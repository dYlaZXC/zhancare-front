"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import robotImage from "@/assets/robosit.png";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import { ShieldCheck, Stethoscope, HeartPulse, Hospital, ArrowRight, Sparkles } from "lucide-react";

const iconMap = [ShieldCheck, Stethoscope, HeartPulse, Hospital];

const Features = () => {
  const { language } = useLanguage();
  const [hoveredFeature, setHoveredFeature] = React.useState<number | null>(null);

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.features;
      case "kz":
        return kz.features;
      case "en":
        return en.features;
      default:
        return en.features;
    }
  };

  const translations = getTranslations();

  // Get chat messages based on language
  const getMessages = () => {
    switch (language) {
      case "ru":
        return [
          "Ищу информацию по симптомам...",
          "Поиск завершен...",
          "Передаю информацию врачу..."
        ];
      case "kz":
        return [
          "Симптомдар бойынша ақпарат іздеп жатырмын...",
          "Іздеу аяқталды...",
          "Дәрігерге ақпарат жіберемін..."
        ];
      case "en":
        return [
          "Searching for symptom information...",
          "Search completed...",
          "Transmitting information to doctor..."
        ];
      default:
        return [
          "Searching for symptom information...",
          "Search completed...",
          "Transmitting information to doctor..."
        ];
    }
  };

  const messages = getMessages();

  const [messageIndex, setMessageIndex] = React.useState(0);
  const [particles, setParticles] = React.useState<any[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [messages.length]);

  React.useEffect(() => {
    const generated = Array.from({ length: 12 }).map((_, i) => ({
      size: Math.random() * 6 + 2,
      left: Math.random() * 100,
      duration: Math.random() * 4 + 2,
      delay: i * 0.3,
    }));
    setParticles(generated);
  }, []);

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-br from-[#2956bf] via-[#283353] to-[#1e263e] text-white py-20 px-6 sm:px-10"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3772ff]/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-[#2c5bcc]/20 rounded-full blur-3xl animate-pulse-slow-delayed" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#2956bf]/25 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(55,114,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(55,114,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-16">
          {/* Left Content Section */}
          <motion.div
            className="flex-1 max-w-xl space-y-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-[#ebf1ff]/10 backdrop-blur-sm border border-[#ebf1ff]/20 rounded-full px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="w-4 h-4 text-[#3772ff]" />
              <span className="bg-gradient-to-r from-[#ebf1ff] to-[#e1eaff] bg-clip-text text-transparent">
                AI-Powered Healthcare
              </span>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-[#ebf1ff] to-[#e1eaff] bg-clip-text text-transparent">
                {translations?.title}
              </span>
            </h2>

            <p className="text-lg leading-relaxed text-[#dfe0e5]">
              {translations?.description}
            </p>

            <Link
              href="https://www.zhan.care/"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#3772ff] to-[#3267e6] hover:from-[#3267e6] hover:to-[#2c5bcc] active:from-[#2c5bcc] active:to-[#2956bf] transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-white shadow-lg shadow-[#3772ff]/30 hover:shadow-xl hover:shadow-[#3772ff]/40 hover:-translate-y-0.5"
              aria-label="Go to main website"
            >
              {translations?.buttonText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>

            {/* Premium Feature Cards */}
            <div className="space-y-4 pt-6">
              {translations?.featuresList?.map((feature, index) => {
                const Icon = iconMap[index % iconMap.length];
                const isHovered = hoveredFeature === index;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    viewport={{ once: true }}
                    onMouseEnter={() => setHoveredFeature(index)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className="group relative"
                  >
                    <motion.div
                      className={`
                        relative flex items-start gap-4 p-5 rounded-2xl
                        bg-gradient-to-br from-[#283353]/40 to-[#1e263e]/40
                        backdrop-blur-sm border transition-all duration-300
                        ${isHovered
                          ? 'border-[#3772ff]/60 shadow-lg shadow-[#3772ff]/20'
                          : 'border-[#ebf1ff]/10 hover:border-[#ebf1ff]/20'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Icon Container */}
                      <motion.div
                        className={`
                          flex items-center justify-center w-12 h-12 rounded-xl
                          bg-gradient-to-br transition-all duration-300
                          ${isHovered
                            ? 'from-[#3772ff] to-[#2c5bcc] shadow-lg shadow-[#3772ff]/30'
                            : 'from-[#283353] to-[#1e263e] border border-[#ebf1ff]/20'
                          }
                        `}
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className={`w-6 h-6 transition-colors duration-300 ${isHovered ? 'text-white' : 'text-[#ebf1ff]'}`} />
                      </motion.div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-[#ebf1ff] transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-[#bcc0ca] leading-relaxed">
                          {feature.description}
                        </p>
                      </div>

                      {/* Hover Glow Effect */}
                      {isHovered && (
                        <motion.div
                          layoutId="feature-glow"
                          className="absolute inset-0 bg-gradient-to-r from-[#3772ff]/10 to-[#2c5bcc]/10 rounded-2xl -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Right Robot Section */}
          <motion.div
            className="flex-1 flex justify-center items-center relative min-h-[600px] md:min-h-[700px]"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Animated Particles */}
            {particles.map((p, i) => (
              <div
                key={i}
                className="absolute bg-gradient-to-br from-[#ebf1ff] to-[#e1eaff] rounded-full opacity-40 blur-sm z-0"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  left: `${p.left}%`,
                  bottom: `${20 + (i % 3) * 15}%`,
                  animationName: "rise-premium",
                  animationDuration: `${p.duration}s`,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}

            {/* Premium Platform Glow - Larger */}
            <div className="absolute bottom-12 md:bottom-16 w-80 md:w-96 h-16 rounded-full z-0">
              <div className="absolute inset-0 bg-gradient-to-t from-[#3772ff]/70 via-[#3772ff]/40 to-transparent blur-2xl animate-pulse-platform-premium" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2c5bcc]/50 to-transparent blur-xl animate-pulse-platform-premium-delayed" />
            </div>

            {/* Robot Container - Much Larger */}
            <div className="relative z-10 animate-floating-premium w-full flex justify-center">
              {/* Premium Speech Bubble */}
              <motion.div
                className="absolute -top-12 sm:-top-16 md:-top-20 left-1/2 transform -translate-x-1/2 min-w-[300px] sm:min-w-[350px] max-w-[90vw] sm:max-w-none z-20"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <div className="relative bg-gradient-to-br from-[#ebf1ff] to-[#e1eaff] text-[#1b1b1b] text-sm sm:text-base px-6 py-4 rounded-2xl shadow-2xl border border-white/40 backdrop-blur-sm bubble-speech-premium">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#3772ff] animate-pulse flex-shrink-0" />
                    <span className="font-medium flex-1">{messages[messageIndex]}</span>
                    <div className="flex space-x-1.5 flex-shrink-0">
                      <div className="w-2.5 h-2.5 bg-[#3772ff] rounded-full animate-typing-premium" />
                      <div className="w-2.5 h-2.5 bg-[#3772ff] rounded-full animate-typing-premium delay-200" />
                      <div className="w-2.5 h-2.5 bg-[#3772ff] rounded-full animate-typing-premium delay-400" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Robot Image with Glow - Significantly Larger */}
              <div className="relative max-w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3772ff]/20 to-[#2c5bcc]/20 blur-3xl rounded-full scale-110" />
                <Image
                  src={robotImage}
                  alt="AI Assistant Robot"
                  width={600}
                  height={600}
                  className="object-contain relative z-10 w-full h-auto max-w-[500px] sm:max-w-[550px] md:max-w-[600px]"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floating-premium {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) translateX(-8px) rotate(-1deg);
          }
          50% {
            transform: translateY(-28px) translateX(0px) rotate(0deg);
          }
          75% {
            transform: translateY(-20px) translateX(8px) rotate(1deg);
          }
        }

        @keyframes pulse-platform-premium {
          0%, 100% {
            transform: scaleX(1) scaleY(1);
            opacity: 0.5;
          }
          50% {
            transform: scaleX(1.15) scaleY(1.3);
            opacity: 0.7;
          }
        }

        @keyframes pulse-platform-premium-delayed {
          0%, 100% {
            transform: scaleX(1) scaleY(1);
            opacity: 0.3;
          }
          50% {
            transform: scaleX(1.2) scaleY(1.4);
            opacity: 0.5;
          }
        }

        @keyframes typing-premium {
          0%, 100% {
            opacity: 0.3;
            transform: translateY(0px);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }

        @keyframes rise-premium {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-150px) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.15);
          }
        }

        .animate-floating-premium {
          animation: floating-premium 6s ease-in-out infinite;
        }

        .animate-pulse-platform-premium {
          animation: pulse-platform-premium 3s ease-in-out infinite;
        }

        .animate-pulse-platform-premium-delayed {
          animation: pulse-platform-premium-delayed 3s ease-in-out infinite 0.5s;
        }

        .animate-typing-premium {
          animation: typing-premium 1.4s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 8s ease-in-out infinite 2s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-400 {
          animation-delay: 0.4s;
        }

        .bubble-speech-premium::after {
          content: "";
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-width: 8px;
          border-style: solid;
          border-color: #ebf1ff transparent transparent transparent;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
      `}</style>
    </section>
  );
};

export default Features;
