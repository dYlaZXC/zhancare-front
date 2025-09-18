import type { Doctor, Language } from "../types/doctor";

export const getSpecializationName = (doctor: Doctor, language: Language = 'ru'): string => {
  if (doctor.specialization) {
    switch (language) {
      case 'kz':
        return doctor.specialization.name_kz || doctor.specialization.name_ru;
      case 'en':
        return doctor.specialization.name_en || doctor.specialization.name_ru;
      default:
        return doctor.specialization.name_ru;
    }
  }
  return doctor.doctor_type;
};

export const filterDoctors = (
  doctors: Doctor[],
  searchTerm: string,
  filterByType: string,
  language: Language = 'ru'
) => {
  return doctors.filter(doctor => {
    const doctorName = doctor.name || '';
    const specialization = getSpecializationName(doctor, language);

    const matchesSearch = doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterByType === "all" || specialization === filterByType;
    return matchesSearch && matchesType;
  });
};

export const sortDoctorsByRecommendation = (
  doctors: Doctor[],
  recommendedDoctorId?: number
) => {
  return doctors.sort((a, b) => {
    const aIsRecommended = recommendedDoctorId === a.id;
    const bIsRecommended = recommendedDoctorId === b.id;

    if (aIsRecommended && !bIsRecommended) return -1;
    if (!aIsRecommended && bIsRecommended) return 1;
    return 0;
  });
};

export const getDoctorTypes = (doctors: Doctor[], language: Language = 'ru'): string[] => {
  const types = [...new Set(doctors.map(doc => getSpecializationName(doc, language)).filter(type => type))];
  return types;
};