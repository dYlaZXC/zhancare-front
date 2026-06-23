"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { api, getWebSocketURL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface TgMessage {
  id: number;
  conversation_id: number;
  clinic_id: number | null;
  chat_id: number;
  username: string;
  full_name: string;
  direction: "in" | "out";
  text: string;
  tg_message_id: number | null;
  received_at: string;
}

interface Contact {
  chat_id: number;
  displayName: string;
  username: string;
  lastMessage: string;
  lastAt: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  return isToday
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function getDisplayName(msg: TgMessage): string {
  return msg.full_name || (msg.username ? `@${msg.username}` : `Chat ${msg.chat_id}`);
}

function buildContacts(msgs: TgMessage[]): Contact[] {
  const map = new Map<number, TgMessage>();
  msgs.forEach(m => {
    const existing = map.get(m.chat_id);
    if (!existing || new Date(m.received_at) > new Date(existing.received_at)) {
      map.set(m.chat_id, m);
    }
  });
  return [...map.values()]
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
    .map(m => ({
      chat_id: m.chat_id,
      displayName: getDisplayName(m),
      username: m.username,
      lastMessage: (m.direction === "out" ? "Вы: " : "") + m.text,
      lastAt: m.received_at,
    }));
}

const TgIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 1 0 24 12 12 12 0 0 0 11.944 0Zm5.92 8.08-2.01 9.48c-.147.658-.538.818-1.09.508l-3-2.21-1.448 1.394c-.16.16-.295.295-.604.295l.215-3.053 5.56-5.023c.242-.215-.054-.333-.373-.118L7.21 14.47 4.26 13.56c-.656-.205-.67-.656.137-.971l11.59-4.47c.547-.2 1.025.12.877.96Z"/>
  </svg>
);

