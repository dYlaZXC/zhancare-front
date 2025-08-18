"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import "swiper/css";
import "swiper/css/pagination";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

// Import all doctor images
import doctorImg from "@/assets/doctor-img/doctor-img.jpeg";
import doctorImg2 from "@/assets/doctor-img/doctor-img2.jpeg";
import doctorImg3 from "@/assets/doctor-img/doctor-img3.jpeg";
import doctorImg4 from "@/assets/doctor-img/doctor-img4.jpeg";
import doctorImg5 from "@/assets/doctor-img/doctor-img5.jpeg";
import doctorImg6 from "@/assets/doctor-img/doctor-img6.jpeg";
import doctorImg7 from "@/assets/doctor-img/doctor-img7.jpeg";
import doctorImg8 from "@/assets/doctor-img/doctor-img8.jpeg";
import doctorImg9 from "@/assets/doctor-img/doctor-img9.jpeg";
import doctorImg10 from "@/assets/doctor-img/doctor-img10.jpeg";
import doctorImg11 from "@/assets/doctor-img/doctor-img11.jpeg";
import doctorImg12 from "@/assets/doctor-img/doctor-img12.jpeg";
import doctorImg13 from "@/assets/doctor-img/doctor-img13.jpeg";
import doctorImg14 from "@/assets/doctor-img/doctor-img14.jpeg";
import doctorImg15 from "@/assets/doctor-img/doctor-img15.jpeg";
import doctorImg16 from "@/assets/doctor-img/doctor-img16.jpeg";
import doctorImg17 from "@/assets/doctor-img/doctor-img17.jpeg";
import doctorImg18 from "@/assets/doctor-img/doctor-img18.jpeg";
import doctorImg19 from "@/assets/doctor-img/doctor-img19.jpeg";
import doctorImg20 from "@/assets/doctor-img/doctor-img20.jpeg";
import doctorImg21 from "@/assets/doctor-img/doctor-img21.jpeg";

