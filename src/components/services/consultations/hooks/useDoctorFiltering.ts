import { useMemo } from "react";
import type { Doctor, Language, RecommendedDoctor } from "../types/doctor";
import { filterDoctors, sortDoctorsByRecommendation, getDoctorTypes } from "../utils/doctorUtils";

interface UseDoctorFilteringProps {
  doctors: Doctor[];
  searchTerm: string;
  filterByType: string;
  language: Language;
  recommendedDoctor?: RecommendedDoctor;
}

export const useDoctorFiltering = ({
  doctors,
  searchTerm,
  filterByType,
  language,
  recommendedDoctor,
}: UseDoctorFilteringProps) => {
  const filteredDoctors = useMemo(() => {
    const filtered = filterDoctors(doctors, searchTerm, filterByType, language);
    return sortDoctorsByRecommendation(filtered, recommendedDoctor?.id);
  }, [doctors, searchTerm, filterByType, language, recommendedDoctor?.id]);

  const doctorTypes = useMemo(() => {
    return getDoctorTypes(doctors, language);
  }, [doctors, language]);

  return {
    filteredDoctors,
    doctorTypes,
  };
};