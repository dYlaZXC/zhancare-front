import { useMemo } from "react";
import type { Doctor, Language, RecommendedDoctor } from "../types/doctor";
import { filterDoctors, sortDoctorsByRecommendation, getDoctorTypes } from "../utils/doctorUtils";

interface UseDoctorFilteringProps {
  doctors: Doctor[];
  searchTerm: string;
  filterByType: string;
  filterByClinic: string;
  language: Language;
  recommendedDoctor?: RecommendedDoctor;
}

export const useDoctorFiltering = ({
  doctors,
  searchTerm,
  filterByType,
  filterByClinic,
  language,
  recommendedDoctor,
}: UseDoctorFilteringProps) => {
  const filteredDoctors = useMemo(() => {
    let filtered = filterDoctors(doctors, searchTerm, filterByType, language);

    // Filter by clinic
    if (filterByClinic && filterByClinic !== 'all') {
      filtered = filtered.filter(doctor => doctor.clinic?.name === filterByClinic);
    }

    return sortDoctorsByRecommendation(filtered, recommendedDoctor?.id);
  }, [doctors, searchTerm, filterByType, filterByClinic, language, recommendedDoctor?.id]);

  const doctorTypes = useMemo(() => {
    return getDoctorTypes(doctors, language);
  }, [doctors, language]);

  // Get unique clinic names
  const clinics = useMemo(() => {
    const uniqueClinics = Array.from(new Set(
      doctors
        .map(doctor => doctor.clinic?.name)
        .filter((name): name is string => !!name)
    ));
    return uniqueClinics.sort();
  }, [doctors]);

  return {
    filteredDoctors,
    doctorTypes,
    clinics,
  };
};