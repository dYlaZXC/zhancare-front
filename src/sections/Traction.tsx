"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faRocket,
  faTrophy,
  faGlobe,
  faMedal,
  faLocationDot,
  faMobileScreen,
  faHospital,
  faHandshake,
  type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

interface Milestone {
  date: string;
  title: string;
  items?: string[];
  isCurrent?: boolean;
  isFuture?: boolean;
  icon: IconDefinition;
}

const data: Record<"ru" | "en" | "kz", { heading: string; sub: string; quote: string; quoteTranslation: string; milestones: Milestone[] }> = {
  ru: {
    heading: "Наш путь",
    sub: "От идеи — до продукта в 3 клиниках Казахстана",
    quote: "Per aspera ad astra",
    quoteTranslation: "Через тернии — к звёздам",
    milestones: [
      {
        date: "Июнь 2023",
        icon: faLightbulb,
        title: "Идея и запуск проекта; разработка ИИ",
      },
      {
        date: "Январь 2024",
        icon: faRocket,
        title: "Пилотный запуск в сёлах Акмол, Жибек Жолы, Кощи",
      },
      {
        date: "Апрель 2025",
        icon: faTrophy,
        title: "1-е место на национальной выставке Enactus 2025 среди всех вузов Казахстана",
        items: ["+500 участников"],
      },
      {
        date: "Сентябрь 2025",
        icon: faGlobe,
        title: "Полуфинал Enactus World Cup 2025 (Бангкок)",
        items: [
          "Участие команды ZhanCare в парламентской сессии Мажилиса РК по развитию ИИ, инноваций и молодёжного предпринимательства",
        ],
      },
      {
        date: "Октябрь 2025",
        icon: faMedal,
        title: "Победитель AI-Sana — «Лучший ИИ-проект в здравоохранении»",
      },
      {
        date: "Сейчас",
        icon: faLocationDot,
        title: "Продукт работает в 3 клиниках: Ayala, BN, Dariger Plus",
        items: [
          "1 200+ пользователей",
          "100+ пациентов — казахстанцы, проживающие за рубежом",
          "Астана и Степногорск",
        ],
        isCurrent: true,
      },
      {
        date: "Q2 2026",
        icon: faMobileScreen,
        title: "Запуск мобильного приложения для iOS и Android",
        items: [
          "Запись к врачу в 2 касания",
          "Push-уведомления и напоминания",
          "Личный кабинет пациента",
        ],
        isFuture: true,
      },
      {
        date: "Q3 2026",
        icon: faHospital,
        title: "Масштабирование до 20+ клиник в 5 городах Казахстана",
        items: [
          "Алматы, Астана, Шымкент, Актобе, Атырау",
          "5 000+ активных пользователей",
        ],
        isFuture: true,
      },
      {
        date: "2027",
        icon: faHandshake,
        title: "Выход на рынки СНГ и интеграция со страховыми компаниями",
        items: [
          "Кыргызстан, Узбекистан",
          "Прямые договоры со страховщиками",
          "B2B-решения для корпоративных клиентов",
        ],
        isFuture: true,
      },
    ],
  },
  en: {
    heading: "Our Journey",
    sub: "From idea to a live product in 3 clinics across Kazakhstan",
    quote: "Per aspera ad astra",
    quoteTranslation: "Through hardships to the stars",
    milestones: [
      {
        date: "June 2023",
        icon: faLightbulb,
        title: "Project idea & launch; AI development begins",
      },
      {
        date: "January 2024",
        icon: faRocket,
        title: "Pilot launch in villages Akmol, Zhibek Zholy, Koshi",
      },
      {
        date: "April 2025",
        icon: faTrophy,
        title: "1st place at the Enactus 2025 national exhibition across all universities of Kazakhstan",
        items: ["+500 participants"],
      },
      {
        date: "September 2025",
        icon: faGlobe,
        title: "Semifinal — Enactus World Cup 2025 (Bangkok)",
        items: [
          "ZhanCare team participated in the Mazhilis parliamentary session on AI, innovation & youth entrepreneurship",
        ],
      },
      {
        date: "October 2025",
        icon: faMedal,
        title: "Winner of AI-Sana — 'Best AI project in healthcare'",
      },
      {
        date: "Now",
        icon: faLocationDot,
        title: "Live in 3 clinics: Ayala, BN, Dariger Plus",
        items: [
          "1,200+ users",
          "100+ patients — Kazakhstanis living abroad",
          "Astana & Stepnogorsk",
        ],
        isCurrent: true,
      },
      {
        date: "Q2 2026",
        icon: faMobileScreen,
        title: "Mobile app launch for iOS & Android",
        items: [
          "Book a doctor in 2 taps",
          "Push notifications & reminders",
          "Personal patient dashboard",
        ],
        isFuture: true,
      },
      {
        date: "Q3 2026",
        icon: faHospital,
        title: "Scale to 20+ clinics across 5 cities in Kazakhstan",
        items: [
          "Almaty, Astana, Shymkent, Aktobe, Atyrau",
          "5,000+ active users",
        ],
        isFuture: true,
      },
      {
        date: "2027",
        icon: faHandshake,
        title: "Expand to CIS markets & integrate with insurance providers",
        items: [
          "Kyrgyzstan, Uzbekistan",
          "Direct insurance company contracts",
          "B2B solutions for corporate clients",
        ],
        isFuture: true,
      },
    ],
  },
  kz: {
    heading: "Біздің жол",
    sub: "Идеядан Қазақстанның 3 клиникасындағы өнімге дейін",
    quote: "Per aspera ad astra",
    quoteTranslation: "Қиындықтар арқылы — жұлдыздарға",
    milestones: [
      {
        date: "Маусым 2023",
        icon: faLightbulb,
        title: "Жоба идеясы және іске қосылуы; ЖИ әзірлеу",
      },
      {
        date: "Қаңтар 2024",
        icon: faRocket,
        title: "Ақмол, Жібек Жолы, Қощы ауылдарында пилоттық іске қосу",
      },
      {
        date: "Сәуір 2025",
        icon: faTrophy,
        title: "Қазақстанның барлық ЖОО арасында Enactus 2025 ұлттық көрмесінде 1-орын",
        items: ["+500 қатысушы"],
      },
      {
        date: "Қыркүйек 2025",
        icon: faGlobe,
        title: "Enactus World Cup 2025 жартыфиналы (Бангкок)",
        items: [
          "ZhanCare командасының ЖИ, инновация және жастар кәсіпкерлігі бойынша Мәжіліс парламенттік сессиясына қатысуы",
        ],
      },
      {
        date: "Қазан 2025",
        icon: faMedal,
        title: "AI-Sana жеңімпазы — «Денсаулық сақтаудағы үздік ЖИ-жоба»",
      },
      {
        date: "Қазір",
        icon: faLocationDot,
        title: "3 клиникада жұмыс істейді: Ayala, BN, Dariger Plus",
        items: [
          "1 200+ пайдаланушы",
          "100+ пациент — шетелде тұратын қазақстандықтар",
          "Астана және Степногорск",
        ],
        isCurrent: true,
      },
      {
        date: "Q2 2026",
        icon: faMobileScreen,
        title: "iOS және Android үшін мобильді қосымшаны іске қосу",
        items: [
          "2 түртумен дәрігерге жазылу",
          "Push-хабарламалар мен еске салулар",
          "Пациенттің жеке кабинеті",
        ],
        isFuture: true,
      },
      {
        date: "Q3 2026",
        icon: faHospital,
        title: "Қазақстанның 5 қаласындағы 20+ клиникаға дейін кеңейту",
        items: [
          "Алматы, Астана, Шымкент, Ақтөбе, Атырау",
          "5 000+ белсенді пайдаланушы",
        ],
        isFuture: true,
      },
      {
        date: "2027",
        icon: faHandshake,
        title: "ТМД нарығына шығу және сақтандыру компанияларымен интеграция",
        items: [
          "Қырғызстан, Өзбекстан",
          "Сақтандырушылармен тікелей келісімшарттар",
          "Корпоративтік клиенттерге арналған B2B-шешімдер",
        ],
        isFuture: true,
      },
    ],
  },
};

