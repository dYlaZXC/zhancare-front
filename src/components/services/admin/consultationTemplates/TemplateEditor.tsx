"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { Layers, Loader2, CheckCircle2, Save, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Eye } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import SearchSelect from "../schedule/components/SearchSelect";
import { TemplatePreview } from "./TemplatePreview";
import { TemplateLivePreview } from "./TemplateLivePreview";
import type { ConsultationFormTemplate, FormSection, SectionType } from "./types";
import { EMPTY_SECTION, SECTION_KEY_RE, SECTION_TYPE_LABELS, generateSectionKey } from "./types";

const SECTION_TYPE_OPTIONS = Object.entries(SECTION_TYPE_LABELS).map(([id, label]) => ({ id, label }));

export function TemplateEditor({
  mode,
  initial,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  initial: ConsultationFormTemplate | null;
  onCancel: () => void;
  onSaved: (template: ConsultationFormTemplate) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [sections, setSections] = useState<FormSection[]>(
    // Existing sections keep their existing key untouched — only a brand-new
    // section (created or edited before, key already blank) gets one assigned.
    initial
      ? initial.sections.map((s) => ({ ...s, type: s.type || "text", key: s.key || generateSectionKey() }))
      : [{ ...EMPTY_SECTION, key: generateSectionKey() }]
  );
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateSection = (index: number, patch: Partial<FormSection>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSection = () => setSections((prev) => [...prev, { ...EMPTY_SECTION, key: generateSectionKey() }]);

  const removeSection = (index: number) => setSections((prev) => prev.filter((_, i) => i !== index));

  const moveSection = (index: number, dir: -1 | 1) => {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };
  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setSections((prev) => {
        const next = [...prev];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(index, 0, moved);
        return next;
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const validate = (): string | null => {
    if (!name.trim()) return "Введите название шаблона";
    if (sections.length === 0) return "Добавьте хотя бы одну секцию";
    if (sections.length > 30) return "Не более 30 секций в шаблоне";
    const seenKeys = new Set<string>();
    for (const s of sections) {
      if (!s.label.trim()) return "У каждой секции должен быть заголовок";
      if (!SECTION_KEY_RE.test(s.key)) return `Некорректный ключ секции: «${s.key}»`;
      if (seenKeys.has(s.key)) return `Повторяющийся ключ секции: «${s.key}»`;
      seenKeys.add(s.key);
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), document_type: "consultation", sections };
      let res;
      if (mode === "edit") {
        res = await api.patch(`/consultation-templates/${initial!.id}/`, payload);
        toast.success("Шаблон обновлён");
      } else {
        res = await api.post("/consultation-templates/", payload);
        toast.success("Шаблон создан");
      }
      onSaved(res.data);
    } catch (e: any) {
      const detail = e?.response?.data;
      toast.error(typeof detail === "object" ? JSON.stringify(detail) : "Не удалось сохранить шаблон");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="absolute left-0 top-0 w-1.5 h-full" style={{ background: "linear-gradient(to bottom, #3772ff, #2956bf)" }} />

      <div className="px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ebf1ff, #d6e4ff)" }}>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                {mode === "edit" ? "Редактировать шаблон" : "Новый шаблон листа"}
              </h2>
              <p className="text-xs text-gray-400">Секции консультационного листа для видеоконсультаций и приёма в клинике</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            disabled={sections.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Eye className="w-4 h-4" /> Предпросмотр
          </button>
        </div>

        {/* Left: the fields being edited. Right: a live, read-only sketch of
            the resulting page (TemplateLivePreview) that just re-renders off
            the same `name`/`sections` state — no separate "apply" step,
            nothing to keep in sync by hand. Stacks on narrow screens instead
            of disappearing, so it's never simply unreachable there. */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-1/2 min-w-0 space-y-6">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Название шаблона</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Терапевт"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-400 outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">Секции листа</label>
                <button
                  type="button"
                  onClick={addSection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Добавить секцию
                </button>
              </div>

              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={index}
                    onDragOver={handleDragOver(index)}
                    onDrop={handleDrop(index)}
                    className={`rounded-2xl border-2 p-4 bg-gray-50/50 transition-all ${
                      dragOverIndex === index ? "border-sky-400 bg-sky-50/50" : "border-gray-100"
                    } ${draggedIndex === index ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-2 flex-shrink-0">
                        <div
                          draggable
                          onDragStart={handleDragStart(index)}
                          onDragEnd={handleDragEnd}
                          className="cursor-grab active:cursor-grabbing touch-none"
                          title="Перетащите, чтобы изменить порядок"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </div>
                        <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed">
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed">
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Заголовок вкладки</label>
                            <input
                              type="text"
                              value={section.label}
                              onChange={(e) => updateSection(index, { label: e.target.value })}
                              placeholder="Жалобы"
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-sky-400 outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Тип поля</label>
                            <SearchSelect
                              options={SECTION_TYPE_OPTIONS}
                              value={section.type}
                              onChange={(v) => { if (v) updateSection(index, { type: v as SectionType }); }}
                              placeholder="Выберите тип"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Подсказка для ИИ-анализа (необязательно)</label>
                          <input
                            type="text"
                            value={section.ai_hint ?? ""}
                            onChange={(e) => updateSection(index, { ai_hint: e.target.value })}
                            placeholder="Что именно ИИ должен писать в этот раздел"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-sky-400 outline-none text-sm"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600 pt-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!section.required}
                            onChange={(e) => updateSection(index, { required: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          Обязательная секция (визуальная пометка)
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        disabled={sections.length === 1}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex-shrink-0">
            <TemplateLivePreview name={name} sections={sections} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2956bf 100%)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "edit" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {mode === "edit" ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <TemplatePreview sections={sections} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
