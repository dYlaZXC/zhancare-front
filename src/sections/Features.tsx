"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import robotImage from "@/assets/robosit.png";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import { ShieldCheck, Stethoscope, HeartPulse, Hospital } from "lucide-react";

const iconMap = [ShieldCheck, Stethoscope, HeartPulse, Hospital];

// ✅ Вынесено вне компонента — больше нет ошибки useEffect deps
const messages = [
  "Ищу информацию по симптомам...",
  "Поиск завершен... ",
  "Передаю информацию врачу..."
];

const Features = () => {
  const { language } = useLanguage();
  const translations = language === "ru" ? ru.features : kz.features;

  const [messageIndex, setMessageIndex] = React.useState(0);
  const [particles, setParticles] = React.useState<any[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const generated = Array.from({ length: 8 }).map((_, i) => ({
      size: Math.random() * 5 + 3,
      left: Math.random() * 100,
      duration: Math.random() * 3 + 3,
      delay: i * 0.5,
    }));
    setParticles(generated);
  }, []);

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-radial from-[#1E34A0] to-[#1C212C] text-white py-16 px-6 sm:px-10"
    >
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-900 rounded-full blur-3xl opacity-30 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <motion.div
          className="flex-1 max-w-xl space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold leading-snug">
            {translations?.title}
          </h2>
          <p className="text-lg leading-relaxed text-gray-300">
            {translations?.description}
          </p>
          <Link
            href="https://www.zhan.care/"
            className="inline-block bg-blue-800 hover:bg-blue-900 transition-colors px-6 py-3 rounded-lg font-semibold text-white shadow-md"
            aria-label="Go to main website"
          >
            {translations?.buttonText}
          </Link>

          <div className="space-y-5 pt-4">
            {translations?.featuresList?.map((feature, index) => {
              const Icon = iconMap[index % iconMap.length];
              return (
                <motion.div
                  key={index}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <Icon className="w-6 h-6 text-blue-300 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className="flex-1 flex justify-center items-center relative"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-30 blur-md z-0"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: `${p.left}%`,
                bottom: "20px",
                animationName: "rise",
                animationDuration: `${p.duration}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}

          <div className="absolute bottom-2 w-52 h-10 rounded-full z-0 bg-gradient-to-t from-blue-600/50 to-transparent blur-[6px] animate-pulse-platform shadow-xl" />

          <div className="relative z-10 animate-floating-strong">
            <div className="absolute -top-6 sm:-top-10 left-1/2 transform -translate-x-1/2 bg-white text-black text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md flex items-center gap-2 max-w-[85vw] sm:max-w-none bubble-speech">
              <span className="opacity-70">{messages[messageIndex]}</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-black rounded-full animate-typing" />
                <div className="w-2 h-2 bg-black rounded-full animate-typing delay-200" />
                <div className="w-2 h-2 bg-black rounded-full animate-typing delay-400" />
              </div>
            </div>

            <Image
              src={robotImage}
              alt="AI Assistant Robot"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes floating-strong {
          0% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-16px) translateX(-6px);
          }
          50% {
            transform: translateY(-24px) translateX(0px);
          }
          75% {
            transform: translateY(-16px) translateX(6px);
          }
          100% {
            transform: translateY(0px) translateX(0px);
          }
        }

        @keyframes pulse-platform {
          0% {
            transform: scaleX(1) scaleY(1);
            opacity: 0.4;
          }
          50% {
            transform: scaleX(1.1) scaleY(1.2);
            opacity: 0.6;
          }
          100% {
            transform: scaleX(1) scaleY(1);
            opacity: 0.4;
          }
        }

        @keyframes typing {
          0% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.2;
          }
        }

        @keyframes rise {
          0% {
            transform: translateY(0);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-120px);
            opacity: 0;
          }
        }

        .animate-floating-strong {
          animation: floating-strong 5s ease-in-out infinite;
        }

        .animate-pulse-platform {
          animation: pulse-platform 3s ease-in-out infinite;
        }

        .animate-typing {
          animation: typing 1.5s infinite;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-400 {
          animation-delay: 0.4s;
        }

        .bubble-speech::after {
          content: "";
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: white transparent transparent transparent;
        }
      `}</style>
    </section>
  );
};

export default Features;
