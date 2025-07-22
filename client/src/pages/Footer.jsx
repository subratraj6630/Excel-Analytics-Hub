import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function Footer() {
  const [isOpen, setIsOpen] = useState(false);

  // Team members data
  const teamMembers = [
    { name: 'Subrat Raj', role: 'Full Stack Developer' },
    { name: 'Vaishnavi Amate', role: 'Frontend Developer' },
    { name: 'Himanshu Singh', role: 'Frontend Developer' },
    { name: 'Anusha Chaudhary', role: 'Frontend Developer' },
    { name: 'Amzad Khan', role: 'Frontend Developer' },
    { name: 'Maran', role: 'Frontend Developer' },
  ];

  // Animation variants for pop-up
  const popupVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <footer className="w-full bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 text-center py-6 mt-12 border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <p className="text-sm font-medium">
        Made with <span className="text-red-500">❤️</span> by{' '}
        <span
          className="font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer relative group"
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          Team DYNAMO
          {/* Animated underline effect */}
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-emerald-500 dark:bg-emerald-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={popupVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 bg-gradient-to-br from-white/95 to-gray-100/80 dark:from-gray-800/95 dark:to-gray-900/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-2xl p-6 min-w-[250px] z-20"
              >
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center mb-4 last:mb-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3"></div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{member.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                    </div>
                  </div>
                ))}
                {/* Arrow pointing to Team DYNAMO */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-200/50 dark:border-t-gray-800/50"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </span>{' '}
        · All rights reserved © {new Date().getFullYear()}
      </p>
    </footer>
  );
}

export default Footer;