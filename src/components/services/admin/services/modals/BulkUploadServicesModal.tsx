"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { X, Download, Upload, Loader2, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import type { ServiceCategory } from "../types/serviceTypes";

// ─── Bulk Upload Modal ──────────────────────────────────────────────────────
// One category + one currency + one default duration apply to the whole
// file — matches the real use case (a clinic pastes in a whole lab-test
// price list that's all one category and mostly the same turnaround time)
// without making the admin repeat a category slug on every row, where a
// typo would silently create a wrong-category or orphaned service.

type UploadResult = { created: number; errors: { row: number; message: string }[] };

export function BulkUploadServicesModal({
  categories,
  clinicCurrency,
  onClose,
  onUploaded,
}: {
  categories: ServiceCategory[];
  clinicCurrency: string;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [modalMouseDownTarget, setModalMouseDownTarget] = useState<EventTarget | null>(null);
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState(clinicCurrency);
  const [duration, setDuration] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const res = await api.get("/diagnostics/services/bulk-upload-template/", { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "шаблон_услуг.xlsx";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Не удалось скачать шаблон");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!category) { toast.error("Выберите категорию"); return; }
    if (!file) { toast.error("Выберите файл"); return; }
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("currency", currency);
      formData.append("duration_minutes", String(duration));
      const res = await api.post<UploadResult>("/diagnostics/services/bulk-upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      if (res.data.created > 0) {
        toast.success(`Добавлено услуг: ${res.data.created}`);
        onUploaded();
      }
      if (res.data.errors.length > 0) {
        toast.error(`Пропущено строк с ошибками: ${res.data.errors.length}`);
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || "Не удалось загрузить файл";
      toast.error(message);
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={e => setModalMouseDownTarget(e.target)}
      onClick={e => {
        if (e.target === e.currentTarget && modalMouseDownTarget === e.currentTarget) onClose();
        setModalMouseDownTarget(null);
      }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #e0f2fe, #e0e7ff)" }}>
          <div>
            <h3 className="text-base font-black text-gray-800">Массовая загрузка услуг</h3>
            <p className="text-xs text-gray-500 mt-0.5">Из Excel-файла — все строки в одну категорию</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Step 1: template */}
          <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/50 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-700">1. Скачайте шаблон</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Название, категория (необязательно), цена, длительность (необязательно), описание</p>
            </div>
            <button onClick={handleDownloadTemplate} disabled={downloadingTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 transition-colors disabled:opacity-50 flex-shrink-0">
              {downloadingTemplate ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Шаблон
            </button>
          </div>

          {/* Step 2: category / currency / duration */}
          <div className="space-y-3">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">2. Общие параметры для всех строк</p>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Категория по умолчанию *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 transition-all bg-white">
                <option value="">Выберите категорию</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Валюта</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all bg-white">
                  {["KZT", "UZS", "USD", "AED"].map(cur => <option key={cur} value={cur}>{cur}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Длительность (мин)</label>
                <input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value) || 30)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 outline-none focus:border-sky-400 transition-all" />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">Строка в файле может задать свою категорию («Категория») или длительность («Длительность (мин)») — тогда для неё используются значения из файла, а не выбранные выше.</p>
          </div>

          {/* Step 3: file */}
          <div className="space-y-2">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">3. Заполненный файл</p>
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null); }} />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-sky-300 hover:bg-sky-50/30 transition-all text-left">
              <FileSpreadsheet size={18} className={file ? "text-sky-600" : "text-gray-400"} />
              <span className={`text-sm truncate ${file ? "text-gray-800 font-semibold" : "text-gray-400"}`}>
                {file ? file.name : "Выберите .xlsx файл"}
              </span>
            </button>
          </div>

          {/* Result summary */}
          {result && (
            <div className="space-y-2">
              {result.created > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">Добавлено услуг: {result.created}</p>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-bold text-amber-700">Пропущено строк: {result.errors.length}</p>
                  </div>
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-[11px] text-amber-700 pl-6">Строка {e.row}: {e.message}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
            Закрыть
          </button>
          <button onClick={handleUpload} disabled={uploading || !category || !file}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-sm"
            style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)" }}>
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Загрузить
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
