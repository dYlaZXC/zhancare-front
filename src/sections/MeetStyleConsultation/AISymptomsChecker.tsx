"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faArrowUp,
  faArrowLeft,
  faSpinner,
  faMicrophone,
  faStop,
  faHeartPulse,
  faCircleCheck,
  faUserMd,
  faImage,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface TimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

interface DoctorRecommendation {
  id: number;
  name: string;
  specialization?: {
    ru: string;
    en: string;
    kz: string;
  };
  doctor_type?: string; // Legacy field for backward compatibility
  email: string;
  phone?: string;
  years_of_experience?: number;
  clinic?: {
    name: string;
    address: string;
    city: string | null;
    rating: number | null;
  };
  language?: string;
  urgency: string;
  timeSlots?: TimeSlot[];
}

interface Message {
  role: "user" | "assistant" | "doctor-card" | "doctors-list" | "time-slots";
  content: string;
  doctor?: DoctorRecommendation;
  doctors?: DoctorRecommendation[];
  timeSlots?: TimeSlot[];
  doctorId?: number;
  doctorName?: string;
  imageUrl?: string;
}

// Helper function to format AI message content with better structure
const formatAIMessage = (content: string) => {
  // Split by newlines and process each paragraph
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, idx) => {
        // Check if paragraph contains a list (sentences ending with dots)
        const sentences = paragraph.split('. ').filter(s => s.trim());

        if (sentences.length > 3) {
          // If many sentences, format as a list
          return (
            <div key={idx} className="space-y-2">
              {sentences.map((sentence, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2">
                  <span className="text-blue-600 leading-relaxed" style={{ color: "#3772ff" }}>•</span>
                  <span className="flex-1 leading-relaxed">{sentence.trim()}{sIdx < sentences.length - 1 && !sentence.endsWith('.') ? '.' : ''}</span>
                </div>
              ))}
            </div>
          );
        } else {
          // Regular paragraph
          return (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          );
        }
      })}
    </div>
  );
};

