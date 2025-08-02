"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

type Message = {
  sender: "user" | "ai";
  text: string;
};

export default function HeroChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Auto focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const fullText = `AI: Я получил ваш запрос: "${input}"`;

    // Initially push empty AI message
    setMessages((prev) => [...prev, { sender: "ai", text: "" }]);

    // Simulate typing
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          sender: "ai",
          text: fullText.slice(0, i),
        };
        return updated;
      });

      if (i >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
  };

  return (
    <div className="flex justify-center px-4 pt-32 w-full">
      <motion.div
        className="relative backdrop-blur-lg bg-black/30 border border-white/10 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.3)] p-6 w-full max-w-4xl h-[calc(100vh-200px)] flex flex-col justify-between"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Clear Chat Button */}
        <button
          onClick={handleClear}
          className="absolute top-4 right-4 text-xs text-white/50 hover:text-white transition"
        >
          Очистить чат
        </button>

        {/* Chat History */}
        <div
          ref={chatRef}
          className="overflow-y-auto max-h-full pr-2 space-y-4 custom-scrollbar"
        >
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                className={`flex items-start gap-2 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                layout
              >
                {msg.sender === "ai" && (
                  <div className="text-white text-xl">🤖</div>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl text-sm shadow-md max-w-[75%] whitespace-pre-wrap leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-500/30 text-white"
                      : "bg-white/10 text-white"
                  }`}
                >
                  <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="text-sm leading-relaxed text-white" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-semibold text-white" {...props} />
                        ),
                        code: ({ node, ...props }) => (
                          <code className="bg-white/20 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                </div>
                {msg.sender === "user" && (
                  <div className="text-white text-xl">🧑</div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="text-white/70 text-sm italic ml-2 animate-pulse flex items-center gap-2">
              🤖 <span>AI печатает...</span>
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="flex items-center gap-2 mt-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-2 rounded-full bg-white/20 text-white placeholder-white/60 outline-none backdrop-blur-md"
            placeholder="Напишите сообщение..."
          />
          <button
            onClick={handleSend}
            className="bg-white/20 text-white px-4 py-2 rounded-full hover:bg-white/30 transition backdrop-blur-md"
          >
            ➤
          </button>
        </div>
      </motion.div>
    </div>
  );
}