// Deterministic star generator — no hydration mismatch
function generateStars(count: number, seed = 42) {
  const stars: { x: number; y: number; r: number; op: number; dur: number }[] = [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      r: rand() * 1.6 + 0.4,
      op: rand() * 0.5 + 0.3,
      dur: rand() * 3 + 2,
    });
  }
  return stars;
}

const STARS = generateStars(160);

export function Traction() {
  const { language } = useLanguage();
  const t = useMemo(() => data[language] ?? data.ru, [language]);

  return (
    <section className="relative py-24 overflow-hidden" id="traction"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0a0e2a 0%, #050810 60%, #000 100%)" }}
    >
      {/* ── Starry sky ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              opacity: s.op,
              animation: `twinkle ${s.dur}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.07) % s.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Nebula glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full bg-[#1a2fff]/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/6 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-[#0038ff]/5 blur-[80px] pointer-events-none" />

      <style>{`
        @keyframes twinkle {
          from { opacity: var(--op-from, 0.2); transform: scale(1); }
          to   { opacity: var(--op-to, 0.9);   transform: scale(1.3); }
        }
      `}</style>

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: -24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t.heading}
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{t.sub}</p>
        </motion.div>

        {/* Quote */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="inline-flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            <span className="text-xl md:text-2xl font-bold tracking-widest text-white/90 italic">
              {t.quote}
            </span>
            <span className="text-sm text-[#3772ff] font-medium tracking-wide">
              — {t.quoteTranslation}
            </span>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line — desktop only */}
          <div className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#3772ff]/50 to-transparent" />

          <div className="flex flex-col gap-12">
            {t.milestones.map((m, i) => {
              const isRight = i % 2 === 0; // even → card on right, label on left

              return (
                <motion.div
                  key={i}
                  className="relative flex flex-col md:flex-row items-center gap-6 md:gap-0"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                >
                  {/* Left half — date label (desktop, even rows) or card (desktop, odd rows) */}
                  <div className={`hidden md:flex w-1/2 ${isRight ? "justify-end pr-10" : "justify-start pl-10"}`}>
                    {isRight ? (
                      // Even: show date label on left
                      <p className="text-white font-semibold text-sm tracking-widest uppercase text-right">
                        {m.date}
                      </p>
                    ) : (
                      // Odd: show card on left
                      <MilestoneCard m={m} />
                    )}
                  </div>

                  {/* Center dot */}
                  <div className="relative z-10 flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
                    {m.isCurrent ? (
                      <span className="relative flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3772ff] opacity-70" />
                        <span className="relative flex h-5 w-5 rounded-full bg-[#3772ff] items-center justify-center shadow-[0_0_16px_rgba(55,114,255,0.9)]">
                          <span className="h-2 w-2 rounded-full bg-white" />
                        </span>
                      </span>
                    ) : m.isFuture ? (
                      <span className="flex h-4 w-4 rounded-full border-2 border-dashed border-white/30 bg-[#050810]" />
                    ) : (
                      <span className="flex h-4 w-4 rounded-full border-2 border-[#3772ff] bg-[#050810] shadow-[0_0_8px_rgba(55,114,255,0.5)]" />
                    )}
                  </div>

                  {/* Right half — card (desktop, even rows) or date label (desktop, odd rows) */}
                  <div className={`hidden md:flex w-1/2 justify-start pl-10`}>
                    {isRight ? (
                      // Even: show card on right
                      <MilestoneCard m={m} />
                    ) : (
                      // Odd: show date label on right
                      <p className="text-white font-semibold text-sm tracking-widest uppercase">
                        {m.date}
                      </p>
                    )}
                  </div>

                  {/* Mobile: full-width card */}
                  <div className="md:hidden w-full">
                    <MilestoneCard m={m} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MilestoneCard({ m }: { m: Milestone }) {
  return (
    <div
      className={`relative rounded-2xl p-5 max-w-sm w-full backdrop-blur-md transition-all duration-300
        ${m.isCurrent
          ? "bg-gradient-to-br from-[#1a2fff]/25 to-[#0010a0]/20 border border-[#3772ff]/60 shadow-[0_0_30px_rgba(55,114,255,0.3)]"
          : m.isFuture
          ? "bg-white/[0.02] border border-dashed border-white/20 opacity-70 hover:opacity-90 hover:border-white/35 transition-all duration-300"
          : "bg-white/[0.04] border border-white/10 hover:border-[#3772ff]/40 hover:bg-white/[0.07] hover:shadow-[0_0_20px_rgba(55,114,255,0.15)]"
        }
      `}
    >
      {/* Badges */}
      {m.isCurrent && (
        <span className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#3772ff] text-white shadow-[0_2px_12px_rgba(55,114,255,0.6)]">
          Live
        </span>
      )}
      {m.isFuture && (
        <span className="absolute -top-3 left-4 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 text-white/60">
          Roadmap
        </span>
      )}

      {/* Date chip — shown inside card on mobile, hidden on desktop (shown outside) */}
      <div className="md:hidden mb-3">
        <span className="text-[10px] font-bold tracking-widest uppercase text-white/70">
          {m.date}
        </span>
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#3772ff]/20 border border-[#3772ff]/30 flex items-center justify-center mt-0.5">
          <FontAwesomeIcon icon={m.icon} className="text-[#3772ff] text-sm" />
        </div>
        <p className="text-white font-semibold text-sm leading-snug">{m.title}</p>
      </div>

      {/* Bullet items */}
      {m.items && m.items.length > 0 && (
        <ul className="mt-3 space-y-1.5 pl-9">
          {m.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-400 text-xs leading-relaxed">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#3772ff]/70 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
