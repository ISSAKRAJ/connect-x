'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function SplashPage() {
  const router = useRouter();
  const [animationStage, setAnimationStage] = useState<'sliding' | 'touching' | 'ignited'>('sliding');

  useEffect(() => {
    // Cinematic animation timings
    // Stage 1: Sliding (0s to 1.8s)
    const touchTimeout = setTimeout(() => {
      setAnimationStage('touching');
    }, 1800);

    // Stage 2: Fingers touch, spark triggers (1.8s to 2.1s)
    const igniteTimeout = setTimeout(() => {
      setAnimationStage('ignited');
    }, 2100);

    // Stage 3: Redirect to /chat (after 4.5 seconds)
    const redirectTimeout = setTimeout(() => {
      router.push('/chat');
    }, 4500);

    return () => {
      clearTimeout(touchTimeout);
      clearTimeout(igniteTimeout);
      clearTimeout(redirectTimeout);
    };
  }, [router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-zinc-950 scanline">
      
      {/* Decorative ambient neon background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Pill Badge with faint scanline effect & breathing pulse (top) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: [0.3, 1, 0.3], y: 0 }}
        transition={{ 
          y: { duration: 1.2, ease: 'easeOut' },
          opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }}
        className="absolute top-16 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] leading-none shadow-[0_0_12px_rgba(59,130,246,0.1)] backdrop-blur-sm z-30"
      >
        <Shield className="w-3.5 h-3.5" /> DECENTRALIZED SANDBOX OPERATIONAL
      </motion.div>

      {/* Animation Container */}
      <div className="relative w-full max-w-4xl h-[400px] flex items-center justify-center">
        
        {/* Left Hand SVG Container */}
        <div
          className={`absolute right-1/2 top-1/2 -translate-y-1/2 pr-[1px] transition-all duration-[1800ms] ease-out origin-right ${
            animationStage === 'sliding' 
              ? 'translate-x-[-125%] opacity-0 scale-95' 
              : animationStage === 'touching'
              ? 'translate-x-0 opacity-100 scale-100'
              : 'translate-x-[-50px] opacity-0 scale-90 blur-sm pointer-events-none'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
        >
          {/* Cybernetic Left Hand pointing Right */}
          <svg
            width="320"
            height="200"
            viewBox="0 0 320 200"
            fill="none"
            className="text-blue-500/90 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
          >
            {/* Shaded hand geometry path */}
            <path
              d="M 10 120 C 30 115, 60 108, 85 103 C 90 92, 106 87, 122 87 C 138 87, 154 92, 176 92 C 187 92, 203 92, 225 92 L 310 92 C 314 92, 317 94, 317 97 C 317 100, 314 102, 310 102 L 210 102 C 216 107, 224 113, 224 118 C 224 124, 216 130, 204 130 L 187 130 C 193 135, 198 141, 198 147 C 198 153, 193 159, 181 159 L 165 159 C 170 164, 173 170, 173 175 C 173 180, 167 186, 152 186 C 128 186, 100 180, 75 163 C 53 152, 30 147, 10 147 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner details */}
            <path d="M 85 103 L 122 103 L 176 108" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M 122 87 L 144 130 L 155 159" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            {/* Glowing nodes */}
            <circle cx="122" cy="87" r="3.5" fill="#60a5fa" className="animate-pulse" />
            <circle cx="176" cy="92" r="3" fill="#60a5fa" />
            <circle cx="310" cy="92" r="4.5" fill="#3b82f6" className="animate-ping" />
            <circle cx="310" cy="92" r="2.5" fill="#ffffff" />
          </svg>
        </div>

        {/* Right Hand SVG Container */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-y-1/2 pl-[1px] transition-all duration-[1800ms] ease-out origin-left ${
            animationStage === 'sliding' 
              ? 'translate-x-[125%] opacity-0 scale-95' 
              : animationStage === 'touching'
              ? 'translate-x-0 opacity-100 scale-100'
              : 'translate-x-[50px] opacity-0 scale-90 blur-sm pointer-events-none'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)' }}
        >
          {/* Cybernetic Right Hand pointing Left (Mirrored) */}
          <svg
            width="320"
            height="200"
            viewBox="0 0 320 200"
            fill="none"
            className="text-emerald-500/90 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)] transform scale-x-[-1]"
          >
            {/* Shaded hand geometry path */}
            <path
              d="M 10 120 C 30 115, 60 108, 85 103 C 90 92, 106 87, 122 87 C 138 87, 154 92, 176 92 C 187 92, 203 92, 225 92 L 310 92 C 314 92, 317 94, 317 97 C 317 100, 314 102, 310 102 L 210 102 C 216 107, 224 113, 224 118 C 224 124, 216 130, 204 130 L 187 130 C 193 135, 198 141, 198 147 C 198 153, 193 159, 181 159 L 165 159 C 170 164, 173 170, 173 175 C 173 180, 167 186, 152 186 C 128 186, 100 180, 75 163 C 53 152, 30 147, 10 147 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner details */}
            <path d="M 85 103 L 122 103 L 176 108" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            <path d="M 122 87 L 144 130 L 155 159" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
            {/* Glowing nodes */}
            <circle cx="122" cy="87" r="3.5" fill="#34d399" className="animate-pulse" />
            <circle cx="176" cy="92" r="3" fill="#34d399" />
            <circle cx="310" cy="92" r="4.5" fill="#10b981" className="animate-ping" />
            <circle cx="310" cy="92" r="2.5" fill="#ffffff" />
          </svg>
        </div>

        {/* Contact Touch Point Spark */}
        {animationStage !== 'sliding' && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-all duration-[800ms] ease-out z-20 pointer-events-none ${
              animationStage === 'touching' 
                ? 'scale-150 shadow-[0_0_20px_#fff,0_0_40px_#3b82f6] opacity-100' 
                : 'scale-[26] shadow-[0_0_80px_#3b82f6] opacity-0'
            }`}
          />
        )}

        {/* Blinding 'X' Ignite Title */}
        {animationStage === 'ignited' && (
          <div className="absolute flex flex-col items-center justify-center animate-x-ignite z-30 select-none">
            <span className="text-zinc-500 font-bold tracking-[0.6em] text-[10px] uppercase mb-4 animate-pulse">
              PEER-TO-PEER SECURE LINK
            </span>
            
            <div className="flex items-center text-5xl sm:text-7xl font-black tracking-tighter">
              <span className="text-zinc-300 mr-4">CONNECT</span>
              <span className="relative text-blue-500 font-black text-6xl sm:text-8xl px-6 py-2.5 border border-blue-500/40 rounded-2xl bg-blue-500/10 backdrop-blur-md shadow-[0_0_40px_rgba(59,130,246,0.4)]">
                X
              </span>
            </div>
            
            {/* Matrix Loading indicators */}
            <div className="mt-12 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
