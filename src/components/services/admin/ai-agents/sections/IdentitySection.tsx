"use client";

import { Bot, Tag } from "lucide-react";
import { Input, Label, Section } from "../components/FormPrimitives";
import type { AIAgent, FormState } from "../types/aiAgentTypes";

export function IdentitySection({
  form,
  onFieldChange,
  agent,
}: {
  form: FormState;
  onFieldChange: (key: keyof FormState, value: string | boolean) => void;
  agent: AIAgent | null;
}) {
  return (
    <Section title="Идентификация" subtitle="Имя агента и его публичный URL" icon={Tag} color="#8b5cf6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Имя агента</Label>
          <Input
            value={form.agent_name}
            onChange={(v) => onFieldChange("agent_name", v)}
            placeholder="AI Ассистент"
            icon={Bot}
          />
        </div>
        <div className="space-y-1.5">
          <Label>URL Slug</Label>
          <Input
            value={form.slug}
            onChange={(v) => onFieldChange("slug", v)}
            placeholder="my-clinic"
            icon={Tag}
            monospace
            hint={form.slug ? `/consultation/symptoms/${form.slug}/` : undefined}
            hintHref={form.slug ? `/consultation/symptoms/${form.slug}/` : undefined}
          />
        </div>
      </div>

      {/* Mobile active toggle */}
      {agent && (
        <div className="sm:hidden flex items-center justify-between pt-1">
          <span className="text-sm text-gray-600 font-medium">Агент активен</span>
          <button
            onClick={() => onFieldChange("is_active", !form.is_active)}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ${form.is_active ? "bg-emerald-500" : "bg-gray-200"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${form.is_active ? "left-[calc(100%-1.375rem)]" : "left-0.5"}`} />
          </button>
        </div>
      )}
    </Section>
  );
}
