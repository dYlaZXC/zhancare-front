"use client";

import { MessageSquare } from "lucide-react";
import { Label, Section, Textarea } from "../components/FormPrimitives";
import type { FormState } from "../types/aiAgentTypes";

export function PersonalitySection({
  form,
  onFieldChange,
}: {
  form: FormState;
  onFieldChange: (key: keyof FormState, value: string | boolean) => void;
}) {
  return (
    <Section title="Персонаж" subtitle="Как агент общается с пациентами" icon={MessageSquare} color="#3772ff">
      <div className="space-y-1.5">
        <Label>Приветственное сообщение</Label>
        <Textarea
          value={form.welcome_message}
          onChange={(v) => onFieldChange("welcome_message", v)}
          placeholder="Здравствуйте! Я AI ассистент вашей клиники. Расскажите о ваших симптомах, и я постараюсь помочь."
          rows={3}
          hint="Если пусто — используется стандартное приветствие"
        />
      </div>
    </Section>
  );
}
