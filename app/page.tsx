"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["Health", "Work", "Relationships"];
const TAGLINE = "Balance your life across";

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // No need to set state - initialized above
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-[#faf8f4]">
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='%232b262c' fill-opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xl font-semibold tracking-[0.2em] text-[#2b262c] font-['Cormorant_Garamond']">
            VANCAL
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link 
            href="/calendar"
            className="text-sm tracking-widest text-[#5a5550] hover:text-[#2b262c] transition-colors font-medium"
          >
            ENTER
          </Link>
        </motion.div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-sm md:text-base tracking-[0.3em] text-[#8a8580] uppercase mb-8"
          >
            {TAGLINE}
          </motion.p>

          <div className="h-20 md:h-24 flex items-center justify-center mb-12">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl md:text-7xl lg:text-8xl font-light text-[#2b262c] absolute font-['Cormorant_Garamond'] italic"
              >
                {WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl text-[#5a5550] max-w-xl mx-auto leading-relaxed font-light"
          >
            An intelligent calendar system designed to help you prioritize what matters most.
            Your data stays private with end-to-end encryption.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16"
          >
            <Link href="/calendar">
              <button className="group relative px-10 py-4 bg-[#2b262c] text-[#faf8f4] overflow-hidden">
                <span className="relative z-10 text-sm tracking-[0.2em] font-medium">
                  GET STARTED
                </span>
                <div className="absolute inset-0 bg-[#3d363c] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="relative z-10 flex items-center justify-between px-8 py-6 md:px-16 lg:px-24 text-xs tracking-widest text-[#8a8580]"
      >
        <span className="font-light">© 2026</span>
        <div className="flex items-center gap-8">
          <span className="font-light">PRIVACY FIRST</span>
          <span className="font-light">E2E ENCRYPTED</span>
        </div>
      </motion.footer>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isVisible ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-px bg-[#2b262c]/10"
      />
    </main>
  );
}