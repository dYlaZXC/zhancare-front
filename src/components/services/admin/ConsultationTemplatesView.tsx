"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, ClipboardType, Plus, Pencil, Trash2, Star, CheckCircle2 } from "lucide-react";

import type { ConsultationFormTemplate } from "./consultationTemplates/types";

export function ConsultationTemplatesView() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ConsultationFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/consultation-templates/");
      const list = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setTemplates(list);
    } catch {
      toast.error("Не удалось загрузить шаблоны");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openCreate = () => router.push("/admin/consultation-templates/new");
  const openEdit = (t: ConsultationFormTemplate) => router.push(`/admin/consultation-templates/${t.id}/edit`);

  const handleSetDefault = async (t: ConsultationFormTemplate) => {
    if (t.is_default) return;
    setSettingDefaultId(t.id);
    try {
      const res = await api.post(`/consultation-templates/${t.id}/set-default/`);
      setTemplates((prev) => prev.map((x) => (x.clinic === t.clinic ? { ...x, is_default: x.id === t.id } : x)));
      toast.success(`«${res.data.name}» теперь активный шаблон`);
    } catch {
      toast.error("Не удалось назначить шаблон активным");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async (t: ConsultationFormTemplate) => {
    if (!confirm(`Удалить шаблон «${t.name}»? Уже заполненные листы не изменятся.`)) return;
    try {
      await api.delete(`/consultation-templates/${t.id}/`);
      setTemplates((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Шаблон удалён");
    } catch {
      toast.error("Не удалось удалить шаблон");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e263e" }}>Шаблоны консультационных листов</h1>
          <p className="text-gray-600 mt-1">Конструктор секций для видеоконсультаций и приёма в клинике</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{ background: "linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)" }}
        >
          <Plus className="w-5 h-5" /> Новый шаблон
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardType className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Шаблонов пока нет</p>
          <p className="text-sm mt-1">Без своего шаблона используется стандартный набор секций</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl border-2 border-gray-100 bg-white p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800 truncate">{t.name}</p>
                  {t.is_default && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex-shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Активный
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{t.sections.length} секций: {t.sections.map((s) => s.label).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!t.is_default && (
                  <button
                    onClick={() => handleSetDefault(t)}
                    disabled={settingDefaultId === t.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors disabled:opacity-50"
                  >
                    {settingDefaultId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Сделать активным
                  </button>
                )}
                <button onClick={() => openEdit(t)} className="p-2 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ConsultationTemplatesView;
