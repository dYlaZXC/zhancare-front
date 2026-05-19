"use client";
import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";
import SocialX from "@/assets/social-x.svg";
import SocialInsta from "@/assets/social-insta.svg";
import SocialLinkedin from "@/assets/social-linkedin.svg";
import SocialPin from "@/assets/social-pin.svg";
import SocialYoutube from "@/assets/social-youtube.svg";
import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";
import { MapPin, Mail, Phone, ArrowUpRight, Heart, Send, TrendingUp, Users, Stethoscope, CheckCircle, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "react-toastify";
import PdfViewerModal from "@/components/auth/PdfViewerModal";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

export const Footer = () => {
  const { language } = useLanguage();
  const { appLogo, brand } = useBrand();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const controls = useAnimationControls();

  // PDF Modal state
  const [pdfModal, setPdfModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: "",
    title: "",
  });

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.footer;
      case "kz":
        return kz.footer;
      case "en":
        return en.footer;
      default:
        return en.footer;
    }
  };

  const translations = getTranslations();

  const [platformStats, setPlatformStats] = useState({ doctors: "25+", patients: "150+", consultations: "1,000+" });

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
    fetch(`${API}/public/stats/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K+` : String(n);
        setPlatformStats({ doctors: fmt(data.doctors), patients: fmt(data.patients), consultations: fmt(data.consultations) });
      })
      .catch(() => {});
  }, []);

  // Section IDs mapping for navigation
  const sectionIds: { [key: string]: string } = {
    "Home": "hero",
    "Главная": "hero",
    "Басты бет": "hero",
    "About": "hero",
    "О нас": "hero",
    "Жоба туралы": "hero",
    "AI Chat": "ai-chat",
    "ЧатсИИ": "ai-chat",
    "AI-мен сөйлесу": "ai-chat",
    "Services": "services",
    "Услуги": "services",
    "Қызметтер": "services",
    "Features": "modules",
    "Возможности": "modules",
    "Модульдер": "modules",
    "Contacts": "contacts",
    "Контакты": "contacts",
    "Байланыс": "contacts",
  };

  // Handle scroll to section
  const handleScrollToSection = (linkText: string) => {
    const sectionId = sectionIds[linkText];
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 80;
        const elementPosition = element.offsetTop - headerHeight;

        window.scrollTo({
          top: elementPosition,
          behavior: "smooth"
        });
      }
    }
  };

  // Helper function to get PDF path based on language
  const getPdfPath = (docType: string) => {
    const langSuffix = language === "ru" ? "rus" : language === "kz" ? "kaz" : "eng";
    return `/docs/footer/${docType}_${langSuffix}.pdf`;
  };

  // Helper function to open PDF modal
  const openPdfModal = (docType: string, title: string) => {
    setPdfModal({
      isOpen: true,
      url: getPdfPath(docType),
      title,
    });
  };

  // Helper function to close PDF modal
  const closePdfModal = () => {
    setPdfModal({
      isOpen: false,
      url: "",
      title: "",
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error(translations.newsletter.errorMessage);
      controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Telegram Bot API configuration
      const TELEGRAM_BOT_TOKEN = "8364913089:AAG5rK07-jHVgf1Uspgyf1sgXnkrKXH0ngw";
      const TELEGRAM_CHAT_ID = "@zhancareai";

      // Format message for Telegram
      const message = `
📧 *Новая подписка на рассылку*

✉️ *Email:* ${email}
📍 *Источник:* Footer Newsletter
⏰ *Время:* ${new Date().toLocaleString('ru-RU')}
      `.trim();

      // Send to Telegram
      const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

      const response = await fetch(telegramUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          message_thread_id: 5, // Topic 5 = Newsletter
        }),
      });

      if (response.ok) {
        toast.success(translations.newsletter.successMessage);
        setEmail("");
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const stats = [
    { value: platformStats.patients, label: translations.stats.patients, icon: Users },
    { value: platformStats.doctors, label: translations.stats.doctors, icon: Stethoscope },
    { value: platformStats.consultations, label: translations.stats.consultations, icon: TrendingUp },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-[#0f0f1e] via-[#1a1a2e] to-[#16213e] text-gray-400 text-xs sm:text-sm lg:text-base py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Wave Separator */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none">
        <svg className="relative block w-full h-12 sm:h-16 md:h-20" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <motion.path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="#1D1D2F"
            animate={{
              d: [
                "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
                "M321.39,66.44c58-10.79,114.16-40.13,172-51.86,82.39-16.72,168.19-7.73,250.45,9.61C823.78,41,906.67,82,985.66,102.83c70.05,18.48,146.53,36.09,214.34,13V0H0V37.35A600.21,600.21,0,0,0,321.39,66.44Z",
                "M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z",
              ]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Stats Bar */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl mb-16"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <motion.div
                        className="text-3xl lg:text-4xl font-bold text-white mb-2"
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                    <stat.icon className="w-12 h-12 text-blue-400/50" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-7xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-14">

            {/* Brand Section */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="space-y-6 lg:space-y-8">
                {/* Logo */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-48 sm:w-56 md:w-64"
                >
                  <Image
                    src={appLogo}
                    alt={brand.name + " Logo"}
                    className="w-full h-auto object-contain"
                  />
                </motion.div>

                {/* Company Description */}
                <div className="space-y-4">
                  <p className="text-gray-400 text-base leading-relaxed max-w-md">
                    {translations.companyTagline}
                  </p>

                  <motion.a
                    href="#hero"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm sm:text-base group transition-all duration-300"
                    whileHover={{ x: 5 }}
                  >
                    {translations.learnMore}
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                  </motion.a>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <motion.a
                    href={`mailto:${translations.contact.email}`}
                    className="flex items-center gap-3 text-gray-400 hover:text-blue-400 text-sm transition-colors duration-300 group"
                    whileHover={{ x: 5 }}
                  >
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    {translations.contact.email}
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  {translations.navigation.title}
                  <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                </h3>
                <nav className="space-y-2">
                  {translations.navigation.links.map((link, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleScrollToSection(link)}
                      className="w-full text-left block text-gray-400 hover:text-blue-400 text-sm transition-all duration-300 group flex items-center gap-2 cursor-pointer bg-transparent border-0"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-3 h-3 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                      <span className="border-b border-transparent group-hover:border-blue-400/50 transition-colors duration-300">
                        {link}
                      </span>
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Medical hub links */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  Медицина
                  <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                </h3>
                <nav className="space-y-2">
                  {[
                    { href: "/symptoms",                            label: "Симптомы" },
                    { href: "/specialists",                         label: "Специалисты" },
                    { href: "/almaty",                              label: "Врачи в Алматы" },
                    { href: "/almaty/specialists/kardiolog",        label: "Кардиолог в Алматы" },
                    { href: "/almaty/specialists/pediatr",          label: "Педиатр в Алматы" },
                    { href: "/almaty/symptoms/golovnaya-bol",       label: "Головная боль в Алматы" },
                  ].map(({ href, label }) => (
                    <motion.a
                      key={href}
                      href={href}
                      className="block text-gray-400 hover:text-blue-400 text-sm transition-all duration-300 group flex items-center gap-2"
                      whileHover={{ x: 5 }}
                    >
                      <CheckCircle className="w-3 h-3 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                      <span className="border-b border-transparent group-hover:border-blue-400/50 transition-colors duration-300">
                        {label}
                      </span>
                    </motion.a>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Legal Links */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="space-y-4">
                <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
                  {translations.legal.title}
                  <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
                </h3>
                <nav className="space-y-2">
                  <motion.button
                    onClick={() => openPdfModal("data_processing_policy", translations.legal.dataProcessing)}
                    className="w-full text-left block text-gray-400 hover:text-blue-400 text-sm transition-all duration-300 group flex items-center gap-2 cursor-pointer bg-transparent border-0"
                    whileHover={{ x: 5 }}
                  >
                    <FileText className="w-3 h-3 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                    <span className="border-b border-transparent group-hover:border-blue-400/50 transition-colors duration-300">
                      {translations.legal.dataProcessing}
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={() => openPdfModal("offer_dmu", translations.legal.offer)}
                    className="w-full text-left block text-gray-400 hover:text-blue-400 text-sm transition-all duration-300 group flex items-center gap-2 cursor-pointer bg-transparent border-0"
                    whileHover={{ x: 5 }}
                  >
                    <FileText className="w-3 h-3 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                    <span className="border-b border-transparent group-hover:border-blue-400/50 transition-colors duration-300">
                      {translations.legal.offer}
                    </span>
                  </motion.button>

                  <motion.button
                    onClick={() => openPdfModal("terms_of_use", translations.legal.terms)}
                    className="w-full text-left block text-gray-400 hover:text-blue-400 text-sm transition-all duration-300 group flex items-center gap-2 cursor-pointer bg-transparent border-0"
                    whileHover={{ x: 5 }}
                  >
                    <FileText className="w-3 h-3 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
                    <span className="border-b border-transparent group-hover:border-blue-400/50 transition-colors duration-300">
                      {translations.legal.terms}
                    </span>
                  </motion.button>
                </nav>
              </div>
            </motion.div>

            {/* Newsletter */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="relative">
                {/* Glassmorphic Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 rounded-2xl blur-xl" />

                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all duration-300">
                  <div className="space-y-4">
                    {/* Title with Icon */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl">
                        <Mail className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold">
                          {translations.newsletter.title}
                        </h3>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {translations.newsletter.description}
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Form */}
                    <motion.form
                      onSubmit={handleNewsletterSubmit}
                      animate={controls}
                      className="relative"
                    >
                      <div className="relative">
                        {/* Glow Effect on Focus */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition duration-500" />

                        <div className="relative flex gap-2 group">
                          <div className="relative flex-1">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder={translations.newsletter.placeholder}
                              className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/[0.15] transition-all duration-300"
                              disabled={isSubmitting}
                            />
                          </div>
                          <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            className="relative px-6 py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            <div className="relative flex items-center gap-2">
                              {isSubmitting ? (
                                <motion.div
                                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                              ) : (
                                <>
                                  <Send className="w-5 h-5" />
                                  <span className="hidden sm:inline">{translations.newsletter.button}</span>
                                </>
                              )}
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </motion.form>

                    {/* Social Links */}
                    <div className="pt-2 border-t border-white/10">
                      <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                        {translations.social.title}
                      </h4>
                      <div className="flex items-center gap-2.5">
                        {[
                          { Icon: SocialX,        label: "X (Twitter)" },
                          { Icon: SocialInsta,    label: "Instagram" },
                          { Icon: SocialLinkedin, label: "LinkedIn" },
                          { Icon: SocialPin,      label: "Pinterest" },
                          { Icon: SocialYoutube,  label: "YouTube" },
                        ].map((social, index) => (
                          <motion.div
                            key={index}
                            aria-label={social.label}
                            className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-indigo-500/20 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="flex items-center justify-center w-5 h-5">
                              <social.Icon className="w-full h-full text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
                            </div>
                            {/* Glow on hover */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            className="relative my-12"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-1 rounded-full" />
            </div>
          </motion.div>

          {/* Bottom Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-center gap-4"
          >
            {/* Copyright */}
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <span>&copy; {new Date().getFullYear()} {translations.rights}</span>
            </div>

            {/* Seobility badge */}
            <a
              href="https://www.seobility.net/en/seocheck/check?url=https%3A%2F%2Fzhan.care%2F"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-40 hover:opacity-70 transition-opacity duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://app.seobility.net/widget/widget.png?url=https%3A%2F%2Fzhan.care%2F"
                alt="Seobility Score for zhan.care"
                width={100}
                height={40}
                style={{ height: "40px", width: "auto" }}
              />
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfModal.isOpen}
        onClose={closePdfModal}
        pdfUrl={pdfModal.url}
        title={pdfModal.title}
      />
    </footer>
  );
};
