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
      { nameRu: "Главный внештатный уролог Акмолинской области", nameKz: "Ақмола облысының штаттан тыс бас урологі", nameEn: "Chief Freelance Urologist of Akmola Region", specialty: { ru: "Заведующий отделения урологии и андрологии МОБ2", kz: "МОБ2 урология және андрология бөлімінің меңгерушісі", en: "Head of Urology and Andrology Department MOB2" }, experience: "30", image: doctorImg21, category: "surgery" },
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
      <div className="flex flex-wrap justify-center gap-4 mb-10 relative z-10">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleCategoryChange(category.key);
            }}
            className={`px-5 py-2 rounded-full border cursor-pointer select-none relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${activeCategory === category.key 
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-lg" 
                : "border-blue-400 text-blue-700 hover:bg-blue-100 transition-all duration-200 bg-white"
              }`
            }
            style={{ pointerEvents: 'auto' }}
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
                      alt={`${translations.altTexts.doctorPhoto} - ${doc.name}, ${doc.specialtyText}`}
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
                    alt={`${translations.altTexts.doctorProfilePhoto} - ${selectedDoctor.name}, ${selectedDoctor.specialtyText}`}
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