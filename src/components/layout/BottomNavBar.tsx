"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Stethoscope, History, FileText, UserRound, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { isStandalone, isMobileUserAgent, STANDALONE_GATE_DISMISSED_EVENT } from "@/lib/pwaDetect";
import ru from "@/locales/ru.json";
import en from "@/locales/en.json";
import kz from "@/locales/kz.json";
import uz from "@/locales/uz.json";

// Mirrors StandaloneWelcomeGate.tsx's DISMISS_KEY — once that gate is
// dismissed (or was never shown, e.g. a logged-in user), the bottom nav
// behaves normally; while it's actually covering the homepage, this bar
// would just duplicate its "Войти" action.
const WELCOME_DISMISS_KEY = "zhancare_standalone_welcome_dismissed";

const ACCENT = "#3772ff";

// Dashboards doctor/nurse/admin already have their own sidebar nav (out of
// scope here — this bar is specifically the patient/guest mobile scenario),
// full-screen video/login flows where a persistent bottom bar would just be
// in the way.
const HIDDEN_PREFIXES = [
  "/doctor",
  "/nurse",
  "/admin",
  "/login",
  "/video-call",
  "/video",
  "/telegram-auth",
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user, isPatient, isDoctor, isNurse, isAdmin, loading, openAuth } = useAuth();
  const { language } = useLanguage();
  const t = (language === "en" ? en : language === "kz" ? kz : language === "uz" ? uz : ru).bottomNav;

  const [welcomeGateShowing, setWelcomeGateShowing] = useState(false);
  useEffect(() => {
    const gateCouldApply = isStandalone() && isMobileUserAgent();
    const dismissed = sessionStorage.getItem(WELCOME_DISMISS_KEY) === "true";
    setWelcomeGateShowing(gateCouldApply && !dismissed);

    const handleDismissed = () => setWelcomeGateShowing(false);
    window.addEventListener(STANDALONE_GATE_DISMISSED_EVENT, handleDismissed);
    return () => window.removeEventListener(STANDALONE_GATE_DISMISSED_EVENT, handleDismissed);
  }, [pathname]);

  if (loading) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname === "/" && !user && welcomeGateShowing) return null;
  // Logged in but not a patient (doctor/nurse/admin viewing a public page,
  // e.g. the homepage) — their own cabinets already have navigation for
  // this; the patient tab set below wouldn't make sense for them.
  if (user && !isPatient) return null;
  // `roles` is an array, so a user can hold more than one — a patient who
  // is *also* a doctor/nurse/admin still shouldn't see the patient-only
  // tabs below, so this isn't covered by the isPatient check above.
  if (isDoctor || isNurse || isAdmin) return null;

  const tabs = user
    ? [
        { href: "/", label: t.home, Icon: Home },
        { href: "/consultation/symptoms", label: t.seeDoctor, Icon: Stethoscope },
        { href: "/patient/history", label: t.history, Icon: History },
        { href: "/patient/documents", label: t.documents, Icon: FileText },
        { href: "/patient/profile", label: t.profile, Icon: UserRound },
      ]
    : [
        { href: "/", label: t.home, Icon: Home },
        { href: "/consultation/symptoms", label: t.seeDoctor, Icon: Stethoscope },
        { href: "/specialists", label: t.specialists, Icon: FileText },
      ];

  return (
    <>
      {/* Spacer so fixed-position content below doesn't cover page content —
          renders only when the bar itself does, since they share this
          component's early returns above. */}
      <div className="md:hidden" style={{ height: `calc(4rem + env(safe-area-inset-bottom))` }} aria-hidden />
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-white border-t border-gray-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0"
              style={{ color: active ? ACCENT : "#8a8f99" }}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[11px] font-medium truncate px-0.5">{label}</span>
            </Link>
          );
        })}
        {!user && (
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-w-0"
            style={{ color: "#8a8f99" }}
          >
            <LogIn className="w-5 h-5" strokeWidth={2} />
            <span className="text-[11px] font-medium truncate px-0.5">{t.login}</span>
          </button>
        )}
      </nav>
    </>
  );
}