export default function AISymptomsChecker() {
  const router = useRouter();
  const { language } = useLanguage();

  // Get initial welcome message based on language
  const getWelcomeMessage = () => {
    switch (language) {
      case "en":
        return "Hello! I'm your medical AI assistant. Please tell me what's bothering you? Describe your symptoms in detail. You can also attach photos of symptoms (rash, redness, etc.).";
      case "kz":
        return "Сәлеметсіз бе! Мен сіздің медициналық AI көмекшісімін. Сізді не алаңдатып тұр? Симптомдарыңызды толық сипаттаңыз. Сондай-ақ симптомдардың фотосуреттерін тіркеуге болады (бөртпе, қызару және т.б.).";
      case "ru":
      default:
        return "Здравствуйте! Я ваш медицинский ИИ-ассистент. Расскажите, пожалуйста, что вас беспокоит? Опишите ваши симптомы подробно. Вы также можете прикрепить фото симптомов (сыпь, покраснения и т.д.).";
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: getWelcomeMessage(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      // Only update if the first message is still the welcome message (no user messages yet)
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [
          {
            role: "assistant",
            content: getWelcomeMessage(),
          },
        ];
      }
      return prev;
    });
  }, [language]);

  const handleSendMessage = async () => {
    // Allow sending if there's either text or an image
    if ((!input.trim() && !imagePreview) || isLoading) return;

    const userMessage = input.trim() || "📷 [Фото симптомов]";
    const userImage = imagePreview;

    setInput("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Reset textarea height and scroll to initial state
    if (inputRef.current) {
      inputRef.current.style.height = "40px";
      inputRef.current.style.overflowY = "hidden";
      inputRef.current.scrollTop = 0;
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage, imageUrl: userImage || undefined }]);
    setIsLoading(true);

    try {
      // Check if user is actually describing symptoms (not just greeting or asking questions)
      const startsWithGreeting = /^(hi|hello|привет|здравствуй|добрый|hey|хай|салам)/i.test(userMessage.trim());
      const startsWithQuestion = /^(how|what|when|where|why|как|что|когда|где|почему|можно|можете|у вас|есть ли)/i.test(userMessage.trim());
      const isShortMessage = userMessage.trim().length < 10;

      // Check for symptom keywords in the entire message
      const hasSymptomKeywords = /боли|болит|температура|кашель|головная|живот|горло|насморк|слабость|тошнота|рвота|понос|давление|сердце|грудь|спина|pain|ache|fever|cough|headache|stomach|throat|cold|weak|nausea|vomiting|diarrhea|pressure|chest|back|ауру|температура|жөтел|бас ауруы|іш қатты|жүрек/i.test(userMessage.trim());

      // Check for random/nonsense text (no vowels, too many consonants, random characters)
      const hasVowels = /[аеёиоуыэюяaeiouy]/i.test(userMessage.trim());
      const consonantRatio = (userMessage.match(/[бвгджзйклмнпрстфхцчшщbcdfghjklmnpqrstvwxyz]/gi) || []).length / userMessage.trim().length;
      const isLikelyNonsense = !hasVowels || consonantRatio > 0.8;

      // Determine if message is ONLY a greeting/question or if it contains symptoms
      const isOnlyGreeting = startsWithGreeting && isShortMessage && !hasSymptomKeywords;
      const isOnlyQuestion = startsWithQuestion && isShortMessage && !hasSymptomKeywords;
      const isTooVague = isShortMessage && !hasSymptomKeywords;

      // Only call AI if it seems like actual symptoms (not greeting/question and message has substance)
      if (isOnlyGreeting || isOnlyQuestion || isLikelyNonsense || isTooVague) {
        // Detect language based on message content
        const isEnglish = /^(hi|hello|hey|good|how|what|when|where|why|can|do|does)/i.test(userMessage.trim());
        const isKazakh = /[әғқңөұүһ]/i.test(userMessage.trim());

        // Respond with a friendly message encouraging symptom description in detected language
        let greetingResponses;

        if (isEnglish) {
          greetingResponses = [
            "Hello! Please describe your symptoms in detail so I can help you find the right doctor.",
            "Hi! Tell me, what's bothering you? Please describe your symptoms.",
            "Hello! I'll help you find a doctor. Please describe what symptoms are concerning you.",
          ];
        } else if (isKazakh) {
          greetingResponses = [
            "Сәлеметсіз бе! Симптомдарыңызды толық сипаттаңыз, маманды табуға көмектесе аламын.",
            "Сәлем! Сізді не алаңдатып тұр? Симптомдарыңызды сипаттаңыз.",
            "Сәлеметсіз бе! Дәрігерді табуға көмектесемін. Қандай симптомдар сіздің алаңдатып тұрғанын айтыңыз.",
          ];
        } else {
          // Default to Russian
          greetingResponses = [
            "Здравствуйте! Пожалуйста, опишите ваши симптомы подробно, чтобы я мог помочь вам найти подходящего врача.",
            "Привет! Расскажите, что вас беспокоит? Опишите ваши симптомы.",
            "Здравствуйте! Я помогу вам найти врача. Опишите, пожалуйста, какие симптомы вас беспокоят.",
          ];
        }

        const randomResponse = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];

        setMessages((prev) => [...prev, { role: "assistant", content: randomResponse }]);
        setIsLoading(false);
        return;
      }

      // Collect all user messages to build full symptom description
      const allUserMessages = [...messages.filter(m => m.role === "user").map(m => m.content), userMessage];
      const fullSymptoms = allUserMessages.join(". ");

      // Call AI recommendation API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultations/ai-recommend/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          symptoms: fullSymptoms,
          language: "ru"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI recommendation");
      }

      const data = await response.json();
      console.log("AI API Response:", data);
      console.log("Messages length:", messages.length);
      console.log("Data success:", data.success);
      console.log("Data recommended_doctor:", data.recommended_doctor);

      // Format the AI response
      let aiResponse = "";
      let specialty = "";
      let reason = "";

      // Extract reason and specialty from different response formats
      if (data.success && data.recommended_doctor) {
        // Doctor found format
        reason = data.recommended_doctor.reason || "";
        specialty = data.recommended_doctor.doctor_type || "";
      } else if (!data.success && data.ai_data) {
        // No doctor found format
        reason = data.ai_data.reason || "";
        specialty = data.ai_data.specialty || "";
      } else if (data.reason) {
        // Direct format (if any)
        reason = data.reason;
        specialty = data.specialty || "";
      }

      // Use the reason as AI response
      if (reason) {
        aiResponse = reason;
      } else if (data.error) {
        // Handle error from backend
        aiResponse = "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте описать ваши симптомы более подробно.";
      } else {
        // Fallback response if API doesn't return expected data
        const responses = [
          "Понимаю. Как долго у вас эти симптомы?",
          "Спасибо за информацию. Есть ли у вас температура?",
          "Хорошо. Принимали ли вы какие-либо лекарства?",
        ];
        aiResponse = responses[Math.min(messages.length / 2, responses.length - 1)];
      }

      // Detect language from AI response to localize additional messages
      const detectResponseLanguage = (text: string) => {
        const hasEnglish = /[a-zA-Z]/.test(text);
        const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
        const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text);

        if (hasEnglish && !hasCyrillic) return "en";
        if (hasKazakh) return "kz";
        return "ru";
      };

      const responseLang = detectResponseLanguage(aiResponse);

      // If we have enough information (either doctor found or not)
      // Note: messages.length will be 1 here because setState is async and hasn't updated yet
      console.log("Checking condition: messages.length >= 1 && (data.success || (!data.success && data.ai_data))");
      console.log("Result:", messages.length >= 1 && (data.success || (!data.success && data.ai_data)));

      if (messages.length >= 1 && (data.success || (!data.success && data.ai_data))) {
        console.log("Inside main condition block");
        // Add AI explanation message with localized specialty recommendation
        if (specialty) {
          const specialtyMessages = {
            en: `\n\nBased on your symptoms, I recommend consulting with a specialist: ${specialty}.`,
            ru: `\n\nОсновываясь на ваших симптомах, я рекомендую консультацию с специалистом: ${specialty}.`,
            kz: `\n\nСимптомдарыңызға сүйене отырып, маманмен кеңесуді ұсынамын: ${specialty}.`
          };
          aiResponse += specialtyMessages[responseLang as keyof typeof specialtyMessages] || specialtyMessages.ru;
        }

        // If doctor found (either exact match or fallback)
        console.log("Checking doctor card condition:", data.success, data.recommended_doctor);
        if (data.success && data.recommended_doctor) {
          console.log("Creating doctor card!");

          const doctorFoundMessages = {
            en: "I found a suitable doctor for you:",
            ru: "Я нашел подходящего врача для вас:",
            kz: "Сізге қолайлы дәрігерді таптым:"
          };
          let cardContent = doctorFoundMessages[responseLang as keyof typeof doctorFoundMessages] || doctorFoundMessages.ru;

          // If it's a fallback doctor (when requested specialty not available)
          if (data.fallback_used && data.requested_specialty) {
            const fallbackMessages = {
              en: `\n\nUnfortunately, we currently don't have an available specialist in "${data.requested_specialty}". However, I can offer you a consultation with our doctor who can conduct an initial examination and refer you to the appropriate specialist if needed.`,
              ru: `\n\nК сожалению, в данный момент у нас нет доступного специалиста по направлению "${data.requested_specialty}". Но я могу предложить вам консультацию с нашим врачом, который сможет провести первичный осмотр и при необходимости направить вас к нужному специалисту.`,
              kz: `\n\nӨкінішке орай, қазіргі уақытта "${data.requested_specialty}" бағыты бойынша қолжетімді маман жоқ. Бірақ мен сізге біздің дәрігермен кеңесуді ұсына аламын, ол алғашқы тексеруді өткізе алады және қажет болса, сізді қажетті маманға жібере алады.`
            };
            aiResponse += fallbackMessages[responseLang as keyof typeof fallbackMessages] || fallbackMessages.ru;

            const alternativeMessages = {
              en: "Recommended doctor (alternative):",
              ru: "Рекомендуемый врач (альтернатива):",
              kz: "Ұсынылған дәрігер (балама):"
            };
            cardContent = alternativeMessages[responseLang as keyof typeof alternativeMessages] || alternativeMessages.ru;
          }

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: aiResponse },
            {
              role: "doctor-card",
              content: cardContent,
              doctor: data.recommended_doctor
            }
          ]);
          setIsLoading(false);
          return;
        }

        // If no doctor found at all (even fallback failed)
        if (!data.success && data.ai_data && specialty) {
          const noDoctorMessages = {
            en: `\n\nUnfortunately, all our doctors are currently busy. Please try again later or contact us by phone for urgent consultation.`,
            ru: `\n\nК сожалению, в данный момент все наши врачи заняты. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону для срочной консультации.`,
            kz: `\n\nӨкінішке орай, қазіргі уақытта барлық дәрігерлеріміз бос емес. Кейінірек қайталап көріңіз немесе шұғыл кеңес алу үшін бізге телефон арқылы хабарласыңыз.`
          };
          const noDocMessage = noDoctorMessages[responseLang as keyof typeof noDoctorMessages] || noDoctorMessages.ru;

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: aiResponse + noDocMessage }
          ]);
          setIsLoading(false);
          return;
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error calling AI recommendation API:", error);

      // Fallback to simulated responses on error
      const responses = [
        "Понимаю. Как долго у вас эти симптомы?",
        "Спасибо за информацию. Есть ли у вас температура?",
        "Хорошо. Принимали ли вы какие-либо лекарства?",
        "Отлично. Основываясь на ваших симптомах, я рекомендую консультацию с терапевтом. Подбираю подходящего врача...",
      ];

      const response = responses[Math.min(messages.length / 2, responses.length - 1)];
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setIsLoading(false);

      // After 4 exchanges, redirect to doctor matching
      if (messages.length >= 7) {
        setTimeout(() => {
          router.push("/consultation/matching");
        }, 2000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  const handleBookAppointment = async (doctorId: number, doctorName: string) => {
    setIsLoading(true);

    try {
      // Call API to get doctor's available time slots
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultations/get-doctor-time-slots/${doctorId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch time slots");
      }

      const data = await response.json();
      console.log("Time slots response:", data);

      if (data.success && data.timeSlots && data.timeSlots.length > 0) {
        // Detect language from previous messages
        const lastBotMessage = messages.filter(m => m.role === "assistant").pop();
        const detectResponseLanguage = (text: string) => {
          const hasEnglish = /[a-zA-Z]/.test(text || "");
          const hasCyrillic = /[а-яА-ЯёЁ]/.test(text || "");
          const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text || "");

          if (hasEnglish && !hasCyrillic) return "en";
          if (hasKazakh) return "kz";
          return "ru";
        };

        const responseLang = detectResponseLanguage(lastBotMessage?.content || "");

        const messages_text = {
          en: `Here are the available appointment times for Dr. ${doctorName}:`,
          ru: `Вот доступное время приема для врача ${doctorName}:`,
          kz: `Міне дәрігер ${doctorName} үшін қолжетімді қабылдау уақыты:`
        };

        setMessages((prev) => [
          ...prev,
          {
            role: "time-slots",
            content: messages_text[responseLang as keyof typeof messages_text] || messages_text.ru,
            timeSlots: data.timeSlots,
            doctorId,
            doctorName
          }
        ]);
      } else {
        const errorMessages = {
          en: "Sorry, no available time slots at the moment. Please try again later or contact the clinic directly.",
          ru: "К сожалению, нет доступных временных слотов в данный момент. Попробуйте позже или свяжитесь с клиникой напрямую.",
          kz: "Кешіріңіз, қазіргі уақытта бос уақыт жоқ. Кейінірек қайталап көріңіз немесе клиникаға тікелей хабарласыңыз."
        };

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessages.ru
          }
        ]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка при загрузке расписания. Пожалуйста, попробуйте позже."
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleShowOtherDoctors = async () => {
    setIsLoading(true);

    try {
      // Call API to get 5 random available doctors
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consultations/get-random-doctors/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch alternative doctors");
      }

      const data = await response.json();
      console.log("Alternative doctors response:", data);

      if (data.success && data.doctors && data.doctors.length > 0) {
        // Detect language from previous messages
        const lastBotMessage = messages.filter(m => m.role === "assistant").pop();
        const detectResponseLanguage = (text: string) => {
          const hasEnglish = /[a-zA-Z]/.test(text || "");
          const hasCyrillic = /[а-яА-ЯёЁ]/.test(text || "");
          const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text || "");

          if (hasEnglish && !hasCyrillic) return "en";
          if (hasKazakh) return "kz";
          return "ru";
        };

        const responseLang = detectResponseLanguage(lastBotMessage?.content || "");

        const messages_text = {
          en: "Here are other available doctors you can consult with:",
          ru: "Вот другие доступные врачи, с которыми вы можете проконсультироваться:",
          kz: "Міне, сіз кеңес ала алатын басқа қолжетімді дәрігерлер:"
        };

        setMessages((prev) => [
          ...prev,
          {
            role: "doctors-list",
            content: messages_text[responseLang as keyof typeof messages_text] || messages_text.ru,
            doctors: data.doctors
          }
        ]);
      } else {
        const errorMessages = {
          en: "Sorry, no available doctors at the moment. Please try again later.",
          ru: "Извините, в данный момент нет доступных врачей. Пожалуйста, попробуйте позже.",
          kz: "Кешіріңіз, қазіргі уақытта қолжетімді дәрігерлер жоқ. Кейінірек қайталап көріңіз."
        };

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMessages.ru
          }
        ]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching alternative doctors:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Произошла ошибка при загрузке списка врачей. Пожалуйста, попробуйте позже."
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл слишком большой. Максимальный размер: 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert("Пожалуйста, выберите изображение");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #ebf1ff 0%, #ffffff 50%, #ebf1ff 100%)" }}>
      {/* Header */}
      <header className="bg-white border-b shadow-sm" style={{ borderColor: "#e1eaff" }}>
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all hover:scale-105 text-sm sm:text-base"
              style={{
                color: "#2956bf",
                background: "#ebf1ff"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e1eaff"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#ebf1ff"}
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs sm:text-sm" />
              <span className="hidden sm:inline font-medium">Назад</span>
            </button>

            {/* Center - AI Assistant Info */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 justify-center">
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl sm:rounded-2xl blur-lg opacity-40"
                  style={{ background: "#3772ff" }}
                />
                <div
                  className="relative w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                >
                  <FontAwesomeIcon icon={faRobot} className="text-white text-sm sm:text-base lg:text-xl" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-sm sm:text-base lg:text-lg" style={{ color: "#283353" }}>ИИ Медицинский Ассистент</h1>
                <p className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2" style={{ color: "#3772ff" }}>
                  <FontAwesomeIcon icon={faHeartPulse} className="text-xs" />
                  <span>Диагностика симптомов</span>
                </p>
              </div>
            </div>

            {/* Online Badge */}
            <div className="flex justify-end">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold whitespace-nowrap" style={{ background: "#ebf1ff", color: "#2956bf" }}>
                Онлайн
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4">
        <div className="container mx-auto max-w-5xl space-y-4 sm:space-y-6">
          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border"
            style={{
              background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
              borderColor: "#2956bf"
            }}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCircleCheck} className="text-white text-base sm:text-xl" />
              </div>
              <div className="text-white">
                <h3 className="font-bold text-base sm:text-lg lg:text-xl mb-1 sm:mb-2">Добро пожаловать в ZhanCare AI</h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  Я проведу предварительную диагностику ваших симптомов и помогу подобрать подходящего специалиста.
                  Все данные конфиденциальны и защищены.
                </p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div>
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>ИИ Ассистент</span>
                      </div>
                      <div
                        className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border"
                        style={{
                          background: "white",
                          borderColor: "#e1eaff"
                        }}
                      >
                        <div className="text-sm sm:text-base break-words" style={{ color: "#283353", overflowWrap: "break-word", wordBreak: "break-word" }}>
                          {formatAIMessage(message.content)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : message.role === "doctor-card" && message.doctor ? (() => {
                  // Detect language for doctor card labels
                  const detectLang = () => {
                    const lastAssistant = messages.filter(m => m.role === "assistant").pop();
                    const text = lastAssistant?.content || "";
                    const hasEnglish = /[a-zA-Z]/.test(text);
                    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
                    const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text);
                    if (hasEnglish && !hasCyrillic) return "en";
                    if (hasKazakh) return "kz";
                    return "ru";
                  };
                  const lang = detectLang();

                  const labels = {
                    doctorRecommendation: { en: "Doctor Recommendation", ru: "Рекомендация врача", kz: "Дәрігер ұсынысы" },
                    bookAppointment: { en: "Book Appointment", ru: "Записаться на прием", kz: "Жазылу" },
                    showOtherDoctors: { en: "Show Other Doctors", ru: "Показать других врачей", kz: "Басқа дәрігерлерді көрсету" },
                    urgentConsultation: { en: "Urgent Consultation", ru: "Срочная консультация", kz: "Шұғыл кеңес" },
                    experience: { en: "years experience", ru: "лет опыта", kz: "жыл тәжірибе" },
                    clinic: { en: "Clinic", ru: "Клиника", kz: "Клиника" }
                  };

                  // Get specialization in current language
                  const doctorSpecialization = message.doctor.specialization
                    ? message.doctor.specialization[lang as keyof typeof message.doctor.specialization]
                    : message.doctor.doctor_type || "Doctor";

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{labels.doctorRecommendation[lang as keyof typeof labels.doctorRecommendation]}</span>
                      </div>
                      <div
                        className="rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-2xl border-2 relative"
                        style={{
                          background: "linear-gradient(135deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)",
                          borderColor: "#60a5fa",
                          boxShadow: "0 20px 60px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                        }}
                      >
                        {/* Premium Badge for Urgent Cases */}
                        {message.doctor.urgency === "urgent" && (
                          <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-2xl" style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}>
                            <div className="flex items-center gap-1.5">
                              <FontAwesomeIcon icon={faHeartPulse} className="text-white text-sm animate-pulse" />
                              <span className="text-white text-xs font-bold uppercase tracking-wider">{labels.urgentConsultation[lang as keyof typeof labels.urgentConsultation]}</span>
                            </div>
                          </div>
                        )}

                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", filter: "blur(40px)" }}></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", filter: "blur(30px)" }}></div>

                        <div className="relative px-5 py-5 sm:px-7 sm:py-6">
                          {/* Doctor Header */}
                          <div className="flex items-start gap-4 sm:gap-5 mb-5">
                            {/* Enhanced Avatar */}
                            <div className="relative flex-shrink-0">
                              <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                style={{
                                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)",
                                  backdropFilter: "blur(10px)",
                                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.3)"
                                }}
                              >
                                <FontAwesomeIcon icon={faUserMd} className="text-white text-2xl sm:text-3xl" />
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
                              </div>
                              {/* Status indicator */}
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-blue-900 animate-pulse" style={{ background: "#10b981" }}></div>
                            </div>

                            {/* Doctor Info */}
                            <div className="flex-1 pt-1">
                              <h3 className="text-white font-bold text-lg sm:text-xl mb-1.5 leading-tight" style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)" }}>
                                {message.doctor.name}
                              </h3>
                              <p className="text-blue-100 text-sm sm:text-base mb-2 font-medium">{doctorSpecialization}</p>
                              {message.doctor.years_of_experience && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)" }}>
                                  <span className="text-blue-100">✨</span>
                                  <span className="text-white">{message.doctor.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Clinic Information Card */}
                          {message.doctor.clinic && (
                            <div
                              className="rounded-xl p-4 mb-5 relative overflow-hidden"
                              style={{
                                background: "rgba(255, 255, 255, 0.12)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)"
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 255, 255, 0.2)" }}>
                                  <span className="text-base">🏥</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-blue-100/80 text-xs font-semibold mb-1 uppercase tracking-wide">{labels.clinic[lang as keyof typeof labels.clinic]}</p>
                                  <p className="text-white text-sm sm:text-base font-bold mb-2 leading-tight">{message.doctor.clinic.name}</p>

                                  <div className="space-y-1.5">
                                    {message.doctor.clinic.address && (
                                      <div className="flex items-start gap-2">
                                        <span className="text-blue-200 text-xs mt-0.5">📍</span>
                                        <p className="text-blue-100 text-xs leading-relaxed flex-1">{message.doctor.clinic.address}</p>
                                      </div>
                                    )}
                                    {message.doctor.clinic.city && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-200 text-xs">🌆</span>
                                        <p className="text-blue-100 text-xs">{message.doctor.clinic.city}</p>
                                      </div>
                                    )}
                                    {message.doctor.clinic.rating && (
                                      <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(251, 191, 36, 0.15)" }}>
                                          <span className="text-sm">⭐</span>
                                          <span className="text-amber-200 text-xs font-bold">{message.doctor.clinic.rating.toFixed(1)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Premium Action Buttons */}
                          <div className="space-y-3">
                            {/* Primary CTA Button */}
                            <button
                              onClick={() => router.push("/consultation/schedule")}
                              className="w-full py-4 sm:py-5 font-bold rounded-xl sm:rounded-2xl transition-all relative overflow-hidden group"
                              style={{
                                background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                                color: "#1e40af",
                                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                              }}
                            >
                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              <span className="relative flex items-center justify-center gap-2 text-sm sm:text-base">
                                <span>{labels.bookAppointment[lang as keyof typeof labels.bookAppointment]}</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                              </span>
                            </button>

                            {/* Secondary Button */}
                            <button
                              onClick={handleShowOtherDoctors}
                              disabled={isLoading}
                              className="w-full py-3 sm:py-3.5 font-semibold rounded-xl transition-all relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                background: "rgba(255, 255, 255, 0.15)",
                                color: "white",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                backdropFilter: "blur(10px)"
                              }}
                            >
                              <span className="relative text-xs sm:text-sm">{labels.showOtherDoctors[lang as keyof typeof labels.showOtherDoctors]}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })() : message.role === "doctors-list" && message.doctors ? (() => {
                  // Detect language for doctors list
                  const detectLang = () => {
                    const text = message.content || "";
                    const hasEnglish = /[a-zA-Z]/.test(text);
                    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
                    const hasKazakh = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text);
                    if (hasEnglish && !hasCyrillic) return "en";
                    if (hasKazakh) return "kz";
                    return "ru";
                  };
                  const lang = detectLang();

                  const labels = {
                    book: { en: "Book", ru: "Записаться", kz: "Жазылу" },
                    experience: { en: "years exp", ru: "лет опыта", kz: "жыл тәжірибе" },
                    clinic: { en: "Clinic", ru: "Клиника", kz: "Клиника" }
                  };

                  return (
                  <div className="max-w-[90%] sm:max-w-[85%] flex gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                    >
                      <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="px-2 py-1 rounded-lg mb-2 inline-block" style={{ background: "#ebf1ff" }}>
                        <span className="text-xs font-semibold" style={{ color: "#2956bf" }}>{message.content}</span>
                      </div>
                      <div className="space-y-3">
                        {message.doctors.map((doctor, idx) => {
                          // Get specialization in current language
                          const doctorSpecialization = doctor.specialization
                            ? doctor.specialization[lang as keyof typeof doctor.specialization]
                            : doctor.doctor_type || "Doctor";

                          return (
                            <div
                              key={doctor.id || idx}
                              className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border relative"
                              style={{
                                background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
                                borderColor: "#60a5fa",
                                boxShadow: "0 10px 40px rgba(37, 99, 235, 0.3)"
                              }}
                            >
                              {/* Decorative elements */}
                              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)", filter: "blur(20px)" }}></div>

                              <div className="relative px-4 py-3 sm:px-5 sm:py-4">
                                <div className="flex items-start gap-3 mb-3">
                                  {/* Avatar */}
                                  <div className="relative flex-shrink-0">
                                    <div
                                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                                      style={{
                                        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)",
                                        backdropFilter: "blur(10px)",
                                        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)"
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faUserMd} className="text-white text-sm sm:text-base" />
                                    </div>
                                    {/* Status dot */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-blue-900" style={{ background: "#10b981" }}></div>
                                  </div>

                                  <div className="flex-1">
                                    <h3 className="text-white font-bold text-sm sm:text-base mb-0.5 leading-tight">{doctor.name}</h3>
                                    <p className="text-blue-100 text-xs sm:text-sm mb-1.5">{doctorSpecialization}</p>
                                    {doctor.years_of_experience && (
                                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255, 255, 255, 0.15)" }}>
                                        <span className="text-blue-100">✨</span>
                                        <span className="text-white font-semibold">{doctor.years_of_experience} {labels.experience[lang as keyof typeof labels.experience]}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Clinic Info */}
                                {doctor.clinic && (
                                  <div
                                    className="rounded-lg p-2.5 mb-3"
                                    style={{
                                      background: "rgba(255, 255, 255, 0.1)",
                                      backdropFilter: "blur(10px)",
                                      border: "1px solid rgba(255, 255, 255, 0.15)"
                                    }}
                                  >
                                    <p className="text-white text-xs font-semibold mb-1.5">{doctor.clinic.name}</p>
                                    <div className="flex items-center justify-between gap-2">
                                      {doctor.clinic.city && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-blue-200 text-xs">📍</span>
                                          <span className="text-blue-100 text-xs">{doctor.clinic.city}</span>
                                        </div>
                                      )}
                                      {doctor.clinic.rating && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(251, 191, 36, 0.15)" }}>
                                          <span className="text-xs">⭐</span>
                                          <span className="text-amber-200 text-xs font-bold">{doctor.clinic.rating.toFixed(1)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Book Button */}
                                <button
                                  onClick={() => router.push("/consultation/schedule")}
                                  className="w-full py-2.5 sm:py-3 font-bold rounded-lg sm:rounded-xl transition-all relative overflow-hidden group"
                                  style={{
                                    background: "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                                    color: "#1e40af",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                                  }}
                                >
                                  <span className="relative flex items-center justify-center gap-1.5 text-xs sm:text-sm">
                                    <span>{labels.book[lang as keyof typeof labels.book]}</span>
                                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  );
                })() : (
                  <div className="max-w-[90%] sm:max-w-[85%]">
                    <div
                      className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)",
                      }}
                    >
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Attached"
                          className="max-w-full rounded-xl mb-2"
                          style={{ maxHeight: "300px", objectFit: "contain" }}
                        />
                      )}
                      <p className="text-white text-sm sm:text-base leading-relaxed break-words" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{message.content}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
                <div
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
                >
                  <FontAwesomeIcon icon={faRobot} className="text-white text-xs sm:text-sm" />
                </div>
                <div className="rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg border" style={{ background: "white", borderColor: "#e1eaff" }}>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm sm:text-base" style={{ color: "#3772ff" }} />
                    <span className="text-sm sm:text-base" style={{ color: "#283353" }}>Анализирую симптомы...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t" style={{ borderColor: "#e1eaff" }}>
        <div className="container mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-[200px] max-h-[200px] rounded-xl border-2"
                style={{ borderColor: "#3772ff" }}
              />
              <button
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xs" />
              </button>
            </div>
          )}

          <div className="relative">
            {/* Combined Input Container */}
            <div className="relative rounded-3xl border-2 transition-all shadow-lg"
              style={{
                borderColor: "#3772ff",
                background: "#ffffff"
              }}
            >
              <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Опишите ваши симптомы..."
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-3xl focus:outline-none focus:ring-0 focus:border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-transparent text-xs sm:text-sm lg:text-base resize-none overflow-hidden break-words border-0"
                  style={{
                    minHeight: "40px",
                    maxHeight: "120px",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    boxShadow: "none",
                    border: "none",
                    outline: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none"
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "40px";
                    const newHeight = Math.min(target.scrollHeight, 120);
                    target.style.height = newHeight + "px";
                    // Only show scroll if content exceeds max height
                    target.style.overflowY = target.scrollHeight > 120 ? "auto" : "hidden";
                  }}
                />

                {/* Right Side Buttons */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Image Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: imagePreview ? "#3772ff" : "transparent",
                    color: imagePreview ? "white" : "#3772ff"
                  }}
                >
                  <FontAwesomeIcon
                    icon={faImage}
                    className="text-sm sm:text-base"
                  />
                </button>

                {/* Voice Recording Button */}
                <button
                  onClick={toggleRecording}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: isRecording ? "#ef4444" : "transparent",
                    color: isRecording ? "white" : "#3772ff"
                  }}
                >
                  <FontAwesomeIcon
                    icon={isRecording ? faStop : faMicrophone}
                    className={`text-sm sm:text-base ${isRecording ? "animate-pulse" : ""}`}
                  />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !imagePreview) || isLoading}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full text-white flex items-center justify-center transition-all disabled:cursor-not-allowed group"
                  style={{
                    background: (input.trim() || imagePreview) && !isLoading
                      ? "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)"
                      : "#bcc0ca"
                  }}
                  onMouseEnter={(e) => {
                    if ((input.trim() || imagePreview) && !isLoading) {
                      e.currentTarget.style.transform = "scale(1.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {/* Glow effect */}
                  {(input.trim() || imagePreview) && !isLoading && (
                    <div
                      className="absolute inset-0 rounded-full blur-md opacity-50 -z-10"
                      style={{ background: "#3772ff" }}
                    />
                  )}
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs sm:text-sm" />
                </button>
              </div>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-2 sm:mt-3 flex items-center justify-center gap-0.5 xs:gap-1 sm:gap-1.5 text-[8px] xs:text-[9px] sm:text-xs px-2" style={{ color: "#3772ff" }}>
            <span className="font-medium whitespace-nowrap">Enter - отправка</span>
            <span className="whitespace-nowrap" style={{ color: "#bcc0ca" }}>•</span>
            <span className="font-medium whitespace-nowrap">Shift+Enter - строка</span>
          </div>
        </div>
      </div>
    </div>
  );
}
