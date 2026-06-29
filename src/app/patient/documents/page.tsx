"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/utils/local";
import { toast } from "react-toastify";
import { useLanguage } from "@/context/LanguageContext";
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
  { value: "lab_result", icon: faFlask, color: "#ef4444" },
  { value: "imaging", icon: faXRay, color: "#8b5cf6" },
  { value: "prescription", icon: faPrescriptionBottle, color: "#10b981" },
  { value: "medical_report", icon: faFileAlt, color: "#3b82f6" },
  { value: "insurance", icon: faShieldAlt, color: "#f59e0b" },
  { value: "vaccination", icon: faSyringe, color: "#ec4899" },
  { value: "other", icon: faPaperclip, color: "#6b7280" },
];

const DOCUMENTS_TEXT = {
  ru: {
    categories: {
      lab_result: "Результат анализа", imaging: "Снимок/Изображение", prescription: "Рецепт",
      medical_report: "Медицинское заключение", insurance: "Страховой документ",
      vaccination: "Прививочный сертификат", other: "Другое",
    },
    fetchError: "Не удалось загрузить документы",
    onlyImagesAndPdf: "Поддерживаются только изображения и PDF файлы",
    fileTooLarge: "Размер файла не должен превышать 10MB",
    fileReady: (name: string) => `Файл "${name}" готов к загрузке`,
    selectFileFirst: "Пожалуйста, выберите файл",
    uploadSuccess: "✅ Документ успешно загружен!",
    uploadError: "Не удалось загрузить документ",
    deleteSuccess: "🗑️ Документ удален",
    deleteError: "Не удалось удалить документ",
    downloadStarted: "📥 Загрузка началась",
    downloadError: "Не удалось открыть документ",
    title: "Медицинские документы",
    subtitle: "Управление вашими медицинскими файлами",
    hideForm: "Скрыть форму", hideShort: "Скрыть",
    uploadDocument: "Загрузить документ", uploadShort: "Загрузить",
    documentType: "Тип документа",
    dropFile: "Отпустите файл", dragFile: "Перетащите файл сюда",
    or: "или", chooseFile: "Выберите файл",
    fileHint: "JPG, PNG, PDF (макс. 10 MB)",
    descriptionLabel: "Описание (необязательно)",
    descriptionPlaceholder: "Добавьте краткое описание документа...",
    uploading: (p: number) => `Загрузка... ${p}%`,
    searchPlaceholder: "Поиск по названию или описанию...",
    all: "Все",
    sortDate: "По дате", sortName: "По имени", sortType: "По типу",
    found: "Найдено:", outOf: "из",
    notFound: "Документы не найдены", noDocuments: "Нет документов",
    tryOtherSearch: "Попробуйте изменить параметры поиска",
    uploadFirst: "Загрузите свой первый документ выше",
    resetFilters: "Сбросить фильтры",
    delete: "Удалить", view: "Посмотреть", download: "Скачать",
    fileSize: "Размер файла:", uploadDate: "Дата загрузки:",
    deleteDocTitle: "Удалить документ?",
    deleteDocConfirm: "Вы уверены, что хотите удалить этот документ? Это действие нельзя отменить.",
    cancel: "Отмена",
    searchInList: "Поиск...",
    noOptionsFound: "Ничего не найдено",
    locale: "ru-RU",
  },
  kz: {
    categories: {
      lab_result: "Талдау нәтижесі", imaging: "Снимок/Сурет", prescription: "Рецепт",
      medical_report: "Медициналық қорытынды", insurance: "Сақтандыру құжаты",
      vaccination: "Егу сертификаты", other: "Басқа",
    },
    fetchError: "Құжаттарды жүктеу мүмкін болмады",
    onlyImagesAndPdf: "Тек суреттер және PDF файлдары қолдау табады",
    fileTooLarge: "Файл өлшемі 10MB-тан аспауы керек",
    fileReady: (name: string) => `"${name}" файлы жүктеуге дайын`,
    selectFileFirst: "Файлды таңдаңыз",
    uploadSuccess: "✅ Құжат сәтті жүктелді!",
    uploadError: "Құжатты жүктеу мүмкін болмады",
    deleteSuccess: "🗑️ Құжат жойылды",
    deleteError: "Құжатты жою мүмкін болмады",
    downloadStarted: "📥 Жүктеу басталды",
    downloadError: "Құжатты ашу мүмкін болмады",
    title: "Медициналық құжаттар",
    subtitle: "Медициналық файлдарыңызды басқару",
    hideForm: "Форманы жасыру", hideShort: "Жасыру",
    uploadDocument: "Құжат жүктеу", uploadShort: "Жүктеу",
    documentType: "Құжат түрі",
    dropFile: "Файлды босатыңыз", dragFile: "Файлды осында сүйреңіз",
    or: "немесе", chooseFile: "Файл таңдау",
    fileHint: "JPG, PNG, PDF (макс. 10 MB)",
    descriptionLabel: "Сипаттама (міндетті емес)",
    descriptionPlaceholder: "Құжаттың қысқаша сипаттамасын қосыңыз...",
    uploading: (p: number) => `Жүктелуде... ${p}%`,
    searchPlaceholder: "Атауы немесе сипаттамасы бойынша іздеу...",
    all: "Барлығы",
    sortDate: "Күні бойынша", sortName: "Аты бойынша", sortType: "Түрі бойынша",
    found: "Табылды:", outOf: "ішінен",
    notFound: "Құжаттар табылмады", noDocuments: "Құжаттар жоқ",
    tryOtherSearch: "Іздеу параметрлерін өзгертіп көріңіз",
    uploadFirst: "Жоғарыда алғашқы құжатыңызды жүктеңіз",
    resetFilters: "Сүзгілерді тазалау",
    delete: "Жою", view: "Қарау", download: "Жүктеп алу",
    fileSize: "Файл өлшемі:", uploadDate: "Жүктеу күні:",
    deleteDocTitle: "Құжатты жою керек пе?",
    deleteDocConfirm: "Бұл құжатты жоюға сенімдісіз бе? Бұл әрекетті болдырмау мүмкін емес.",
    cancel: "Бас тарту",
    searchInList: "Іздеу...",
    noOptionsFound: "Ештеңе табылмады",
    locale: "kk-KZ",
  },
  en: {
    categories: {
      lab_result: "Lab Result", imaging: "Imaging/Scan", prescription: "Prescription",
      medical_report: "Medical Report", insurance: "Insurance Document",
      vaccination: "Vaccination Certificate", other: "Other",
    },
    fetchError: "Failed to load documents",
    onlyImagesAndPdf: "Only images and PDF files are supported",
    fileTooLarge: "File size must not exceed 10MB",
    fileReady: (name: string) => `File "${name}" is ready to upload`,
    selectFileFirst: "Please select a file",
    uploadSuccess: "✅ Document uploaded successfully!",
    uploadError: "Failed to upload document",
    deleteSuccess: "🗑️ Document deleted",
    deleteError: "Failed to delete document",
    downloadStarted: "📥 Download started",
    downloadError: "Failed to open document",
    title: "Medical Documents",
    subtitle: "Manage your medical files",
    hideForm: "Hide form", hideShort: "Hide",
    uploadDocument: "Upload document", uploadShort: "Upload",
    documentType: "Document type",
    dropFile: "Drop the file", dragFile: "Drag a file here",
    or: "or", chooseFile: "Choose file",
    fileHint: "JPG, PNG, PDF (max 10 MB)",
    descriptionLabel: "Description (optional)",
    descriptionPlaceholder: "Add a short description of the document...",
    uploading: (p: number) => `Uploading... ${p}%`,
    searchPlaceholder: "Search by name or description...",
    all: "All",
    sortDate: "By date", sortName: "By name", sortType: "By type",
    found: "Found:", outOf: "of",
    notFound: "No documents found", noDocuments: "No documents",
    tryOtherSearch: "Try changing your search parameters",
    uploadFirst: "Upload your first document above",
    resetFilters: "Reset filters",
    delete: "Delete", view: "View", download: "Download",
    fileSize: "File size:", uploadDate: "Upload date:",
    deleteDocTitle: "Delete document?",
    deleteDocConfirm: "Are you sure you want to delete this document? This action cannot be undone.",
    cancel: "Cancel",
    searchInList: "Search...",
    noOptionsFound: "Nothing found",
    locale: "en-US",
  },
  uz: {
    categories: {
      lab_result: "Tahlil natijasi", imaging: "Rasm/Surat", prescription: "Retsept",
      medical_report: "Tibbiy xulosa", insurance: "Sug'urta hujjati",
      vaccination: "Emlash sertifikati", other: "Boshqa",
    },
    fetchError: "Hujjatlarni yuklab bo'lmadi",
    onlyImagesAndPdf: "Faqat rasm va PDF fayllar qo'llaniladi",
    fileTooLarge: "Fayl hajmi 10MB dan oshmasligi kerak",
    fileReady: (name: string) => `"${name}" fayli yuklashga tayyor`,
    selectFileFirst: "Iltimos, faylni tanlang",
    uploadSuccess: "✅ Hujjat muvaffaqiyatli yuklandi!",
    uploadError: "Hujjatni yuklab bo'lmadi",
    deleteSuccess: "🗑️ Hujjat o'chirildi",
    deleteError: "Hujjatni o'chirib bo'lmadi",
    downloadStarted: "📥 Yuklab olish boshlandi",
    downloadError: "Hujjatni ochib bo'lmadi",
    title: "Tibbiy hujjatlar",
    subtitle: "Tibbiy fayllaringizni boshqarish",
    hideForm: "Formani yashirish", hideShort: "Yashirish",
    uploadDocument: "Hujjat yuklash", uploadShort: "Yuklash",
    documentType: "Hujjat turi",
    dropFile: "Faylni qo'yib yuboring", dragFile: "Faylni shu yerga torting",
    or: "yoki", chooseFile: "Fayl tanlash",
    fileHint: "JPG, PNG, PDF (maks. 10 MB)",
    descriptionLabel: "Tavsif (ixtiyoriy)",
    descriptionPlaceholder: "Hujjatning qisqacha tavsifini qo'shing...",
    uploading: (p: number) => `Yuklanmoqda... ${p}%`,
    searchPlaceholder: "Nomi yoki tavsifi bo'yicha qidirish...",
    all: "Barchasi",
    sortDate: "Sana bo'yicha", sortName: "Nomi bo'yicha", sortType: "Turi bo'yicha",
    found: "Topildi:", outOf: "dan",
    notFound: "Hujjatlar topilmadi", noDocuments: "Hujjatlar yo'q",
    tryOtherSearch: "Qidiruv parametrlarini o'zgartirib ko'ring",
    uploadFirst: "Yuqorida birinchi hujjatingizni yuklang",
    resetFilters: "Filtrlarni tozalash",
    delete: "O'chirish", view: "Ko'rish", download: "Yuklab olish",
    fileSize: "Fayl hajmi:", uploadDate: "Yuklangan sana:",
    deleteDocTitle: "Hujjatni o'chirasizmi?",
    deleteDocConfirm: "Bu hujjatni o'chirishga ishonchingiz komilmi? Bu amalni bekor qilib bo'lmaydi.",
    cancel: "Bekor qilish",
    searchInList: "Qidirish...",
    noOptionsFound: "Hech narsa topilmadi",
    locale: "uz-UZ",
  },
};

