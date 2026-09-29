"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, ClipboardList, Layers } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import type { Service, ServiceCategory, ServiceStats, StaffMember, StatusFilter } from "./services/types/serviceTypes";
import { ServicesHeader, ServicesStatsCards } from "./services/components/ServicesHeader";
import { ServicesToolbar } from "./services/components/ServicesToolbar";
import { ServiceCard } from "./services/components/ServiceCard";
import { ServicesPagination } from "./services/components/ServicesPagination";
import { CategoriesPanel } from "./services/components/CategoriesPanel";
import { ServiceFormModal } from "./services/modals/ServiceFormModal";
import { CategoryFormModal } from "./services/modals/CategoryFormModal";
import { ServiceScheduleModal } from "./services/modals/ServiceScheduleModal";
import { BulkUploadServicesModal } from "./services/modals/BulkUploadServicesModal";

const PAGE_SIZE = 20;

// Page + filters live in ONE state object so a filter change and its reset to
// page 1 land in a single render — two separate setStates would fire a wasted
// request for (new filter, old page), which can even 404.
interface ListQuery {
  page: number;
  category: string;
  status: StatusFilter;
  search: string;
}
const INITIAL_QUERY: ListQuery = { page: 1, category: "all", status: "all", search: "" };

export function ServicesView({ user }: { user: any }) {
  const [query, setQuery] = useState<ListQuery>(INITIAL_QUERY);
  const [services, setServices] = useState<Service[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ServiceStats>({ total: 0, active: 0, inactive: 0 });
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [scheduleService, setScheduleService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');
  // `false` = closed, `null` = create, a category = edit that one.
  const [categoryModal, setCategoryModal] = useState<ServiceCategory | null | false>(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  const listTopRef = useRef<HTMLDivElement>(null);
  // Only the newest request may write state — otherwise a slow response for
  // an old page/search could land after a newer one and overwrite it.
  const requestSeq = useRef(0);

  const debouncedSearch = useDebouncedValue(serviceSearch.trim(), 300);
  useEffect(() => {
    setQuery(q => (q.search === debouncedSearch ? q : { ...q, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/diagnostics/categories/");
      const list: ServiceCategory[] = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setCategories(list);
    } catch {
      // non-fatal: category picker will just be empty
    }
  }, []);

  // `silent` refetches in place (no spinner / dimming) — used after a
  // mutation, where the list should just quietly catch up.
  const fetchServices = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    const seq = ++requestSeq.current;
    if (!silent) setLoading(true);
    try {
      const params: Record<string, string | number> = { page: query.page, page_size: PAGE_SIZE };
      if (query.category !== "all") params.category = query.category;
      if (query.status !== "all") params.is_active = query.status === "active" ? "true" : "false";
      if (query.search) params.search = query.search;

      const res = await api.get("/diagnostics/services/", { params });
      if (seq !== requestSeq.current) return;
      setServices(res.data.results);
      setTotalCount(res.data.count);
      // Absent only when the backend can't resolve a clinic for this admin.
      setStats(res.data.stats ?? { total: res.data.count, active: res.data.count, inactive: 0 });
    } catch (err: any) {
      if (seq !== requestSeq.current) return;
      // The page we were on no longer exists (its last row was deactivated
      // out of the current filter) — step back one page.
      if (err?.response?.status === 404 && query.page > 1) {
        setQuery(q => ({ ...q, page: Math.max(1, q.page - 1) }));
        return;
      }
      toast.error("Не удалось загрузить услуги");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    api.get('/clinic-stats/').then(res => {
      if (res.data?.clinic_info?.currency) setClinicCurrency(res.data.clinic_info.currency);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchServices(); }, [fetchServices]);

  useEffect(() => {
    api.get('/staff/').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setStaff(list.filter((m: StaffMember) => m.role === 'doctor'));
    }).catch(() => {});
  }, []);

  const changeCategory = (category: string) => setQuery(q => ({ ...q, category, page: 1 }));
  const changeStatus = (status: StatusFilter) => setQuery(q => ({ ...q, status, page: 1 }));
  const changePage = (page: number) => {
    setQuery(q => ({ ...q, page }));
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setShowModal(true);
  };

  // Toggle / deactivate change counts, and may move the row out of the
  // current status filter or shift the page boundary — so after the instant
  // in-place update, quietly refetch to let the server decide.
  const handleToggle = async (s: Service) => {
    try {
      const res = await api.patch(`/diagnostics/services/${s.id}/toggle-active/`);
      setServices(prev => prev.map(x => x.id === s.id ? res.data : x));
      fetchServices({ silent: true });
    } catch {
      toast.error("Не удалось изменить статус");
    }
  };

  const handleDelete = async (s: Service) => {
    if (!confirm(`Деактивировать услугу «${s.name}»?`)) return;
    try {
      await api.delete(`/diagnostics/services/${s.id}/`);
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: false } : x));
      toast.success("Услуга деактивирована");
      fetchServices({ silent: true });
    } catch {
      toast.error("Не удалось удалить услугу");
    }
  };

  const handleToggleCategory = async (cat: ServiceCategory) => {
    try {
      const res = await api.patch(`/diagnostics/categories/${cat.id}/`, { is_active: !cat.is_active });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...res.data } : c));
    } catch {
      toast.error("Не удалось изменить статус категории");
    }
  };

  const handleDeleteCategory = async (cat: ServiceCategory) => {
    if (!confirm(`Удалить категорию «${cat.name}»?`)) return;
    try {
      await api.delete(`/diagnostics/categories/${cat.id}/`);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (query.category === cat.slug) changeCategory("all");
      toast.success("Категория удалена");
    } catch {
      toast.error("Не удалось удалить категорию");
    }
  };

  const hasFilters = query.category !== "all" || query.status !== "all" || query.search !== "";
  const showInitialSpinner = loading && services.length === 0;

  const TABS = [
    { key: 'services' as const,   label: 'Услуги',    Icon: ClipboardList, count: stats.total },
    { key: 'categories' as const, label: 'Категории', Icon: Layers,        count: categories.length },
  ];

  return (
    <div className="w-full">
      {/* mb-8 only on the Услуги tab: there the stats + toolbar live in this
          block, so it is what spaces them from the list. The Категории tab
          renders its own stats + toolbar inside CategoriesPanel and matches the
          same gaps there. */}
      <div className={activeTab === 'services' ? 'mb-8' : ''}>
        <ServicesHeader
          onOpenCreate={openCreate}
          onOpenBulkUpload={() => setShowBulkUploadModal(true)}
          onOpenCreateCategory={() => setCategoryModal(null)}
          tab={activeTab}
        />

        {/* Tabs — Услуги and Категории are two views of the same catalog,
            not a main page plus a settings popup. */}
        <div className="flex items-center gap-1 border-b-2 border-gray-100 mb-6">
          {TABS.map(({ key, label, Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3 -mb-0.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === key
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === key ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'services' && (
          <>
            <ServicesStatsCards total={stats.total} active={stats.active} inactive={stats.inactive} />

            <ServicesToolbar
              categories={categories}
              catFilter={query.category}
              onCatFilterChange={changeCategory}
              statusFilter={query.status}
              onStatusFilterChange={changeStatus}
              serviceSearch={serviceSearch}
              onServiceSearchChange={setServiceSearch}
            />
          </>
        )}
      </div>

      {/* CATEGORIES */}
      {activeTab === 'categories' && (
        <CategoriesPanel
          categories={categories}
          onEdit={(cat) => setCategoryModal(cat)}
          onToggle={handleToggleCategory}
          onDelete={handleDeleteCategory}
          onScheduleSaved={fetchCategories}
          clinicCurrency={clinicCurrency}
        />
      )}

      {/* SERVICES */}
      {activeTab === 'services' && <div ref={listTopRef} className="scroll-mt-4">
        {showInitialSpinner ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">{hasFilters ? "Ничего не найдено" : "Услуг пока нет"}</p>
            <p className="text-sm mt-1">
              {hasFilters
                ? "Попробуйте изменить фильтры или поисковый запрос"
                : "Нажмите «Добавить услугу» чтобы создать первую"}
            </p>
          </div>
        ) : (
          <>
            <div className={`space-y-3 transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}>
              {services.map(s => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  category={categories.find(c => c.slug === s.category)}
                  clinicCurrency={clinicCurrency}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onSchedule={setScheduleService}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            <ServicesPagination
              page={query.page}
              pageSize={PAGE_SIZE}
              totalCount={totalCount}
              onPageChange={changePage}
            />
          </>
        )}
      </div>}

      {/* ADD / EDIT SERVICE MODAL */}
      <AnimatePresence>
        {showModal && (
          <ServiceFormModal
            mode={editing ? "edit" : "create"}
            initial={editing}
            categories={categories}
            staff={staff}
            clinicCurrency={clinicCurrency}
            user={user}
            onClose={() => setShowModal(false)}
            onSaved={() => {
              // A new/renamed service can land on any page (the list is
              // sorted by category + name) and changes the counts.
              setShowModal(false);
              fetchServices({ silent: true });
            }}
          />
        )}
      </AnimatePresence>

      {/* ADD / EDIT CATEGORY MODAL */}
      <AnimatePresence>
        {categoryModal !== false && (
          <CategoryFormModal
            initial={categoryModal}
            staff={staff}
            clinicCurrency={clinicCurrency}
            user={user}
            onClose={() => setCategoryModal(false)}
            onSaved={(cat, mode) => {
              // Saving a category's settings pushes them to the services that
              // follow it — refresh the list so it shows the new values.
              if (cat.synced_services) fetchServices({ silent: true });
              setCategories(prev => (
                mode === "create"
                  ? [...prev, cat]
                  : prev.map(c => c.id === cat.id ? cat : c)
              ).sort((a, b) => b.id - a.id));
              setCategoryModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* SCHEDULE MODAL */}
      <ServiceScheduleModal
        service={scheduleService}
        onClose={() => setScheduleService(null)}
        onSaved={(updated) => {
          setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
          setScheduleService(null);
        }}
      />

      {/* BULK UPLOAD MODAL */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <BulkUploadServicesModal
            categories={categories}
            clinicCurrency={clinicCurrency}
            onClose={() => setShowBulkUploadModal(false)}
            onUploaded={() => fetchServices({ silent: true })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServicesView;
