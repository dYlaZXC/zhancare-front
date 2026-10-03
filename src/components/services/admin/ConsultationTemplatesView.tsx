"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import {
  Loader2, ClipboardType, Plus, Pencil, Trash2, Star, CheckCircle2,
  Library, Share2, Flame, Search, Eye, Copy, Building2, User, Award,
  Heart, ChevronDown, Users, Network, Clock, XCircle, Send, ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import type { ConsultationFormTemplate, VisitType } from "./consultationTemplates/types";
import { VISIT_TYPE_LABELS } from "./consultationTemplates/types";
import { TemplatePreview } from "./consultationTemplates/TemplatePreview";

// "Популярный" is derived straight from usage_count, no separate field —
// a round, easy-to-reason-about threshold, not meant to be precise.
const POPULAR_THRESHOLD = 10;

type LibraryView = "mine" | "library" | "favorites" | "moderation";

function apiErrorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}
type SortOption = "popular" | "new" | "most_copied";
const SORT_LABELS: Record<SortOption, string> = {
  popular: "Популярные",
  new: "Новые",
  most_copied: "Чаще копируют",
};

function TrustBadges({ t }: { t: ConsultationFormTemplate }) {
  return (
    <>
      {t.is_verified && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold flex-shrink-0">
          <Award className="w-3 h-3" /> Проверено ZhanCare
        </span>
      )}
      {t.usage_count >= POPULAR_THRESHOLD && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold flex-shrink-0">
          <Flame className="w-3 h-3" /> Популярный
        </span>
      )}
    </>
  );
}

