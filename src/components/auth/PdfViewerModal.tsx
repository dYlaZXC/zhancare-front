"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

const PdfViewerModal = ({ isOpen, onClose, pdfUrl, title }: PdfViewerModalProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[60] px-4 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#3772ff] to-[#2956bf] rounded-t-2xl">
            <h2 className="text-lg font-semibold text-white truncate pr-4">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 active:scale-95 group"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-100 rounded-b-2xl">
            {isMobile ? (
              // Mobile view - Show download button and embedded view attempt
              <div className="flex flex-col h-full">
                <div className="p-6 bg-white border-b border-gray-200">
                  <p className="text-gray-700 mb-4 text-sm">
                    For the best experience on mobile, download the PDF to view it.
                  </p>
                  <a
                    href={pdfUrl}
                    download
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#3772ff] hover:bg-[#3267e6] text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                </div>
                {/* Still try to display inline for browsers that support it */}
                <div className="flex-1 overflow-hidden">
                  <iframe
                    src={`${pdfUrl}#view=FitH`}
                    className="w-full h-full border-0"
                    title={title}
                  />
                </div>
              </div>
            ) : (
              // Desktop view - Direct iframe
              <iframe
                src={`${pdfUrl}#view=FitH`}
                className="w-full h-full border-0"
                title={title}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PdfViewerModal;
