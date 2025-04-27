"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { motion, AnimatePresence } from "framer-motion";
import "swiper/css";
import "swiper/css/pagination";

import { useState } from "react";
import Image from "next/image";

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

// Doctor data
const doctors = [
    { name: "Рахимов Есдаулет Толебайұлы", specialty: "Врач ПМСП / ВОП / Участковый", experience: "10 лет", image: doctorImg15, category: "ВОП" },
    { name: "Арыстанбаева Жансая Абзаловна", specialty: "Фельдшер", experience: "10 лет", image: doctorImg11, category: "Фельдшер/Сестры" },
    { name: "Саутова Алия Мейрамовна", specialty: "Терапевт", experience: "10 лет", image: doctorImg14, category: "ВОП" },
    { name: "Ауельбекова Ултуган Тулегеновна", specialty: "Массажист", experience: "25 лет", image: doctorImg7, category: "Массаж" },
    { name: "Умирбекова Айнур Едиловна", specialty: "Сестринское дело", experience: "26 лет", image: doctorImg19, category: "Фельдшер/Сестры" },
    { name: "Ержанова Эльмира Токтарбаевна", specialty: "Врач", experience: "15 лет", image: doctorImg9, category: "ВОП" },
    { name: "Сейтенова Дурия Каратаевна", specialty: "Педиатрия", experience: "38 лет", image: doctorImg17, category: "Педиатрия" },
    { name: "Абдигаипова Зарина Елтаевна", specialty: "Медколледж", experience: "11 лет", image: doctorImg6, category: "Фельдшер/Сестры" },
    { name: "Оспанова Масиха Султановна", specialty: "Педиатр", experience: "39 лет", image: doctorImg20, category: "Педиатрия" },
    { name: "Тынысбекова Гульшат Андешевна", specialty: "Дерматокосметолог", experience: "25 лет", image: doctorImg13, category: "Дерматология" },
    { name: "Уразымбетова Венера Жиенбаевна", specialty: "Сестринское дело", experience: "15 лет", image: doctorImg10, category: "Фельдшер/Сестры" },
    { name: "Абилкадирова Гульнара Аскербековна", specialty: "Медицинское училище", experience: "38 лет", image: doctorImg5, category: "Фельдшер/Сестры" },
    { name: "Сеитова Гульнара Нуруллаевна", specialty: "Офтальмолог", experience: "15 лет", image: doctorImg8, category: "Офтальмология" },
    { name: "Ержанова Алтын Омаркановна", specialty: "Дерматокосметолог/Хирург", experience: "18 лет", image: doctorImg12, category: "Хирургия" },
    { name: "Бегимова Алина Болатовна", specialty: "Врач общей практики", experience: "3 года", image: doctorImg21, category: "ВОП" },
    { name: "Койбакова Сәуле", specialty: "Сестринское дело", experience: "16 лет", image: doctorImg2, category: "Фельдшер/Сестры" },
    { name: "Бейсенбекова Асемгуль", specialty: "Фельдшер", experience: "3 года", image: doctorImg18, category: "Фельдшер/Сестры" },
    { name: "Амирханова Акбота Кайратовна", specialty: "Врач-косметолог/дерматовенеролог", experience: "3 года", image: doctorImg, category: "Дерматология" },
    { name: "Мырзахметова Гульнара Асильевна", specialty: "Дерматокосметолог/Гирудотерапевт", experience: "1 год", image: doctorImg4, category: "Дерматология" },
    { name: "Мекенбаева Нигина Бобуровна", specialty: "Радиолог", experience: "1 год", image: doctorImg16, category: "Радиология" },
  ];

  const categories = [
    "Все", "ВОП", "Фельдшер/Сестры", "Педиатрия", "Офтальмология", "Дерматология", "Хирургия", "Массаж", "Радиология"
  ];

  export const DoctorsCarousel = () => {
    const [selectedDoctor, setSelectedDoctor] = useState<null | typeof doctors[0]>(null);
    const [activeCategory, setActiveCategory] = useState<string>("Все");
  
    const filteredDoctors = activeCategory === "Все"
      ? doctors
      : doctors.filter((doc) => doc.category === activeCategory);
  
    return (
      <section id="specialists" className="py-20 bg-gradient-to-b from-white to-[#d2dcff] text-center overflow-hidden">
        <motion.h2
          className="text-4xl font-extrabold mb-8 text-[#001E80] tracking-tight"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Наши специалисты
        </motion.h2>
  
        {/* 🔵 Категории */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {categories.map((category, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full border 
                ${activeCategory === category 
                  ? "bg-gradient-to-r from-[#0079ff] to-[#00cfff] text-white" 
                  : "border-blue-400 text-blue-700 hover:bg-blue-100 transition"
                }`
              }
            >
              {category}
            </button>
          ))}
        </div>
  
        {/* 🔵 Карточки врачей */}
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
                <p className="text-gray-500 mt-2">{doc.specialty}</p>
                <p className="text-gray-400 mt-1 text-sm">{doc.experience}</p>
  
                {parseInt(doc.experience) >= 10 && (
                  <span className="mt-2 inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                    Опытный врач
                  </span>
                )}
  
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="mt-6 bg-gradient-to-r from-[#00cfff] to-[#0079ff] text-white py-2 px-5 rounded-full hover:opacity-90 transition"
                >
                  Профиль
                </button>
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
  
        {/* 🔵 Popup Профиль врача */}
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
                  <p className="text-gray-500 mt-2">{selectedDoctor.specialty}</p>
                  <p className="text-gray-400 mt-1 text-sm">{selectedDoctor.experience} опыта</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };