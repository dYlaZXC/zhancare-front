"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

interface WaMessage {
  id: number;
  from_number: string;
  body: string;
  received_at: string;
  message_id: string;
}

interface Contact {
  number: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

function authHeaders() {
  const token = localStorage.getItem("access_token");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatFullTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function WhatsAppInbox() {
  const [allMessages, setAllMessages] = useState<WaMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<WaMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [outgoing, setOutgoing] = useState<{ body: string; at: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/whatsapp/messages/`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const msgs: WaMessage[] = data.messages ?? [];
      setAllMessages(msgs);

      // Build contacts list: one entry per unique number, latest message first
      const byNumber = new Map<string, WaMessage[]>();
      msgs.forEach(m => {
        if (!byNumber.has(m.from_number)) byNumber.set(m.from_number, []);
        byNumber.get(m.from_number)!.push(m);
      });
      const contactList: Contact[] = [];
      byNumber.forEach((mList, number) => {
        const sorted = [...mList].sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
        contactList.push({
          number,
          lastMessage: sorted[0].body,
          lastAt: sorted[0].received_at,
          unread: 0,
        });
      });
      contactList.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
      setContacts(contactList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMessages]);

  useEffect(() => {
    if (!selected) return;
    const msgs = allMessages
      .filter(m => m.from_number === selected)
      .sort((a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime());
    setThread(msgs);
  }, [selected, allMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, outgoing]);

  const selectContact = (number: string) => {
    setSelected(number);
    setOutgoing([]);
    setReplyText("");
  };

  const sendReply = async () => {
    if (!selected || !replyText.trim() || sending) return;
    const body = replyText.trim();
    setSending(true);
    try {
      const res = await fetch(`${API}/whatsapp/reply/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ to: selected, body }),
      });
      if (res.ok) {
        setOutgoing(prev => [...prev, { body, at: new Date().toISOString() }]);
        setReplyText("");
        toast.success("Сообщение отправлено");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Ошибка отправки");
      }
    } catch {
      toast.error("Ошибка соединения");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  // Merge thread + outgoing for display
  type DisplayMsg = { key: string; body: string; at: string; dir: "in" | "out" };
  const displayThread: DisplayMsg[] = [
    ...thread.map(m => ({ key: `in-${m.id}`, body: m.body, at: m.received_at, dir: "in" as const })),
    ...outgoing.map((o, i) => ({ key: `out-${i}`, body: o.body, at: o.at, dir: "out" as const })),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Left: Contact list */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#25d366" }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">WhatsApp Inbox</h2>
              <p className="text-xs text-gray-400">{contacts.length} контактов</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
              <svg viewBox="0 0 24 24" className="w-10 h-10 fill-gray-200" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Нет сообщений
            </div>
          ) : (
            contacts.map(c => (
              <button
                key={c.number}
                onClick={() => selectContact(c.number)}
                className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-all border-b border-gray-50 ${
                  selected === c.number ? "bg-green-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                     style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}>
                  {c.number.slice(-2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">+{c.number}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(c.lastAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{c.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Thread */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                 style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}>
              {selected.slice(-2)}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">+{selected}</p>
              <p className="text-xs text-gray-400">{thread.length} сообщений</p>
            </div>
            <button
              onClick={fetchMessages}
              className="ml-auto p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
              title="Обновить"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
            {displayThread.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-12">Нет сообщений</div>
            ) : (
              displayThread.map(msg => (
                <div key={msg.key} className={`flex ${msg.dir === "out" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.dir === "out"
                        ? "text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
                    }`}
                    style={msg.dir === "out" ? { background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" } : {}}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={`text-[10px] mt-1 text-right ${msg.dir === "out" ? "text-green-100" : "text-gray-400"}`}>
                      {formatFullTime(msg.at)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply box */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-end gap-3">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Написать сообщение... (Enter — отправить, Shift+Enter — новая строка)"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
            />
            <button
              onClick={sendReply}
              disabled={!replyText.trim() || sending}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #25d366 0%, #128c7e 100%)" }}
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-gray-200" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <p className="text-sm">Выберите контакт для переписки</p>
        </div>
      )}
    </div>
  );
}
