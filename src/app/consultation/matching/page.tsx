"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserMd,
  faStar,
  faCheckCircle,
  faArrowLeft,
  faSpinner,
  faClock,
  faGraduationCap,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MatchingPage() {
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(true);
  const [matchedDoctor, setMatchedDoctor] = useState<any>(null);

  useEffect(() => {
    // Simulate AI matching process
    setTimeout(() => {
      setMatchedDoctor({
        id: 1,
        name: "Доктор Аманжол Касымов",
        specialty: "Терапевт",
        rating: 4.9,
        reviews: 234,
        experience: 15,
        clinic: "Медицинский центр ZhanCare",
        price: 15000,
        availableIn: "5 минут",
        education: "КазНМУ им. С.Д. Асфендиярова",
        languages: ["Русский", "Казахский", "Английский"],
      });
      setIsMatching(false);
    }, 3000);
  }, []);

  const handleProceedToPayment = () => {
    router.push("/consultation/payment");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="hidden sm:inline">Назад</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Подбор врача</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        {isMatching ? (
          /* Loading State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-block relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 relative">
                <FontAwesomeIcon icon={faUserMd} className="text-white text-5xl" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-transparent border-t-white rounded-full"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Подбираем врача...
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              ИИ анализирует ваши симптомы и находит подходящего специалиста
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                <span>Анализ симптомов...</span>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Matched Doctor Card */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Success Message */}
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8 text-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-4xl mb-3" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Врач найден!
              </h2>
              <p className="text-green-700">
                Мы подобрали специалиста, который лучше всего подходит для ваших симптомов
              </p>
            </div>

            {/* Doctor Card */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Doctor Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl font-bold shadow-xl" style={{ color: '#3772ff' }}>
                    {matchedDoctor.name.split(' ')[1].charAt(0)}{matchedDoctor.name.split(' ')[2].charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2">{matchedDoctor.name}</h3>
                    <p className="text-xl text-blue-100 mb-3">{matchedDoctor.specialty}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faStar} className="text-yellow-300" />
                        <span className="font-semibold">{matchedDoctor.rating}</span>
                        <span className="text-blue-100">({matchedDoctor.reviews} отзывов)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faClock} className="text-blue-200" />
                        <span>Доступен через {matchedDoctor.availableIn}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Experience */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faGraduationCap} className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Опыт работы</h4>
                      <p className="text-gray-600">{matchedDoctor.experience} лет</p>
                      <p className="text-sm text-gray-500">{matchedDoctor.education}</p>
                    </div>
                  </div>

                  {/* Clinic */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faHospital} className="text-indigo-600 text-xl" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Клиника</h4>
                      <p className="text-gray-600">{matchedDoctor.clinic}</p>
                      <p className="text-sm text-gray-500">
                        Языки: {matchedDoctor.languages.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price and Action */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-600 mb-1">Стоимость консультации</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {matchedDoctor.price.toLocaleString()} ₸
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Длительность</p>
                      <p className="text-xl font-semibold text-gray-900">30 минут</p>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                  >
                    Перейти к оплате
                  </button>

                  <p className="text-center text-sm text-gray-500 mt-4">
                    После оплаты консультация начнется автоматически
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-center text-gray-600">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 mr-2" />
                Врач будет ожидать подтверждения оплаты. После подтверждения вы автоматически попадете в видео-консультацию.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
