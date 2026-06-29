"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { api, getWebSocketURL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

interface WaMessage {
  id: number;
  from_number: string;
  to_number: string;
  direction: "in" | "out";
  body: string;
  received_at: string;
  message_id: string;
  status?: string;
}

interface Contact {
  number: string;
  lastMessage: string;
  lastAt: string;
  hasQueued: boolean;
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

function buildContacts(msgs: WaMessage[]): Contact[] {
  const map = new Map<string, WaMessage>();
  const queuedNumbers = new Set<string>();
  msgs.forEach(m => {
    const number = m.direction === "in" ? m.from_number : m.to_number;
    if (!number) return;
    if (m.status === "queued") queuedNumbers.add(number);
    const existing = map.get(number);
    if (!existing || new Date(m.received_at) > new Date(existing.received_at)) {
      map.set(number, m);
    }
  });
  return [...map.values()]
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())
    .map(m => {
      const number = m.direction === "in" ? m.from_number : m.to_number;
      return {
        number,
        lastMessage: (m.direction === "out" ? "Вы: " : "") + m.body,
        lastAt: m.received_at,
        hasQueued: queuedNumbers.has(number),
      };
    });
}

const WaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function WhatsAppInbox({ initialPhone }: { initialPhone?: string } = {}) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [incomingMsgs, setIncomingMsgs] = useState<WaMessage[]>([]);
  const [selected, setSelected] = useState<string | null>(initialPhone ?? null);
  const [thread, setThread] = useState<WaMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [unread, setUnread] = useState<Map<string, number>>(new Map());
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get("/whatsapp/messages/");
      const msgs: WaMessage[] = data.messages ?? [];
      setIncomingMsgs(msgs);
      setContacts(buildContacts(msgs));
      // Auto-open thread if initialPhone provided
      if (initialPhone) fetchThread(initialPhone);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [initialPhone]);

  const fetchThread = useCallback(async (number: string) => {
    try {
      const { data } = await api.get("/whatsapp/messages/", { params: { from_number: number } });
      setThread(data.messages ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    const base = getWebSocketURL().replace(/\/$/, "");
    // Auth is no longer carried in the URL — the browser attaches the httpOnly
    // zha_access cookie to the WS handshake automatically, and the backend's
    // JWTCookieAuthMiddleware authenticates before the consumer accepts.
    const wsUrl = `${base}/whatsapp/`;

    const connect = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsStatus("connecting");
      ws.onopen = () => setWsStatus("connected");
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type !== "whatsapp_message") return;
          const msg: WaMessage = payload.data;
          setIncomingMsgs(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            const updated = [...prev, msg];
            setContacts(buildContacts(updated));
            return updated;
          });
          const contactNumber = msg.direction === "in" ? msg.from_number : msg.to_number;
          if (msg.direction === "in" && contactNumber !== selectedRef.current) {
            setUnread(prev => {
              const next = new Map(prev);
              next.set(contactNumber, (next.get(contactNumber) ?? 0) + 1);
              return next;
            });
          }
          if (contactNumber === selectedRef.current) {
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
    if (!selected) return;
    setThread([]);
    fetchThread(selected);
  }, [selected, fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const sendReply = async () => {
    if (!selected || !replyText.trim() || sending) return;
    const body = replyText.trim();
    setSending(true);
    setReplyText("");
    try {
      const { data } = await api.post("/whatsapp/reply/", { to: selected, body });
      if (data.message) {
        const msg: WaMessage = data.message;
        setIncomingMsgs(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          setContacts(buildContacts(updated));
          return updated;
        });
        if (wsStatus !== "connected") {
          setThread(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
      }
      if (data.reengagement_sent) {
        toast.info("Пациент не писал >24ч — отправлен шаблон для возобновления переписки. Сообщение придёт, когда пациент ответит.");
      } else {
        toast.success("Отправлено");
      }
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

  const selectedContact = contacts.find(c => c.number === selected);

  return (
    <div className="flex h-full overflow-hidden rounded-none" style={{ background: "#f0f2f5" }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col overflow-hidden transition-all duration-300
          ${selected ? "hidden md:flex" : "flex w-full"}
          md:w-[300px]`}
        style={{ background: "linear-gradient(180deg, #1e263e 0%, #12263a 100%)" }}
      >
        {/* Sidebar header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "#25d366" }}>
                <WaIcon className="w-5 h-5 fill-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">WhatsApp</p>
                <p className="text-white/50 text-xs mt-0.5">Входящие сообщения</p>
              </div>
            </div>
            {/* WS status dot */}
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
              <p className="text-white font-bold text-lg leading-none mt-0.5">{incomingMsgs.length}</p>
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
                    background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(37,211,102,0.3)"
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
              <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <WaIcon className="w-10 h-10 fill-white/10" />
              <p className="text-white/30 text-sm">Нет сообщений</p>
            </div>
          ) : (() => {
            const filtered = contacts.filter(c =>
              filter === "all" ? true :
              filter === "unread" ? (unread.get(c.number) ?? 0) > 0 :
              (unread.get(c.number) ?? 0) === 0
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
                key={c.number}
                onClick={() => {
                  setSelected(c.number);
                  setReplyText("");
                  setUnread(prev => { const next = new Map(prev); next.delete(c.number); return next; });
                }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  selected === c.number
                    ? "shadow-lg"
                    : "hover:bg-white/5"
                }`}
                style={selected === c.number ? {
                  background: "linear-gradient(135deg, rgba(37,211,102,0.2) 0%, rgba(18,140,126,0.2) 100%)",
                  border: "1px solid rgba(37,211,102,0.3)"
                } : { border: "1px solid transparent" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
                >
                  {c.number.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-white truncate">{c.number.startsWith("+") ? c.number : `+${c.number}`}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(unread.get(c.number) ?? 0) > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                          {unread.get(c.number)! > 99 ? "99+" : unread.get(c.number)}
                        </span>
                      )}
                      <span className="text-[10px] text-white/30">{formatTime(c.lastAt)}</span>
                    </div>
                  </div>
                  <p className={`text-xs truncate mt-0.5 flex items-center gap-1 ${(unread.get(c.number) ?? 0) > 0 ? "text-white/70 font-medium" : "text-white/40"}`}>
                    {c.hasQueued && <span className="text-yellow-400 flex-shrink-0" title="Ждёт ответа пациента">⏳</span>}
                    <span className="truncate">{c.lastMessage}</span>
                  </p>
                </div>
              </button>
            ));
          })()}
        </div>
      </div>

      {/* ── RIGHT: THREAD ────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full md:w-auto">

          {/* Thread header */}
          <div
            className="flex-shrink-0 px-3 md:px-5 py-3 flex items-center gap-2 md:gap-3 shadow-sm"
            style={{ background: "linear-gradient(135deg, #1e263e 0%, #29358f 100%)" }}
          >
            {/* Back button — mobile only */}
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
              style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
            >
              {selected.slice(-2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">{selected?.startsWith("+") ? selected : `+${selected}`}</p>
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

          {/* Messages area — chat background */}
          <div
            className="flex-1 overflow-y-auto px-5 py-5 space-y-3 min-h-0"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, rgba(37,211,102,0.03) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(18,140,126,0.04) 0%, transparent 50%),
                #f0f2f5
              `
            }}
          >
            {thread.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <WaIcon className="w-12 h-12 fill-gray-200" />
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
                      background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)",
                      boxShadow: "0 1px 8px rgba(37,211,102,0.25)"
                    } : {
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                    }}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    {msg.status === "queued" && (
                      <p className="text-[10px] mt-1 text-right font-semibold text-yellow-100">
                        ⏳ ждёт ответа пациента
                      </p>
                    )}
                    <p className={`text-[10px] mt-1 text-right ${msg.direction === "out" ? "text-green-100/70" : "text-gray-400"}`}>
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
              className="flex-1 resize-none rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sending}
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)", boxShadow: "0 4px 12px rgba(37,211,102,0.4)" }}
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
        /* Empty state — desktop only */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4" style={{ background: "#f0f2f5" }}>
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
          >
            <WaIcon className="w-12 h-12 fill-white" />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-semibold text-lg">WhatsApp Inbox</p>
            <p className="text-gray-400 text-sm mt-1">Выберите контакт для переписки</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs" style={{ background: "rgba(37,211,102,0.1)", color: "#128c7e" }}>
            <span className={`w-2 h-2 rounded-full ${wsStatus === "connected" ? "bg-green-500" : wsStatus === "connecting" ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
            {wsStatus === "connected" ? "Подключено в реальном времени" : wsStatus === "connecting" ? "Подключение..." : "Работает в режиме поллинга"}
          </div>
        </div>
      )}
    </div>
  );
}
