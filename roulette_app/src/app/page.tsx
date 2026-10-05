"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import RouletteGame from "@/components/RouletteGame";

export default function Home() {
  const [showReviewPopup, setShowReviewPopup] = useState(false);

  useEffect(() => {
      const timer = setTimeout(() => {
        setShowReviewPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
  }, []);

  const handleReviewClick = () => {
    localStorage.setItem("hasClickedReview", "true");
    setShowReviewPopup(false);
    window.open("https://search.google.com/local/writereview?placeid=ChIJM8R6LgDz5kcR2UDNYeKau1U", "_blank"); 
  };

  const handleCloseReview = () => {
    setShowReviewPopup(false);
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header / Logo */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-orbitron)] font-black uppercase tracking-wider">
            <span className="text-text-light">Clean</span> <span className="text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">Wash</span> <span className="font-normal text-text-light tracking-normal">& Co</span>
          </h1>
          <p className="mt-4 text-text-gray text-lg md:text-xl font-body max-w-lg mx-auto">
            Tentez votre chance et gagnez des réductions exclusives pour votre prochain lavage !
          </p>
        </div>

        {/* The Roulette Game Component */}
        <RouletteGame />

      </div>

      {/* Review Popup Modal */}
      <AnimatePresence>
        {showReviewPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-bg-card border border-primary/30 p-8 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.2)] max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
              
              <h2 className="text-3xl font-display font-bold text-text-light mb-4">
                Donnez-nous votre avis !
              </h2>
              <p className="text-text-gray mb-8">
                Avant de tenter votre chance, prenez un instant pour nous laisser un avis sur Google. Votre soutien est précieux.
              </p>
              
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleReviewClick}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-primary-dark text-bg-dark hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(0,240,255,0.4)]"
                >
                  Nous laisser un avis ⭐
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
