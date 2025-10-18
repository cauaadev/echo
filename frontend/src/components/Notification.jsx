import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import useSound from "../hooks/useSound"; // se quiser tocar um som

export default function Notification({
  show = false,
  type = "message", // "message" | "info" | "error"
  title = "",
  message = "",
  onClose,
}) {
  const playSound = useSound("/assets/message.mp3");

  useEffect(() => {
    if (show && type === "message") {
      playSound();
    }

    if (show) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, type, playSound, onClose]);

  const typeStyles = {
    message: "bg-blue-500 text-white",
    info: "bg-gray-700 text-white",
    error: "bg-red-500 text-white",
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-5 right-5 z-50 shadow-lg rounded-2xl px-4 py-3 flex items-start gap-3 border border-white/10 ${typeStyles[type]}`}
        >
          <div className="flex-1">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-sm opacity-90">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:opacity-80 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
