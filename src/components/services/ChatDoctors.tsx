"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { api } from "@/utils/api"; // Assuming you have API instance
import doctorPlaceholder from "@/assets/doctor_avatar.png"; // Placeholder image

interface Doctor {
  id: number;
  name: string;
  doctor_type: string;
  is_online: boolean;
  photo?: string;
}

const ChatDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string; id: number }[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setFetchingDoctors(true);
      const response = await api.get("/auth/doctor/available/");
      if (response.status === 200) {
        // 🚫 Filter out doctors with doctor_type = "Сестринское дело"
        const filteredDoctors = (response.data.doctors || []).filter(
          (doc: { doctor_type: string }) => doc.doctor_type !== "Сестринское дело"
        );
        setDoctors(filteredDoctors);
      }
    } catch (error) {
      console.error("Ошибка загрузки врачей:", error);
    } finally {
      setFetchingDoctors(false);
    }
  };
  

  const handleSend = () => {
    if (!inputText.trim() || !selectedDoctor) return;

    const newMessage = {
      id: Date.now(),
      sender: "Вы",
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // 🚀 Optionally: send to backend via POST
    // api.post("/chat/send/", { doctor_id: selectedDoctor.id, message: inputText.trim() });
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl max-w-5xl mx-auto">
      {/* Title */}
      <h2 className="text-3xl font-bold text-[#001E80] mb-6 text-center">Чат с врачами</h2>

      {/* Doctor List */}
      {!selectedDoctor ? (
        <>
          <p className="text-gray-600 mb-6 text-center">Выберите врача для начала общения.</p>
          {fetchingDoctors ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#001E80]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div key={doc.id} className="border p-4 rounded-xl shadow hover:shadow-lg transition">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 mb-4">
                      <Image
                        src={doc.photo || doctorPlaceholder}
                        alt={doc.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <h3 className="font-bold text-lg text-[#001E80]">{doc.name}</h3>
                    <p className="text-gray-500 text-sm">{doc.doctor_type || "Специалист"}</p>
                    <p className="text-sm mt-1">
                      {doc.is_online ? (
                        <span className="text-green-500 font-semibold">🟢 Онлайн</span>
                      ) : (
                        <span className="text-gray-400">⚪ Офлайн</span>
                      )}
                    </p>
                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white rounded-full hover:opacity-90 transition"
                    >
                      Написать сообщение
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Chat Window */}
          <div className="mb-6">
            <button
              onClick={() => setSelectedDoctor(null)}
              className="text-sm text-blue-500 hover:underline mb-4 inline-block"
            >
              ← Назад к списку врачей
            </button>
            <h3 className="text-2xl font-semibold text-[#001E80] mb-2">
              Чат с {selectedDoctor.name}
            </h3>
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 h-[400px] space-y-3 mb-4">
              {messages.length === 0 ? (
                <div className="text-gray-400 text-center pt-20">Нет сообщений</div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "Вы" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`p-3 rounded-lg max-w-xs ${
                        msg.sender === "Вы" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Введите сообщение..."
                className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-400"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !inputText.trim()}
                className="bg-gradient-to-r from-[#001E80] to-[#3A50FF] text-white px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Отправить"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatDoctors;
