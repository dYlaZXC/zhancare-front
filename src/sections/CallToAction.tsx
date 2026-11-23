"use client";
import ArrowRight from "@/assets/arrow-right.svg";
import starImage from "@/assets/star.png";
import springImage from "@/assets/spring.png";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useBrand } from "@/context/BrandContext";
import { Mail, User, MessageSquare, Send, ArrowRight as ArrowRightIcon } from "lucide-react";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";
import uz from "@/locales/uz.json";

export const CallToAction = () => {
  const { language } = useLanguage();
  const { brand } = useBrand();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Get translations based on language
  const getTranslations = () => {
    switch (language) {
      case "ru":
        return ru.callToAction;
      case "kz":
        return kz.callToAction;
      case "en":
        return en.callToAction;
      case "uz":
        return uz.callToAction;
      default:
        return en.callToAction;
    }
  };


  const translations = getTranslations();

  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const translateY = useTransform(scrollYProgress, [0, 1], [150, -150]);

  const handleEmailRedirect = () => {
    window.location.href = "mailto:zhancare.group@yandex.kz";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/tg/site-notify/", {
        type: "lead",
        name: formData.name,
        email: formData.email,
        message: formData.message,
      });
      toast.success(translations.alertMessage);
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
      toast.error('Ошибка отправки. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section
      id="contacts"
      ref={sectionRef}
      className="bg-gradient-to-b from-[#d2dcff] to-[#1d1d2f] py-16 sm:py-24 overflow-x-clip relative"
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="section-heading relative text-center mb-8 sm:mb-10">
          <h2 className="section-title text-2xl sm:text-3xl font-bold">
            {translations.title}
          </h2>
          <p className="section-des mt-4 sm:mt-5 text-base sm:text-lg">
            {translations.description}
          </p>

          {/* Decorative Images */}
          <motion.img
            src={starImage.src}
            alt="звезда"
            width={260}
            className="absolute -left-[200px] -top-[100px] hidden sm:block"
            style={{
              translateY,
            }}
          />
          <motion.img
            src={springImage.src}
            alt="весна"
            width={260}
            className="absolute -right-[200px] -top-[50px] hidden sm:block"
            style={{
              translateY,
            }}
          />
        </div>

        {/* Contact Form - Modern Redesign */}
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="relative">
            {/* Glassmorphic background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 rounded-3xl blur-2xl" />

            <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-8 sm:p-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Input */}
                    <div className="group">
                      <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" style={{ color: brand.primary }} />
                        {translations.form.nameLabel}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 group-hover:border-gray-300"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="group">
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" style={{ color: brand.primary }} />
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 group-hover:border-gray-300"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message Textarea */}
                  <div className="group">
                    <label
                      htmlFor="message"
                      className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" style={{ color: brand.primary }} />
                      {translations.form.messageLabel}
                    </label>
                    <div className="relative">
                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-300 resize-none group-hover:border-gray-300"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 relative px-8 py-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden group"
                      style={{ background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)` }}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                      <div className="relative flex items-center gap-3">
                        {isSubmitting ? (
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                        <span>{translations.form.submitButton}</span>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handleEmailRedirect}
                      className="flex-1 px-8 py-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center gap-3 group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Mail className="w-5 h-5" style={{ color: brand.primary }} />
                      <span>{translations.form.contactButton}</span>
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};