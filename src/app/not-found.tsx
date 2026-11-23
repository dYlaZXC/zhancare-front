"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft, Search, Stethoscope, Calendar, User } from "lucide-react";

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
    }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(55, 114, 255, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(55, 114, 255, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const links = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/patient/appointments", label: "Записаться", icon: Calendar },
    { href: "/patient", label: "Кабинет", icon: User },
    { href: "/login", label: "Войти", icon: Stethoscope },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f0f1e] via-[#1a1a2e] to-[#16213e] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "rgba(55,114,255,0.12)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{ background: "rgba(26,47,200,0.12)" }}
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.2, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="not-found-grid-bg absolute inset-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <Link href="/">
            <Image
              src="/logosaas.png"
              alt="ZhanCare Academia"
              width={352}
              height={264}
              className="h-14 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
              priority
            />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, type: "spring", bounce: 0.3 }}
          className="relative mb-4 select-none"
        >
          <span className="not-found-404-text text-[160px] sm:text-[200px] font-black leading-none tracking-tighter">
            404
          </span>
          <span className="not-found-404-reflection absolute top-full left-0 right-0 text-[160px] sm:text-[200px] font-black leading-none tracking-tighter opacity-10 scale-y-[-1] pointer-events-none">
            404
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-3"
        >
          Страница не найдена
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-gray-400 text-base sm:text-lg leading-relaxed mb-10 max-w-md"
        >
          Похоже, эта страница была удалена или никогда не существовала.
          Вернитесь на главную или запишитесь на приём к врачу.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-12"
        >
          <Link
            href="/"
            className="group relative flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#001E80] via-[#1A2FC8] to-[#3772ff] text-white font-semibold rounded-xl transition-all duration-300 shadow-[0_8px_30px_rgba(55,114,255,0.4)] hover:shadow-[0_12px_40px_rgba(55,114,255,0.6)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            <div className="absolute inset-0 -top-full group-hover:top-full transition-all duration-700 ease-out bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-300" />
            На главную
          </Link>

          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-7 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold rounded-xl border border-white/10 hover:border-white/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
            Назад
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="w-full"
        >
          <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-4">
            Быстрые ссылки
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-[#3772ff]/15 border border-white/10 hover:border-[#3772ff]/40 rounded-xl text-gray-400 hover:text-[#3772ff] text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-16 flex items-center gap-2 text-gray-600 text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>ZhanCare &mdash; Ваша цифровая медицинская платформа</span>
        </motion.div>
      </div>
    </div>
  );
}