export function ConsultationTemplatesView({
  basePath = "/admin/consultation-templates",
  title = "Шаблоны консультационных листов",
  subtitle = "Конструктор секций для видеоконсультаций и приёма в клинике",
  emptyStateHint = "Без своего шаблона используется стандартный набор секций",
}: {
  basePath?: string;
  title?: string;
  subtitle?: string;
  emptyStateHint?: string;
} = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = !!(user?.profiles?.admin as { is_super_admin?: boolean } | undefined)?.is_super_admin;
  const [view, setView] = useState<LibraryView>("mine");

  const [templates, setTemplates] = useState<ConsultationFormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);
  const [sharingId, setSharingId] = useState<number | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const [queueTemplates, setQueueTemplates] = useState<ConsultationFormTemplate[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState<Record<number, string>>({});
  const [decidingId, setDecidingId] = useState<number | null>(null);

  const [libraryTemplates, setLibraryTemplates] = useState<ConsultationFormTemplate[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<number | "">("");
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitType | "">("");
  const [specialties, setSpecialties] = useState<{ id: number; name_ru: string }[]>([]);

  const [favoriteTemplates, setFavoriteTemplates] = useState<ConsultationFormTemplate[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritingId, setFavoritingId] = useState<number | null>(null);

  const [previewSections, setPreviewSections] = useState<ConsultationFormTemplate["sections"] | null>(null);
  const [copyingId, setCopyingId] = useState<number | null>(null);

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

  useEffect(() => {
    api.get("/consultation-templates/specialties/")
      .then((res) => setSpecialties(res.data ?? []))
      .catch(() => setSpecialties([]));
  }, []);

  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const params: Record<string, string | number> = { sort };
      if (librarySearch) params.search = librarySearch;
      if (specialtyFilter) params.specialty = specialtyFilter;
      if (visitTypeFilter) params.visit_type = visitTypeFilter;
      const res = await api.get("/consultation-templates/library/", { params });
      // OptInPageNumberPagination falls back to a plain array without
      // ?page_size= — but handle the paginated {results: [...]} shape too,
      // since the API is ready to switch to it later.
      const list = Array.isArray(res.data) ? res.data : res.data.results ?? [];
      setLibraryTemplates(list);
    } catch {
      toast.error("Не удалось загрузить библиотеку шаблонов");
    } finally {
      setLibraryLoading(false);
    }
  }, [librarySearch, sort, specialtyFilter, visitTypeFilter]);

  useEffect(() => {
    if (view !== "library") return;
    const t = setTimeout(fetchLibrary, librarySearch ? 350 : 0);
    return () => clearTimeout(t);
  }, [view, fetchLibrary, librarySearch]);

  const fetchFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await api.get("/consultation-templates/favorites/");
      setFavoriteTemplates(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Не удалось загрузить избранные шаблоны");
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "favorites") fetchFavorites();
  }, [view, fetchFavorites]);

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await api.get("/consultation-templates/moderation-queue/");
      setQueueTemplates(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      toast.error("Не удалось загрузить очередь проверки");
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "moderation" && isSuperAdmin) fetchQueue();
  }, [view, isSuperAdmin, fetchQueue]);

  const openCreate = () => router.push(`${basePath}/new`);
  const openEdit = (t: ConsultationFormTemplate) => router.push(`${basePath}/${t.id}/edit`);

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

  const handleToggleShare = async (t: ConsultationFormTemplate) => {
    setSharingId(t.id);
    try {
      const res = await api.patch(`/consultation-templates/${t.id}/`, { is_shared: !t.is_shared });
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_shared: res.data.is_shared } : x)));
      toast.success(res.data.is_shared ? "Шаблон опубликован в библиотеке" : "Шаблон убран из библиотеки");
    } catch {
      toast.error("Не удалось изменить доступ к шаблону");
    } finally {
      setSharingId(null);
    }
  };

  const handleRequestVerification = async (t: ConsultationFormTemplate) => {
    setSubmittingId(t.id);
    try {
      const res = await api.post(`/consultation-templates/${t.id}/request-verification/`);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? res.data : x)));
      toast.success("Шаблон отправлен на проверку");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Не удалось отправить на проверку"));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDecision = async (t: ConsultationFormTemplate, decision: "approve" | "reject") => {
    const note = (decisionNotes[t.id] ?? "").trim();
    if (decision === "reject" && !note) return;
    setDecidingId(t.id);
    try {
      const action = decision === "approve" ? "approve-verification" : "reject-verification";
      await api.post(`/consultation-templates/${t.id}/${action}/`, { note });
      setQueueTemplates((prev) => prev.filter((x) => x.id !== t.id));
      toast.success(decision === "approve" ? "Шаблон проверен и получил отметку ZhanCare" : "Шаблон отклонён, владелец увидит причину");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Не удалось сохранить решение"));
    } finally {
      setDecidingId(null);
    }
  };

  const handleDuplicate = async (t: ConsultationFormTemplate) => {
    setCopyingId(t.id);
    try {
      const res = await api.post(`/consultation-templates/${t.id}/duplicate/`);
      toast.success(`Создана копия «${res.data.name}»`);
      router.push(`${basePath}/${res.data.id}/edit`);
    } catch {
      toast.error("Не удалось скопировать шаблон");
    } finally {
      setCopyingId(null);
    }
  };

  const handleToggleFavorite = async (t: ConsultationFormTemplate) => {
    setFavoritingId(t.id);
    try {
      const res = await api.post(`/consultation-templates/${t.id}/favorite/`);
      const apply = (list: ConsultationFormTemplate[]) =>
        list.map((x) => (x.id === t.id ? { ...x, is_favorited: res.data.is_favorited } : x));
      setLibraryTemplates(apply);
      setFavoriteTemplates((prev) =>
        res.data.is_favorited ? prev : prev.filter((x) => x.id !== t.id)
      );
      toast.success(res.data.is_favorited ? "Добавлено в избранное" : "Убрано из избранного");
    } catch {
      toast.error("Не удалось изменить избранное");
    } finally {
      setFavoritingId(null);
    }
  };

  const renderLibraryCard = (t: ConsultationFormTemplate) => (
    <div key={t.id} className="rounded-2xl border-2 border-gray-100 bg-white p-5 flex flex-col gap-3">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-gray-800">{t.name}</p>
          <button
            onClick={() => handleToggleFavorite(t)}
            disabled={favoritingId === t.id}
            title={t.is_favorited ? "Убрать из избранного" : "Добавить в избранное"}
            className="flex-shrink-0 p-1 -m-1 text-gray-300 hover:text-rose-500 transition-colors disabled:opacity-50"
          >
            <Heart className={`w-4 h-4 ${t.is_favorited ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
          <TrustBadges t={t} />
          {t.specialty_name && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{t.specialty_name}</span>
          )}
          {t.visit_type && (
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">{VISIT_TYPE_LABELS[t.visit_type]}</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
          {t.clinic_name && (
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {t.clinic_name}</span>
          )}
          {t.doctor_name && (
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {t.doctor_name}</span>
          )}
          <span>{t.sections.length} секций</span>
          {t.usage_count > 0 && (
            <span className="flex items-center gap-1 text-orange-600"><Flame className="w-3.5 h-3.5" /> {t.usage_count}</span>
          )}
          {t.derived_count > 0 && (
            <span className="flex items-center gap-1 text-sky-600"><Copy className="w-3.5 h-3.5" /> {t.derived_count} копий</span>
          )}
          {(t.unique_doctor_count > 0 || t.unique_clinic_count > 0) && (
            <span className="flex items-center gap-1 text-gray-400">
              <Users className="w-3.5 h-3.5" /> {t.unique_doctor_count} врачей · {t.unique_clinic_count} клиник
            </span>
          )}
        </div>
        {(t.derived_count > 0 || t.original_template) && t.ecosystem_usage_count > t.usage_count && (
          <p className="flex items-center gap-1 text-xs text-sky-600 mt-1">
            <Network className="w-3.5 h-3.5" /> Вся ветка использована {t.ecosystem_usage_count} раз
          </p>
        )}
        {t.original_template_name && (
          <p className="text-xs text-gray-400 mt-1">
            На основе шаблона «{t.original_template_name}»
            {t.original_author_name && <> · автор: {t.original_author_name}</>}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={() => setPreviewSections(t.sections)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" /> Предпросмотр
        </button>
        <button
          onClick={() => handleDuplicate(t)}
          disabled={copyingId === t.id}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors disabled:opacity-50"
        >
          {copyingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
          Создать копию
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e263e" }}>{title}</h1>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>
        {view === "mine" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: "linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)" }}
          >
            <Plus className="w-5 h-5" /> Новый шаблон
          </button>
        )}
      </div>

      <div className="mb-6 inline-flex p-1 rounded-2xl bg-gray-100 gap-1">
        <button
          type="button"
          onClick={() => setView("mine")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === "mine" ? "bg-white text-sky-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Мои шаблоны
        </button>
        <button
          type="button"
          onClick={() => setView("library")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === "library" ? "bg-white text-sky-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Library className="w-4 h-4" /> Библиотека шаблонов
        </button>
        <button
          type="button"
          onClick={() => setView("favorites")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            view === "favorites" ? "bg-white text-sky-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Heart className="w-4 h-4" /> Мои избранные
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setView("moderation")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              view === "moderation" ? "bg-white text-sky-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> На проверке
          </button>
        )}
      </div>

      {view === "mine" && (
        loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardType className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Шаблонов пока нет</p>
            <p className="text-sm mt-1">{emptyStateHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl border-2 border-gray-100 bg-white p-5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-800 truncate">{t.name}</p>
                    {t.is_default && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex-shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Активный
                      </span>
                    )}
                    {t.is_shared && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold flex-shrink-0">
                        <Share2 className="w-3 h-3" /> В библиотеке
                      </span>
                    )}
                    <TrustBadges t={t} />
                    {t.moderation_status === "pending" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex-shrink-0">
                        <Clock className="w-3 h-3" /> На рассмотрении
                      </span>
                    )}
                    {t.moderation_status === "rejected" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold flex-shrink-0">
                        <XCircle className="w-3 h-3" /> Отклонено
                      </span>
                    )}
                    {t.usage_count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold flex-shrink-0">
                        <Flame className="w-3 h-3" /> Использований: {t.usage_count}
                      </span>
                    )}
                  </div>
                  {t.moderation_status === "rejected" && t.moderation_note && (
                    <p className="text-xs text-red-600 mt-1">Причина отклонения: {t.moderation_note}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{t.sections.length} секций: {t.sections.map((s) => s.label).join(", ")}</p>
                  {(t.derived_count > 0 && t.ecosystem_usage_count > t.usage_count) && (
                    <p className="flex items-center gap-1 text-xs text-sky-600 mt-1">
                      <Network className="w-3 h-3" /> {t.derived_count} {t.derived_count === 1 ? "копия" : "копий"} · вся ветка использована {t.ecosystem_usage_count} раз
                    </p>
                  )}
                  {t.original_template_name && (
                    <p className="text-xs text-gray-400 mt-1">
                      На основе шаблона «{t.original_template_name}»
                      {t.original_author_name && <> · автор: {t.original_author_name}</>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.is_shared && (t.moderation_status === "draft" || t.moderation_status === "rejected") && (
                    <button
                      onClick={() => handleRequestVerification(t)}
                      disabled={submittingId === t.id}
                      title="Отправить шаблон на проверку — после одобрения получит отметку «Проверено ZhanCare»"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {submittingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {t.moderation_status === "rejected" ? "Отправить повторно" : "Отправить на проверку"}
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleShare(t)}
                    disabled={sharingId === t.id}
                    title="Опубликовать в библиотеке шаблонов — видно другим клиникам и врачам, редактировать и удалять может только владелец"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                      t.is_shared ? "text-sky-700 bg-sky-50 hover:bg-sky-100" : "text-gray-500 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {sharingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    {t.is_shared ? "В библиотеке" : "В библиотеку"}
                  </button>
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
        )
      )}

      {view === "library" && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="relative flex-1 min-w-52">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Поиск по названию, клинике, автору..."
                className="w-full pl-11 pr-4 py-2.5 text-sm border-2 border-gray-200 rounded-2xl bg-white focus:border-sky-400 focus:outline-none transition-colors"
              />
            </div>

            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-2xl bg-white focus:border-sky-400 focus:outline-none transition-colors"
            >
              <option value="">Все специальности</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.name_ru}</option>)}
            </select>

            <select
              value={visitTypeFilter}
              onChange={(e) => setVisitTypeFilter(e.target.value as VisitType | "")}
              className="px-3 py-2.5 text-sm border-2 border-gray-200 rounded-2xl bg-white focus:border-sky-400 focus:outline-none transition-colors"
            >
              <option value="">Все типы визита</option>
              {(Object.entries(VISIT_TYPE_LABELS) as [VisitType, string][]).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-2xl bg-white hover:border-gray-300 transition-colors"
              >
                {SORT_LABELS[sort]}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 min-w-44">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setSort(value); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${sort === value ? "font-semibold text-sky-600" : "text-gray-700"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {libraryLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
          ) : libraryTemplates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Library className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">В библиотеке пока нет шаблонов</p>
              <p className="text-sm mt-1">Опубликуйте свой шаблон во вкладке «Мои шаблоны», чтобы начать библиотеку</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {libraryTemplates.map(renderLibraryCard)}
            </div>
          )}
        </div>
      )}

      {view === "favorites" && (
        favoritesLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : favoriteTemplates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Пока нет избранных шаблонов</p>
            <p className="text-sm mt-1">Нажмите на сердечко у шаблона в библиотеке, чтобы сохранить его сюда</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favoriteTemplates.map(renderLibraryCard)}
          </div>
        )
      )}

      {view === "moderation" && isSuperAdmin && (
        queueLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : queueTemplates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Очередь проверки пуста</p>
            <p className="text-sm mt-1">Новые шаблоны появятся здесь после отправки владельцем на проверку</p>
          </div>
        ) : (
          <div className="space-y-3">
            {queueTemplates.map((t) => {
              const note = decisionNotes[t.id] ?? "";
              const deciding = decidingId === t.id;
              return (
                <div key={t.id} className="rounded-2xl border-2 border-gray-100 bg-white p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800">{t.name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                        {t.clinic_name && (
                          <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {t.clinic_name}</span>
                        )}
                        {t.doctor_name && (
                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {t.doctor_name}</span>
                        )}
                        <span>{t.sections.length} секций</span>
                        {t.submitted_for_review_at && (
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> отправлен {new Date(t.submitted_for_review_at).toLocaleString("ru-RU")}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setPreviewSections(t.sections)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" /> Предпросмотр
                    </button>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setDecisionNotes((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    rows={2}
                    placeholder="Комментарий — обязателен при отклонении, владелец увидит его"
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-sky-400 focus:outline-none transition-colors"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleDecision(t, "reject")}
                      disabled={deciding || !note.trim()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deciding ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Отклонить
                    </button>
                    <button
                      onClick={() => handleDecision(t, "approve")}
                      disabled={deciding}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      {deciding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                      Одобрить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {previewSections && (
        <TemplatePreview sections={previewSections} onClose={() => setPreviewSections(null)} />
      )}
    </div>
  );
}

export default ConsultationTemplatesView;
