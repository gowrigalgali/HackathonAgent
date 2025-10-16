"use client";

import { motion } from "framer-motion";

export function Loader({ size = 22 }: { size?: number }) {
  const dot = {
    initial: { opacity: 0.2, y: 0 },
    animate: { opacity: 1, y: -4 },
  };
  return (
    <div className="flex items-center justify-center gap-1 text-primary">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial="initial"
          animate="animate"
          transition={{ repeat: Infinity, repeatType: "mirror", duration: 0.6, delay: i * 0.12 }}
          variants={dot}
          style={{ width: size / 6, height: size / 6 }}
        >
          ●
        </motion.span>
      ))}
    </div>
  );
}


