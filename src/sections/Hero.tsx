"use client";

import heroVideo from "@/assets/hero-video.mp4";
import Image from "next/image";
import Logo from "@/assets/logosaas.png";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden"
    >
      <video autoPlay muted loop playsInline className="absolute inset-0 w-screen h-screen object-cover -z-10">
        <source src={heroVideo} type="video/mp4" />
      </video>
      <motion.div
        className="absolute inset-0 bg-black/70 -z-9"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <Image src={Logo} alt="Logo" className="mx-auto mb-6" width={120} height={120} />
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8 italic">"Иногда, чтобы найти себя — нужно потеряться."<br/>— <span className="font-semibold">Wolf Architect</span></p>
        <p className="text-sm text-gray-300 mb-4">
          от создателя <strong>ZhanCare AI</strong> — Адилан Ахрамович, ТОО iTry<br/>
          Обращаться по вопросам: <a href="tel:+77758249686" className="underline">+7 775 824 9686</a>
        </p>
        <Link href="/" className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
          Вернуться на главную
        </Link>
      </div>
    </motion.section>
  );
}