export default function TelegramInbox() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allMsgs, setAllMsgs] = useState<TgMessage[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [thread, setThread] = useState<TgMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [unread, setUnread] = useState<Map<number, number>>(new Map());
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selected;

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get("/tg/messages/");
      const msgs: TgMessage[] = data.messages ?? [];
      setAllMsgs(msgs);
      setContacts(buildContacts(msgs));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  const fetchThread = useCallback(async (chatId: number) => {
    try {
      const { data } = await api.get(`/tg/messages/`, { params: { chat_id: chatId } });
      setThread(data.messages ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    const base = getWebSocketURL().replace(/\/$/, "");
    // Auth is no longer carried in the URL — the browser attaches the httpOnly
    // zha_access cookie to the WS handshake automatically, and the backend's
    // JWTCookieAuthMiddleware authenticates before the consumer accepts.
    const wsUrl = `${base}/telegram/`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsStatus("connecting");
      ws.onopen = () => setWsStatus("connected");
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== "telegram_message") return;
          const msg: TgMessage = payload.data;
          setAllMsgs(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const updated = [...prev, msg];
            setContacts(buildContacts(updated));
            return updated;
          });
          if (msg.direction === "in" && msg.chat_id !== selectedRef.current) {
            setUnread(prev => {
              const next = new Map(prev);
              next.set(msg.chat_id, (next.get(msg.chat_id) ?? 0) + 1);
              return next;
            });
          }
          if (msg.chat_id === selectedRef.current) {
            setThread(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg].sort((a, b) =>
                new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
              );
            });
          }
        } catch { /* ignore */ }
      };
      ws.onclose = () => { setWsStatus("disconnected"); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => { wsRef.current?.close(); };
  }, [user]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  useEffect(() => {
    if (wsStatus !== "disconnected") return;
    const id = setInterval(fetchContacts, 15000);
    return () => clearInterval(id);
  }, [wsStatus, fetchContacts]);

  useEffect(() => {
    if (selected === null) return;
    setThread([]);
    fetchThread(selected);
  }, [selected, fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const sendReply = async () => {
    if (selected === null || !replyText.trim() || sending) return;
    const body = replyText.trim();
    setSending(true);
    setReplyText("");
    try {
      const { data } = await api.post("/tg/reply/", { chat_id: selected, text: body });
      if (data.message) {
        const msg: TgMessage = data.message;
        setAllMsgs(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          setContacts(buildContacts(updated));
          return updated;
        });
        if (wsStatus !== "connected") {
          setThread(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
      }
      toast.success("Отправлено");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Ошибка отправки");
      setReplyText(body);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  const selectedContact = contacts.find(c => c.chat_id === selected);

  return (
    <div className="flex h-full overflow-hidden rounded-none" style={{ background: "#f0f2f5" }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300
          ${selected !== null ? "hidden md:flex" : "flex w-full"}
          md:w-[300px]`}
        style={{ background: "linear-gradient(180deg, #1e263e 0%, #12263a 100%)" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "#0088cc" }}>
                <TgIcon className="w-5 h-5 fill-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">Telegram</p>
                <p className="text-white/50 text-xs mt-0.5">Входящие сообщения</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  wsStatus === "connected" ? "bg-green-400 shadow-[0_0_6px_#4ade80]" :
                  wsStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"
                }`}
              />
              <span className="text-[10px] text-white/40">
                {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "..." : "Офлайн"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white/40 text-[10px] uppercase tracking-wide">Контактов</p>
              <p className="text-white font-bold text-lg leading-none mt-0.5">{contacts.length}</p>
            </div>
            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.05)" }}>
              <p className="text-white/40 text-[10px] uppercase tracking-wide">Сообщений</p>
              <p className="text-white font-bold text-lg leading-none mt-0.5">{allMsgs.length}</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-3 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["all", "unread", "read"] as const).map(f => {
              const labels = { all: "Все", unread: "Непрочит.", read: "Прочит." };
              const isActive = filter === f;
              const unreadCount = f === "unread" ? [...unread.values()].filter(v => v > 0).length : 0;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                  style={isActive ? {
                    background: "linear-gradient(135deg, #0088cc 0%, #005f8e 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(0,136,204,0.3)"
                  } : { color: "rgba(255,255,255,0.4)" }}
                >
                  {labels[f]}
                  {f === "unread" && unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <TgIcon className="w-10 h-10 fill-white/10" />
              <p className="text-white/30 text-sm">Нет сообщений</p>
            </div>
          ) : (() => {
            const filtered = contacts.filter(c =>
              filter === "all" ? true :
              filter === "unread" ? (unread.get(c.chat_id) ?? 0) > 0 :
              (unread.get(c.chat_id) ?? 0) === 0
            );
            if (filtered.length === 0) return (
              <div className="flex flex-col items-center justify-center h-40 gap-2">
                <p className="text-white/20 text-xs">
                  {filter === "unread" ? "Нет непрочитанных" : "Нет прочитанных"}
                </p>
              </div>
            );
            return filtered.map(c => (
              <button
                key={c.chat_id}
                onClick={() => {
                  setSelected(c.chat_id);
                  setReplyText("");
                  setUnread(prev => { const next = new Map(prev); next.delete(c.chat_id); return next; });
                }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  selected === c.chat_id ? "shadow-lg" : "hover:bg-white/5"
                }`}
                style={selected === c.chat_id ? {
                  background: "linear-gradient(135deg, rgba(0,136,204,0.2) 0%, rgba(0,95,142,0.2) 100%)",
                  border: "1px solid rgba(0,136,204,0.3)"
                } : { border: "1px solid transparent" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ background: "linear-gradient(135deg, #0088cc 0%, #005f8e 100%)" }}
                >
                  {c.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-white truncate">{c.displayName}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(unread.get(c.chat_id) ?? 0) > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                          {unread.get(c.chat_id)! > 99 ? "99+" : unread.get(c.chat_id)}
                        </span>
                      )}
                      <span className="text-[10px] text-white/30">{formatTime(c.lastAt)}</span>
                    </div>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${(unread.get(c.chat_id) ?? 0) > 0 ? "text-white/70 font-medium" : "text-white/40"}`}>
                    {c.lastMessage}
                  </p>
                </div>
              </button>
            ));
          })()}
        </div>
      </div>

      {/* ── RIGHT: THREAD ────────────────────────────────── */}
      {selected !== null ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full md:w-auto">

          {/* Thread header */}
          <div
            className="flex-shrink-0 px-3 md:px-5 py-3 flex items-center gap-2 md:gap-3 shadow-sm"
            style={{ background: "linear-gradient(135deg, #1e263e 0%, #0088cc 100%)" }}
          >
            <button
              onClick={() => setSelected(null)}
              className="md:hidden p-2 -ml-1 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              className="w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-lg"
              style={{ background: "linear-gradient(135deg, #0088cc 0%, #005f8e 100%)" }}
            >
              {(selectedContact?.displayName ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">{selectedContact?.displayName ?? `Chat ${selected}`}</p>
              <p className="text-white/40 text-xs mt-0.5">{thread.length} сообщений</p>
            </div>
            <button
              onClick={() => fetchThread(selected)}
              className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
              title="Обновить"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-5 py-5 space-y-3 min-h-0"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, rgba(0,136,204,0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(0,95,142,0.04) 0%, transparent 50%),
                #f0f2f5
              `
            }}
          >
            {thread.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <TgIcon className="w-12 h-12 fill-gray-200" />
                <p className="text-sm">Нет сообщений</p>
              </div>
            ) : (
              thread.map(msg => (
                <div key={`${msg.direction}-${msg.id}`} className={`flex ${msg.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative max-w-[68%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.direction === "out"
                        ? "text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none"
                    }`}
                    style={msg.direction === "out" ? {
                      background: "linear-gradient(135deg, #0088cc 0%, #005f8e 100%)",
                      boxShadow: "0 1px 8px rgba(0,136,204,0.25)"
                    } : {
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                    }}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.direction === "out" ? "text-blue-100/70" : "text-gray-400"}`}>
                      {formatFullTime(msg.received_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <div
            className="flex-shrink-0 px-4 py-3 flex items-end gap-3 border-t"
            style={{ background: "#ffffff", borderColor: "#e9edef" }}
          >
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Написать сообщение... (Enter — отправить)"
              rows={2}
              className="flex-1 resize-none rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sending}
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #0088cc 0%, #005f8e 100%)", boxShadow: "0 4px 12px rgba(0,136,204,0.4)" }}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>

      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4" style={{ background: "#f0f2f5" }}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #0088cc 0%, #005f8e 100%)" }}
          >
            <TgIcon className="w-12 h-12 fill-white" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-lg">Telegram Inbox</p>
            <p className="text-gray-400 text-sm mt-1">Выберите контакт для переписки</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ background: "rgba(0,136,204,0.1)", color: "#005f8e" }}>
            <span className={`w-2 h-2 rounded-full ${wsStatus === "connected" ? "bg-blue-500" : wsStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
            {wsStatus === "connected" ? "Подключено в реальном времени" : wsStatus === "connecting" ? "Подключение..." : "Работает в режиме поллинга"}
          </div>
        </div>
      )}
    </div>
  );
}
