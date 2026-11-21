"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Stethoscope, History, FileText, UserRound, LogIn, Users } from "lucide-react";
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

// Same gradient family as brandConfig's sidebarGradient/StandaloneWelcomeGate
// so the floating bar reads as one brand surface rather than a one-off.
const BAR_BACKGROUND =
  "linear-gradient(135deg, rgba(18,38,58,0.94) 0%, rgba(30,38,62,0.94) 25%, rgba(41,53,143,0.94) 75%, rgba(55,114,255,0.94) 100%)";
const FAB_BACKGROUND = "linear-gradient(135deg, #4A6BFF 0%, #3772ff 55%, #29358f 100%)";

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

type SideTab = { key: string; href: string; label: string; Icon: typeof Home };

function SideTabLink({ tab, active }: { tab: SideTab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 min-w-0"
    >
      {active && (
        <motion.div
          layoutId="bottomNavActivePill"
          className="absolute inset-x-2 inset-y-1 rounded-2xl bg-white/15"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <motion.span whileTap={{ scale: 0.88 }} className="relative z-10 flex flex-col items-center gap-0.5">
        <tab.Icon
          className="w-5 h-5"
          strokeWidth={active ? 2.5 : 2}
          style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.5)" }}
        />
        <span
          className="text-[10px] font-medium truncate px-0.5 max-w-[4.5rem]"
          style={{ color: active ? "#ffffff" : "rgba(255,255,255,0.5)" }}
        >
          {tab.label}
        </span>
      </motion.span>
    </Link>
  );
}

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

  // The "see a doctor" action is the app's single primary CTA (it's the
  // first button on the homepage hero) — it gets its own raised FAB in the
  // middle of the bar instead of sitting flush as just another tab.
  const primaryHref = "/consultation/symptoms";
  const primaryActive = pathname.startsWith(primaryHref);

  const leftTabs: SideTab[] = user
    ? [
        { key: "home", href: "/", label: t.home, Icon: Home },
        { key: "history", href: "/patient/history", label: t.history, Icon: History },
      ]
    : [{ key: "home", href: "/", label: t.home, Icon: Home }];

  const rightTabs: SideTab[] = user
    ? [
        { key: "documents", href: "/patient/documents", label: t.documents, Icon: FileText },
        { key: "profile", href: "/patient/profile", label: t.profile, Icon: UserRound },
      ]
    : [{ key: "specialists", href: "/specialists", label: t.specialists, Icon: Users }];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Spacer so fixed-position content below doesn't cover page content —
          renders only when the bar itself does, since they share this
          component's early returns above. */}
      <div className="md:hidden" style={{ height: `calc(5.25rem + env(safe-area-inset-bottom))` }} aria-hidden />
      <nav
        className="md:hidden fixed left-3 right-3 z-50 flex items-stretch rounded-[28px] border border-white/10 backdrop-blur-xl"
        style={{
          bottom: `calc(0.75rem + env(safe-area-inset-bottom))`,
          background: BAR_BACKGROUND,
          boxShadow:
            "0 10px 32px rgba(10,20,45,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 0 28px rgba(55,114,255,0.22)",
        }}
      >
        {leftTabs.map((tab) => (
          <SideTabLink key={tab.key} tab={tab} active={isActive(tab.href)} />
        ))}

        {/* Elevated center FAB — primary CTA */}
        <div className="relative flex flex-1 flex-col items-center justify-end min-w-0">
          <Link href={primaryHref} className="relative -mt-7 flex flex-col items-center gap-1">
            {!primaryActive && (
              <motion.div
                className="absolute top-0 w-14 h-14 rounded-full border-2 border-white/25"
                animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0, 0.45] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center w-14 h-14 rounded-full"
              style={{
                background: FAB_BACKGROUND,
                boxShadow: primaryActive
                  ? "0 6px 18px rgba(55,114,255,0.65), 0 0 0 3px rgba(255,255,255,0.55)"
                  : "0 6px 18px rgba(55,114,255,0.55), 0 0 0 3px rgba(12,20,42,0.9)",
              }}
            >
              <Stethoscope className="w-6 h-6 text-white" strokeWidth={2.3} />
            </motion.div>
            <span className="text-[10px] font-semibold text-white whitespace-nowrap">{t.seeDoctor}</span>
          </Link>
        </div>

        {rightTabs.map((tab) => (
          <SideTabLink key={tab.key} tab={tab} active={isActive(tab.href)} />
        ))}

        {!user && (
          <button
            type="button"
            onClick={() => openAuth("login")}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 min-w-0"
          >
            <motion.span whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-0.5">
              <LogIn className="w-5 h-5" strokeWidth={2} style={{ color: "rgba(255,255,255,0.5)" }} />
              <span className="text-[10px] font-medium truncate px-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t.login}
              </span>
            </motion.span>
          </button>
        )}
      </nav>
    </>
  );
}
