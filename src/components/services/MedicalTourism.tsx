"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plane,
  Hotel,
  Stethoscope,
  MapPin,
  Star,
  Check,
  ArrowRight,
  Calendar,
  Clock,
  Award,
  Heart,
  Globe,
  Users,
  Shield,
  Phone
} from "lucide-react";
import Image from "next/image";

interface TourismPackage {
  id: number;
  title: string;
  destination: string;
  price: string;
  duration: string;
  rating: number;
  reviews: number;
  image: string;
  features: string[];
  specialty: string;
  hospital: string;
  popular?: boolean;
}

const MedicalTourism = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPackage, setSelectedPackage] = useState<TourismPackage | null>(null);

  const categories = [
    { id: "all", name: "Все направления", icon: Globe },
    { id: "cardio", name: "Кардиология", icon: Heart },
    { id: "ortho", name: "Ортопедия", icon: Users },
    { id: "plastic", name: "Пластическая хирургия", icon: Award },
    { id: "dental", name: "Стоматология", icon: Stethoscope },
  ];

  const packages: TourismPackage[] = [
    {
      id: 1,
      title: "Кардиологическое обследование Premium",
      destination: "Германия, Мюнхен",
      price: "от 8,500€",
      duration: "7 дней",
      rating: 4.9,
      reviews: 156,
      image: "/medical-tourism/germany.jpg",
      features: [
        "Полное кардиологическое обследование",
        "Консультация профессоров",
        "VIP размещение в клинике",
        "Проживание в 5* отеле",
        "Трансфер и переводчик"
      ],
      specialty: "Кардиология",
      hospital: "Клиника Мюнхенского университета",
      popular: true
    },
    {
      id: 2,
      title: "Эндопротезирование суставов",
      destination: "Турция, Стамбул",
      price: "от 6,200€",
      duration: "14 дней",
      rating: 4.8,
      reviews: 203,
      image: "/medical-tourism/turkey.jpg",
      features: [
        "Операция по замене сустава",
        "Реабилитация",
        "Проживание в отеле",
        "Медицинское сопровождение 24/7",
        "Туристическая программа"
      ],
      specialty: "Ортопедия",
      hospital: "Американский госпиталь Стамбула"
    },
    {
      id: 3,
      title: "Пластическая хирургия",
      destination: "Южная Корея, Сеул",
      price: "от 4,800€",
      duration: "10 дней",
      rating: 5.0,
      reviews: 312,
      image: "/medical-tourism/korea.jpg",
      features: [
        "Консультация хирурга",
        "Операция",
        "Послеоперационный уход",
        "Отель 5*",
        "Экскурсионная программа"
      ],
      specialty: "Пластическая хирургия",
      hospital: "Samsung Medical Center",
      popular: true
    },
    {
      id: 4,
      title: "Имплантация зубов All-on-4",
      destination: "Израиль, Тель-Авив",
      price: "от 12,000€",
      duration: "5 дней",
      rating: 4.9,
      reviews: 89,
      image: "/medical-tourism/israel.jpg",
      features: [
        "Полная диагностика",
        "Имплантация All-on-4",
        "Временные протезы",
        "Проживание",
        "Координатор"
      ],
      specialty: "Стоматология",
      hospital: "Assuta Medical Center"
    }
  ];

  const filteredPackages = selectedCategory === "all"
    ? packages
    : packages.filter(pkg => {
        const categoryMap: Record<string, string> = {
          "cardio": "Кардиология",
          "ortho": "Ортопедия",
          "plastic": "Пластическая хирургия",
          "dental": "Стоматология"
        };
        return pkg.specialty === categoryMap[selectedCategory];
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-[#3772ff] via-[#5B8DEF] to-[#7BA5F7] text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <Plane className="w-5 h-5" />
              <span className="text-sm font-semibold">Медицинский туризм премиум-класса</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Лечение за рубежом
            </h1>

            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Получите качественное медицинское обслуживание в лучших клиниках мира с полным сопровождением
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Globe, value: "30+", label: "Стран" },
                { icon: Hotel, value: "200+", label: "Клиник" },
                { icon: Users, value: "5000+", label: "Пациентов" },
                { icon: Shield, value: "100%", label: "Гарантия" }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-[#3772ff] to-[#5B8DEF] text-white shadow-lg shadow-blue-500/30 scale-105"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-300"
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Популярно
                  </div>
                )}

                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-20 h-20 text-blue-300/50" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      {pkg.destination}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {pkg.specialty}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {pkg.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-500" />
                    {pkg.hospital}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(pkg.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{pkg.rating}</span>
                    <span className="text-sm text-gray-500">({pkg.reviews} отзывов)</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    {pkg.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{pkg.price}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pkg.duration}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3772ff] to-[#5B8DEF] text-white rounded-xl font-medium hover:shadow-lg hover:scale-105 transition-all duration-300"
                    >
                      Подробнее
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filteredPackages.length === 0 && (
          <div className="text-center py-20">
            <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Пакеты в этой категории скоро появятся</p>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Phone className="w-12 h-12 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Нужна консультация?</h2>
          <p className="text-lg text-blue-100 mb-8">
            Наши специалисты помогут подобрать оптимальную программу лечения за рубежом
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl">
              Заказать звонок
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-300">
              Написать в WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Package Detail Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPackage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedPackage.title}</h3>
                    <p className="text-gray-600 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedPackage.destination}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPackage(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Что входит в пакет:</h4>
                    <ul className="space-y-2">
                      {selectedPackage.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Стоимость</div>
                      <div className="text-3xl font-bold text-gray-900">{selectedPackage.price}</div>
                    </div>
                    <button className="px-8 py-4 bg-gradient-to-r from-[#3772ff] to-[#5B8DEF] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-300">
                      Забронировать
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalTourism;
