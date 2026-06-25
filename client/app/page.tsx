'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, ShieldCheck, Lock, Phone, FileText, Palette, 
  ArrowRight, Cpu, Layers, Terminal, AlertCircle, Menu, X 
} from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* 1. STICKY GLASSMORPHIC HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <span className="text-xl font-black tracking-tighter text-white">
              CONNECT
            </span>
            <span className="px-2 py-0.5 text-sm font-black text-blue-400 border border-blue-500/30 rounded bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.2)]">
              X
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button 
              onClick={() => scrollToSection('features')} 
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('security')} 
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              Security
            </button>
            <button 
              onClick={() => scrollToSection('stack')} 
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              Stack
            </button>
            <span className="w-px h-4 bg-zinc-800" />
            <span className="text-xs uppercase tracking-widest font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.0.0 Active
            </span>
          </nav>

          {/* Header Call to Action */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => router.push('/login')}
              className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button 
              onClick={() => router.push('/login')}
              className="relative inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/20 rounded-xl transition-all duration-300 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.5)] active:scale-95 cursor-pointer"
            >
              Launch Console
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-zinc-950/95 backdrop-blur-lg px-4 pt-2 pb-6 space-y-4">
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-left py-2 text-base font-medium text-zinc-400 hover:text-white"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('security')} 
                className="text-left py-2 text-base font-medium text-zinc-400 hover:text-white"
              >
                Security
              </button>
              <button 
                onClick={() => scrollToSection('stack')} 
                className="text-left py-2 text-base font-medium text-zinc-400 hover:text-white"
              >
                Stack
              </button>
            </div>
            <div className="border-t border-zinc-800 pt-4 flex flex-col gap-3">
              <button 
                onClick={() => router.push('/login')}
                className="w-full text-center py-2 text-sm font-semibold text-zinc-300 hover:text-white border border-white/10 rounded-xl"
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/login')}
                className="w-full text-center py-3 text-xs font-bold uppercase tracking-widest text-white bg-blue-600 rounded-xl"
              >
                Launch Console
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* Ambient background gradients (Static blur) */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* 3D SVG Hands (Static Background Layer, toned down opacity to ensure high readability and zero visual clutter) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center -z-10 select-none overflow-hidden opacity-[0.12]">
          <div className="relative w-full max-w-[1200px] h-[500px]">
            {/* Left Hand Vector pointing Center */}
            <div className="absolute right-[52%] top-1/2 -translate-y-1/2">
              <svg width="450" height="280" viewBox="0 0 430 280" fill="none">
                <defs>
                  <linearGradient id="hero-hand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>
                <path
                  d="M 100 135 C 115 128, 140 118, 160 111 C 166 97, 185 89, 205 89 C 220 89, 235 93, 260 93 L 398 93 C 402 93, 405 95, 405 98 C 405 101, 402 103, 398 103 L 268 103 C 274 109, 282 115, 282 121 C 282 127, 274 133, 262 133 L 235 133 C 242 139, 248 145, 248 151 C 248 157, 242 163, 228 163 L 205 163 C 212 169, 217 175, 217 181 C 217 187, 210 193, 192 193 C 162 193, 125 185, 95 165 Z"
                  fill="url(#hero-hand-grad)"
                />
                <circle cx="205" cy="89" r="4.5" fill="#3b82f6" />
                <circle cx="398" cy="93" r="4" fill="#ffffff" />
              </svg>
            </div>
            
            {/* Right Hand Vector pointing Center (Mirrored) */}
            <div className="absolute left-[52%] top-1/2 -translate-y-1/2 transform scale-x-[-1]">
              <svg width="450" height="280" viewBox="0 0 430 280" fill="none">
                <path
                  d="M 100 135 C 115 128, 140 118, 160 111 C 166 97, 185 89, 205 89 C 220 89, 235 93, 260 93 L 398 93 C 402 93, 405 95, 405 98 C 405 101, 402 103, 398 103 L 268 103 C 274 109, 282 115, 282 121 C 282 127, 274 133, 262 133 L 235 133 C 242 139, 248 145, 248 151 C 248 157, 242 163, 228 163 L 205 163 C 212 169, 217 175, 217 181 C 217 187, 210 193, 192 193 C 162 193, 125 185, 95 165 Z"
                  fill="url(#hero-hand-grad)"
                />
                <circle cx="205" cy="89" r="4.5" fill="#10b981" />
                <circle cx="398" cy="93" r="4" fill="#ffffff" />
              </svg>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 z-10 select-none">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/10 bg-blue-500/5 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] leading-none">
            <Lock className="w-3.5 h-3.5" /> Zero-Trust Peer-to-Peer Protocol
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight text-white leading-none">
            Enterprise Sandboxed <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-emerald-400">
              Communication
            </span>
          </h1>

          {/* Decisive description (no jargon, professional value prop) */}
          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl leading-relaxed mt-2">
            Establish encrypted direct WebRTC data tunnels and high-fidelity audio streams directly between browsers. 
            No relay servers storing messages, no persistent databases, and zero footprint.
          </p>

          {/* Dual Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
            <button
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl py-4 px-10 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.5)] transition-all duration-300 cursor-pointer active:scale-95"
            >
              Get Connect ID <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/5 text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-xl py-4 px-10 flex items-center justify-center transition-all duration-300"
            >
              Explore Architecture
            </button>
          </div>

        </div>

      </section>

      {/* 3. ENTERPRISE FEATURES SECTION */}
      <section id="features" className="py-24 border-t border-white/5 bg-zinc-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-[0.3em] font-black text-blue-400 mb-3">
              Core Capabilities
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for Secure, Instant Collaborations
            </p>
            <p className="text-zinc-500 text-sm mt-3">
              Connect X unifies the features of secure modern collaboration suites directly in-browser. 
              No downloads, no administrative approvals, and absolute security by default.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1: Voice calling */}
            <ScrollReveal className="h-full" delay={0}>
              <div className="h-full glass-panel border border-white/5 hover:border-blue-500/25 hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] rounded-2xl p-8 flex flex-col gap-5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Direct Voice Call</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    Establish instant cryptographic peer connections for high-fidelity audio streams. 
                    Your conversation flows directly from your microphone to their speakers, bypassing centralized listeners.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 2: Ephemeral file sharing */}
            <ScrollReveal className="h-full" delay={150}>
              <div className="h-full glass-panel border border-white/5 hover:border-blue-500/25 hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] rounded-2xl p-8 flex flex-col gap-5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Secure File Stream</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    Send files of any size directly from memory. Files are read as chunks, fed through E2E data channels, 
                    and flushed immediately. Files never touch a cloud storage folder.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Feature 3: Drawing sandbox */}
            <ScrollReveal className="h-full" delay={300}>
              <div className="h-full glass-panel border border-white/5 hover:border-blue-500/25 hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] rounded-2xl p-8 flex flex-col gap-5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">P2P Sandbox Sketchpad</h3>
                  <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                    Collaborate visually on a secure sandbox canvas. Drawing lines and pointer coordinates are streamed 
                    instantaneously via data channels. Purge operations wipe coordinates completely.
                  </p>
                </div>
              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* 4. SECURITY & ARCHITECTURE SECTION */}
      <section id="security" className="py-24 border-t border-white/5 bg-zinc-950/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Scheme / Graphic */}
            <ScrollReveal className="order-2 lg:order-1">
              <div className="glass-panel border border-white/5 rounded-2xl p-6 sm:p-8 font-mono text-[11px] text-zinc-400 space-y-6">
                
                {/* Protocol Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-blue-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" /> SECURE_TUNNEL_STATE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400 border border-blue-500/20">
                    ESTABLISHED
                  </span>
                </div>

                {/* Flow Schema */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/2 p-3 rounded-lg border border-white/5">
                    <span className="text-white">1. Connect ID Request</span>
                    <span className="text-zinc-500">Signaling Server</span>
                  </div>

                  {/* Signaling Lines */}
                  <div className="pl-6 border-l border-blue-500/20 py-2 space-y-2">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span>↳</span>
                      <span>Client A requests ICE candidates</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span>↳</span>
                      <span>Client B performs SDP handshake</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white/2 p-3 rounded-lg border border-white/5">
                    <span className="text-white">2. Peer Connection</span>
                    <span className="text-blue-400">Direct WebRTC Data / Audio Tunnel</span>
                  </div>

                  {/* Direct E2E Tunnel Lines */}
                  <div className="pl-6 border-l border-emerald-500/20 py-2 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <span>↳</span>
                      <span>Signaling Server connection is closed</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500">
                      <span>↳</span>
                      <span>Direct connection: Voice, File, Canvas</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                    <span className="text-red-400">3. Session Tear Down</span>
                    <span className="text-red-400/70">Wipe Client Memory</span>
                  </div>
                </div>

                {/* Explanatory footer inside schema */}
                <div className="pt-2 text-[10px] text-zinc-500 leading-relaxed">
                  // Connect X implements passwordless authentication. Identities are tied to public keys. 
                  All chats, voice streams, and sketchpad data exist purely in device memory and are destroyed permanently on tab closure.
                </div>

              </div>
            </ScrollReveal>

            {/* Explanatory Copy */}
            <ScrollReveal className="order-1 lg:order-2 space-y-6">
              <h2 className="text-xs uppercase tracking-[0.3em] font-black text-blue-400">
                Zero-Trust Security
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                No Intermediary Databases. No Log Dumps.
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Connect X establishes true decentralization. We built the signaling layer strictly to broker the handshake connection. 
                Once client browsers exchange address mappings, the direct WebRTC peer connection initiates, and client communication bypasses our systems entirely.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">RAM Ephemerality</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      All messages, active files, and sandbox strokes are kept in temporary browser state and wiped immediately.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0 mt-1">
                    <Cpu className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Local Analysis AI</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Uses browser-level heuristic and transformer engines to categorize sentiment. Zero network requests sent.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* 5. TECH STACK SECTION */}
      <section id="stack" className="py-24 border-t border-white/5 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-[0.3em] font-black text-blue-400 mb-3">
              Standard Architecture
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Powered by Modern Web Technologies
            </p>
          </div>

          {/* Stack Grids */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            
            <ScrollReveal delay={0}>
              <div className="glass-panel border border-white/5 rounded-2xl p-6 hover:bg-white/2 transition-colors duration-200">
                <div className="text-lg font-black text-white mb-1">Next.js 15</div>
                <div className="text-zinc-500 text-xs">App Router & SSG</div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="glass-panel border border-white/5 rounded-2xl p-6 hover:bg-white/2 transition-colors duration-200">
                <div className="text-lg font-black text-blue-400 mb-1">WebRTC</div>
                <div className="text-zinc-500 text-xs">E2E Data & Audio Channels</div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="glass-panel border border-white/5 rounded-2xl p-6 hover:bg-white/2 transition-colors duration-200">
                <div className="text-lg font-black text-emerald-400 mb-1">Socket.io</div>
                <div className="text-zinc-500 text-xs">LAN-Ready Signaling</div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="glass-panel border border-white/5 rounded-2xl p-6 hover:bg-white/2 transition-colors duration-200">
                <div className="text-lg font-black text-purple-400 mb-1">SQLite & Prisma</div>
                <div className="text-zinc-500 text-xs">Identity Database</div>
              </div>
            </ScrollReveal>

          </div>

          {/* Quick Notice */}
          <div className="mt-12 p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 text-zinc-400 text-xs flex items-center justify-center gap-2 max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
            <span>
              Connect X does not log communication payloads. Signaling messages are ephemeral packets that are purged from node memory.
            </span>
          </div>

        </div>
      </section>

      {/* 6. ENTERPRISE FOOTER */}
      <footer className="mt-auto border-t border-white/5 bg-zinc-950 py-12 text-zinc-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-white tracking-tighter">CONNECT X</span>
            <span className="text-zinc-800">|</span>
            <span>&copy; {new Date().getFullYear()} All Rights Reserved.</span>
          </div>

          {/* Security details / Status */}
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              E2E Encryption Certified
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              100% Peer-to-Peer
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
