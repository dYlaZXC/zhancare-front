"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, ChangeEvent } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaLightbulb, FaImage, FaTimes } from "react-icons/fa";
import Image from "next/image";

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

interface Message {
  sender: "user" | "bot";
  text: string;
  imageUrl?: string;
  showDoctorButton?: boolean;
}

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05 },
  }),
};

// Format markdown-like output
function formatMessageToHTML(text: string): string {
  let safe = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\n/g, "<br/>");
  return safe;
}

export const ChatSection = () => {
  const { setIsAuthOpen } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input, imageUrl: imagePreview || undefined },
    ]);

    const imgPrompt = imagePreview
      ? { type: "image_url", image_url: { url: imagePreview } }
      : null;

    const payload = {
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "system",
          content:
            "You are a professional medical assistant. Respond clearly and concisely in the same language the user used. " +
            "If the user should consult a doctor, include this on a separate line at the end of your message: <show_doctor_button>true</show_doctor_button>",
        },
        {
          role: "user",
          content: imgPrompt
            ? [{ type: "text", text: input }, imgPrompt]
            : [{ type: "text", text: input }],
        },
      ],
      temperature: 0.5,
      top_p: 1,
      stream: false,
    };

    setInput("");
    setImagePreview(null);
    await callPixtralAPI(payload);
  };

  const callPixtralAPI = async (payload: any) => {
    setStreaming(true);
    setCurrentStream("");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      let fullText = data?.choices?.[0]?.message?.content || "Ответ не получен.";
      const showDoctorButton = fullText.includes("<show_doctor_button>true</show_doctor_button>");
      fullText = fullText.replace("<show_doctor_button>true</show_doctor_button>", "").trim();

      let index = 0;
      const typeChar = () => {
        if (index <= fullText.length) {
          setCurrentStream(fullText.slice(0, index));
          index++;
          requestAnimationFrame(typeChar);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: fullText, showDoctorButton },
          ]);
          setCurrentStream("");
          setStreaming(false);
        }
      };

      requestAnimationFrame(typeChar);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Ошибка. Попробуйте позже." },
      ]);
      setStreaming(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.section
      id="ai-chat"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative bg-gradient-to-b from-[#1E34A0] to-[#1C212C] text-white py-16 px-4 sm:px-10"
    >
      <motion.div
        className="container mx-auto max-w-4xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {/* Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <h2 className="text-4xl font-extrabold text-white leading-snug">
            Иногда важен первый шаг.
          </h2>
          <p className="text-lg text-white/80 mt-3 max-w-md">
            Опишите симптомы, и наш ИИ-ассистент подскажет, стоит ли обращаться к специалисту.
          </p>
          <div className="mt-6">
            <svg
              width="36"
              height="36"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-bounce"
            >
              <path
                d="M1 11.8716L12.3538 24.6838L25 11.8716M1 1L12.3538 13.8331L25 1"
                stroke="white"
                strokeWidth="1.01186"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Chat Box */}
        <motion.div
          className="bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 space-y-5 min-h-[580px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-2xl font-extrabold text-center text-[#001E80]">MedGemma 4B IT</div>
          <p className="text-sm text-center text-gray-500">
            Это демо-версия Pixtral, использующая ИИ для помощи в вопросах здоровья.
          </p>

          <div className="rounded-lg space-y-3 bg-gray-50 border border-gray-200 p-4 min-h-[460px]">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className={`relative max-w-[80%] px-4 py-2 text-sm rounded-2xl shadow-md ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-[#001E80] to-[#3A50FF] text-white ml-auto"
                    : "bg-white text-gray-800"
                }`}
              >
                {msg.imageUrl && (
                  <Image
                    src={msg.imageUrl}
                    alt="Uploaded"
                    width={200}
                    height={200}
                    className="rounded mb-2"
                  />
                )}
                {msg.sender === "bot" ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: formatMessageToHTML(msg.text),
                    }}
                  />
                ) : (
                  msg.text
                )}
                {msg.showDoctorButton && (
                  <div className="mt-4">
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      Записаться к врачу
                    </button>
                  </div>
                )}
              </motion.div>
            ))}

            {streaming && (
              <motion.div
                className="w-fit max-w-[80%] px-4 py-2 text-sm rounded-2xl bg-yellow-50 text-yellow-800 border border-yellow-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span
                  dangerouslySetInnerHTML={{
                    __html: formatMessageToHTML(currentStream),
                  }}
                />
              </motion.div>
            )}
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2 flex justify-center relative w-fit mx-auto">
              <Image
                src={imagePreview}
                alt="Preview"
                width={120}
                height={120}
                className="rounded-md"
              />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-[-8px] right-[-8px] bg-red-500 text-white rounded-full p-1 shadow"
              >
                <FaTimes size={12} />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex flex-col sm:flex-row gap-3 items-center mt-2">
            <div className="flex-1 w-full flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 shadow-sm bg-white">
              <input
                type="text"
                placeholder="Что вас беспокоит?.."
                className="flex-1 text-sm outline-none bg-transparent text-black"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={streaming}
              />
              <label className="cursor-pointer text-[#001E80] hover:text-[#3A50FF] transition">
                <FaImage size={18} />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <button
                onClick={handleSend}
                disabled={streaming}
                className={`text-[#001E80] hover:text-[#3A50FF] transition ${
                  streaming ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <FaPaperPlane size={18} />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap justify-center gap-3 pt-4">
            {[
              "Примеры симптомов",
              "Популярный вопрос про здоровье",
              "Побочные эффекты лекарства",
            ].map((prompt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(prompt)}
                disabled={streaming}
                className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 transition"
              >
                <FaLightbulb className="text-yellow-400" />
                {prompt}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};
