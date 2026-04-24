"use client";

import { VanCal } from "@/components/Calendar/VanCal";
import { motion } from "framer-motion";

export default function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ 
        opacity: 1, 
        backdropFilter: "blur(20px)",
        background: "linear-gradient(135deg, rgba(15,15,15,0.98) 0%, rgba(26,23,20,0.95) 100%)"
      }}
      transition={{ 
        duration: 0.8,
        ease: [0.23, 1, 0.32, 1]
      }}
      className="relative min-h-screen"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(255,179,71,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(78,205,196,0.05) 0%, transparent 50%),
          linear-gradient(180deg, #0F0F0F 0%, #1A1714 100%)
        `
      }}
    >
      {/* Ambient glow overlays */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,179,71,0.01) 2px,
              rgba(255,179,71,0.01) 4px
            )
          `,
          animation: "scanlines 8s linear infinite"
        }}
      />
      
      {/* Content */}
      <VanCal />
      
      {/* Scanline animation */}
      <style jsx global>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}</style>
    </motion.div>
  );
}