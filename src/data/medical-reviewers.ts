export interface MedicalReviewer {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  yearsOfExperience: number;
  bio: string;
  avatarInitials: string;
}

export const medicalReviewers: Record<string, MedicalReviewer> = {
  "therapist-001": {
    id: "therapist-001",
    name: "Алия Сейткалиева",
    specialty: "Терапевт",
    credentials: "Врач-терапевт высшей категории, КазНМУ им. Асфендиярова",
    yearsOfExperience: 14,
    bio: "Врач-терапевт с 14-летним опытом. Специализируется на диагностике и лечении внутренних болезней.",
    avatarInitials: "АС",
  },
  "cardiologist-001": {
    id: "cardiologist-001",
    name: "Нурлан Джаксыбеков",
    specialty: "Кардиолог",
    credentials: "Врач-кардиолог, к.м.н., Национальный кардиохирургический центр",
    yearsOfExperience: 18,
    bio: "Кардиолог с 18-летним опытом. Специализируется на ишемической болезни сердца и гипертонии.",
    avatarInitials: "НД",
  },
  "pediatrician-001": {
    id: "pediatrician-001",
    name: "Гульнара Ахметова",
    specialty: "Педиатр",
    credentials: "Врач-педиатр высшей категории, ЗКМУ им. Марата Оспанова",
    yearsOfExperience: 11,
    bio: "Педиатр с 11-летним опытом работы с детьми от рождения до 18 лет.",
    avatarInitials: "ГА",
  },
  "neurologist-001": {
    id: "neurologist-001",
    name: "Серик Мухамедиев",
    specialty: "Невролог",
    credentials: "Врач-невролог, ННЦН, Алматы",
    yearsOfExperience: 16,
    bio: "Невролог с 16-летним опытом. Специализируется на головных болях, остеохондрозе и нарушениях сна.",
    avatarInitials: "СМ",
  },
  "gynecologist-001": {
    id: "gynecologist-001",
    name: "Динара Касымова",
    specialty: "Гинеколог",
    credentials: "Врач акушер-гинеколог высшей категории, РНЦРМНИ им. академика Б.Атчабарова",
    yearsOfExperience: 13,
    bio: "Акушер-гинеколог с 13-летним опытом. Ведёт беременность, занимается лечением гинекологических заболеваний.",
    avatarInitials: "ДК",
  },
};
