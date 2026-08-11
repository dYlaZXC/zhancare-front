"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { api } from "@/utils/api";
import { FileDropZone } from "../components/FileDropZone";

export function ImportModal({ onClose }: { onClose: () => void }) {
  const [pipelineFile, setPipelineFile] = useState<File | null>(null);
  const [clinicsFile, setClinicsFile] = useState<File | null>(null);
  const [doUpdate, setDoUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pipeline?: any; clinics?: any } | null>(null);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async () => {
    if (!pipelineFile && !clinicsFile) { setError("Выберите хотя бы один файл"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      if (pipelineFile) fd.append("pipeline_file", pipelineFile);
      if (clinicsFile)  fd.append("clinics_file",  clinicsFile);
      if (doUpdate)     fd.append("update_existing", "true");
      const { data } = await api.post("/pipeline/import/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Ошибка при загрузке файла");
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Upload className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Импорт из Excel</h2>
              <p className="text-xs text-gray-400">Загрузите файлы pipeline или клиник</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <FileDropZone label="Файл pipeline (zhancare_pipeline_kliniki_po_raionam.xlsx)" accept=".xlsx,.xls" file={pipelineFile} onChange={setPipelineFile} />
          <FileDropZone label="Файл клиник (zhancare_kliniki_tashkenta.xlsx)" accept=".xlsx,.xls" file={clinicsFile} onChange={setClinicsFile} />

          <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <button
              type="button"
              onClick={() => setDoUpdate(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${doUpdate ? "bg-blue-500" : "bg-gray-200"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform ${doUpdate ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-gray-700 font-medium">Обновить существующие клиники</span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">{error}</p>}

          {result && (
            <div className="space-y-2 bg-emerald-50 rounded-xl px-4 py-3 text-sm border border-emerald-100">
              {result.pipeline && !result.pipeline.error && (
                <>
                  <p className="text-emerald-700 font-medium">Pipeline: <b>{result.pipeline.created}</b> создано, <b>{result.pipeline.updated}</b> обновлено</p>
                  {result.pipeline.columns_detected && <p className="text-gray-400 text-xs break-all">Колонки: {result.pipeline.columns_detected.join(", ")}</p>}
                  {result.pipeline.row_errors?.length > 0 && <div className="text-red-500 text-xs space-y-0.5">{result.pipeline.row_errors.map((e: string, i: number) => <p key={i}>{e}</p>)}</div>}
                </>
              )}
              {result.pipeline?.error && <p className="text-red-600">Pipeline ошибка: {result.pipeline.error}</p>}
              {result.clinics && !result.clinics.error && (
                <>
                  <p className="text-emerald-700 font-medium">Клиники: <b>{result.clinics.created}</b> создано, <b>{result.clinics.updated}</b> обновлено{result.clinics.skipped > 0 && <>, <b>{result.clinics.skipped}</b> пропущено</>}</p>
                  {result.clinics.columns_detected && <p className="text-gray-400 text-xs break-all">Колонки: {result.clinics.columns_detected.join(", ")}</p>}
                  {result.clinics.row_errors?.length > 0 && <div className="text-red-500 text-xs space-y-0.5">{result.clinics.row_errors.map((e: string, i: number) => <p key={i}>{e}</p>)}</div>}
                </>
              )}
              {result.clinics?.error && <p className="text-red-600">Клиники ошибка: {result.clinics.error}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/60 border-t border-gray-100">
          {result ? (
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
              style={{ background: 'linear-gradient(135deg, #12263a, #3772ff)' }}>
              Закрыть и обновить список
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors font-medium">Отмена</button>
              <button onClick={handleSubmit} disabled={loading || (!pipelineFile && !clinicsFile)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Загрузка...</> : <><Upload className="w-4 h-4" />Загрузить</>}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
