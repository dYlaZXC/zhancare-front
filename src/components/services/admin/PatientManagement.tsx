"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Loader2, AlertCircle } from "lucide-react";

import PatientDocumentsDrawer from "./PatientDocumentsDrawer";
import { api } from "@/utils/api";

import type { Patient, Clinic, FoundPatient } from "./patient-management/types/patientTypes";
import { PAGE_SIZE } from "./patient-management/types/patientTypes";
import { StatsCards } from "./patient-management/components/StatsCards";
import { PatientToolbar } from "./patient-management/components/PatientToolbar";
import { PatientCard } from "./patient-management/components/PatientCard";
import { PatientFormModal } from "./patient-management/modals/PatientFormModal";
import { DeletePatientModal } from "./patient-management/modals/DeletePatientModal";
import { PatientClinicLinkModal } from "./patient-management/modals/PatientClinicLinkModal";

interface PatientManagementProps {
  user: any;
}

export default function PatientManagement({ user }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'clinic_created'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [docsPatient, setDocsPatient] = useState<Patient | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [linkCandidate, setLinkCandidate] = useState<FoundPatient | null>(null);

  useEffect(() => {
    fetchPatients();
    checkAdminType();
  }, []);

  const checkAdminType = async () => {
    // Check if current admin is a global admin (no clinic_id and no clinic object)
    const isGlobal = !user.clinic_id && !user.clinic?.id;
    setIsGlobalAdmin(isGlobal);

    // If global admin, fetch list of clinics
    if (isGlobal) {
      try {
        const response = await api.get('/clinics/');
        setClinics(response.data);
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/patients/');
      setPatients(response.data);
    } catch (err: any) {
      console.error("Error fetching patients:", err);
      setError(err.response?.data?.error || err.message || "Не удалось загрузить список пациентов");
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const handleEditClick = (patient: Patient) => {
    setEditingPatient(patient);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPatient(null);
  };

  const handleDeleteClick = (patient: Patient) => {
    setDeletingPatient(patient);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingPatient(null);
  };

  // Filter and sort patients based on search and filters
  const filteredPatients = patients
    .filter((patient) => {
      // Phones are stored as E.164 (+7XXXXXXXXXX), but people naturally type
      // Kazakh numbers with a leading 8 instead of +7, plus spaces/dashes
      // (e.g. "8 708 110-93-16") — a raw substring match against the stored
      // value never matches that. Normalize both sides the same way the
      // backend does for phone lookups (see phone_utils.normalize_phone):
      // strip to digits, then treat a leading 8 as 7.
      const searchDigits = searchQuery.replace(/\D/g, "");
      const normalizedSearchDigits =
        searchDigits.length > 1 && searchDigits[0] === "8"
          ? "7" + searchDigits.slice(1)
          : searchDigits;
      const matchesPhone =
        !!patient.phone &&
        normalizedSearchDigits.length > 0 &&
        patient.phone.replace(/\D/g, "").includes(normalizedSearchDigits);

      // first_name/last_name/email are typed as required strings, but the
      // API can actually return null for any of them (e.g. a patient
      // registered by phone only has no email) — crashed here in
      // production as soon as a search query made .filter() reach one of
      // those patients: "Cannot read properties of null (reading
      // 'toLowerCase')".
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (patient.first_name ?? "").toLowerCase().includes(q) ||
        (patient.last_name ?? "").toLowerCase().includes(q) ||
        (patient.email ?? "").toLowerCase().includes(q) ||
        matchesPhone;

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && patient.is_active) ||
        (filterStatus === 'inactive' && !patient.is_active) ||
        (filterStatus === 'clinic_created' && !!patient.clinic_created);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Patients with visits float to top; within each group sort by date desc
      const aDate = a.last_visit || a.created_at || '';
      const bDate = b.last_visit || b.created_at || '';
      const aHasVisit = !!a.last_visit;
      const bHasVisit = !!b.last_visit;
      if (aHasVisit !== bHasVisit) return aHasVisit ? -1 : 1;
      return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to first page when filters or search change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.is_active).length,
    inactive: patients.filter(p => !p.is_active).length,
    clinic_created: patients.filter(p => !!p.clinic_created).length,
  };

  return (

    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1e263e' }}>
              Управление Пациентами
            </h1>
            <p className="text-gray-600">
              Управляйте профилями пациентов клиники
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <UserPlus className="w-5 h-5" />
            Добавить Пациента
          </motion.button>
        </div>

        <StatsCards total={stats.total} active={stats.active} inactive={stats.inactive} />

        <PatientToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          filteredCount={filteredPatients.length}
          clinicCreatedCount={stats.clinic_created}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-16 h-16 animate-spin mb-4" style={{ color: '#10b981' }} />
          <span className="text-lg font-medium text-gray-600">
            Загрузка пациентов...
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
            <h3 className="text-amber-900 font-bold text-base mb-1">Ошибка загрузки</h3>
            <p className="text-amber-800 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Patients List */}
      {!loading && (
        <div className="space-y-4">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl font-semibold text-gray-600 mb-2">
                Пациенты не найдены
              </p>
              <p className="text-gray-500">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {paginatedPatients.map((patient, index) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  initial={initialLoad}
                  index={index}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onDocs={setDocsPatient}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <PatientFormModal
            mode="create"
            initial={null}
            isGlobalAdmin={isGlobalAdmin}
            clinics={clinics}
            user={user}
            onClose={() => setShowAddModal(false)}
            onSaved={(newPatient) => {
              setPatients(prev => [newPatient, ...prev]);
              setShowAddModal(false);
            }}
            onExistingPatientFound={(found) => setLinkCandidate(found)}
          />
        )}
      </AnimatePresence>

      {/* Existing-patient clinic-link modal (opened when Add Patient finds a match elsewhere) */}
      <AnimatePresence>
        {linkCandidate && (
          <PatientClinicLinkModal
            patient={linkCandidate}
            onClose={() => setLinkCandidate(null)}
            onLinked={() => {
              setLinkCandidate(null);
              fetchPatients();
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Patient Modal */}
      <AnimatePresence>
        {showEditModal && editingPatient && (
          <PatientFormModal
            mode="edit"
            initial={editingPatient}
            isGlobalAdmin={isGlobalAdmin}
            clinics={clinics}
            user={user}
            onClose={closeEditModal}
            onSaved={(updatedPatient) => {
              setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
              closeEditModal();
            }}
            onExistingPatientFound={(found) => { closeEditModal(); setLinkCandidate(found); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deletingPatient && (
          <DeletePatientModal
            patient={deletingPatient}
            onClose={closeDeleteModal}
            onDeleted={(patientId) => {
              setPatients(prev => prev.map(p => p.id === patientId ? { ...p, is_active: false } : p));
              closeDeleteModal();
            }}
          />
        )}
      </AnimatePresence>

      {/* Patient Documents Drawer */}
      {docsPatient && (
        <PatientDocumentsDrawer
          patientId={docsPatient.id}
          patientName={`${docsPatient.first_name} ${docsPatient.last_name}`.trim()}
          isOpen={!!docsPatient}
          onClose={() => setDocsPatient(null)}
        />
      )}
    </div>
  );
}
