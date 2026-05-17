"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FileText, Upload, Trash2, Download, Loader2,
  AlertCircle, File, FileScan, FileCheck, Pill,
  Shield, Syringe, FolderOpen, Building2,
} from "lucide-react";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MedicalDoc {
  id: number;
  document_type: string;
  document_type_display: string;
  description: string;
  original_filename: string;
  file_size: number | null;
  file_url: string | null;
  uploaded_at: string;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  consultation: number | null;
}

interface PatientDocumentsDrawerProps {
  patientId: number;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPES: { value: string; label: string; icon: any; color: string }[] = [
  { value: "lab_result",     label: "Результат анализа",      icon: FileScan,    color: "#3772ff" },
  { value: "imaging",        label: "Снимок / Изображение",   icon: FileText,    color: "#8b5cf6" },
  { value: "prescription",   label: "Рецепт",                 icon: Pill,        color: "#10b981" },
  { value: "medical_report", label: "Медзаключение",          icon: FileCheck,   color: "#f59e0b" },
  { value: "insurance",      label: "Страховой документ",     icon: Shield,      color: "#06b6d4" },
  { value: "vaccination",    label: "Прививочный сертификат", icon: Syringe,     color: "#ec4899" },
  { value: "other",          label: "Другое",                 icon: File,        color: "#6b7280" },
];

function getDocMeta(type: string) {
  return DOC_TYPES.find(d => d.value === type) ?? DOC_TYPES[DOC_TYPES.length - 1];
}

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const BRAND = "linear-gradient(135deg, #12263a 0%, #1e263e 40%, #3772ff 100%)";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientDocumentsDrawer({
  patientId, patientName, isOpen, onClose,
}: PatientDocumentsDrawerProps) {
  const [docs, setDocs] = useState<MedicalDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("lab_result");
  const [description, setDescription] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchDocs();
  }, [isOpen, patientId]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/medical-documents/?patient_id=${patientId}`);
      setDocs(res.data);
    } catch {
      toast.error("Не удалось загрузить документы");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("patient_id", String(patientId));
      form.append("file", selectedFile);
      form.append("document_type", docType);
      form.append("description", description);
      await api.post("/medical-documents/admin-upload/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Документ загружен");
      setSelectedFile(null);
      setDescription("");
      setDocType("lab_result");
      fetchDocs();
    } catch {
      toast.error("Ошибка загрузки документа");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await api.delete(`/medical-documents/admin-delete/${id}/`);
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success("Документ удалён");
    } catch {
      toast.error("Не удалось удалить документ");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: MedicalDoc) => {
    try {
      const res = await api.get(`/medical-documents/${doc.id}/download/`);
      window.open(res.data.download_url, "_blank");
    } catch {
      // fallback to file_url
      if (doc.file_url) window.open(doc.file_url, "_blank");
      else toast.error("Не удалось получить ссылку");
    }
  };

  const onFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between flex-shrink-0"
              style={{ background: BRAND }}>
              <div className="flex items-center gap-3 text-white">
                <FolderOpen className="w-5 h-5 text-blue-300" />
                <div>
                  <h2 className="text-lg font-bold">Документы пациента</h2>
                  <p className="text-blue-200 text-xs mt-0.5">{patientName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Upload section */}
              <div className="p-5 border-b border-gray-100 space-y-3">
                <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-500" />
                  Загрузить документ
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : selectedFile
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={e => setSelectedFile(e.target.files?.[0] ?? null)} />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">{selectedFile.name}</span>
                      <span className="text-xs text-gray-400">({fmtSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Перетащите файл или <span className="text-blue-500 font-semibold">выберите</span></p>
                      <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, XLS — до 10 МБ</p>
                    </>
                  )}
                </div>

                {selectedFile && (
                  <div className="space-y-2">
                    {/* Doc type */}
                    <select value={docType} onChange={e => setDocType(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none bg-white">
                      {DOC_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {/* Description */}
                    <input
                      type="text"
                      placeholder="Описание (необязательно)"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedFile(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        Отмена
                      </button>
                      <button onClick={handleUpload} disabled={uploading}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: BRAND }}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? "Загрузка..." : "Загрузить"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Docs list */}
              <div className="p-5 space-y-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-gray-500 text-sm">Загрузка документов...</p>
                  </div>
                ) : docs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <FolderOpen className="w-12 h-12 text-gray-200" />
                    <p className="text-gray-500 font-semibold">Нет документов</p>
                    <p className="text-gray-400 text-sm">Загрузите первый документ пациенту</p>
                  </div>
                ) : (
                  <DocGroup
                    title="Загружено администратором"
                    icon={<Building2 className="w-4 h-4 text-blue-500" />}
                    docs={docs}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                    deletingId={deletingId}
                    showUploader
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex-shrink-0">
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors text-sm">
                Закрыть
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── DocGroup ─────────────────────────────────────────────────────────────────

function DocGroup({ title, icon, docs, onDelete, onDownload, deletingId, showUploader }: {
  title: string;
  icon: React.ReactNode;
  docs: MedicalDoc[];
  onDelete: (id: number) => void;
  onDownload: (doc: MedicalDoc) => void;
  deletingId: number | null;
  showUploader?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
        <span className="text-xs text-gray-400">({docs.length})</span>
      </div>
      <div className="space-y-2">
        {docs.map(doc => <DocCard key={doc.id} doc={doc} onDelete={onDelete} onDownload={onDownload}
          deletingId={deletingId} showUploader={showUploader} />)}
      </div>
    </div>
  );
}

function DocCard({ doc, onDelete, onDownload, deletingId, showUploader }: {
  doc: MedicalDoc;
  onDelete: (id: number) => void;
  onDownload: (doc: MedicalDoc) => void;
  deletingId: number | null;
  showUploader?: boolean;
}) {
  const meta = getDocMeta(doc.document_type);
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.color}18` }}>
        <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{doc.original_filename || "Документ"}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
            style={{ background: `${meta.color}18`, color: meta.color }}>
            {doc.document_type_display}
          </span>
          {doc.file_size && (
            <span className="text-[10px] text-gray-400">{fmtSize(doc.file_size)}</span>
          )}
        </div>
        {doc.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{doc.description}</p>
        )}
        <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] text-gray-400">
          <span>{fmtDate(doc.uploaded_at)}</span>
          {showUploader && doc.uploaded_by_name && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {doc.uploaded_by_name}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onDownload(doc)}
          title="Скачать"
          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(doc.id)} disabled={deletingId === doc.id}
          title="Удалить"
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
          {deletingId === doc.id
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Trash2 className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}
