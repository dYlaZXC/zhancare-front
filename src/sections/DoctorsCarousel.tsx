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
import doctorImg22 from "@/assets/doctor-img/doctor-img22.jpeg";
import doctorImg23 from "@/assets/doctor-img/doctor-img23.jpeg";
import doctorImg24 from "@/assets/doctor-img/doctor-img24.jpeg";
import doctorImg25 from "@/assets/doctor-img/doctor-img25.jpeg";
import doctorImg26 from "@/assets/doctor-img/doctor-img26.jpeg";
import doctorImg27 from "@/assets/doctor-img/doctor-img27.jpeg";
import doctorImg28 from "@/assets/doctor-img/doctor-img28.jpeg";
import doctorImg29 from "@/assets/doctor-img/doctor-img29.jpeg";
import doctorImg30 from "@/assets/doctor-img/doctor-img30.jpeg";
import doctorImg31 from "@/assets/doctor-img/doctor-img31.jpeg";
import doctorImg32 from "@/assets/doctor-img/doctor-img32.jpeg";

export const DoctorsCarousel = () => {
  const { language } = useLanguage();
  const [selectedDoctor, setSelectedDoctor] = useState<null | any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Handle category change
  const handleCategoryChange = (categoryKey: string) => {
    setActiveCategory(categoryKey);
  };

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
          yearsExp: "лет",
          status: "Статус",
          bookAppointment: "Записаться на прием",
          altTexts: {
            doctorPhoto: "Фотография врача",
            doctorProfilePhoto: "Профильная фотография врача"
          }
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
          yearsExp: "жыл",
          status: "Мәртебесі",
          bookAppointment: "Қабылдауға жазылу",
          altTexts: {
            doctorPhoto: "Дәрігердің фотосуреті",
            doctorProfilePhoto: "Дәрігердің профиль фотосуреті"
          }
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
          yearsExp: "years",
          status: "Status",
          bookAppointment: "Book Appointment",
          altTexts: {
            doctorPhoto: "Doctor's photo",
            doctorProfilePhoto: "Doctor's profile photo"
          }
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
          yearsExp: "years",
          status: "Status",
          bookAppointment: "Book Appointment",
          altTexts: {
            doctorPhoto: "Doctor's photo",
            doctorProfilePhoto: "Doctor's profile photo"
          }
        };
    }
  };

  const translations = getTranslations();

  // Doctor data with multilingual names and specialties
  const getDoctors = () => {
    const baseData = [
      { nameRu: "Наурызбаева Баглан Назымбеккызы", nameKz: "Наурызбаева Бағлан Назымбекқызы", nameEn: "Nauryzbayeva Baglan Nazymbek kyzy", specialty: { ru: "Неонатолог, интегративная и превентивная педиатрия, реабилитолог высшей категории", kz: "Жоғары санатты неонатолог, интегративті және превентивті педиатрия, реабилитолог", en: "Neonatologist, Integrative & Preventive Pediatrics, Rehabilitation, Highest Category" }, experience: "26", image: doctorImg19, category: "pediatrics" },
      { nameRu: "Приходько Татьяна Михайловна", nameKz: "Приходько Татьяна Михайловна", nameEn: "Prikhodko Tatyana Mikhailovna", specialty: { ru: "Реабилитолог высшей категории", kz: "Жоғары санатты реабилитолог", en: "Rehabilitation Specialist, Highest Category" }, experience: "26", image: doctorImg20, category: "gp" },
      { nameRu: "Кажитаев Алмас Муралович", nameKz: "Кажитаев Алмас Муралович", nameEn: "Kazhitaev Almas Muralovich", specialty: { ru: "Заведующий отделения урологии и андрологии МОБ2", kz: "МОБ2 урология және андрология бөлімінің меңгерушісі", en: "Head of Urology and Andrology Department MOB2" }, experience: "30", image: doctorImg21, category: "surgery" },
      { nameRu: "Жаканбетов Азат Кунанбаевич", nameKz: "Жақанбетов Азат Құнанбайұлы", nameEn: "Zhakanbetov Azat Kunanbayevich", specialty: { ru: "Отоларинголог (ЛОР), 1 категории", kz: "Отоларинголог (ЛОР), 1 санат", en: "Otolaryngologist (ENT), 1st category" }, experience: "10", image: doctorImg22, category: "gp" },
      { nameRu: "Изтлеуова Нургуль Кубашевна", nameKz: "Изтлеуова Нұргүл Құбашқызы", nameEn: "Iztleuova Nurgul Kubashevna", specialty: { ru: "Инфекционист высшей категории", kz: "Жоғары санатты инфекционист", en: "Infectious Disease Specialist, Highest Category" }, experience: "37", image: doctorImg23, category: "gp" },
      { nameRu: "Ниязбаев Талгат Толешевич", nameKz: "Ниязбаев Талғат Төлешұлы", nameEn: "Niyazbaev Talgat Toleshevich", specialty: { ru: "Уролог-Андролог высшей категории", kz: "Жоғары санатты уролог-андролог", en: "Urologist-Andrologist, Highest Category" }, experience: "25", image: doctorImg24, category: "surgery" },
      { nameRu: "Смагулова Еркежан Есепбаевна", nameKz: "Смағұлова Еркежан Есепбайқызы", nameEn: "Smagulova Yerkezhan Yesepbayevna", specialty: { ru: "Кардиолог высшей категории", kz: "Жоғары санатты кардиолог", en: "Cardiologist, Highest Category" }, experience: "22", image: doctorImg25, category: "gp" },
      { nameRu: "Рябчевская Тамара Георгиевна", nameKz: "Рябчевская Тамара Георгиевна", nameEn: "Ryabchevskaya Tamara Georgievna", specialty: { ru: "Педиатр высшей категории", kz: "Жоғары санатты педиатр", en: "Pediatrician, Highest Category" }, experience: "48", image: doctorImg26, category: "pediatrics" },
      { nameRu: "Муканова Роза Шайдулловна", nameKz: "Мұқанова Роза Шайдуллақызы", nameEn: "Mukanova Roza Shaidullovna", specialty: { ru: "УЗИ, лучевая диагностика высшей категории", kz: "Жоғары санатты УДЗ, сәулелік диагностика", en: "Ultrasound, Radiology, Highest Category" }, experience: "23", image: doctorImg27, category: "radiology" },
      { nameRu: "Султан Риза Алибековна", nameKz: "Сұлтан Риза Әлібекқызы", nameEn: "Sultan Riza Alibekovna", specialty: { ru: "Терапевт, педиатр, невропатолог высшей категории", kz: "Жоғары санатты терапевт, педиатр, невропатолог", en: "Therapist, Pediatrician, Neurologist, Highest Category" }, experience: "18", image: doctorImg28, category: "gp" },
      { nameRu: "Чекменева Наталья Иосифовна", nameKz: "Чекменева Наталья Иосифовна", nameEn: "Chekmeneva Natalya Iosifovna", specialty: { ru: "Акушер-гинеколог", kz: "Акушер-гинеколог", en: "Obstetrician-Gynecologist" }, experience: "39", image: doctorImg29, category: "gp" },
      { nameRu: "Сиразитдинов Рустам Раисович", nameKz: "Сиразитдинов Рұстам Раисұлы", nameEn: "Sirazitdinov Rustam Raisovich", specialty: { ru: "Хирург, травматолог, детский хирург высшей категории", kz: "Жоғары санатты хирург, травматолог, балалар хирургі", en: "Surgeon, Traumatologist, Pediatric Surgeon, Highest Category" }, experience: "25", image: doctorImg30, category: "surgery" },
      { nameRu: "Джайнаров Нургиса Ершораевич", nameKz: "Джайнаров Нұрғиса Ершорайұлы", nameEn: "Dzhaynarov Nurgisa Yershorayevich", specialty: { ru: "Стоматолог высшей категории", kz: "Жоғары санатты стоматолог", en: "Dentist, Highest Category" }, experience: "10", image: doctorImg31, category: "gp" },
      { nameRu: "Мусин Жанат Сартаевич", nameKz: "Мусин Жанат Сартайұлы", nameEn: "Musin Zhanat Sartayevich", specialty: { ru: "Хирург", kz: "Хирург", en: "Surgeon" }, experience: "36", image: doctorImg32, category: "surgery" },
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
      <div className="flex flex-wrap justify-center gap-3 mb-12 px-4 relative z-10">
        {categories.map((category, index) => (
          <motion.button
            key={category.key}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCategoryChange(category.key);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-6 py-3 rounded-2xl font-semibold cursor-pointer select-none transition-all duration-300 overflow-hidden group
              ${activeCategory === category.key
                ? "text-white shadow-xl"
                : "text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 hover:border-indigo-300 hover:shadow-md"
              }`
            }
            style={{ pointerEvents: 'auto' }}
          >
            {/* Active background gradient */}
            {activeCategory === category.key && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* Hover gradient effect for inactive buttons */}
            {activeCategory !== category.key && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            {/* Icon and text with active indicator */}
            <span className="relative z-10 flex items-center gap-2">
              {/* Active indicator dot - left side of text */}
              {activeCategory === category.key && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2 h-2 bg-green-400 rounded-full shadow-lg"
                />
              )}

              {category.key === "all" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
              {category.key === "surgery" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              )}
              {category.key === "pediatrics" && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {category.label}
            </span>
          </motion.button>
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
              className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl overflow-hidden w-[320px] mx-auto transition-all duration-500 hover:-translate-y-2 relative border border-gray-100"
            >
              {/* Photo Section with overlay gradient */}
              <div className="relative w-full h-80 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                <Image
                  src={doc.image}
                  alt={`${translations.altTexts.doctorPhoto} - ${doc.name}, ${doc.specialtyText}`}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40"></div>

                {/* Experience badge on photo */}
                {parseInt(doc.experience) >= 20 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {doc.experience}+ {translations.yearsExp}
                  </div>
                )}

                {/* Status indicator */}
                <div className="absolute bottom-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  {translations.experiencedDoctor}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-6 space-y-3">
                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 leading-tight min-h-[56px] line-clamp-2">
                  {doc.name}
                </h3>

                {/* Specialty */}
                <p className="text-sm text-gray-600 leading-relaxed min-h-[40px] line-clamp-2">
                  {doc.specialtyText}
                </p>

                {/* Experience bar */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(parseInt(doc.experience) * 2, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">
                    {doc.experience} {translations.yearsExp}
                  </span>
                </div>

                {/* Action Button */}
                <motion.button
                  onClick={() => setSelectedDoctor(doc)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                >
                  <span>{translations.profileButton}</span>
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Doctor Profile Popup */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDoctor(null)}
          >
            <motion.div
              className="bg-white rounded-3xl overflow-hidden w-full max-w-lg relative shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Photo Section - Full height without gradient fade */}
              <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50">
                <Image
                  src={selectedDoctor.image}
                  alt={`${translations.altTexts.doctorProfilePhoto} - ${selectedDoctor.name}, ${selectedDoctor.specialtyText}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {/* Subtle bottom gradient only */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/60 to-transparent"></div>

                {/* Experience badge */}
                {parseInt(selectedDoctor.experience) >= 20 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {selectedDoctor.experience}+ {translations.yearsExp}
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{selectedDoctor.name}</h3>
                  <p className="text-lg text-gray-600">{selectedDoctor.specialtyText}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700">{translations.experience}</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700">{selectedDoctor.experience} {translations.yearsExp}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-700">{translations.status || "Статус"}</span>
                    </div>
                    <p className="text-sm font-bold text-green-700 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      {translations.experiencedDoctor}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {translations.bookAppointment || "Записаться на прием"}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};