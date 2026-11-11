"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { UserPlus, Loader2, AlertCircle, Users, Stethoscope, Heart, CheckCircle } from "lucide-react";

import StaffScheduleModal from "./StaffScheduleModal";
import { KPICard } from "./dashboardUI";

import type { StaffMember, Clinic } from "./staff-management/types/staffTypes";
import { StaffToolbar } from "./staff-management/components/StaffToolbar";
import { StaffActivityGrid } from "./staff-management/components/StaffActivityGrid";
import { StaffPaginationControls } from "./staff-management/components/StaffPaginationControls";
import { StaffActivityProvider } from "./staff-management/context/StaffActivityContext";
import { StaffFormModal } from "./staff-management/modals/StaffFormModal";
import { DeleteStaffModal } from "./staff-management/modals/DeleteStaffModal";

interface StaffManagementProps {
  user: any;
}

export default function StaffManagement({ user }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<'all' | 'doctor' | 'nurse'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'offline' | 'break'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMember, setScheduleMember] = useState<StaffMember | null>(null);
  // Memoized so StaffScheduleModal's `member` prop keeps a stable reference
  // across unrelated re-renders of this component — an effect in that modal
  // keys off member?.id already, but there's no reason to hand it a fresh
  // object identity every render regardless. (Live staff-activity updates
  // no longer even reach this component at all — see StaffActivityGrid,
  // which owns that subscription — so this is now purely defensive.)
  const scheduleModalMember = useMemo(
    () =>
      scheduleMember && {
        ...scheduleMember,
        first_name: scheduleMember.first_name ?? '',
        last_name: scheduleMember.last_name ?? '',
      },
    [scheduleMember]
  );
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [clinicCurrency, setClinicCurrency] = useState<string>('KZT');
  const [diagServices, setDiagServices] = useState<{ id: number; name: string; price: number | null }[]>([]);
  const [onlyOngoing, setOnlyOngoing] = useState(false);

  useEffect(() => {
    api.get('/clinic-stats/').then(res => {
      if (res.data?.clinic_info?.currency) setClinicCurrency(res.data.clinic_info.currency);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get('/diagnostics/services/').then(res => {
      setDiagServices((res.data || []).map((s: any) => ({ id: s.id, name: s.name, price: s.price ? Number(s.price) : null })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchStaff();
    checkAdminType();
  }, []);

  const checkAdminType = async () => {
    // Check if current admin is a global admin (no clinic_id and no clinic object)
    const isGlobal = !user.clinic_id && !user.clinic?.id;
    setIsGlobalAdmin(isGlobal);

    // If global admin, fetch list of clinics
    // /clinics/ is paginated (12/page, max 50) — request the max page size
    // since this dropdown needs the full list, not one page of it.
    if (isGlobal) {
      try {
        const response = await api.get("/clinics/", { params: { page_size: 50 } });
        setClinics(response.data.results ?? response.data);
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    }
  };

  const fetchStaff = useCallback(async (deleted = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = deleted ? "/staff/?show_deleted=true" : "/staff/";
      const response = await api.get(url);
      setStaff(response.data);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError(err.message || "Не удалось загрузить список персонала");

      // Mock data for development
      const mockStaff: StaffMember[] = [
        {
          id: 1,
          first_name: "Айгуль",
          last_name: "Нурсултанова",
          email: "aigul.nursultanova@clinic.kz",
          phone: "+7 (701) 234-56-78",
          role: "doctor",
          specialization: "Кардиолог",
          is_active: true,
          created_at: "2024-01-15T10:00:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 2,
          first_name: "Даурен",
          last_name: "Абаев",
          email: "dauren.abaev@clinic.kz",
          phone: "+7 (702) 345-67-89",
          role: "doctor",
          specialization: "Терапевт",
          is_active: true,
          created_at: "2024-02-20T11:30:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 3,
          first_name: "Малика",
          last_name: "Сагындыкова",
          email: "malika.sagyndykova@clinic.kz",
          phone: "+7 (777) 456-78-90",
          role: "nurse",
          specialization: "Процедурная медсестра",
          is_active: true,
          created_at: "2024-03-10T09:15:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 4,
          first_name: "Асель",
          last_name: "Токтарова",
          email: "asel.toktarova@clinic.kz",
          phone: "+7 (705) 567-89-01",
          role: "nurse",
          specialization: "Медсестра палатная",
          is_active: true,
          created_at: "2024-04-05T14:20:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
        {
          id: 5,
          first_name: "Ерлан",
          last_name: "Касымов",
          email: "erlan.kasymov@clinic.kz",
          phone: "+7 (708) 678-90-12",
          role: "doctor",
          specialization: "Хирург",
          is_active: false,
          created_at: "2023-11-12T16:45:00Z",
          clinic: { id: 1, name: "Медицинский Центр Астана" }
        },
      ];
      setStaff(mockStaff);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // These 5 handlers are passed down through StaffActivityGrid into every
  // StaffCard, which is now React.memo'd — useCallback with stable deps
  // (functional setState updates instead of closing over `staff`) keeps
  // their identity stable across renders, so a live activity update for
  // ONE card doesn't invalidate memo for the other 30.
  const handleToggleStatus = useCallback(async (memberId: number, currentStatus: string | undefined) => {
    try {
      const newStatus = currentStatus === 'available' ? 'offline' : 'available';
      const response = await api.patch(`/staff/${memberId}/`, { availability_status: newStatus });
      const updatedStaff = response.data;

      setStaff(prev => prev.map(member =>
        member.id === memberId ? { ...member, availability_status: updatedStaff.availability_status } : member
      ));

      const statusText = updatedStaff.availability_status === 'available' ? 'Доступен' : 'Не работает';
      toast.success(`Статус изменен на: ${statusText}!`);
    } catch (err: any) {
      console.error("Error toggling staff status:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось изменить статус сотрудника";
      toast.error(errorMessage);
    }
  }, []);

  const handleEditClick = useCallback((member: StaffMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  }, []);

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingMember(null);
  };

  const handleDeleteClick = useCallback((member: StaffMember) => {
    setDeletingMember(member);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingMember(null);
  };

  const handleRestore = useCallback(async (member: StaffMember) => {
    try {
      await api.patch(`/staff/${member.id}/`, { is_deleted: false });
      await fetchStaff(true);
      toast.success(`${member.first_name} ${member.last_name} успешно восстановлен(а)!`);
    } catch (err: any) {
      console.error("Error restoring staff:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.detail || err.message || "Не удалось восстановить сотрудника";
      toast.error(errorMessage);
    }
  }, [fetchStaff]);

  const openScheduleModal = useCallback((member: StaffMember) => {
    setScheduleMember(member);
    setShowScheduleModal(true);
  }, []);

  // Filter and sort staff based on search and filters — everything here is
  // activity-INDEPENDENT (no read of live activity state), so this doesn't
  // change when a WS event comes in. The one activity-dependent filter
  // (onlyOngoing) is applied inside StaffActivityGrid/StaffPaginationControls
  // instead — both read activityById via StaffActivityContext, not through
  // any state routed back through this component, so a live update never
  // causes StaffManagement itself (and therefore never the modals it also
  // renders) to re-render.
  const visibleStaff = staff
    .filter((member) => {
      // Typed as required strings, but not guaranteed null-safe at runtime
      // — same crash class fixed in PatientManagement.tsx's search filter
      // ("Cannot read properties of null (reading 'toLowerCase')").
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (member.first_name ?? "").toLowerCase().includes(q) ||
        (member.last_name ?? "").toLowerCase().includes(q) ||
        (member.email ?? "").toLowerCase().includes(q);

      const matchesRole = filterRole === 'all' || member.role === filterRole;
      const matchesStatus =
        filterStatus === 'all' ||
        member.availability_status === filterStatus;

      // Filter by deleted status
      const matchesDeleted = showDeleted ? member.is_deleted === true : !member.is_deleted;

      return matchesSearch && matchesRole && matchesStatus && matchesDeleted;
    })
    .sort((a, b) => {
      // Sort by created_at descending (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Reset to first page when filters or search change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterRole, filterStatus, showDeleted, onlyOngoing]);

  const stats = {
    total: staff.filter(s => !s.is_deleted).length,
    doctors: staff.filter(s => s.role === 'doctor' && !s.is_deleted).length,
    nurses: staff.filter(s => s.role === 'nurse' && !s.is_deleted).length,
    available: staff.filter(s => s.availability_status === 'available' && !s.is_deleted).length,
  };

  return (
    // StaffActivityProvider owns the ONE live-activity WS subscription for
    // this whole page. Only StaffActivityGrid and StaffPaginationControls
    // (via useStaffActivityContext) actually consume it — everything else
    // below, including StaffManagement's own render and both CRUD modals,
    // is unaffected by a context value change: React only re-renders
    // context CONSUMERS when the value changes, never a provider's other
    // children just because they're nested inside it.
    <StaffActivityProvider>
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Управление Персоналом
            </h1>
            <p className="text-gray-600">
              Управляйте врачами, медсестрами и другим медицинским персоналом
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #3772ff 0%, #2c5bcc 100%)' }}
          >
            <UserPlus className="w-5 h-5" />
            Добавить Сотрудника
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <KPICard label="Всего" value={String(stats.total)} icon={Users} color="#3772ff" />
          <KPICard label="Докторов" value={String(stats.doctors)} icon={Stethoscope} color="#3267e6" />
          <KPICard label="Медсестер" value={String(stats.nurses)} icon={Heart} color="#8b5cf6" />
          <KPICard label="Доступных" value={String(stats.available)} icon={CheckCircle} color="#10b981" />
        </div>

        <StaffToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterRole={filterRole}
          onFilterRoleChange={setFilterRole}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          paginationSlot={
            <StaffPaginationControls
              members={visibleStaff}
              onlyOngoing={onlyOngoing}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          }
          showDeleted={showDeleted}
          onToggleShowDeleted={() => { const next = !showDeleted; setShowDeleted(next); fetchStaff(next); }}
          onlyOngoing={onlyOngoing}
          onToggleOnlyOngoing={() => setOnlyOngoing(v => !v)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#3772ff' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка персонала...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-6 flex items-center gap-4 border-2 mb-8"
          style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderColor: '#fbbf24'
          }}
        >
          <AlertCircle className="w-7 h-7 text-amber-700 flex-shrink-0" />
          <div>
            <h3 className="text-amber-900 font-bold text-base mb-1">Демонстрационный режим</h3>
            <p className="text-amber-800 text-sm">{error}</p>
            <p className="text-amber-700 text-sm mt-1">Отображаются демонстрационные данные.</p>
          </div>
        </motion.div>
      )}

      {/* Staff List — StaffActivityGrid reads live activity via
          StaffActivityContext, not through anything routed back into
          StaffManagement's own state. StaffManagement itself never
          re-renders on a live update (and therefore neither do the modals
          below), only on real staff/filter/pagination changes. */}
      {!loading && (
        <div className="space-y-4">
          <StaffActivityGrid
            members={visibleStaff}
            onlyOngoing={onlyOngoing}
            initialLoad={initialLoad}
            showDeleted={showDeleted}
            currentPage={currentPage}
            onEdit={handleEditClick}
            onToggleStatus={handleToggleStatus}
            onSchedule={openScheduleModal}
            onDelete={handleDeleteClick}
            onRestore={handleRestore}
          />
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <StaffFormModal
            mode="create"
            initial={null}
            clinics={clinics}
            isGlobalAdmin={isGlobalAdmin}
            clinicCurrency={clinicCurrency}
            diagServices={diagServices}
            user={user}
            onClose={() => setShowAddModal(false)}
            onSaved={(newMember) => {
              setStaff(prev => [newMember, ...prev]);
              setShowAddModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {showEditModal && editingMember && (
          <StaffFormModal
            mode="edit"
            initial={editingMember}
            clinics={clinics}
            isGlobalAdmin={isGlobalAdmin}
            clinicCurrency={clinicCurrency}
            diagServices={diagServices}
            user={user}
            onClose={closeEditModal}
            onSaved={(updatedMember) => {
              setStaff(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
              closeEditModal();
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingMember && (
          <DeleteStaffModal
            member={deletingMember}
            onClose={closeDeleteModal}
            onDeleted={() => {
              closeDeleteModal();
              fetchStaff(showDeleted);
            }}
          />
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      {/* StaffScheduleModal's own member type keeps first_name/last_name
          required — it only uses them for display text, so a fallback here
          is simpler than threading nullability through that file too. */}
      <StaffScheduleModal
        isOpen={showScheduleModal}
        member={scheduleModalMember}
        onClose={() => { setShowScheduleModal(false); setScheduleMember(null); }}
        onSaved={() => { fetchStaff(showDeleted); }}
      />
    </div>
    </StaffActivityProvider>
  );
}
