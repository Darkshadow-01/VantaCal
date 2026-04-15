"use client";

import { VanCal } from "@/components/Calendar/VanCal";
import { motion } from "framer-motion";

export default function CalendarPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <VanCal />
    </motion.div>
  );
}
