"use client";

import { Brain } from "lucide-react";
import { Label, Section, Textarea } from "../components/FormPrimitives";
import type { FormState } from "../types/aiAgentTypes";

export function AIInstructionsSection({
  form,
  onFieldChange,
}: {
  form: FormState;
  onFieldChange: (key: keyof FormState, value: string | boolean) => void;
}) {
  return (
    <Section title="Инструкции AI" subtitle="Специализация, ограничения и правила поведения" icon={Brain} color="#0ea5e9">
      <div className="space-y-1.5">
        <Label>Дополнительный промпт</Label>
        <Textarea
          value={form.system_prompt_extra}
          onChange={(v) => onFieldChange("system_prompt_extra", v)}
          placeholder={`Клиника специализируется на кардиологии и педиатрии.\nРекомендуй только врачей этой клиники.\nПри серьёзных симптомах настаивай на срочной консультации кардиолога.`}
          rows={7}
          monospace
          hint="Добавляется к базовому системному промпту ZhanCare"
        />
      </div>
    </Section>
  );
}
