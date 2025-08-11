export interface Message {
  sender: "user" | "bot";
  text: string;
  imageUrl?: string;
  showDoctorButton?: boolean;
  timestamp: Date;
  id: string;
}

export type Language = "ru" | "en" | "kz";

export interface ChatHookProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  imagePreview: string | null;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;
  language: string;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}