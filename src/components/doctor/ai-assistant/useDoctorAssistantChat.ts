import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { AssistantMessage, ContextCompleteness } from "./types";

let messageIdCounter = 0;
const localId = () => `local_${Date.now()}_${messageIdCounter++}`;

export function useDoctorAssistantChat(patientId: number | null) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<number | string | null>(null);
  const [completeness, setCompleteness] = useState<ContextCompleteness | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchThread = useCallback(async () => {
    if (!patientId) {
      setMessages([]);
      return;
    }
    setLoadingThread(true);
    try {
      const res = await api.get(`/doctor/ai-assistant/threads/?patient_id=${patientId}`);
      setMessages(res.data.messages || []);
    } catch {
      toast.error("Не удалось загрузить историю диалога");
    } finally {
      setLoadingThread(false);
    }
  }, [patientId]);

  useEffect(() => { fetchThread(); }, [fetchThread]);

  /**
   * Uploads a File to Object Storage via a presigned PUT URL (doctor-scoped
   * endpoint, not the patient widget's AllowAny one) and returns the
   * permanent public file_url, or null on failure. Caller validates
   * type/size before calling this (also enforced server-side).
   */
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      const presign = await api.post("/doctor/ai-assistant/upload-image/", { content_type: file.type });
      const { upload_url, file_url } = presign.data as { upload_url: string; file_url: string };
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) return null;
      return file_url;
    } catch {
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (text: string, imageUrl?: string | null) => {
    if (!patientId || (!text.trim() && !imageUrl) || sending) return;
    setSending(true);

    const userLocalId = localId();
    setMessages((prev) => [...prev, {
      id: userLocalId, role: "user", content: text, image_url: imageUrl || null,
      created_at: new Date().toISOString(), safety_status: null, feedback: null,
    }]);

    const placeholderId = localId();
    setMessages((prev) => [...prev, {
      id: placeholderId, role: "assistant", content: "", image_url: null,
      created_at: new Date().toISOString(), safety_status: null, feedback: null,
    }]);
    setStreamingMessageId(placeholderId);

    try {
      const client_message_id = crypto.randomUUID();
      const res = await api.post("/doctor/ai-assistant/messages/", {
        patient_id: patientId, message: text, image_url: imageUrl || undefined, client_message_id,
      });
      const data = res.data as {
        user_message: AssistantMessage; assistant_message: AssistantMessage;
        context_completeness: ContextCompleteness | null; superseded: boolean;
      };

      // Replace the two optimistic placeholders with the real rows.
      setMessages((prev) => prev.filter((m) => m.id !== userLocalId && m.id !== placeholderId).concat([data.user_message]));
      setCompleteness(data.context_completeness);

      if (data.superseded) {
        toast.warning("Этот ответ устарел — обновите диалог.");
        setMessages((prev) => prev.concat([data.assistant_message]));
        setStreamingMessageId(null);
        setSending(false);
        return;
      }

      // Client-side typewriter — no real token streaming anywhere in this
      // codebase (same convention as the patient-facing widget's useChat).
      const full = data.assistant_message.content;
      let index = 0;
      const abortController = new AbortController();
      abortRef.current = abortController;

      setMessages((prev) => prev.concat([{ ...data.assistant_message, content: "" }]));

      const typeChar = () => {
        if (abortController.signal.aborted) return;
        if (index <= full.length) {
          setMessages((prev) => prev.map((m) =>
            m.id === data.assistant_message.id ? { ...m, content: full.slice(0, index) } : m
          ));
          index += 2;
          setTimeout(typeChar, 10);
        } else {
          setStreamingMessageId(null);
          setSending(false);
        }
      };
      typeChar();
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== userLocalId && m.id !== placeholderId));
      if (err?.response?.status === 409) {
        toast.warning(err.response.data?.error || "Предыдущий ответ ещё формируется, подождите.");
      } else if (err?.response?.status === 403) {
        toast.error(err.response.data?.error || "Нет доступа к данным этого пациента.");
      } else {
        toast.error("Не удалось отправить сообщение");
      }
      setStreamingMessageId(null);
      setSending(false);
    }
  }, [patientId, sending]);

  const setFeedback = useCallback(async (messageId: number, helpful: boolean) => {
    try {
      await api.patch(`/doctor/ai-assistant/messages/${messageId}/feedback/`, { helpful });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: helpful ? "helpful" : "not_helpful" } : m)));
    } catch {
      toast.error("Не удалось сохранить оценку");
    }
  }, []);

  return { messages, loadingThread, sending, streamingMessageId, completeness, sendMessage, setFeedback, uploadImage };
}
