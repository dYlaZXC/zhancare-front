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
  faSearch,
  faDownload,
  faTimes,
  faFileImage,
  faFilePdf,
  faUpload,
  faSortAmountDown,
  faCalendarAlt,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

// Document categories with FontAwesomeicons matching backend
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
  original_filename: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "type">("date");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<MedicalDocument | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileValidation(files[0]);
    }
  };

  const handleFileValidation = (file: File) => {
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
    toast.success(`Файл "${file.name}" готов к загрузке`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidation(file);
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

      toast.success("✅ Документ успешно загружен!");
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
    try {
      await api.delete(`/medical-documents/${id}/`);
      setDocuments(documents.filter((doc) => doc.id !== id));
      toast.success("🗑️ Документ удален");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error("Не удалось удалить документ");
    }
  };

  const handleDownload = async (doc: MedicalDocument) => {
    try {
      window.open(doc.file_url, "_blank");
      toast.success("📥 Загрузка началась");
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

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter((doc) => {
      const matchesCategory = filterCategory === "all" || doc.document_type === filterCategory;
      const matchesSearch =
        doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      } else if (sortBy === "name") {
        return a.original_filename.localeCompare(b.original_filename);
      } else {
        return a.document_type.localeCompare(b.document_type);
      }
    });

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
    <div className="space-y-6 relative pb-20">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
             style={{ background: 'radial-gradient(circle, rgba(55, 114, 255, 0.3) 0%, transparent 70%)', animationDuration: '4s' }}></div>
        <div className="absolute bottom-40 left-20 w-64 h-64 rounded-full blur-2xl opacity-20 animate-bounce"
             style={{ background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)', animationDuration: '5s' }}></div>
      </div>

      {/* Header with Upload Button */}
      <div className="relative z-10 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-white">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Медицинские документы</h1>
              <p className="text-sm text-gray-500">Управление вашими медицинскими файлами</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <FontAwesomeIcon icon={showUploadForm ? faChevronUp : faPlus} />
            {showUploadForm ? "Скрыть форму" : "Загрузить документ"}
          </button>
        </div>
      </div>

      {/* Collapsible Upload Section */}
      {showUploadForm && (
        <div className="relative z-10 rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 ease-out">
          <div className="p-6">

          {/* Category Selection - Compact */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Тип документа
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {DOCUMENT_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`group relative overflow-hidden p-3 rounded-lg transition-all duration-200 ${
                    selectedCategory === category.value
                      ? "shadow-md scale-105"
                      : "hover:scale-102 shadow-sm"
                  }`}
                  style={selectedCategory === category.value
                    ? {
                        background: 'white',
                        border: `2px solid ${category.color}`,
                      }
                    : {
                        background: 'white',
                        border: '2px solid #e5e7eb',
                      }
                  }>
                  <div className="relative z-10">
                    <div className={`w-8 h-8 mx-auto mb-1 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      selectedCategory === category.value ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                         style={{ background: `${category.color}15` }}>
                      <FontAwesomeIcon icon={category.icon} className="text-sm" style={{ color: category.color }} />
                    </div>
                    <div className={`text-[10px] font-semibold text-center leading-tight ${
                      selectedCategory === category.value ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      {category.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Zone - Compact */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative mb-4 border-2 border-dashed rounded-xl transition-all duration-300 ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
            }`}
          >
            <div className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 transition-all duration-300 ${
                isDragging ? "bg-blue-600 text-white scale-110" : "bg-blue-100 text-blue-600"
              }`}>
                <FontAwesomeIcon icon={faUpload} className="text-xl" />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-2">
                {isDragging ? "Отпустите файл" : "Перетащите файл сюда"}
              </h3>
              <p className="text-gray-500 text-sm mb-3">или</p>
              <label className="inline-block">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <span className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 text-sm">
                  <FontAwesomeIcon icon={faFileImage} />
                  Выберите файл
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-3">
                JPG, PNG, PDF (макс. 10 MB)
              </p>
            </div>

            {selectedFile && (
              <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-green-500">
                <div className="text-center p-4">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-600 mb-2" />
                  <p className="text-gray-900 font-semibold">{selectedFile.name}</p>
                  <p className="text-gray-600 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте краткое описание документа..."
              className="w-full px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none text-sm"
              rows={2}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              !selectedFile || uploading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02] shadow-md"
            }`}
          >
            {uploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Загрузка... {uploadProgress}%
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCloudUploadAlt} />
                Загрузить документ
              </>
            )}
          </button>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-3 bg-gray-200 rounded-full overflow-hidden h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Search and Filter Section */}
      <div className="relative z-10 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full md:w-auto">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или описанию..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Filter by Category */}
          <div className="relative w-full md:w-64">
            <FontAwesomeIcon
              icon={faFilter}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300 appearance-none bg-white cursor-pointer"
            >
              <option value="all">Все категории</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative w-full md:w-48">
            <FontAwesomeIcon
              icon={faSortAmountDown}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "name" | "type")}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300 appearance-none bg-white cursor-pointer"
            >
              <option value="date">По дате</option>
              <option value="name">По названию</option>
              <option value="type">По типу</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <FontAwesomeIcon icon={faFileAlt} />
          <span>
            Найдено документов: <strong className="text-blue-600">{filteredAndSortedDocuments.length}</strong> из {documents.length}
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="relative z-10">
        {filteredAndSortedDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
              <FontAwesomeIcon icon={faFileAlt} className="text-5xl text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery || filterCategory !== "all" ? "Документы не найдены" : "Нет документов"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filterCategory !== "all"
                ? "Попробуйте изменить параметры поиска"
                : "Загрузите свой первый документ выше"}
            </p>
            {(searchQuery || filterCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("all");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTimes} />
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredAndSortedDocuments.map((doc, index) => {
              const categoryInfo = getCategoryInfo(doc.document_type);
              const isPDF = doc.original_filename.toLowerCase().endsWith(".pdf");

              return (
                <div
                  key={doc.id}
                  className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border bg-white"
                  style={{
                    borderColor: '#e5e7eb',
                  }}
                >
                  {/* Category Badge - Smaller */}
                  <div className="absolute top-2 left-2 z-20">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md shadow-sm backdrop-blur-sm"
                         style={{
                           background: `${categoryInfo.color}20`,
                           border: `1px solid ${categoryInfo.color}40`
                         }}>
                      <FontAwesomeIcon
                        icon={categoryInfo.icon}
                        className="text-xs"
                        style={{ color: categoryInfo.color }}
                      />
                      <span className="text-[10px] font-semibold" style={{ color: categoryInfo.color }}>
                        {categoryInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - Smaller */}
                  <div className="absolute top-2 right-2 z-20 flex gap-1">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-blue-50 shadow-sm backdrop-blur-sm bg-white/90 border border-gray-200"
                      title="Просмотр"
                    >
                      <FontAwesomeIcon icon={faEye} className="text-xs text-blue-500 hover:text-blue-600 transition-colors" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-red-50 shadow-sm backdrop-blur-sm bg-white/90 border border-gray-200"
                      title="Удалить"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs text-gray-500 hover:text-red-500 transition-colors" />
                    </button>
                  </div>

                  {/* File Preview - Smaller */}
                  <div className="relative pt-10 pb-3 px-3"
                       style={{
                         background: isPDF
                           ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
                           : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                       }}>
                    <div className="w-14 h-14 mx-auto rounded-xl flex items-center justify-center shadow-md"
                         style={{
                           background: isPDF
                             ? 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
                             : 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)'
                         }}>
                      {isPDF ? (
                        <FontAwesomeIcon icon={faFilePdf} className="text-xl text-red-700" />
                      ) : (
                        <FontAwesomeIcon icon={faFileImage} className="text-xl text-blue-700" />
                      )}
                    </div>
                  </div>

                  {/* File Info - Smaller */}
                  <div className="px-3 pb-3 space-y-2">
                    <h3 className="font-bold text-gray-900 truncate text-sm" title={doc.original_filename}>
                      {doc.original_filename}
                    </h3>
                    {doc.description && (
                      <p className="text-xs text-gray-600 line-clamp-1 leading-snug">
                        {doc.description}
                      </p>
                    )}
                    <div className="flex justify-between text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-200">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                        <span className="truncate">{new Date(doc.uploaded_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>

                    {/* Download Button - Smaller */}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                    >
                      <FontAwesomeIcon icon={faDownload} className="text-xs" />
                      Скачать
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon
                  icon={getCategoryInfo(previewDoc.document_type).icon}
                  className="text-2xl text-white"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{previewDoc.original_filename}</h2>
                  <p className="text-sm text-white/80">{getCategoryInfo(previewDoc.document_type).label}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {previewDoc.description && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">{previewDoc.description}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Размер файла:</span>
                  <span className="font-semibold text-gray-900">{formatFileSize(previewDoc.file_size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Дата загрузки:</span>
                  <span className="font-semibold text-gray-900">{formatDate(previewDoc.uploaded_at)}</span>
                </div>
              </div>

              {/* Document Preview */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {previewDoc.original_filename.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDoc.file_url}
                    className="w-full h-[600px] border-0"
                    title={previewDoc.original_filename}
                  />
                ) : (
                  <div className="p-4 flex items-center justify-center">
                    <img
                      src={previewDoc.file_url}
                      alt={previewDoc.original_filename}
                      className="max-w-full max-h-[500px] rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                Скачать
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(previewDoc.id);
                  setPreviewDoc(null);
                }}
                className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-red-600 to-red-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTrash} className="text-2xl text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Удалить документ?</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
