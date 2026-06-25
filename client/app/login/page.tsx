'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, User, PlusCircle, ArrowRight, Copy, Check, Info } from 'lucide-react';

const getBackendUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const hostname = window.location.hostname;
  return `http://${hostname}:5000`;
};

const BACKEND_URL = getBackendUrl();

export default function LoginPage() {
  const router = useRouter();
  
  // Tab states: 'login' or 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Input fields
  const [username, setUsername] = useState('');
  const [connectId, setConnectId] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedUser, setGeneratedUser] = useState<{ username: string; connectId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Redirect to chat if already authenticated
  useEffect(() => {
    const savedUser = localStorage.getItem('connect_x_user');
    if (savedUser) {
      try {
        JSON.parse(savedUser);
        router.push('/chat');
      } catch (e) {
        localStorage.removeItem('connect_x_user');
      }
    }
  }, [router]);

  // Clear errors when switching tabs
  useEffect(() => {
    setError('');
    setUsername('');
    setConnectId('');
    setGeneratedUser(null);
  }, [activeTab]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Connect ID');
      }

      setGeneratedUser(data);
      // Save user profile immediately to localStorage
      localStorage.setItem('connect_x_user', JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectId.trim()) {
      setError('Please enter a Connect ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid Connect ID');
      }

      // Save user profile to localStorage
      localStorage.setItem('connect_x_user', JSON.stringify(data));
      
      // Redirect to chat room
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your Connect ID.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedUser) return;
    navigator.clipboard.writeText(generatedUser.connectId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-zinc-950">
      {/* Visual Ambient glow rings */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Network Nodes (Decorative) */}
      <div className="absolute top-10 left-10 w-24 h-24 border border-white/5 rounded-full flex items-center justify-center bg-white/1 -z-10 antigravity-3">
        <div className="w-2 h-2 rounded-full bg-blue-500/40 animate-ping" />
      </div>
      <div className="absolute bottom-20 right-10 w-32 h-32 border border-white/5 rounded-full flex items-center justify-center bg-white/1 -z-10 antigravity-2">
        <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
      </div>

      {/* App Branding */}
      <div className="mb-6 flex flex-col items-center select-none animate-fade-in z-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tighter flex items-center gap-2">
          CONNECT
          <span className="text-blue-500 px-2 py-0.5 border border-blue-500/20 rounded bg-blue-500/5 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
            X
          </span>
        </h1>
        <p className="text-zinc-500 text-xs tracking-wider uppercase mt-1">Zero-Trust Peer-to-Peer Network</p>
      </div>

      {/* Main Glassmorphism Card with Floating Animation */}
      <div className="w-full max-w-md glass-panel-neon-blue rounded-2xl p-6 sm:p-8 antigravity-1 z-10">
        {/* Tab Headers */}
        {!generatedUser && (
          <div className="flex border-b border-white/10 mb-6 pb-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-3 text-sm font-semibold tracking-wide transition-all duration-300 relative ${
                activeTab === 'login' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Enter Network
              {activeTab === 'login' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 pb-3 text-sm font-semibold tracking-wide transition-all duration-300 relative ${
                activeTab === 'register' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Generate Identity
              {activeTab === 'register' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              )}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-start gap-2 animate-shake">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Enter Network (Login) */}
        {!generatedUser && activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="connectId" className="text-zinc-400 text-xs uppercase tracking-widest font-semibold block">
                Connect ID (6 Characters)
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="connectId"
                  type="text"
                  placeholder="e.g. AX79Z8"
                  maxLength={6}
                  value={connectId}
                  onChange={(e) => setConnectId(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.5)] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authenticate & Enter'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* Tab 2: Generate Identity (Register) */}
        {!generatedUser && activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-zinc-400 text-xs uppercase tracking-widest font-semibold block">
                Choose a Handle / Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="username"
                  type="text"
                  placeholder="e.g. Alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.5)] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate ID & Join'}
              {!loading && <PlusCircle className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* Identity Confirmation view (Shown after Registering) */}
        {generatedUser && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Identity Generated!</h3>
              <p className="text-zinc-500 text-xs">
                Welcome, <span className="text-zinc-300 font-semibold">{generatedUser.username}</span>. Your unique Connect ID is shown below:
              </p>
            </div>

            {/* Glowing Connect ID Display Box */}
            <div className="relative border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5 flex items-center justify-between gap-4 font-mono tracking-widest text-emerald-400 select-all glass-panel">
              <span className="text-xl sm:text-2xl font-bold ml-2">{generatedUser.connectId}</span>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all duration-200 active:scale-95"
                title="Copy to Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Warning note */}
            <div className="text-left p-3 rounded-lg border border-white/5 bg-white/1 text-zinc-500 text-2xs space-y-1">
              <span className="font-semibold text-zinc-400 block">🔒 Privacy & Security:</span>
              <p>This is a passwordless system. Keep this ID safe. Anyone with this ID can connect as you.</p>
            </div>

            <button
              onClick={() => router.push('/chat')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all duration-300"
            >
              Enter Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-zinc-600 text-2xs uppercase tracking-widest font-medium z-10">
        🔒 Connect X is End-to-End Encrypted
      </div>
    </div>
  );
}
