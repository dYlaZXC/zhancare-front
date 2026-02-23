"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/local";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFlask,
  faXRay,
  faPrescriptionBottle,
  faFileAlt,
  faShieldAlt,
  faSyringe,
  faPaperclip,
  faCloudUploadAlt,
  faEye,
  faTrash,
  faFilter,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// Document categories with FontAwesome icons matching backend
const DOCUMENT_CATEGORIES = [
  { value: "lab_result", label: "Результат анализа", icon: faFlask, color: "#ef4444" },
  { value: "imaging", label: "Снимок/Изображение", icon: faXRay, color: "#8b5cf6" },
  { value: "prescription", label: "Рецепт", icon: faPrescriptionBottle, color: "#10b981" },
  { value: "medical_report", label: "Медицинское заключение", icon: faFileAlt, color: "#3b82f6" },
  { value: "insurance", label: "Страховой документ", icon: faShieldAlt, color: "#f59e0b" },
  { value: "vaccination", label: "Прививочный сертификат", icon: faSyringe, color: "#ec4899" },
  { value: "other", label: "Другое", icon: faPaperclip, color: "#6b7280" },
];

interface MedicalDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  description?: string;
}

export default function PatientDocumentsPage() {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("lab_result");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get("/medical-documents/");
      setDocuments(response.data);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      if (error.response?.status !== 401) {
        toast.error("Не удалось загрузить документы");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
        "image/heic",
        "image/heif",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Поддерживаются только изображения и PDF файлы");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 10MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Пожалуйста, выберите файл");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", selectedCategory);
    if (description) {
      formData.append("description", description);
    }

    try {
      const response = await api.post("/medical-documents/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      toast.success("Документ успешно загружен!");
      setDocuments([response.data, ...documents]);

      // Reset form
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(
        error.response?.data?.detail || "Не удалось загрузить документ"
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот документ?")) {
      return;
    }

    try {
      await api.delete(`/medical-documents/${id}/`);
      setDocuments(documents.filter((doc) => doc.id !== id));
      toast.success("Документ удален");
    } catch (error) {
      toast.error("Не удалось удалить документ");
    }
  };

  const handleDownload = async (doc: MedicalDocument) => {
    try {
      window.open(doc.file_url, "_blank");
    } catch (error) {
      toast.error("Не удалось открыть документ");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryInfo = (type: string) => {
    return (
      DOCUMENT_CATEGORIES.find((cat) => cat.value === type) || {
        value: "other",
        label: "Другое",
        icon: faPaperclip,
        color: "#6b7280",
      }
    );
  };

  const filteredDocuments =
    filterCategory === "all"
      ? documents
      : documents.filter((doc) => doc.document_type === filterCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{
             background: `
               radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.1) 0%, transparent 50%),
               linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)
             `
           }}>
        <div className="relative">
          <FontAwesomeIcon
            icon={faSpinner}
            className="text-6xl text-blue-600 animate-spin"
          />
          <div className="absolute inset-0 blur-xl opacity-50 bg-blue-400 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
             style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.3) 0%, transparent 70%)', animationDuration: '4s' }}></div>
        <div className="absolute bottom-40 left-20 w-64 h-64 rounded-full blur-2xl opacity-20 animate-bounce"
             style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', animationDuration: '5s' }}></div>
      </div>

      {/* Upload Section */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20"
           style={{
             background: `
               radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.15) 0%, transparent 50%),
               linear-gradient(135deg, #1e263e 0%, #29358f 50%, #3772ff 100%)
             `
           }}>
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none"></div>

        {/* Animated background orbs */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full blur-2xl animate-pulse"
             style={{ background: 'rgba(55, 114, 255, 0.2)', animationDuration: '3s' }}></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 rounded-full blur-xl animate-bounce"
             style={{ background: 'rgba(139, 92, 246, 0.2)', animationDuration: '4s' }}></div>

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                 style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)' }}>
              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Загрузить документ</h2>
              <p className="text-gray-300 text-sm">Безопасное хранилище медицинских документов</p>
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-3">Тип документа</label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {DOCUMENT_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  onMouseEnter={() => setHoveredCategory(category.value)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`group relative overflow-hidden p-4 rounded-xl transition-all duration-300 ${
                    selectedCategory === category.value
                      ? "scale-105 shadow-2xl"
                      : "hover:scale-105"
                  }`}
                  style={selectedCategory === category.value
                    ? {
                        background: 'rgba(55, 114, 255, 0.3)',
                        border: '2px solid rgba(55, 114, 255, 0.6)',
                        boxShadow: '0 0 30px rgba(55, 114, 255, 0.4)',
                      }
                    : {
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                      }
                  }>
                  <div className="relative z-10">
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      selectedCategory === category.value ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                         style={{ background: `${category.color}33` }}>
                      <FontAwesomeIcon icon={category.icon} className="text-lg" style={{ color: category.color }} />
                    </div>
                    <div className="text-xs font-semibold text-white text-center leading-tight">
                      {category.label}
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  {hoveredCategory === category.value && (
                    <div className="absolute inset-0 rounded-xl opacity-30 blur-lg animate-pulse"
                         style={{ background: category.color }}></div>
                  )}

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
                </button>
              ))}
            </div>
          </div>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-3">
              Выберите файл
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/jpg,application/pdf,image/heic,image/heif"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="group relative flex items-center justify-center gap-3 w-full p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-102 border-2 border-dashed overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: selectedFile ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                }}
              >
                <FontAwesomeIcon
                  icon={faCloudUploadAlt}
                  className={`text-3xl transition-all duration-300 ${selectedFile ? 'text-green-400' : 'text-white group-hover:text-blue-400'}`}
                />
                <div className="text-center">
                  <p className="text-white font-semibold">
                    {selectedFile ? selectedFile.name : "Нажмите или перетащите файл"}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {selectedFile
                      ? `${formatFileSize(selectedFile.size)}`
                      : "JPG, PNG, PDF, HEIC/HEIF до 10MB"
                    }
                  </p>
                </div>

                {/* Animated background on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                     style={{ background: 'radial-gradient(circle at center, rgba(55, 114, 255, 0.1) 0%, transparent 70%)' }}></div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-3">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Общий анализ крови от 15.02.2026"
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-300 text-white placeholder-gray-400"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="group relative w-full py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 overflow-hidden shadow-2xl"
            style={{
              background: uploading
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              {uploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
                  <span>Загрузка... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" />
                  <span>Загрузить документ</span>
                </>
              )}
            </div>

            {/* Shimmer effect */}
            {!uploading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000"></div>
            )}

            {/* Progress bar */}
            {uploading && (
              <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300"
                   style={{ width: `${uploadProgress}%` }}></div>
            )}
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/20"
           style={{
             background: `
               radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(55, 114, 255, 0.1) 0%, transparent 50%),
               linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)
             `
           }}>
        <div className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)' }}>
                <FontAwesomeIcon icon={faFileAlt} className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Мои документы</h2>
                <p className="text-gray-600 text-sm">Всего документов: {filteredDocuments.length}</p>
              </div>
            </div>

            {/* Filter */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400" />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-12 pr-8 py-3 rounded-xl border-2 focus:outline-none transition-all duration-300 appearance-none cursor-pointer font-medium"
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderColor: '#cbd5e1',
                }}
              >
                <option value="all">Все категории</option>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center relative"
                   style={{ background: 'linear-gradient(135deg, rgba(55, 114, 255, 0.1) 0%, rgba(55, 114, 255, 0.05) 100%)' }}>
                <FontAwesomeIcon icon={faFileAlt} className="text-6xl text-gray-400" />
                <div className="absolute inset-0 rounded-full blur-xl opacity-50 bg-blue-400 animate-pulse"></div>
              </div>
              <p className="text-xl text-gray-600 font-medium">
                {filterCategory === "all"
                  ? "У вас пока нет загруженных документов"
                  : "Нет документов в этой категории"}
              </p>
              <p className="text-gray-500 mt-2">Загрузите свой первый документ выше</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc, index) => {
                const categoryInfo = getCategoryInfo(doc.document_type);
                const isPDF = doc.file_name.toLowerCase().endsWith(".pdf");

                return (
                  <div
                    key={doc.id}
                    className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderColor: '#e2e8f0',
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md"
                           style={{
                             background: `${categoryInfo.color}20`,
                             border: `1px solid ${categoryInfo.color}40`
                           }}>
                        <FontAwesomeIcon
                          icon={categoryInfo.icon}
                          className="text-sm"
                          style={{ color: categoryInfo.color }}
                        />
                        <span className="text-xs font-semibold" style={{ color: categoryInfo.color }}>
                          {categoryInfo.label}
                        </span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="absolute top-4 right-4 z-20 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-md"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                    </button>

                    {/* File Preview */}
                    <div className="relative pt-16 pb-6 px-6"
                         style={{
                           background: isPDF
                             ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                             : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                         }}>
                      <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
                           style={{
                             background: isPDF
                               ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
                               : 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)'
                           }}>
                        {isPDF ? (
                          <span className="text-2xl font-bold text-red-700">PDF</span>
                        ) : (
                          <FontAwesomeIcon icon={faXRay} className="text-3xl text-blue-700" />
                        )}
                      </div>
                    </div>

                    {/* File Info */}
                    <div className="px-6 pb-6 space-y-3">
                      <h3 className="font-bold text-gray-900 truncate text-lg" title={doc.file_name}>
                        {doc.file_name}
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {doc.description}
                        </p>
                      )}
                      <div className="flex justify-between text-xs text-gray-500 font-medium pt-2 border-t border-gray-200">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{formatDate(doc.uploaded_at)}</span>
                      </div>

                      {/* Open Button */}
                      <button
                        onClick={() => handleDownload(doc)}
                        className="group/btn relative w-full py-3 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden shadow-lg mt-4"
                        style={{
                          background: 'linear-gradient(135deg, #3772ff 0%, #29358f 100%)',
                        }}
                      >
                        <div className="relative z-10 flex items-center justify-center gap-2">
                          <FontAwesomeIcon icon={faEye} />
                          <span>Открыть</span>
                        </div>

                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform translate-x-full group-hover/btn:translate-x-[-200%] transition-transform duration-1000"></div>
                      </button>
                    </div>

                    {/* Card border glow on hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                         style={{
                           boxShadow: `0 0 30px ${categoryInfo.color}40`,
                         }}></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
