'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' }}
          >
            <div className="w-9 h-[5px] bg-foreground/10 rounded-full mx-auto mt-2.5" />
            {title && (
              <h3 className="text-[19px] font-semibold px-7 pt-5 pb-1 text-foreground tracking-tight">{title}</h3>
            )}
            <div className="px-7 pb-10 pt-3">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
