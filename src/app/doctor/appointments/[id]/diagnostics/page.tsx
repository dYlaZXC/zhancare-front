"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  ChevronLeft, User, MapPin, Clock, Save, Play, CheckCircle2,
  FlaskConical, Upload, FileText, Download, Loader2,
} from "lucide-react";

interface DiagnosticsDocument {
  id: number;
  download_url?: string | null;
  document_type_display?: string;
  original_filename: string;
  file_size?: number | null;
  uploaded_at: string;
}

interface DiagnosticsAppointmentDetail {
  id: number;
  patient_name: string;
  clinic_name?: string | null;
  clinic_address?: string | null;
  service_display?: { name: string } | null;
  service_name?: string | null;
  appointment_time: string;
  status: string;
  description?: string | null;
  conclusion?: string | null;
  documents: DiagnosticsDocument[];
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Запланировано",
  confirmed: "Подтверждено",
  in_progress: "В процессе",
  completed: "Завершено",
  cancelled: "Отменено",
};

const STATUS_CLS: Record<string, string> = {
  scheduled: "bg-violet-50 text-violet-700 border-violet-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function DiagnosticsAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [appointment, setAppointment] = useState<DiagnosticsAppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAppointment = useCallback(async () => {
    try {
      const { data } = await api.get<DiagnosticsAppointmentDetail>(`/diagnostics/appointments/${id}/doctor-view/`);
      setAppointment(data);
      setDescription(data.description ?? "");
      setConclusion(data.conclusion ?? "");
    } catch {
      toast.error("Не удалось загрузить запись");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAppointment(); }, [fetchAppointment]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/diagnostics/appointments/${id}/update-documentation/`, { description, conclusion });
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const { data } = await api.patch<DiagnosticsAppointmentDetail>(
        `/diagnostics/appointments/${id}/update-status/`,
        { status: newStatus }
      );
      setAppointment((prev) => (prev ? { ...prev, status: data.status } : prev));
      toast.success("Статус обновлён");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Ошибка при изменении статуса");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("diagnostics_appointment_id", String(id));
        const { data } = await api.post<DiagnosticsDocument>("/medical-documents/doctor-upload/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setAppointment((prev) => (prev ? { ...prev, documents: [data, ...prev.documents] } : prev));
      }
      toast.success(files.length > 1 ? "Файлы загружены" : "Файл загружен");
    } catch {
      toast.error("Ошибка при загрузке файла");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
        <p className="text-gray-500">Запись не найдена</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline text-sm">
          ← Назад
        </button>
      </div>
    );
  }

  const isPending = appointment.status === "scheduled" || appointment.status === "confirmed";
  const isOngoing = appointment.status === "in_progress";

  return (
    <div className="min-h-screen bg-gray-50 -mx-3 -mt-4 -mb-3">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Назад
          </button>
          <div className="w-px h-5 bg-gray-200" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {appointment.patient_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">{appointment.patient_name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <FlaskConical className="w-3 h-3" />
                {appointment.service_display?.name || appointment.service_name || "Диагностика"}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${STATUS_CLS[appointment.status] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
            {STATUS_LABEL[appointment.status] ?? appointment.status}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Сохранение..." : "Сохранить"}
            </button>

            {isPending && (
              <button
                onClick={() => changeStatus("in_progress")}
                disabled={statusUpdating}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 rounded-lg shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Начать
              </button>
            )}
            {isOngoing && (
              <button
                onClick={() => changeStatus("completed")}
                disabled={statusUpdating}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-sm shadow-blue-200 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Завершить
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="w-full p-6 space-y-4">
        {/* Info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Информация о записи</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400">Пациент</p>
                <p className="text-sm text-gray-800 font-medium">{appointment.patient_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400">Клиника</p>
                <p className="text-sm text-gray-800 font-medium">{appointment.clinic_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-xl">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-400">Время</p>
                <p className="text-sm text-gray-800 font-medium">
                  {new Date(appointment.appointment_time).toLocaleString("ru-KZ", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description + Conclusion — side by side on wide screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ход обследования, наблюдения..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-300 border border-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Заключение</label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Результаты, диагноз, рекомендации..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl text-sm text-gray-800 placeholder-gray-300 border border-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Документы и снимки</label>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-2xl px-4 py-4 cursor-pointer transition-all border-gray-200 hover:border-blue-300 hover:bg-blue-50/20 flex items-center gap-2 text-gray-400"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                <span className="text-sm">Загрузка...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Нажмите, чтобы прикрепить фото или документ</span>
              </>
            )}
          </div>

          {appointment.documents.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {appointment.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.download_url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                >
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">{doc.original_filename}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(doc.file_size)}</span>
                  <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
