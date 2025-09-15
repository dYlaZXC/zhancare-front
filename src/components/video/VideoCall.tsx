"use client";

import React, { useState, useEffect, useRef } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";

interface VideoCallProps {
  meetingId: string;
  doctor: string;
  onEndCall: () => void;
  isDoctor: boolean;
  userName: string;
  jwtToken?: string;
}

const API_KEY = "QqkMxELY0YVGkCx17Vya04Sq9nGvCahu";
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

const VideoCall: React.FC<VideoCallProps> = ({
  meetingId,
  doctor,
  onEndCall,
  isDoctor,
  userName,
  jwtToken,
}) => {
  const safeUserName = userName || "guest";
  const userEmail = `${safeUserName.toLowerCase().replace(/\s+/g, "")}@example.com`;

  const [messages, setMessages] = useState<{ user: string; response: string }[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const { language } = useLanguage();
  const t = language === "ru" ? ru.chat : kz.chat;

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { user: userInput, response: "" };
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
          { role: "system", content: t.assistantInstruction },
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

      if (!res.ok) throw new Error(t.fetchError);

      const data = await res.json();

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        return [...prev.slice(0, -1), { ...last, response: data.choices[0].message.content }];
      });
    } catch (err) {
      setError(t.genericError);
    } finally {
      setUserInput("");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative"
         style={{
           background: `
             radial-gradient(circle at 50% 50%, rgba(55, 114, 255, 0.15) 0%, transparent 50%),
             linear-gradient(135deg, #12263a 0%, #1e263e 25%, #29358f 75%, #3772ff 100%)
           `
         }}>

      {/* Premium Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full blur-xl animate-pulse"
             style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.2) 0%, rgba(41, 53, 143, 0.1) 100%)', animationDuration: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 rounded-full blur-lg animate-bounce"
             style={{ background: 'radial-gradient(circle, rgba(50, 103, 230, 0.25) 0%, rgba(30, 38, 62, 0.1) 100%)', animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full blur-md animate-ping"
             style={{ background: 'radial-gradient(circle, rgba(67, 126, 255, 0.3) 0%, transparent 70%)', animationDuration: '2s' }}></div>
      </div>

      {/* Premium Header */}
      <div className="relative z-10 p-6 backdrop-blur-xl border-b border-white/10"
           style={{
             background: `
               linear-gradient(135deg,
                 rgba(55, 114, 255, 0.15) 0%,
                 rgba(50, 103, 230, 0.1) 50%,
                 rgba(44, 91, 204, 0.05) 100%
               )
             `,
             boxShadow: `
               0 8px 32px rgba(55, 114, 255, 0.1),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
             `
           }}>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Premium Status Icon */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}>
              <span className="text-white text-xl font-bold">📹</span>

              {/* Glow effect */}
              <div className="absolute -inset-1 rounded-2xl opacity-60 blur-lg -z-10"
                   style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}></div>

              {/* Live indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-lg">
                {isDoctor
                  ? "Вы ведете консультацию"
                  : `Звонок с доктором ${doctor || "Неизвестный врач"}`}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-sm text-gray-200">Meeting ID: {meetingId}</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/20"
                 style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-white">HD Качество</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Main Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        {/* Premium Video Container */}
        <div className="flex-1 bg-black min-w-0 relative overflow-hidden rounded-l-2xl ml-2 mt-2 mb-2"
             style={{
               boxShadow: `
                 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                 inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
               `
             }}>
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={meetingId}
            userInfo={{ displayName: safeUserName, email: userEmail }}
            configOverwrite={{
              prejoinPageEnabled: false,
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              enableClosePage: false,
              disableModeratorIndicator: !isDoctor,
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_BRAND_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              TOOLBAR_BUTTONS: [
                "microphone",
                "camera",
                "chat",
                "tileview",
                "fullscreen",
              ],
            }}
            jwt={jwtToken}
            getIFrameRef={(node) => {
              const iframe = node as HTMLIFrameElement;
              iframe.style.height = "100%";
              iframe.style.width = "100%";
              iframe.style.border = "none";
              iframe.allow = "camera; microphone; display-capture";
            }}
          />
        </div>

        {/* Premium AI Chat Container */}
        <div className="w-[380px] min-w-[320px] max-w-sm flex flex-col relative overflow-hidden m-2 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl"
             style={{
               background: `
                 linear-gradient(135deg,
                   rgba(55, 114, 255, 0.1) 0%,
                   rgba(50, 103, 230, 0.05) 50%,
                   rgba(255, 255, 255, 0.95) 100%
                 )
               `,
               boxShadow: `
                 0 25px 50px -12px rgba(55, 114, 255, 0.2),
                 inset 0 1px 0 0 rgba(255, 255, 255, 0.2)
               `
             }}>

          {/* Premium Chat Header */}
          <div className="relative overflow-hidden p-4 backdrop-blur-xl border-b border-white/10"
               style={{
                 background: `
                   linear-gradient(135deg,
                     rgba(55, 114, 255, 0.15) 0%,
                     rgba(50, 103, 230, 0.1) 50%,
                     rgba(44, 91, 204, 0.05) 100%
                   )
                 `
               }}>

            {/* Background decoration */}
            <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full opacity-20 blur-xl animate-pulse"
                 style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.4) 0%, transparent 70%)', animationDuration: '3s' }}></div>

            <div className="relative z-10 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}>
                <span className="text-white font-bold">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{t.title}</h3>
                <p className="text-xs text-gray-600">AI медицинский помощник</p>
              </div>
              <div className="ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Premium Chat Messages */}
          <div
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 text-sm relative"
            style={{
              background: `
                linear-gradient(135deg,
                  rgba(255, 255, 255, 0.8) 0%,
                  rgba(55, 114, 255, 0.02) 50%,
                  rgba(255, 255, 255, 0.9) 100%
                )
              `
            }}
          >
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                {/* User Message */}
                <div className="text-right">
                  <div className="inline-block relative overflow-hidden rounded-2xl p-3 max-w-[85%] backdrop-blur-sm"
                       style={{
                         background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)',
                         boxShadow: '0 4px 12px rgba(55, 114, 255, 0.3)'
                       }}>
                    <span className="text-white font-medium">{msg.user}</span>

                    {/* Message shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>

                {/* AI Response */}
                {msg.response && (
                  <div className="text-left mt-2">
                    <div className="inline-block relative overflow-hidden rounded-2xl p-3 max-w-[85%] backdrop-blur-sm border border-white/20"
                         style={{
                           background: `
                             linear-gradient(135deg,
                               rgba(40, 51, 83, 0.95) 0%,
                               rgba(30, 38, 62, 0.98) 100%
                             )
                           `,
                           boxShadow: '0 4px 12px rgba(40, 51, 83, 0.2)'
                         }}>
                      <span className="text-white font-medium">{msg.response}</span>

                      {/* AI glow effect */}
                      <div className="absolute -inset-0.5 rounded-2xl opacity-0 hover:opacity-30 transition-opacity duration-300 -z-10 blur-lg"
                           style={{ background: 'linear-gradient(135deg, #283353 0%, #1e263e 100%)' }}></div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Premium Loading Animation */}
            {loading && (
              <div className="text-left mt-2">
                <div className="inline-block relative overflow-hidden rounded-2xl p-3 max-w-[85%] backdrop-blur-sm border border-white/20"
                     style={{
                       background: `
                         linear-gradient(135deg,
                           rgba(40, 51, 83, 0.95) 0%,
                           rgba(30, 38, 62, 0.98) 100%
                         )
                       `
                     }}>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-white font-medium">{t.typing}...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Error Display */}
            {error && (
              <div className="p-3 rounded-xl border backdrop-blur-sm"
                   style={{
                     background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                     borderColor: 'rgba(239, 68, 68, 0.2)'
                   }}>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                    <span className="text-white text-xs">!</span>
                  </div>
                  <p className="text-red-700 font-medium text-xs">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Premium Chat Input */}
          <div className="p-4 border-t border-white/10 backdrop-blur-xl"
               style={{
                 background: `
                   linear-gradient(135deg,
                     rgba(255, 255, 255, 0.9) 0%,
                     rgba(55, 114, 255, 0.05) 50%,
                     rgba(255, 255, 255, 0.95) 100%
                   )
                 `
               }}>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                placeholder={t.placeholder}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 backdrop-blur-sm text-gray-900 focus:ring-blue-500 placeholder-gray-400"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(55, 114, 255, 0.02) 100%)',
                  border: '2px solid rgba(55, 114, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(55, 114, 255, 0.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(55, 114, 255, 0.05), inset 0 2px 4px rgba(255, 255, 255, 0.1)';
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="group relative overflow-hidden flex items-center space-x-2 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:scale-105 active:scale-95"
                style={{
                  background: loading
                    ? 'linear-gradient(135deg, #e8e8e8 0%, #dddddd 100%)'
                    : 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)',
                  boxShadow: loading
                    ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                    : '0 8px 25px rgba(55, 114, 255, 0.3)',
                  color: loading ? '#1b1b1b' : '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3267e6 0%, #2c5bcc 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(55, 114, 255, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(55, 114, 255, 0.3)';
                  }
                }}
              >
                <span>{loading ? t.sending : t.sendButton}</span>

                {/* Button shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>

                {/* Glow effect */}
                {!loading && (
                  <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"
                       style={{ background: 'linear-gradient(135deg, #3772ff 0%, #3267e6 100%)' }}></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium End Call Button */}
      <div className="relative z-10 p-6 backdrop-blur-xl border-t border-white/10"
           style={{
             background: `
               linear-gradient(135deg,
                 rgba(55, 114, 255, 0.1) 0%,
                 rgba(50, 103, 230, 0.05) 50%,
                 rgba(44, 91, 204, 0.02) 100%
               )
             `,
             boxShadow: `
               0 -8px 32px rgba(55, 114, 255, 0.1),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
             `
           }}>

        <div className="flex justify-center">
          <button
            onClick={onEndCall}
            className="group relative overflow-hidden flex items-center space-x-3 px-8 py-4 rounded-2xl font-bold text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(220, 38, 38, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
            }}
          >
            {/* End call icon */}
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm">📞</span>
            </div>
            <span className="text-lg">Завершить звонок</span>

            {/* Button shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>

            {/* Glow effect */}
            <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-lg"
                 style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}></div>
          </button>
        </div>

        {/* Call duration indicator */}
        <div className="flex justify-center mt-4">
          <div className="px-4 py-2 rounded-xl backdrop-blur-sm border border-white/20"
               style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white">Звонок активен</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