export const DoctorsCarousel = () => {
  const { language } = useLanguage();
  const [selectedDoctor, setSelectedDoctor] = useState<null | any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return {
          title: "Наши специалисты",
          categories: {
            all: "Все",
            gp: "ВОП",
            nursing: "Фельдшер/Сестры",
            pediatrics: "Педиатрия",
            ophthalmology: "Офтальмология",
            dermatology: "Дерматология",
            surgery: "Хирургия",
            massage: "Массаж",
            radiology: "Радиология"
          },
          experiencedDoctor: "Опытный врач",
          profileButton: "Профиль",
          experience: "опыта",
          yearsExp: "лет"
        };
      case "kz":
        return {
          title: "Біздің мамандар",
          categories: {
            all: "Барлығы",
            gp: "ЖДД",
            nursing: "Фельдшер/Мейірбике",
            pediatrics: "Педиатрия",
            ophthalmology: "Офтальмология",
            dermatology: "Дерматология",
            surgery: "Хирургия",
            massage: "Массаж",
            radiology: "Радиология"
          },
          experiencedDoctor: "Тәжірибелі дәрігер",
          profileButton: "Профиль",
          experience: "тәжірибесі",
          yearsExp: "жыл"
        };
      case "en":
        return {
          title: "Our Specialists",
          categories: {
            all: "All",
            gp: "General Practice",
            nursing: "Nurses/Paramedics",
            pediatrics: "Pediatrics",
            ophthalmology: "Ophthalmology",
            dermatology: "Dermatology",
            surgery: "Surgery",
            massage: "Massage",
            radiology: "Radiology"
          },
          experiencedDoctor: "Experienced Doctor",
          profileButton: "Profile",
          experience: "experience",
          yearsExp: "years"
        };
      default:
        return {
          title: "Our Specialists",
          categories: {
            all: "All",
            gp: "General Practice",
            nursing: "Nurses/Paramedics",
            pediatrics: "Pediatrics",
            ophthalmology: "Ophthalmology",
            dermatology: "Dermatology",
            surgery: "Surgery",
            massage: "Massage",
            radiology: "Radiology"
          },
          experiencedDoctor: "Experienced Doctor",
          profileButton: "Profile",
          experience: "experience",
          yearsExp: "years"
        };
    }
  };

  const translations = getTranslations();

  // Doctor data with multilingual names and specialties
  const getDoctors = () => {
    const baseData = [
      { nameRu: "Рахимов Есдаулет Толебайұлы", nameKz: "Рахимов Есдәулет Төлебайұлы", nameEn: "Rakhimov Yesdaulet Tolebayuly", specialty: { ru: "Врач ПМСП / ВОП / Участковый", kz: "ПМКК дәрігері / ЖДД / Учаскелік", en: "Primary Care Doctor / GP / District" }, experience: "10", image: doctorImg15, category: "gp" },
      { nameRu: "Арыстанбаева Жансая Абзаловна", nameKz: "Арыстанбаева Жансая Абзалқызы", nameEn: "Arystanbayeva Zhansaya Abzalovna", specialty: { ru: "Фельдшер", kz: "Фельдшер", en: "Paramedic" }, experience: "10", image: doctorImg11, category: "nursing" },
      { nameRu: "Саутова Алия Мейрамовна", nameKz: "Саутова Алия Мейрамқызы", nameEn: "Sautova Aliya Meiramovna", specialty: { ru: "Терапевт", kz: "Терапевт", en: "Therapist" }, experience: "10", image: doctorImg14, category: "gp" },
      { nameRu: "Ауельбекова Ултуган Тулегеновна", nameKz: "Әуелбекова Ұлтуған Төлегенқызы", nameEn: "Auyelbekova Ultugan Tulegenovna", specialty: { ru: "Массажист", kz: "Массажист", en: "Massage Therapist" }, experience: "25", image: doctorImg7, category: "massage" },
      { nameRu: "Умирбекова Айнур Едиловна", nameKz: "Үмірбекова Айнұр Еділқызы", nameEn: "Umirbekova Ainur Yedilovna", specialty: { ru: "Сестринское дело", kz: "Мейірбике ісі", en: "Nursing" }, experience: "26", image: doctorImg19, category: "nursing" },
      { nameRu: "Ержанова Эльмира Токтарбаевна", nameKz: "Ержанова Эльмира Тоқтарбайқызы", nameEn: "Yerzhanova Elmira Toktarbayeva", specialty: { ru: "Врач", kz: "Дәрігер", en: "Doctor" }, experience: "15", image: doctorImg9, category: "gp" },
      { nameRu: "Сейтенова Дурия Каратаевна", nameKz: "Сейтенова Дурия Қаратайқызы", nameEn: "Seitenova Duriya Karatayeva", specialty: { ru: "Педиатрия", kz: "Педиатрия", en: "Pediatrics" }, experience: "38", image: doctorImg17, category: "pediatrics" },
      { nameRu: "Абдигаипова Зарина Елтаевна", nameKz: "Абдығаипова Зарина Елтайқызы", nameEn: "Abdigaipova Zarina Yeltayeva", specialty: { ru: "Медколледж", kz: "Медколледж", en: "Medical College" }, experience: "11", image: doctorImg6, category: "nursing" },
      { nameRu: "Оспанова Масиха Султановна", nameKz: "Оспанова Масиха Сұлтанқызы", nameEn: "Ospanova Masiha Sultanova", specialty: { ru: "Педиатр", kz: "Педиатр", en: "Pediatrician" }, experience: "39", image: doctorImg20, category: "pediatrics" },
      { nameRu: "Тынысбекова Гульшат Андешевна", nameKz: "Тынысбекова Гүлшат Андешқызы", nameEn: "Tynysbekova Gulshat Andeshevna", specialty: { ru: "Дерматокосметолог", kz: "Дерматокосметолог", en: "Dermatocosmetologist" }, experience: "25", image: doctorImg13, category: "dermatology" },
      { nameRu: "Уразымбетова Венера Жиенбаевна", nameKz: "Уразымбетова Венера Жиенбайқызы", nameEn: "Urazymbekova Venera Zhiyenbayeva", specialty: { ru: "Сестринское дело", kz: "Мейірбике ісі", en: "Nursing" }, experience: "15", image: doctorImg10, category: "nursing" },
      { nameRu: "Абилкадирова Гульнара Аскербековна", nameKz: "Әбілқадырова Гүлнара Аскербекқызы", nameEn: "Abilkadirova Gulnara Askerbekovna", specialty: { ru: "Медицинское училище", kz: "Медициналық училище", en: "Medical School" }, experience: "38", image: doctorImg5, category: "nursing" },
      { nameRu: "Сеитова Гульнара Нуруллаевна", nameKz: "Сейітова Гүлнара Нұрұллақызы", nameEn: "Seitova Gulnara Nurullayeva", specialty: { ru: "Офтальмолог", kz: "Офтальмолог", en: "Ophthalmologist" }, experience: "15", image: doctorImg8, category: "ophthalmology" },
      { nameRu: "Ержанова Алтын Омаркановна", nameKz: "Ержанова Алтын Омарқанқызы", nameEn: "Yerzhanova Altyn Omarkanova", specialty: { ru: "Дерматокосметолог/Хирург", kz: "Дерматокосметолог/Хирург", en: "Dermatocosmetologist/Surgeon" }, experience: "18", image: doctorImg12, category: "surgery" },
      { nameRu: "Бегимова Алина Болатовна", nameKz: "Бегімова Алина Болатқызы", nameEn: "Begimova Alina Bolatovna", specialty: { ru: "Врач общей практики", kz: "Жалпы дәрігер", en: "General Practitioner" }, experience: "3", image: doctorImg21, category: "gp" },
      { nameRu: "Койбакова Сәуле", nameKz: "Қойбақова Сәуле", nameEn: "Koibakova Saule", specialty: { ru: "Сестринское дело", kz: "Мейірбике ісі", en: "Nursing" }, experience: "16", image: doctorImg2, category: "nursing" },
      { nameRu: "Бейсенбекова Асемгуль", nameKz: "Бейсенбекова Асемгүл", nameEn: "Beisenbekova Asemgul", specialty: { ru: "Фельдшер", kz: "Фельдшер", en: "Paramedic" }, experience: "3", image: doctorImg18, category: "nursing" },
      { nameRu: "Амирханова Акбота Кайратовна", nameKz: "Әмірханова Ақбота Қайратқызы", nameEn: "Amirkhanova Akbota Kairatovna", specialty: { ru: "Врач-косметолог/дерматовенеролог", kz: "Косметолог дәрігер/дерматовенеролог", en: "Cosmetologist/Dermatovenereologist" }, experience: "3", image: doctorImg, category: "dermatology" },
      { nameRu: "Мырзахметова Гульнара Асильевна", nameKz: "Мырзахметова Гүлнара Әсілқызы", nameEn: "Myrzakhmetova Gulnara Asilievna", specialty: { ru: "Дерматокосметолог/Гирудотерапевт", kz: "Дерматокосметолог/Гирудотерапевт", en: "Dermatocosmetologist/Hirudotherapist" }, experience: "1", image: doctorImg4, category: "dermatology" },
      { nameRu: "Мекенбаева Нигина Бобуровна", nameKz: "Мекенбаева Нигина Бобұрқызы", nameEn: "Mekenbayeva Nigina Boburovna", specialty: { ru: "Радиолог", kz: "Радиолог", en: "Radiologist" }, experience: "1", image: doctorImg16, category: "radiology" },
    ];

    return baseData.map(doctor => ({
      ...doctor,
      name: language === "ru" ? doctor.nameRu : language === "kz" ? doctor.nameKz : doctor.nameEn,
      specialtyText: doctor.specialty[language as keyof typeof doctor.specialty] || doctor.specialty.en
    }));
  };

  const doctors = getDoctors();

  const categories = [
    { key: "all", label: translations.categories.all },
    { key: "gp", label: translations.categories.gp },
    { key: "nursing", label: translations.categories.nursing },
    { key: "pediatrics", label: translations.categories.pediatrics },
    { key: "ophthalmology", label: translations.categories.ophthalmology },
    { key: "dermatology", label: translations.categories.dermatology },
    { key: "surgery", label: translations.categories.surgery },
    { key: "massage", label: translations.categories.massage },
    { key: "radiology", label: translations.categories.radiology }
  ];

  const filteredDoctors = activeCategory === "all"
    ? doctors
    : doctors.filter((doc) => doc.category === activeCategory);

  return (
    <section id="specialists" className="py-20 bg-gradient-to-b from-white to-[#d2dcff] text-center overflow-hidden">
      <motion.h2
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl laptop-hd:text-4xl desktop-fhd:text-5xl desktop-qhd:text-6xl desktop-4k:text-7xl font-extrabold tracking-tight text-[#001E80] mb-4 sm:mb-6 lg:mb-8"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {translations.title}
      </motion.h2>

      {/* Categories */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        {categories.map((category) => (
          <button
            key={category.key}
            onClick={() => setActiveCategory(category.key)}
            className={`px-5 py-2 rounded-full border 
              ${activeCategory === category.key 
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white" 
                : "border-blue-400 text-blue-700 hover:bg-blue-100 transition"
              }`
            }
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Doctor Cards */}
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={40}
        slidesPerView={1}
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="max-w-7xl mx-auto px-6"
      >
        {filteredDoctors.map((doc, index) => (
          <SwiperSlide key={index}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-xl hover:shadow-2xl p-8 flex flex-col items-center w-[300px] h-[540px] mx-auto transition-all duration-300 hover:scale-105 relative"
            >
              <div className="relative w-36 h-36 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00cfff] to-[#0079ff] p-1">
                  <div className="relative w-full h-full bg-white rounded-full overflow-hidden">
                    <Image
                      src={doc.image}
                      alt={doc.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-[#001E80]">{doc.name}</h3>
              <p className="text-gray-500 mt-2">{doc.specialtyText}</p>
              <p className="text-gray-400 mt-1 text-sm">{doc.experience} {translations.yearsExp}</p>

              {parseInt(doc.experience) >= 10 && (
                <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                  {translations.experiencedDoctor}
                </span>
              )}

              <button
                onClick={() => setSelectedDoctor(doc)}
                className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-5 rounded-full hover:opacity-90 transition"
              >
                {translations.profileButton}
              </button>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Doctor Profile Popup */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDoctor(null)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-md relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>

              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <Image
                    src={selectedDoctor.image}
                    alt={selectedDoctor.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#001E80]">{selectedDoctor.name}</h3>
                <p className="text-gray-500 mt-2">{selectedDoctor.specialtyText}</p>
                <p className="text-gray-400 mt-1 text-sm">{selectedDoctor.experience} {translations.yearsExp} {translations.experience}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};