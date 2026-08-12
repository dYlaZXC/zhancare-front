"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { Loader2, ClipboardList } from "lucide-react";

import type { Service, ServiceCategory, StaffMember } from "./services/types/serviceTypes";
import { ServicesHeader } from "./services/components/ServicesHeader";
import { ServicesToolbar } from "./services/components/ServicesToolbar";
import { ServiceCard } from "./services/components/ServiceCard";
import { ServiceFormModal } from "./services/modals/ServiceFormModal";
import { CategoryFormModal } from "./services/modals/CategoryFormModal";
import { ServiceScheduleModal } from "./services/modals/ServiceScheduleModal";

export function ServicesView({ user }: { user: any }) {
  const [catFilter, setCatFilter] = useState("all");
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [scheduleService, setScheduleService] = useState<Service | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get("/diagnostics/categories/");
      const list: ServiceCategory[] = Array.isArray(res.data) ? res.data : (res.data.results ?? []);
      setCategories(list);
    } catch {
      // non-fatal: category picker will just be empty
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/diagnostics/services/");
      setServices(res.data);
    } catch {
      toast.error("Не удалось загрузить услуги");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };
  const openEdit = (s: Service) => {
    setEditing(s);
    setShowModal(true);
  };

  const handleToggle = async (s: Service) => {
    try {
      const res = await api.patch(`/diagnostics/services/${s.id}/toggle-active/`);
      setServices(prev => prev.map(x => x.id === s.id ? res.data : x));
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
    } catch {
      toast.error("Не удалось удалить услугу");
    }
  };

  const serviceSearchLower = serviceSearch.trim().toLowerCase();
  const filtered = services.filter(s => {
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (!serviceSearchLower) return true;
    return s.name.toLowerCase().includes(serviceSearchLower);
  });
  const totalActive = services.filter(s => s.is_active).length;

  return (
    <div className="w-full space-y-5">

      <ServicesHeader totalActive={totalActive} />

      {/* SERVICES */}
      <div className="space-y-4">
        <ServicesToolbar
          categories={categories}
          catFilter={catFilter}
          onCatFilterChange={setCatFilter}
          serviceSearch={serviceSearch}
          onServiceSearchChange={setServiceSearch}
          onOpenCategories={() => setShowCategoryModal(true)}
          onOpenCreate={openCreate}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Нет услуг в этой категории</p>
            <p className="text-sm mt-1">Нажмите «Добавить услугу» чтобы создать первую</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => (
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
        )}
      </div>

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
            onSaved={(saved) => {
              setServices(prev => editing
                ? prev.map(s => s.id === saved.id ? saved : s)
                : [saved, ...prev]);
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* CATEGORY MANAGEMENT MODAL */}
      <AnimatePresence>
        {showCategoryModal && (
          <CategoryFormModal
            categories={categories}
            onClose={() => setShowCategoryModal(false)}
            onCategoryCreated={(cat) => setCategories(prev => [...prev, cat].sort((a, b) => a.order - b.order))}
            onCategoryUpdated={(cat) => setCategories(prev => prev.map(c => c.id === cat.id ? cat : c))}
            onCategoryDeleted={(cat) => {
              setCategories(prev => prev.filter(c => c.id !== cat.id));
              if (catFilter === cat.slug) setCatFilter("all");
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
    </div>
  );
}

export default ServicesView;
