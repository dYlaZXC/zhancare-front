"use client";
import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

export const ChatComponent = ({ onClose }: { onClose: () => void }) => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<
    { user: string; response: string; timestamp: string }[]
  >([]);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);

  const { language } = useLanguage();
  
  // Fixed: Properly handle all three languages with fallback
  const translations = React.useMemo(() => {
    switch (language) {
      case "ru":
        return ru.chat;
      case "en":
        return en.chat;
      case "kz":
        return kz.chat;
      default:
        return ru.chat; // Fallback to Russian
    }
  }, [language]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMessage = { user: userInput, response: "", timestamp };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);
    setError("");

    try {
      const payload = {
        model: "open-mistral-nemo",
        temperature: 0.3,
        top_p: 1,
        max_tokens: 500,
        messages: [
          { role: "system", content: translations.assistantInstruction },
          { role: "user", content: userInput },
        ],
      };

      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(translations.fetchError);

      const data = await res.json();
      const aiText = data.choices[0].message.content;

      let index = 0;
      setStreamedResponse("");

      typingInterval.current = setInterval(() => {
        index++;
        const currentText = aiText.slice(0, index);
        setStreamedResponse(currentText);

        if (index >= aiText.length) {
          clearInterval(typingInterval.current!);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, response: aiText }];
          });
          setStreamedResponse("");
          setLoading(false);
        }
      }, 15);
    } catch {
      setError(translations.genericError);
      setLoading(false);
    } finally {
      setUserInput("");
    }
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [loading]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, streamedResponse, loading]);

  useEffect(() => {
    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="chat"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 right-4 w-[90%] max-w-xs sm:max-w-lg laptop-hd:max-w-md laptop-hd:bottom-6 laptop-hd:right-6 desktop-fhd:max-w-lg desktop-fhd:bottom-8 desktop-fhd:right-8 bg-white dark:bg-gray-900 shadow-xl rounded-xl z-50 flex flex-col overflow-hidden max-h-[80vh] laptop-hd:max-h-[70vh] desktop-fhd:max-h-[75vh]"
      >
        <ChatHeader title={translations.title} onClose={onClose} />
        <ChatMessages
          messages={messages}
          loading={loading}
          error={error}
          translations={translations}
          containerRef={messageContainerRef}
          streamedResponse={streamedResponse}
        />
        <ChatInput
          userInput={userInput}
          setUserInput={setUserInput}
          onSend={sendMessage}
          loading={loading}
          translations={translations}
          inputRef={inputRef}
        />
      </motion.div>
    </AnimatePresence>
  );
};