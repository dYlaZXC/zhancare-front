/**
 * Type definitions for Protocol AI Assistant
 */

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: ProtocolSource[];
  metadata?: MessageMetadata;
}

export interface ProtocolSource {
  protocol_id: number;
  protocol_name: string;
  content_type: string;
  content_type_display: string;
  title: string;
  content: string;
  page_from: number | null;
  page_to: number | null;
  confidence: number;
}

export interface MessageMetadata {
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  num_sources?: number;
  language?: string;
}

export interface Protocol {
  id: number;
  name: string;
  year: number;
  medicine: string;
  mkb: string;
  mkb_codes: string[];
}

export interface ChatRequest {
  question: string;
  protocol_id?: number;
  content_types?: string[];
  language?: string;
  include_sources?: boolean;
}

export interface ChatResponse {
  question: string;
  answer: string | null;
  success: boolean;
  error?: string;
  metadata: MessageMetadata;
  sources?: ProtocolSource[];
}
