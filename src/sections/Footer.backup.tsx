"use client";
import logo from "@/assets/logosaas.png";
import SocialX from "@/assets/social-x.svg";
import SocialInsta from "@/assets/social-insta.svg";
import SocialLinkedin from "@/assets/social-linkedin.svg";
import SocialPin from "@/assets/social-pin.svg";
import SocialYoutube from "@/assets/social-youtube.svg";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, ArrowUpRight, Heart } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

export const Footer = () => {
  const { language } = useLanguage();
  
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

  // Get address label translation
  const getAddressLabel = () => {
    switch (language) {
      case "ru":
        return "Адрес:";
      case "kz":
        return "Мекен-жай:";
      case "en":
        return "Address:";
      default:
        return "Address:";
    }
  };

  const addressLabel = getAddressLabel();

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

  return (
    <footer className="bg-gradient-to-br from-[#1D1D2F] to-[#1A1A2E] text-gray-400 text-xs sm:text-sm lg:text-base desktop-qhd:text-lg desktop-4k:text-xl py-8 sm:py-10 md:py-12 lg:py-16 laptop-hd:py-12 desktop-fhd:py-16 desktop-qhd:py-20 desktop-4k:py-24 overflow-hidden">
      {/* Subtle Background Elements - minimal like original */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-700/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 laptop-hd:px-8 desktop-fhd:px-12 desktop-qhd:px-16 desktop-4k:px-24 max-w-7xl laptop-hd:max-w-6xl desktop-fhd:max-w-7xl desktop-qhd:max-w-8xl desktop-4k:max-w-9xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16">
            
            {/* Brand Section - Takes more space */}
            <motion.div variants={itemVariants} className="lg:col-span-5 xl:col-span-4">
              <div className="space-y-6 lg:space-y-8">
                {/* Logo */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Image 
                    src={logo} 
                    alt="ZhanCare.AI Logo" 
                    className="h-12 sm:h-16 md:h-20 lg:h-24 laptop-hd:h-16 desktop-fhd:h-20 desktop-qhd:h-28 desktop-4k:h-36 w-auto"
                  />
                </motion.div>

                {/* Company Description */}
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl leading-relaxed max-w-md">
                    {translations.companyTagline}
                  </p>
                  
                  <motion.a
                    href="#hero"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl group transition-all duration-300"
                    whileHover={{ x: 5 }}
                  >
                    {translations.learnMore}
                    <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5 desktop-qhd:w-6 desktop-qhd:h-6 desktop-4k:w-8 desktop-4k:h-8 group-hover:rotate-45 transition-transform duration-300" />
                  </motion.a>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 sm:space-y-4">
                  <motion.div 
                    className="flex items-start gap-3 text-gray-400 text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <MapPin className="w-4 h-4 lg:w-5 lg:h-5 desktop-qhd:w-6 desktop-qhd:h-6 desktop-4k:w-8 desktop-4k:h-8 text-blue-400 mt-1 flex-shrink-0" />
                    <span>{translations.contact.address}</span>
                  </motion.div>
                  
                  <motion.a
                    href={`mailto:${translations.contact.email}`}
                    className="flex items-center gap-3 text-gray-400 hover:text-blue-400 text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl transition-colors duration-300 group"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Mail className="w-4 h-4 lg:w-5 lg:h-5 desktop-qhd:w-6 desktop-qhd:h-6 desktop-4k:w-8 desktop-4k:h-8 text-blue-400 flex-shrink-0" />
                    {translations.contact.email}
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="space-y-4 lg:space-y-6">
                <h3 className="text-white text-base sm:text-lg lg:text-xl desktop-qhd:text-2xl desktop-4k:text-3xl font-semibold mb-3 sm:mb-4 lg:mb-6 border-b pb-2 border-gray-700">
                  {translations.navigation.title}
                </h3>
                <nav className="space-y-2 lg:space-y-3">
                  {translations.navigation.links.map((link, index) => (
                    <motion.a
                      key={index}
                      href="#"
                      className="block text-gray-400 hover:text-blue-400 text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl transition-all duration-300 group"
                      whileHover={{ x: 5 }}
                    >
                      <span className="border-b border-transparent group-hover:border-blue-400 transition-colors duration-300">
                        {link}
                      </span>
                    </motion.a>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="space-y-4 lg:space-y-6">
                <h3 className="text-white text-base sm:text-lg lg:text-xl desktop-qhd:text-2xl desktop-4k:text-3xl font-semibold mb-3 sm:mb-4 lg:mb-6 border-b pb-2 border-gray-700">
                  {translations.contact.title}
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <motion.a
                    href="#contact-form"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 lg:px-6 lg:py-3 desktop-qhd:px-8 desktop-qhd:py-4 desktop-4k:px-10 desktop-4k:py-5 rounded-full font-semibold text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl transition-all duration-300 shadow-lg hover:shadow-xl group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {translations.contact.contactUs}
                    <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5 desktop-qhd:w-6 desktop-qhd:h-6 desktop-4k:w-8 desktop-4k:h-8 group-hover:rotate-45 transition-transform duration-300" />
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div variants={itemVariants} className="lg:col-span-3 xl:col-span-4">
              <div className="space-y-4 lg:space-y-6">
                <h3 className="text-white text-base sm:text-lg lg:text-xl desktop-qhd:text-2xl desktop-4k:text-3xl font-semibold mb-3 sm:mb-4 lg:mb-6 border-b pb-2 border-gray-700">
                  {translations.map.title}
                </h3>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 desktop-qhd:h-80 desktop-4k:h-96 rounded-2xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2924.112740921332!2d76.94777831509592!3d43.23557467913664!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x388369c12f12345b%3A0x123456789abcdef!2sAbay%20Ave%2090%2C%20Almaty%2C%20Kazakhstan!5e0!3m2!1sen!2skz!4v1698349393001!5m2!1sen!2skz"
                      width="100%"
                      height="100%"
                      allowFullScreen
                      loading="lazy"
                      style={{ border: 0 }}
                      className="grayscale hover:grayscale-0 transition-all duration-500"
                    ></iframe>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <motion.div
            variants={itemVariants}
            className="border-t border-gray-700 my-8 sm:my-10 md:my-12 lg:my-16 desktop-qhd:my-20 desktop-4k:my-24"
          ></motion.div>

          {/* Bottom Section */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-8"
          >
            {/* Social Links */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
              <h4 className="text-sm sm:text-base lg:text-lg desktop-qhd:text-xl desktop-4k:text-2xl font-semibold text-white">
                {translations.social.title}
              </h4>
              <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                {[
                  { Icon: SocialX, label: "X (Twitter)", href: "#" },
                  { Icon: SocialInsta, label: "Instagram", href: "#" },
                  { Icon: SocialLinkedin, label: "LinkedIn", href: "#" },
                  { Icon: SocialPin, label: "Pinterest", href: "#" },
                  { Icon: SocialYoutube, label: "YouTube", href: "#" },
                ].map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="group relative p-2 lg:p-3 desktop-qhd:p-4 desktop-4k:p-5 rounded-full bg-gray-700/30 hover:bg-gray-600/40 border border-gray-600 hover:border-gray-500 transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.Icon className="w-5 h-5 sm:w-6 sm:w-6 lg:w-7 lg:h-7 desktop-qhd:w-8 desktop-qhd:h-8 desktop-4k:w-10 desktop-4k:h-10 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Copyright */}
            <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm lg:text-base desktop-qhd:text-lg desktop-4k:text-xl">
              <span>&copy; {new Date().getFullYear()} {translations.rights}</span>
              {/* <span className="hidden sm:inline">•</span> */}
              {/* <span className="hidden sm:inline flex items-center gap-1">
                Made with <Heart className="w-3 h-3 lg:w-4 lg:h-4 desktop-qhd:w-5 desktop-qhd:h-5 desktop-4k:w-6 desktop-4k:h-6 text-red-500" fill="currentColor" /> by ZhanCare.AI
              </span> */}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};