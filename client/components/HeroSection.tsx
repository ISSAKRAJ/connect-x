'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Lock } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <section className="relative flex-grow min-h-[90vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 z-10 overflow-hidden">
      
      {/* 1. BACKGROUND GLOW & DETAILED VECTOR HANDS */}
      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center -z-10 select-none">
        
        {/* Ambient radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(9,9,11,0.15)_0%,#09090b_80%)]" />

        {/* Shockwave expanding ring (Only triggers when intro completes) */}
        {introFinished && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="absolute w-40 h-40 rounded-full border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] pointer-events-none"
          />
        )}

        <div className="relative w-full max-w-[1200px] h-[520px] flex items-center justify-center">
          
          {/* Detailed Left Hand (3D White Claymorphism styling) */}
          <motion.div
            initial={{
              x: '-120%',
              y: 15,
              rotate: 8,
              opacity: 0,
              scale: 0.9,
            }}
            animate={introFinished 
              ? {
                  y: [-8, 8],
                  rotate: [-1, 1],
                  opacity: 0.25,
                  scale: 1,
                  x: 0,
                }
              : {
                  x: 0,
                  y: 0,
                  rotate: 0,
                  opacity: 0.25,
                  scale: 1,
                }
            }
            transition={introFinished 
              ? {
                  y: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  },
                  rotate: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  },
                }
              : {
                  duration: 2.5,
                  ease: [0.25, 1, 0.5, 1],
                }
            }
            onAnimationComplete={() => {
              if (!introFinished) setIntroFinished(true);
            }}
            className="absolute right-1/2 top-1/2 -translate-y-1/2 pr-[1px]"
          >
            <svg
              width="430"
              height="280"
              viewBox="0 0 430 280"
              fill="none"
              className="filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.75)]"
            >
              <defs>
                <linearGradient id="3d-hand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#f8fafc" />
                  <stop offset="70%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <filter id="vector-hand-glow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              
              {/* Sleeve Wireframe */}
              <path
                d="M 0 165 C 25 157, 60 147, 90 140 C 105 136, 120 125, 130 115 L 140 105"
                stroke="#e2e8f0"
                strokeWidth="3"
                strokeOpacity="0.35"
              />
              
              {/* Detailed 3D White Hand Path */}
              <path
                d="M 100 135 C 115 128, 140 118, 160 111 C 166 97, 185 89, 205 89 C 220 89, 235 93, 260 93 L 398 93 C 402 93, 405 95, 405 98 C 405 101, 402 103, 398 103 L 268 103 C 274 109, 282 115, 282 121 C 282 127, 274 133, 262 133 L 235 133 C 242 139, 248 145, 248 151 C 248 157, 242 163, 228 163 L 205 163 C 212 169, 217 175, 217 181 C 217 187, 210 193, 192 193 C 162 193, 125 185, 95 165 Z"
                fill="url(#3d-hand-gradient)"
                filter="url(#vector-hand-glow)"
              />
              
              {/* Volumetric Crease Lines */}
              <path d="M 160 111 L 228 115 L 262 133" stroke="#94a3b8" strokeWidth="1.2" strokeOpacity="0.3" />
              <path d="M 205 89 L 212 163" stroke="#cbd5e1" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 3" />
              <path d="M 130 115 Q 170 145 192 193" stroke="#cbd5e1" strokeWidth="1.2" strokeOpacity="0.25" />

              {/* Glowing skeletal points */}
              <circle cx="205" cy="89" r="4.5" fill="#3b82f6" className="animate-pulse" />
              <circle cx="260" cy="93" r="3" fill="#60a5fa" />
              <circle cx="398" cy="93" r="5.5" fill="#3b82f6" className="animate-ping" />
              <circle cx="398" cy="93" r="3" fill="#ffffff" />
            </svg>
          </motion.div>

          {/* Detailed Right Hand (3D White Claymorphism styling) */}
          <motion.div
            initial={{
              x: '120%',
              y: -15,
              rotate: -8,
              opacity: 0,
              scale: 0.9,
            }}
            animate={introFinished 
              ? {
                  y: [-8, 8],
                  rotate: [-1, 1],
                  opacity: 0.25,
                  scale: 1,
                  x: 0,
                }
              : {
                  x: 0,
                  y: 0,
                  rotate: 0,
                  opacity: 0.25,
                  scale: 1,
                }
            }
            transition={introFinished 
              ? {
                  y: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  },
                  rotate: {
                    duration: 8,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  },
                }
              : {
                  duration: 2.5,
                  ease: [0.25, 1, 0.5, 1],
                }
            }
            className="absolute left-1/2 top-1/2 -translate-y-1/2 pl-[1px]"
          >
            <svg
              width="430"
              height="280"
              viewBox="0 0 430 280"
              fill="none"
              className="filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.75)] transform scale-x-[-1]"
            >
              {/* Sleeve Wireframe */}
              <path
                d="M 0 165 C 25 157, 60 147, 90 140 C 105 136, 120 125, 130 115 L 140 105"
                stroke="#e2e8f0"
                strokeWidth="3"
                strokeOpacity="0.35"
              />
              
              {/* Detailed 3D White Hand Path */}
              <path
                d="M 100 135 C 115 128, 140 118, 160 111 C 166 97, 185 89, 205 89 C 220 89, 235 93, 260 93 L 398 93 C 402 93, 405 95, 405 98 C 405 101, 402 103, 398 103 L 268 103 C 274 109, 282 115, 282 121 C 282 127, 274 133, 262 133 L 235 133 C 242 139, 248 145, 248 151 C 248 157, 242 163, 228 163 L 205 163 C 212 169, 217 175, 217 181 C 217 187, 210 193, 192 193 C 162 193, 125 185, 95 165 Z"
                fill="url(#3d-hand-gradient)"
                filter="url(#vector-hand-glow)"
              />
              
              {/* Volumetric Crease Lines */}
              <path d="M 160 111 L 228 115 L 262 133" stroke="#94a3b8" strokeWidth="1.2" strokeOpacity="0.3" />
              <path d="M 205 89 L 212 163" stroke="#cbd5e1" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 3" />
              <path d="M 130 115 Q 170 145 192 193" stroke="#cbd5e1" strokeWidth="1.2" strokeOpacity="0.25" />

              {/* Glowing skeletal points */}
              <circle cx="205" cy="89" r="4.5" fill="#10b981" className="animate-pulse" />
              <circle cx="260" cy="93" r="3" fill="#34d399" />
              <circle cx="398" cy="93" r="5.5" fill="#10b981" className="animate-ping" />
              <circle cx="398" cy="93" r="3" fill="#ffffff" />
            </svg>
          </motion.div>

        </div>
      </div>

      {/* 2. FOREGROUND: Pill Badge, Main Title, Sub-Paragraph, and CTA */}
      <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto z-10 select-none">
        
        {/* Pill Badge (Foreground, 5s cycle) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={introFinished
            ? {
                y: [-2, 2],
                opacity: 1,
              }
            : {
                opacity: 1,
                y: 0,
              }
          }
          transition={introFinished
            ? {
                y: {
                  duration: 5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }
              }
            : {
                delay: 1.8,
                duration: 1,
                ease: 'easeOut',
              }
          }
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] leading-none"
        >
          <Lock className="w-3.5 h-3.5" /> DECENTRALIZED SANDBOX OPERATIONAL
        </motion.div>

        {/* Main "CONNECT X" Title (Midground, 6s cycle, Opposing Drift) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={introFinished
            ? {
                y: [4, -4], // Opposing drift
                opacity: 1,
                scale: 1,
              }
            : {
                opacity: 1,
                scale: 1,
                y: 0,
              }
          }
          transition={introFinished
            ? {
                y: {
                  duration: 6,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }
              }
            : {
                delay: 1.5,
                duration: 1.2,
                ease: 'easeOut',
              }
          }
          className="relative flex flex-col items-center"
        >
          <h2 className="text-5xl sm:text-8xl font-black tracking-tighter text-white flex items-center justify-center leading-none">
            CONNECT
            <span className="relative text-blue-400 font-extrabold text-6xl sm:text-9xl px-6 py-2 ml-4 border border-blue-500/30 rounded-2xl bg-blue-500/5 backdrop-blur-md shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              X
            </span>
          </h2>
        </motion.div>

        {/* Sub-paragraph & Buttons (Foreground, 5s cycle) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={introFinished
            ? {
                y: [-2, 2],
                opacity: 1,
              }
            : {
                opacity: 1,
                y: 0,
              }
          }
          transition={introFinished
            ? {
                y: {
                  duration: 5,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }
              }
            : {
                delay: 1.8,
                duration: 1,
                ease: 'easeOut',
              }
          }
          className="flex flex-col items-center gap-6"
        >
          <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-[0.3em] font-bold max-w-xl">
            Zero-Trust. Zero-Gravity. Direct Cryptographic Link.
          </p>

          <p className="text-zinc-500 text-xs sm:text-sm max-w-lg leading-relaxed font-medium">
            Connect X establishes end-to-end encrypted direct WebRTC data tunnels and audio pipelines directly between devices. No middle servers, no database leaks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl py-4 px-10 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.6)] transition-all duration-300 cursor-pointer active:scale-95"
            >
              Get Connect ID <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5 text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl py-4 px-10 flex items-center justify-center transition-all duration-300"
            >
              Explore Features
            </a>
          </div>
        </motion.div>
        
      </div>
      
    </section>
  );
}
