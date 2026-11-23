"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot, faSearch, faPaperPlane, faThumbsUp, faThumbsDown,
  faTriangleExclamation, faCircleInfo, faUser, faPaperclip, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { AssistantPatient } from "./ai-assistant/types";
import { useDoctorAssistantChat } from "./ai-assistant/useDoctorAssistantChat";
import AssistantMarkdown from "./ai-assistant/AssistantMarkdown";

const SAFETY_LABELS: Record<string, { label: string; className: string }> = {
  blocked_pre_injection: { label: "Запрос отклонён", className: "border-amber-200 bg-amber-50 text-amber-700" },
  blocked_post_unsafe_response: { label: "Ответ отклонён", className: "border-amber-200 bg-amber-50 text-amber-700" },
  error: { label: "Ошибка сервиса", className: "border-red-200 bg-red-50 text-red-700" },
  superseded: { label: "Ответ устарел", className: "border-gray-200 bg-gray-50 text-gray-500" },
  access_revoked: { label: "Доступ изменился", className: "border-red-200 bg-red-50 text-red-700" },
};

export default function DoctorAIAssistant() {
  const [patients, setPatients] = useState<AssistantPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AssistantPatient | null>(null);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  // Measured, not guessed: the doctor layout's header/breadcrumb are
  // content-sized (not a fixed app-shell height), so there's no reliable
  // CSS constant to subtract from 100vh. Measuring how far down the page
  // this component actually starts works regardless of header height,
  // sidebar state, or anything else rendered above it.
  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return;
      const top = containerRef.current.getBoundingClientRect().top;
      setPanelHeight(Math.max(420, window.innerHeight - top - 24));
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const { messages, loadingThread, sending, streamingMessageId, completeness, sendMessage, setFeedback, uploadImage } =
    useDoctorAssistantChat(selected?.id ?? null);

  useEffect(() => {
    setLoadingPatients(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    api.get(`/doctor/ai-assistant/patients/${params.toString() ? `?${params}` : ""}`)
      .then((res) => setPatients(res.data.patients || []))
      .catch(() => {})
      .finally(() => setLoadingPatients(false));
  }, [search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Attaching a photo for one patient shouldn't silently carry over to the
  // next patient's chat after switching.
  useEffect(() => {
    setInput("");
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return null;
    });
  }, [selected?.id]);

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Поддерживаются только изображения: JPEG, PNG, WEBP, GIF");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Файл слишком большой (максимум 5 МБ)");
      return;
    }
    setPendingImage({ file, preview: URL.createObjectURL(file) });
  };

  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return;
    if (sending || uploadingImage) return;

    let imageUrl: string | null = null;
    if (pendingImage) {
      setUploadingImage(true);
      imageUrl = await uploadImage(pendingImage.file);
      setUploadingImage(false);
      if (!imageUrl) {
        toast.error("Не удалось загрузить изображение");
        return;
      }
      URL.revokeObjectURL(pendingImage.preview);
    }

    sendMessage(input.trim(), imageUrl);
    setInput("");
    setPendingImage(null);
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Header — matches the other doctor-panel tabs (e.g. Аналитика) */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#1e263e" }}>
          ИИ Ассистент
        </h1>
        <p className="text-gray-600">Диалог с ассистентом по истории пациента — черновик, не диагноз</p>
      </div>

      <div
        ref={containerRef}
        className="flex gap-4"
        style={{ height: panelHeight ?? "75vh" }}
      >
      {/* ── Patient picker ───────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Мои пациенты</h2>
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingPatients ? (
            <div className="p-4 text-sm text-gray-400">Загрузка...</div>
          ) : patients.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">Пациенты не найдены</div>
          ) : (
            patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors flex items-center gap-2.5 ${
                  selected?.id === p.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.last_name} {p.first_name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chat panel ───────────────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-gray-400">
            <FontAwesomeIcon icon={faRobot} className="w-10 h-10" />
            <p>Выберите пациента слева, чтобы начать диалог с ассистентом</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{selected.last_name} {selected.first_name}</p>
                <p className="text-xs text-gray-400">ИИ Ассистент — черновик для вашего рассмотрения, не диагноз</p>
              </div>
            </div>

            {completeness && (completeness.truncated || !completeness.medical_profile_present) && (
              <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-700 flex-shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Неполные данные: {completeness.truncated && "история обрезана"}
                  {completeness.truncated && !completeness.medical_profile_present && "; "}
                  {!completeness.medical_profile_present && "нет мед.профиля"}.
                  Аллергии/препараты не отслеживаются системой отдельно.
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {loadingThread ? (
                <div className="text-sm text-gray-400 text-center py-10">Загрузка диалога...</div>
              ) : messages.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-10 flex flex-col items-center gap-2">
                  <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5" />
                  Начните диалог — опишите вопрос по этому пациенту
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === "user";
                  const safety = m.safety_status && m.safety_status !== "ok" ? SAFETY_LABELS[m.safety_status] : null;
                  // TS doesn't narrow `m.id` through the closures below — bind
                  // it to a local once the guard below has confirmed it's a
                  // real (not optimistic-placeholder) numeric id.
                  const realId = typeof m.id === "number" ? m.id : null;
                  return (
                    <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isUser ? "bg-blue-600 text-white whitespace-pre-wrap" : "bg-gray-100 text-gray-900"
                      }`}>
                        {safety && (
                          <div className={`mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${safety.className}`}>
                            {safety.label}
                          </div>
                        )}
                        {m.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.image_url}
                            alt="Прикреплённое изображение"
                            className="max-w-full max-h-64 rounded-xl mb-2 object-contain"
                          />
                        )}
                        {isUser || m.id === streamingMessageId ? (
                          // Plain text while the typewriter effect is still
                          // revealing characters — partial markdown syntax
                          // (an unclosed **, a lone #) renders oddly mid-stream.
                          <div className="whitespace-pre-wrap">{m.content}</div>
                        ) : (
                          <AssistantMarkdown content={m.content} />
                        )}
                        {!isUser && m.safety_status === "ok" && realId !== null && (
                          <div className="flex items-center gap-1 mt-2 -ml-1">
                            <button
                              onClick={() => setFeedback(realId, true)}
                              className={`p-1 rounded-lg transition-colors ${m.feedback === "helpful" ? "text-emerald-600 bg-emerald-50" : "text-gray-400 hover:bg-gray-200"}`}
                            >
                              <FontAwesomeIcon icon={faThumbsUp} className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setFeedback(realId, false)}
                              className={`p-1 rounded-lg transition-colors ${m.feedback === "not_helpful" ? "text-red-600 bg-red-50" : "text-gray-400 hover:bg-gray-200"}`}
                            >
                              <FontAwesomeIcon icon={faThumbsDown} className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              {pendingImage && (
                <div className="relative inline-block mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingImage.preview} alt="" className="h-16 rounded-lg border border-gray-200 object-cover" />
                  <button
                    onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 hover:bg-gray-900 text-white flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploadingImage}
                  title="Прикрепить изображение"
                  className="w-11 self-stretch flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <FontAwesomeIcon icon={faPaperclip} className="w-4 h-4" />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Опишите вопрос по пациенту..."
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || uploadingImage || (!input.trim() && !pendingImage)}
                  className="w-14 self-stretch flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <FontAwesomeIcon icon={uploadingImage ? faRobot : faPaperPlane} className={`w-4 h-4 ${uploadingImage ? "animate-pulse" : ""}`} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
