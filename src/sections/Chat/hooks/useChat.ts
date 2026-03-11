import { useState, ChangeEvent, useRef } from "react";
import { Message, ChatHookProps } from "../types";
// sZitnRrKGtYDjZo2OYNbS797yKSjRRNT
// aTzSULuZc45ObRxLrRBFa50GnCanWo1M // Extra key
const API_KEY = "aTzSULuZc45ObRxLrRBFa50GnCanWo1M"; 
const ENDPOINT = "https://api.mistral.ai/v1/chat/completions";

export const useChat = ({
  messages,
  setMessages,
  input,
  setInput,
  imagePreview,
  setImagePreview,
  language,
  messagesContainerRef
}: ChatHookProps) => {
  const [streaming, setStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messageIdCounter = useRef(0); // Use useRef instead of useState
  const activeRequestRef = useRef<AbortController | null>(null); // Track active requests

  // Better unique ID generation
  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return `msg_${Date.now()}_${messageIdCounter.current}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const getSystemPrompt = () => {
    switch (language) {
      case "ru":
        return "Вы профессиональный медицинский ассистент. Отвечайте четко и кратко на русском языке. Если пользователю следует обратиться к врачу, включите это в отдельной строке в конце вашего сообщения: <show_doctor_button>true</show_doctor_button>";
      case "en":
        return "You are a professional medical assistant. Respond clearly and concisely in English. If the user should consult a doctor, include this on a separate line at the end of your message: <show_doctor_button>true</show_doctor_button>";
      case "kz":
        return "Сіз кәсіби медициналық көмекшісіз. Қазақ тілінде айқын және қысқа жауап беріңіз. Егер пайдаланушы дәрігерге қаралуы керек болса, хабарламаңыздың соңында жеке жолда мынаны қосыңыз: <show_doctor_button>true</show_doctor_button>";
      default:
        return "You are a professional medical assistant. Respond clearly and concisely. If the user should consult a doctor, include this on a separate line at the end of your message: <show_doctor_button>true</show_doctor_button>";
    }
  };

  const getErrorMessage = () => {
    switch (language) {
      case "ru": return "Ошибка. Попробуйте позже.";
      case "en": return "Error. Please try again later.";
      case "kz": return "Қате. Кейінірек қайталап көріңіз.";
      default: return "Error. Please try again later.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !imagePreview) return;
    if (streaming) return; // Prevent multiple sends while streaming

    // Cancel any existing request
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
    }

    const newMessage: Message = {
      sender: "user",
      text: input,
      imageUrl: imagePreview || undefined,
      timestamp: new Date(),
      id: generateMessageId()
    };

    setMessages((prev) => [...prev, newMessage]);

    // Build conversation history for context (last 10 messages to avoid token limits)
    const recentMessages = messages.slice(-10);
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }));

    const imgPrompt = imagePreview
      ? { type: "image_url", image_url: { url: imagePreview } }
      : null;

    const payload = {
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        ...conversationHistory,
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
    // console.log("Starting API call...");
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    activeRequestRef.current = abortController;
    
    setStreaming(true);

    // Generate unique ID for bot message
    const botMessageId = generateMessageId();
    // console.log("Generated bot message ID:", botMessageId);

    // Add placeholder bot message
    setMessages((prev) => {
      // Double check we're not adding duplicate IDs
      const existingIds = prev.map(msg => msg.id);
      if (existingIds.includes(botMessageId)) {
        console.error("Duplicate ID detected:", botMessageId);
        return prev; // Don't add if duplicate
      }
      
      return [
        ...prev,
        { 
          sender: "bot", 
          text: "",
          timestamp: new Date(),
          id: botMessageId
        },
      ];
    });

    try {
      // console.log("Making fetch request...");
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: abortController.signal, // Add abort signal
      });

      // console.log("Response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      // console.log("API response:", data);

      let fullText = data?.choices?.[0]?.message?.content;
      
      if (!fullText) {
        console.warn("No content in API response");
        fullText = getErrorMessage();
      }

      const showDoctorButton = fullText.includes("<show_doctor_button>true</show_doctor_button>");
      fullText = fullText.replace(/<show_doctor_button>.*?<\/show_doctor_button>/g, "").trim();

      // console.log("Processing text:", fullText);

      let index = 0;
      let animationId: NodeJS.Timeout;

      setStreamingMessageId(botMessageId);

      const typeChar = () => {
        // Check if request was aborted
        if (abortController.signal.aborted) {
          // console.log("Animation aborted");
          return;
        }

        if (index <= fullText.length) {
          const currentText = fullText.slice(0, index);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId && msg.sender === "bot"
                ? { ...msg, text: currentText }
                : msg
            )
          );

          index++;
          animationId = setTimeout(typeChar, 15);
        } else {
          // Final update with doctor button
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMessageId && msg.sender === "bot"
                ? { ...msg, text: fullText, showDoctorButton }
                : msg
            )
          );
          setStreamingMessageId(null);
          setStreaming(false);
          activeRequestRef.current = null;
        }
      };

      typeChar();

    } catch (error: any) {
      console.error("API Error:", error);
      
      // Only update if not aborted
      if (!abortController.signal.aborted) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId && msg.sender === "bot"
              ? { ...msg, text: getErrorMessage() }
              : msg
          )
        );
        setStreamingMessageId(null);
        setStreaming(false);
        activeRequestRef.current = null;
      }
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      const errorMessage = language === "ru" ? "Файл слишком большой" : 
                          language === "en" ? "File too large" : 
                          "Файл тым үлкен";
      alert(errorMessage);
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return {
    streaming,
    streamingMessageId,
    handleSend,
    handleImageUpload
  };
};