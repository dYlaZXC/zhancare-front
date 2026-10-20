export interface AssistantPatient {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export type SafetyStatus =
  | "ok"
  | "blocked_pre_injection"
  | "blocked_post_unsafe_response"
  | "error"
  | "superseded"
  | "access_revoked";

export type MessageFeedback = "helpful" | "not_helpful" | null;

export interface AssistantMessage {
  // string ids are local optimistic placeholders (see useDoctorAssistantChat)
  // — never sent to the backend, always replaced once the real row comes back.
  id: number | string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  created_at: string;
  safety_status: SafetyStatus | null;
  feedback: MessageFeedback;
}

export interface ContextCompleteness {
  truncated: boolean;
  consultations_included: number;
  consultations_available_but_excluded: number;
  medical_profile_present: boolean;
  allergies_tracked: boolean;
  medications_tracked: boolean;
}

export interface SendMessageResult {
  user_message: AssistantMessage;
  assistant_message: AssistantMessage;
  context_completeness: ContextCompleteness | null;
  superseded: boolean;
}