interface MedicalDocument {
  id: number;
  document_type: string;
  original_filename: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  description?: string;
}

interface DropdownOption {
  value: string;
  label: string;
  icon?: any;
  color?: string;
}

function SearchDropdown({
  triggerIcon,
  options,
  value,
  onChange,
  searchable = false,
  searchPlaceholder,
  noOptionsLabel,
}: {
  triggerIcon: any;
  options: DropdownOption[];
  value: string;
  onChange: (v: string) => void;
  searchable?: boolean;
  searchPlaceholder: string;
  noOptionsLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full pl-9 sm:pl-12 pr-2 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 bg-white cursor-pointer text-xs sm:text-sm flex items-center gap-2 ${
          open ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-blue-300"
        }`}
      >
        <FontAwesomeIcon
          icon={triggerIcon}
          className="absolute left-3 sm:left-4 text-gray-400 text-sm sm:text-base pointer-events-none"
        />
        {selected?.icon && (
          <FontAwesomeIcon icon={selected.icon} className="text-xs flex-shrink-0" style={{ color: selected.color }} />
        )}
        <span className="flex-1 text-left truncate text-gray-800">{selected?.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-gray-400 text-xs transition-transform duration-300 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-full min-w-[220px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {searchable && (
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">{noOptionsLabel}</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                    o.value === value ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {o.icon && (
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${o.color}15` }}>
                      <FontAwesomeIcon icon={o.icon} className="text-xs" style={{ color: o.color }} />
                    </div>
                  )}
                  <span className="truncate">{o.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientDocumentsPage() {
  const { language } = useLanguage();
  const t = DOCUMENTS_TEXT[language as keyof typeof DOCUMENTS_TEXT] ?? DOCUMENTS_TEXT.ru;
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

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (previewDoc || deleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [previewDoc, deleteConfirm]);

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
        toast.error(t.fetchError);
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
      toast.error(t.onlyImagesAndPdf);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t.fileTooLarge);
      return;
    }

    setSelectedFile(file);
    toast.success(t.fileReady(file.name));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileValidation(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error(t.selectFileFirst);
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

      toast.success(t.uploadSuccess);
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
        error.response?.data?.detail || t.uploadError
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
      toast.success(t.deleteSuccess);
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(t.deleteError);
    }
  };

  const handleDownload = async (doc: MedicalDocument) => {
    try {
      window.open(doc.file_url, "_blank");
      toast.success(t.downloadStarted);
    } catch (error) {
      toast.error(t.downloadError);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t.locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCategoryInfo = (type: string) => {
    const cat = DOCUMENT_CATEGORIES.find((cat) => cat.value === type) || {
      value: "other",
      icon: faPaperclip,
      color: "#6b7280",
    };
    return { ...cat, label: t.categories[cat.value as keyof typeof t.categories] ?? t.categories.other };
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
      <div className="relative z-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-white">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <FontAwesomeIcon icon={faCloudUploadAlt} className="text-white text-lg sm:text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{t.title}</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 text-sm sm:text-base whitespace-nowrap"
          >
            <FontAwesomeIcon icon={showUploadForm ? faChevronUp : faPlus} />
            <span className="hidden xs:inline">{showUploadForm ? t.hideForm : t.uploadDocument}</span>
            <span className="xs:hidden">{showUploadForm ? t.hideShort : t.uploadShort}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Upload Section */}
      {showUploadForm && (
        <div className="relative z-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 ease-out">
          <div className="p-4 sm:p-6">

          {/* Category Selection - Responsive */}
          <div className="mb-4">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              {t.documentType}
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
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
                      {t.categories[category.value as keyof typeof t.categories]}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Zone - Responsive */}
          <div
            ref={dropZoneRef}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative mb-4 border-2 border-dashed rounded-lg sm:rounded-xl transition-all duration-300 ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-[1.02]"
                : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
            }`}
          >
            <div className="p-4 sm:p-6 text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full mb-2 sm:mb-3 transition-all duration-300 ${
                isDragging ? "bg-blue-600 text-white scale-110" : "bg-blue-100 text-blue-600"
              }`}>
                <FontAwesomeIcon icon={faUpload} className="text-lg sm:text-xl" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-800 mb-1 sm:mb-2">
                {isDragging ? t.dropFile : t.dragFile}
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">{t.or}</p>
              <label className="inline-block">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <span className="px-4 sm:px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 text-xs sm:text-sm">
                  <FontAwesomeIcon icon={faFileImage} />
                  {t.chooseFile}
                </span>
              </label>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
                {t.fileHint}
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
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              {t.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none text-xs sm:text-sm"
              rows={2}
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
              !selectedFile || uploading
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02] shadow-md"
            }`}
          >
            {uploading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sm sm:text-base" />
                <span className="hidden xs:inline">{t.uploading(uploadProgress)}</span>
                <span className="xs:hidden">{uploadProgress}%</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-sm sm:text-base" />
                <span className="hidden xs:inline">{t.uploadDocument}</span>
                <span className="xs:hidden">{t.uploadShort}</span>
              </>
            )}
          </button>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="mt-2 sm:mt-3 bg-gray-200 rounded-full overflow-hidden h-1.5 sm:h-2">
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
      <div className="relative z-20 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Search - Full width on mobile */}
          <div className="relative w-full">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-all duration-300 text-sm sm:text-base"
            />
          </div>

          {/* Filter and Sort - Side by side on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:flex md:flex-row">
            {/* Filter by Category */}
            <div className="w-full md:w-64">
              <SearchDropdown
                triggerIcon={faFilter}
                value={filterCategory}
                onChange={setFilterCategory}
                searchable
                searchPlaceholder={t.searchInList}
                noOptionsLabel={t.noOptionsFound}
                options={[
                  { value: "all", label: t.all },
                  ...DOCUMENT_CATEGORIES.map((cat) => ({
                    value: cat.value,
                    label: t.categories[cat.value as keyof typeof t.categories],
                    icon: cat.icon,
                    color: cat.color,
                  })),
                ]}
              />
            </div>

            {/* Sort */}
            <div className="w-full md:w-48">
              <SearchDropdown
                triggerIcon={faSortAmountDown}
                value={sortBy}
                onChange={(v) => setSortBy(v as "date" | "name" | "type")}
                searchPlaceholder={t.searchInList}
                noOptionsLabel={t.noOptionsFound}
                options={[
                  { value: "date", label: t.sortDate },
                  { value: "name", label: t.sortName },
                  { value: "type", label: t.sortType },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <FontAwesomeIcon icon={faFileAlt} className="text-sm sm:text-base" />
          <span>
            {t.found} <strong className="text-blue-600">{filteredAndSortedDocuments.length}</strong> {t.outOf} {documents.length}
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="relative z-10">
        {filteredAndSortedDocuments.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-12 text-center border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gray-100 mb-4 sm:mb-6">
              <FontAwesomeIcon icon={faFileAlt} className="text-3xl sm:text-5xl text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2">
              {searchQuery || filterCategory !== "all" ? t.notFound : t.noDocuments}
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
              {searchQuery || filterCategory !== "all"
                ? t.tryOtherSearch
                : t.uploadFirst}
            </p>
            {(searchQuery || filterCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("all");
                }}
                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-all duration-300 inline-flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTimes} />
                {t.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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

                  {/* Delete Button Only */}
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      onClick={() => setDeleteConfirm(doc.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-red-50 shadow-sm backdrop-blur-sm bg-white/90 border border-gray-200"
                      title={t.delete}
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs text-gray-500 hover:text-red-500 transition-colors" />
                    </button>
                  </div>

                  {/* File Preview */}
                  <div className="relative mt-8 overflow-hidden bg-gray-50" style={{ height: 168 }}>
                    {isPDF ? (
                      <>
                        {/* iframe is wider than container — scrollbar pushed outside the overflow:hidden clip */}
                        <iframe
                          src={`${doc.file_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=75`}
                          className="border-0 pointer-events-none absolute top-0 left-0"
                          style={{ width: 'calc(100% + 20px)', height: 240, marginTop: -4 }}
                          scrolling="no"
                          title={doc.original_filename}
                          loading="lazy"
                        />
                        {/* Bottom fade to mask cut-off edge */}
                        <div className="absolute inset-0 pointer-events-none"
                             style={{ background: 'linear-gradient(to bottom, transparent 55%, white 100%)' }} />
                      </>
                    ) : (
                      <>
                        <img
                          src={doc.file_url}
                          alt={doc.original_filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const t = e.currentTarget;
                            t.style.display = "none";
                            (t.parentElement?.querySelector('.img-fallback') as HTMLElement | null)?.classList.remove("hidden");
                          }}
                        />
                        <div className="img-fallback hidden absolute inset-0 flex items-center justify-center bg-blue-50">
                          <FontAwesomeIcon icon={faFileImage} className="text-4xl text-blue-200" />
                        </div>
                      </>
                    )}
                    {/* Category badge overlap area top gradient */}
                    <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none"
                         style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)' }} />
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
                        <span className="truncate">{new Date(doc.uploaded_at).toLocaleDateString(t.locale, { day: 'numeric', month: 'short' })}</span>
                      </span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2 flex flex-col gap-1.5">
                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xs font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                        {t.view}
                      </button>

                      {/* Download Button */}
                      <button
                        onClick={() => handleDownload(doc)}
                        className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                      >
                        <FontAwesomeIcon icon={faDownload} className="text-xs" />
                        {t.download}
                      </button>
                    </div>
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4"
          onClick={() => setPreviewDoc(null)}
          style={{ margin: 0 }}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <FontAwesomeIcon
                  icon={getCategoryInfo(previewDoc.document_type).icon}
                  className="text-lg sm:text-2xl text-white flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl font-bold text-white truncate">{previewDoc.original_filename}</h2>
                  <p className="text-xs sm:text-sm text-white/80 truncate">{getCategoryInfo(previewDoc.document_type).label}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center flex-shrink-0 ml-2"
              >
                <FontAwesomeIcon icon={faTimes} className="text-white text-lg sm:text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-6 max-h-[calc(95vh-180px)] sm:max-h-[70vh] overflow-y-auto flex-1">
              {previewDoc.description && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">{previewDoc.description}</p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t.fileSize}</span>
                  <span className="font-semibold text-gray-900">{formatFileSize(previewDoc.file_size)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t.uploadDate}</span>
                  <span className="font-semibold text-gray-900">{formatDate(previewDoc.uploaded_at)}</span>
                </div>
              </div>

              {/* Document Preview */}
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                {previewDoc.original_filename.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDoc.file_url}
                    className="w-full h-[400px] sm:h-[500px] md:h-[600px] border-0"
                    title={previewDoc.original_filename}
                  />
                ) : (
                  <div className="p-2 sm:p-4 flex items-center justify-center">
                    <img
                      src={previewDoc.file_url}
                      alt={previewDoc.original_filename}
                      className="max-w-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px] rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="flex-1 py-2.5 sm:py-3 rounded-lg bg-blue-600 text-white text-sm sm:text-base font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faDownload} />
                {t.download}
              </button>
              <button
                onClick={() => {
                  setDeleteConfirm(previewDoc.id);
                  setPreviewDoc(null);
                }}
                className="flex-1 py-2.5 sm:py-3 rounded-lg bg-red-600 text-white text-sm sm:text-base font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setDeleteConfirm(null)}
          style={{ margin: 0 }}
        >
          <div
            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6 bg-gradient-to-r from-red-600 to-red-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faTrash} className="text-lg sm:text-2xl text-white" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">{t.deleteDocTitle}</h2>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                {t.deleteDocConfirm}
              </p>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 sm:py-3 rounded-lg bg-gray-200 text-gray-700 text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all duration-300"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 sm:py-3 rounded-lg bg-red-600 text-white text-sm sm:text-base font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
