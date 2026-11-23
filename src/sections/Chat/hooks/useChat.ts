import { useState, ChangeEvent, useRef } from "react";
import { Message, ChatHookProps } from "../types";
import { isInjectionAttempt, CHAT_ENDPOINT, CHAT_UPLOAD_ENDPOINT } from "@/lib/ai";

export const useChat = ({
  messages,
  setMessages,
  input,
  setInput,
  imagePreview,
  setImagePreview,
  language,
  messagesContainerRef
}: ChatHookProps) => {
  const [streaming, setStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messageIdCounter = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getErrorMessage = () => {
    switch (language) {
      case "ru": return "Ошибка. Попробуйте позже.";
      case "en": return "Error. Please try again later.";
      case "kz": return "Қате. Кейінірек қайталап көріңіз.";
      default: return "Error. Please try again later.";
    }
  };

  /**
   * Upload image to Yandex Object Storage via presigned URL.
   * Returns the permanent public file_url, or null on failure.
   */
  const uploadImage = async (dataUrl: string): Promise<string | null> => {
    try {
      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (blob.size > 5 * 1024 * 1024) return null;

      // Ask backend for a presigned PUT URL
      const urlRes = await fetch(CHAT_UPLOAD_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_type: blob.type || "image/jpeg" }),
      });
      if (!urlRes.ok) return null;
      const { upload_url, file_url } = await urlRes.json();

      // Upload directly to Object Storage (no backend in the middle)
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });
      if (!uploadRes.ok) return null;

      return file_url as string;
    } catch {
      return null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;
    if (streaming) return;

    if (input.trim() && isInjectionAttempt(input)) {
      const blocked = language === "ru"
        ? "Я медицинский ассистент. Пожалуйста, опишите ваши симптомы."
        : language === "kz"
        ? "Мен медициналық көмекшімін. Симптомдарыңызды сипаттаңыз."
        : "I am a medical assistant. Please describe your symptoms.";
      setMessages(prev => [...prev, {
        sender: "bot", text: blocked, timestamp: new Date(), id: generateMessageId()
      }]);
      setInput("");
      return;
    }

    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const newMessage: Message = {
      sender: "user",
      text: input,
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
      id: generateMessageId()
    };
    setMessages(prev => [...prev, newMessage]);

    // Upload image first if present, get storage URL
    let imageStorageUrl: string | undefined;
    if (imagePreview) {
      imageStorageUrl = (await uploadImage(imagePreview)) ?? undefined;
      if (!imageStorageUrl) {
        const uploadError = language === "ru"
          ? "Не удалось загрузить изображение. Попробуйте ещё раз."
          : language === "kz"
          ? "Суретті жүктеу мүмкін болмады. Қайталап көріңіз."
          : "Failed to upload image. Please try again.";
        setMessages(prev => [...prev, {
          sender: "bot", text: uploadError, timestamp: new Date(), id: generateMessageId()
        }]);
        setStreaming(false);
        return;
      }
    }

    // Build conversation history (last 10)
    const history = messages.slice(-10).map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const payload: Record<string, unknown> = {
      message: input,
      language,
      history,
      ...(imageStorageUrl ? { image_url: imageStorageUrl } : {}),
    };

    setInput("");
    setImagePreview(null);
    await callChatAPI(payload);
  };

  const callChatAPI = async (payload: Record<string, unknown>) => {
    const abortController = new AbortController();
    activeRequestRef.current = abortController;
    setStreaming(true);

    const botMessageId = generateMessageId();
    setMessages(prev => {
      if (prev.some(m => m.id === botMessageId)) return prev;
      return [...prev, { sender: "bot", text: "", timestamp: new Date(), id: botMessageId }];
    });

    try {
      const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText: string = data.text || getErrorMessage();
      const isJsonResponse = rawText.trimStart().startsWith("{") && rawText.trimEnd().endsWith("}");
      const fallbackText = language === "en"
        ? "Please describe your symptoms in more detail — I'll give you a medical analysis right away."
        : language === "kz"
        ? "Симптомдарыңызды толығырақ сипаттаңыз — дереу медициналық талдау беремін."
        : "Опишите ваши симптомы подробнее — я сразу дам медицинский анализ.";
      const fullText: string = isJsonResponse ? fallbackText : rawText;
      const showDoctorButton: boolean = isJsonResponse ? false : (data.show_doctor_button ?? false);

      let index = 0;
      setStreamingMessageId(botMessageId);

      const typeChar = () => {
        if (abortController.signal.aborted) return;
        if (index <= fullText.length) {
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId && msg.sender === "bot"
              ? { ...msg, text: fullText.slice(0, index) }
              : msg
          ));
          index++;
          setTimeout(typeChar, 15);
        } else {
          setMessages(prev => prev.map(msg =>
            msg.id === botMessageId && msg.sender === "bot"
              ? { ...msg, text: fullText, showDoctorButton }
              : msg
          ));
          setStreamingMessageId(null);
          setStreaming(false);
          activeRequestRef.current = null;
        }
      };
      typeChar();

    } catch (error: any) {
      if (!abortController.signal.aborted) {
        setMessages(prev => prev.map(msg =>
          msg.id === botMessageId && msg.sender === "bot"
            ? { ...msg, text: getErrorMessage() }
            : msg
        ));
        setStreamingMessageId(null);
        setStreaming(false);
        activeRequestRef.current = null;
      }
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert(language === "ru" ? "Файл слишком большой" :
            language === "en" ? "File too large" : "Файл тым үлкен");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return { streaming, streamingMessageId, handleSend, handleImageUpload };
};
