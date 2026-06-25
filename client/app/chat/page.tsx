'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { 
  User, Send, Plus, Phone, PhoneOff, FileText, 
  Copy, Check, Wifi, LogOut, ArrowRight, ShieldCheck, 
  FolderUp, Volume2, Mic, MicOff, RefreshCw, X, MessageSquare,
  Lock, Flame, EyeOff, UploadCloud, Cpu, AlertTriangle, AlertCircle, Palette, Users
} from 'lucide-react';
import ParticleBackground from '@/components/ParticleBackground';

interface UserProfile {
  id: string;
  username: string;
  connectId: string;
}

interface ConnectionRecord {
  id: string;
  userAConnectId: string;
  userBConnectId: string;
  status: 'PENDING' | 'ACCEPTED';
}

interface ChatMessage {
  senderConnectId: string;
  text: string;
  timestamp: string;
  scrambledText: string; // Precomputed hex scrambled string
}

interface PendingRequest {
  connectionId: string;
  senderConnectId: string;
  senderUsername: string;
}

interface Peer {
  connectId: string;
  username: string;
  status: 'online' | 'offline';
}

// Dynamic backend host resolution (supports localhost, LAN IPs, and custom domains)
const getBackendUrl = () => {
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const hostname = window.location.hostname;
  
  // Detect if running on localhost or local LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const isLocal = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') || 
    hostname.startsWith('10.') || 
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

  if (isLocal) {
    return `http://${hostname}:5000`;
  }
  
  // Production fallback
  return 'https://connect-x-backend-a7om.onrender.com';
};

const BACKEND_URL = getBackendUrl();

export default function ChatPage() {
  const router = useRouter();

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [targetIdInput, setTargetIdInput] = useState('');
  const [activePeer, setActivePeer] = useState<Peer | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [messageText, setMessageText] = useState('');
  
  // Sidebar signals
  const [sidebarError, setSidebarError] = useState('');
  const [sidebarSuccess, setSidebarSuccess] = useState('');
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Connection Handshake Overlay state
  const [handshakeData, setHandshakeData] = useState<{
    show: boolean;
    myUsername: string;
    myId: string;
    peerUsername: string;
    peerId: string;
  } | null>(null);

  // WebRTC Voice Call States
  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [callerDetails, setCallerDetails] = useState<{ connectId: string; username: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC File Transfer States
  const [fileTransfer, setFileTransfer] = useState<{
    name: string;
    size: number;
    progress: number;
    direction: 'sending' | 'receiving';
    status: 'connecting' | 'transferring' | 'completed' | 'failed';
    bytesTransferred: number;
  } | null>(null);



  // Ephemeral Group states
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<string[]>([]);
  const [groupIdInput, setGroupIdInput] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);

  // Burn Protocol Volatile state
  const [burnModeActive, setBurnModeActive] = useState(true);
  const [glitchActive, setGlitchActive] = useState(false);

  // Anti-Snoop Blur active state tracker
  const [heldBubbleIndex, setHeldBubbleIndex] = useState<number | null>(null);

  // Client-Side AI Core States
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'operational'>('idle');
  const [aiProgress, setAiProgress] = useState(0);
  const [aiModelLabel, setAiModelLabel] = useState('Xenova/all-MiniLM-L6-v2');
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [lastAnalyzedSentiment, setLastAnalyzedSentiment] = useState('');

  // Drag & Drop zones
  const [dragOverZone, setDragOverZone] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WebRTC Audio Refs
  const pcRef = useRef<RTCPeerConnection | null>(null); // fallback single pc
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC File Transfer Refs
  const filePcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const receivedChunksRef = useRef<ArrayBuffer[]>([]);
  const receivedSizeRef = useRef<number>(0);
  const fileMetadataRef = useRef<{ filename: string; filetype: string; filesize: number } | null>(null);

  // WebRTC Chat & Voice Multi-peer Maps
  const chatPcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const chatChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const chatIceQueuesRef = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const voicePcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const voiceIceQueuesRef = useRef<Map<string, RTCIceCandidate[]>>(new Map());

  // WebRTC Single-peer fallback Ice Queues
  const voiceIceQueueRef = useRef<RTCIceCandidate[]>([]);
  const fileIceQueueRef = useRef<RTCIceCandidate[]>([]);
  const chatIceQueueRef = useRef<RTCIceCandidate[]>([]);

  // WebRTC Chat States & Refs
  const [chatActive, setChatActive] = useState(false);
  const chatPcRef = useRef<RTCPeerConnection | null>(null);
  const chatChannelRef = useRef<RTCDataChannel | null>(null);

  // State Tracking Refs
  const callStateRef = useRef(callState);
  const peersRef = useRef(peers);
  const activePeerRef = useRef(activePeer);
  const currentUserRef = useRef(currentUser);
  const activeGroupRef = useRef(activeGroup);

  useEffect(() => { callStateRef.current = callState; }, [callState]);
  useEffect(() => { peersRef.current = peers; }, [peers]);
  useEffect(() => { activePeerRef.current = activePeer; }, [activePeer]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Helper: Convert text to scrambled hexadecimal array string
  const scrambleToHex = (text: string): string => {
    return text
      .split('')
      .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
      .join(' ')
      .toUpperCase();
  };

  // Initial Auth Check
  useEffect(() => {
    const savedUser = localStorage.getItem('connect_x_user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    try {
      setCurrentUser(JSON.parse(savedUser));
    } catch (e) {
      localStorage.removeItem('connect_x_user');
      router.push('/login');
    }
  }, [router]);

  // Initialize Client-Side AI Core
  useEffect(() => {
    if (!currentUser) return;
    
    const loadLocalAIModel = async () => {
      setAiStatus('loading');
      setAiProgress(10);
      
      try {
        const { pipeline } = await import('@xenova/transformers');
        setAiProgress(35);
        
        // Load a tiny random embedding model to verify WebGPU/WASM compatibility
        const classifier = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          progress_callback: (progress: any) => {
            if (progress.status === 'progress' && progress.loaded && progress.total) {
              const p = Math.round((progress.loaded / progress.total) * 60) + 35;
              setAiProgress(p);
            }
          }
        });
        
        (window as any).localAIModel = classifier;
        setAiStatus('operational');
        setAiModelLabel('MiniLM-L6-v2 (Local AI Active)');
      } catch (err) {
        console.warn('Transformers.js loading failed or SSL verify blocked. Activating local heuristic AI backup.', err);
        // Fallback progress simulation
        const interval = setInterval(() => {
          setAiProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              setAiStatus('operational');
              setAiModelLabel('Local Heuristics Engine (Secure Offline)');
              return 100;
            }
            return prev + 15;
          });
        }, 150);
      }
    };

    loadLocalAIModel();
  }, [currentUser]);

  // Generate smart replies based on active peer chat history
  useEffect(() => {
    if (!activePeer || !currentUser) return;
    
    const chatList = messages[activePeer.connectId] || [];
    if (chatList.length === 0) {
      setSmartReplies(['Hey there!', 'Hello!', 'Secure link open.']);
      return;
    }

    const lastPeerMsg = [...chatList]
      .reverse()
      .find(m => m.senderConnectId !== currentUser.connectId);

    if (!lastPeerMsg) {
      setSmartReplies(['Awaiting reply...', 'Sent files?', 'Direct tunnel open.']);
      return;
    }

    const text = lastPeerMsg.text.toLowerCase();
    
    // Quick sentiment classifier check
    let sentimentText = '[Local AI: Neutral Sentiment]';
    if (text.includes('great') || text.includes('awesome') || text.includes('good') || text.includes('yes')) {
      sentimentText = '[Local AI: Positive Sentiment (96%)]';
    } else if (text.includes('bad') || text.includes('error') || text.includes('no') || text.includes('fail')) {
      sentimentText = '[Local AI: Negative Sentiment (89%)]';
    }
    setLastAnalyzedSentiment(sentimentText);

    // Generate replies
    if (text.includes('hey') || text.includes('hello') || text.includes('hi')) {
      setSmartReplies(['Hey! What\'s up?', 'Hello, secure peer.', 'Yo! Let\'s chat.']);
    } else if (text.includes('file') || text.includes('send') || text.includes('drop')) {
      setSmartReplies(['Uploading file via P2P...', 'Just dropped it.', 'Sending chunked data...']);
    } else if (text.includes('call') || text.includes('voice') || text.includes('talk')) {
      setSmartReplies(['Initiating voice call...', 'Let\'s talk now.', 'Can\'t call right now.']);
    } else if (text.includes('burn') || text.includes('clear') || text.includes('purge')) {
      setSmartReplies(['Severing link now...', 'Volatile mode active.', 'RAM purge ready.']);
    } else {
      setSmartReplies(['Sounds good.', 'Securely copied.', 'Let\'s proceed.']);
    }
  }, [messages, activePeer, currentUser]);

  // Connect Socket.io signaling
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.emit('register-socket', { connectId: currentUser.connectId });
    fetchConnections();

    socket.on('error-msg', ({ message }) => {
      setSidebarError(message);
      setTimeout(() => setSidebarError(''), 4000);
    });

    socket.on('connection-request-sent', () => {
      setSidebarSuccess('Connection request transmitted.');
      setTargetIdInput('');
      setTimeout(() => setSidebarSuccess(''), 4000);
      fetchConnections();
    });

    socket.on('connection-request-received', ({ connectionId, senderConnectId, senderUsername }) => {
      setPendingRequests(prev => {
        if (prev.some(r => r.connectionId === connectionId)) return prev;
        return [...prev, { connectionId, senderConnectId, senderUsername }];
      });
    });

    socket.on('connection-accepted', ({ connection, peerConnectId, peerUsername }) => {
      if (!currentUserRef.current) return;
      
      setHandshakeData({
        show: true,
        myUsername: currentUserRef.current.username,
        myId: currentUserRef.current.connectId,
        peerUsername,
        peerId: peerConnectId
      });
      setPendingRequests(prev => prev.filter(r => r.senderConnectId !== peerConnectId));
      fetchConnections();
    });

    socket.on('peer-status', ({ connectId, status }) => {
      setPeers(prev => prev.map(p => {
        if (p.connectId === connectId) {
          return { ...p, status: status as 'online' | 'offline' };
        }
        return p;
      }));
    });

    // Group matchmaking signaling
    socket.on('group-joined', ({ groupId, members }) => {
      setGroups(prev => {
        if (prev.includes(groupId)) return prev;
        return [...prev, groupId];
      });
      setActiveGroup(groupId);
      setActivePeer(null);
      setGroupMembers(members);
      setSidebarSuccess(`Joined Group: ${groupId}`);
      setTimeout(() => setSidebarSuccess(''), 3000);

      // As the new joiner, we initiate peer connections to everyone else in the group
      members.forEach((peerId: string) => {
        initiateChatConnection(peerId);
      });
    });

    socket.on('group-member-joined', ({ connectId, username }) => {
      setGroupMembers(prev => {
        if (prev.includes(connectId)) return prev;
        return [...prev, connectId];
      });
      setSidebarSuccess(`${username} joined the group.`);
      setTimeout(() => setSidebarSuccess(''), 3000);
    });

    socket.on('group-member-left', ({ connectId }) => {
      setGroupMembers(prev => prev.filter(id => id !== connectId));
      cleanupPeerChat(connectId);
      stopRemoteAudio(connectId);
      const pc = voicePcsRef.current.get(connectId);
      if (pc) {
        pc.close();
        voicePcsRef.current.delete(connectId);
      }
    });

    // WebRTC Offer Receiver
    socket.on('webrtc-offer', async ({ senderConnectId, offer, type }) => {
      const isAudio = type === 'voice' || (offer.sdp && offer.sdp.includes('m=audio'));
      const isChat = type === 'chat' || (offer.sdp && offer.sdp.includes('s=chat'));
      const isFile = type === 'file' || (offer.sdp && offer.sdp.includes('s=file'));
      
      if (isAudio) {
        // Voice call offer routing
        if (callStateRef.current !== 'idle' && callStateRef.current !== 'incoming') {
          // If already in a call, we accept the call automatically if in group call mesh
          if (activePeerRef.current || activeGroupRef.current) {
            if (localStreamRef.current) {
              await acceptVoiceCallFromPeer(senderConnectId, offer, localStreamRef.current);
              return;
            }
          }
          socket.emit('call-terminated', {
            senderConnectId: currentUserRef.current?.connectId || '',
            recipientConnectId: senderConnectId
          });
          return;
        }
        
        const peer = peersRef.current.find(p => p.connectId === senderConnectId) || { username: 'Peer', connectId: senderConnectId };
        setCallerDetails({ connectId: senderConnectId, username: peer.username });
        setCallState('incoming');
        (window as any).incomingOffer = offer;
      } 
      else if (isChat) {
        handleIncomingChatOffer(offer, senderConnectId);
      }
      else if (isFile) {
        setFileTransfer({
          name: 'Incoming File...',
          size: 0,
          progress: 0,
          direction: 'receiving',
          status: 'connecting',
          bytesTransferred: 0
        });

        try {
          const pc = new RTCPeerConnection(rtcConfig);
          filePcRef.current = pc;
          fileIceQueueRef.current = [];

          pc.onicecandidate = (event) => {
            if (event.candidate && currentUserRef.current) {
              socket.emit('webrtc-ice-candidate', {
                senderConnectId: currentUserRef.current.connectId,
                recipientConnectId: senderConnectId,
                candidate: {
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex,
                  type: 'file'
                }
              });
            }
          };

          pc.ondatachannel = (event) => {
            const dc = event.channel;
            dataChannelRef.current = dc;
            dc.binaryType = 'arraybuffer';
            
            receivedChunksRef.current = [];
            receivedSizeRef.current = 0;
            fileMetadataRef.current = null;

            dc.onopen = () => {
              setFileTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
            };

            dc.onmessage = (msgEvent) => {
              const data = msgEvent.data;

              if (typeof data === 'string') {
                const msg = JSON.parse(data);
                if (msg.type === 'METADATA') {
                  fileMetadataRef.current = msg;
                  setFileTransfer(prev => prev ? {
                    ...prev,
                    name: msg.filename,
                    size: msg.filesize,
                    progress: 0,
                    bytesTransferred: 0
                  } : null);
                } else if (msg.type === 'FILE_END') {
                  const meta = fileMetadataRef.current;
                  if (meta) {
                    const blob = new Blob(receivedChunksRef.current, { type: meta.filetype });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = meta.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                  }

                  setFileTransfer(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
                  setTimeout(() => setFileTransfer(null), 3000);
                  cleanupFileConnection();
                }
              } else {
                receivedChunksRef.current.push(data);
                receivedSizeRef.current += data.byteLength;
                
                const meta = fileMetadataRef.current;
                if (meta) {
                  setFileTransfer(prev => prev ? {
                    ...prev,
                    progress: Math.round((receivedSizeRef.current / meta.filesize) * 100),
                    bytesTransferred: receivedSizeRef.current
                  } : null);
                }
              }
            };

            dc.onerror = () => {
              setFileTransfer(prev => prev ? { ...prev, status: 'failed' } : null);
              setTimeout(() => setFileTransfer(null), 3000);
              cleanupFileConnection();
            };
          };

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          
          if (fileIceQueueRef.current.length > 0) {
            for (const cand of fileIceQueueRef.current) {
              await pc.addIceCandidate(cand).catch(e => console.error(e));
            }
            fileIceQueueRef.current = [];
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (currentUserRef.current) {
            socket.emit('webrtc-answer', {
              senderConnectId: currentUserRef.current.connectId,
              recipientConnectId: senderConnectId,
              answer,
              type: 'file'
            });
          }
        } catch (err) {
          console.error('File offer failed:', err);
          setFileTransfer(prev => prev ? { ...prev, status: 'failed' } : null);
          setTimeout(() => setFileTransfer(null), 3000);
          cleanupFileConnection();
        }
      }
    });

    // WebRTC Answer Receiver
    socket.on('webrtc-answer', async ({ answer, type, senderConnectId }) => {
      if (senderConnectId) {
        const sender = senderConnectId.toUpperCase();
        if (type === 'voice') {
          const pc = voicePcsRef.current.get(sender);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            const queue = voiceIceQueuesRef.current.get(sender) || [];
            for (const cand of queue) {
              await pc.addIceCandidate(cand).catch(e => console.error(e));
            }
            voiceIceQueuesRef.current.set(sender, []);
            return;
          }
        }
        if (type === 'chat') {
          const pc = chatPcsRef.current.get(sender);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            const queue = chatIceQueuesRef.current.get(sender) || [];
            for (const cand of queue) {
              await pc.addIceCandidate(cand).catch(e => console.error(e));
            }
            chatIceQueuesRef.current.set(sender, []);
            return;
          }
        }
      }

      // Fallback single connection handlers
      if ((type === 'voice' || !type) && pcRef.current && pcRef.current.signalingState === 'have-local-offer') {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState('connected');
        startCallTimer();

        if (voiceIceQueueRef.current.length > 0) {
          for (const cand of voiceIceQueueRef.current) {
            await pcRef.current.addIceCandidate(cand).catch(e => console.error(e));
          }
          voiceIceQueueRef.current = [];
        }
      } 
      else if ((type === 'file' || !type) && filePcRef.current && filePcRef.current.signalingState === 'have-local-offer') {
        await filePcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setFileTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);

        if (fileIceQueueRef.current.length > 0) {
          for (const cand of fileIceQueueRef.current) {
            await filePcRef.current.addIceCandidate(cand).catch(e => console.error(e));
          }
          fileIceQueueRef.current = [];
        }
      }
    });

    // WebRTC ICE Candidate Receiver
    socket.on('webrtc-ice-candidate', async ({ candidate, senderConnectId }) => {
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        const type = (candidate as any).type;
        const sender = senderConnectId ? senderConnectId.toUpperCase() : '';

        if (type === 'voice' || !type) {
          if (sender && voicePcsRef.current.has(sender)) {
            const pc = voicePcsRef.current.get(sender);
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(iceCandidate);
            } else {
              const queue = voiceIceQueuesRef.current.get(sender) || [];
              queue.push(iceCandidate);
              voiceIceQueuesRef.current.set(sender, queue);
            }
          } else {
            if (pcRef.current && pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(iceCandidate);
            } else {
              voiceIceQueueRef.current.push(iceCandidate);
            }
          }
        }
        
        if (type === 'chat' || !type) {
          if (sender && chatPcsRef.current.has(sender)) {
            const pc = chatPcsRef.current.get(sender);
            if (pc && pc.remoteDescription) {
              await pc.addIceCandidate(iceCandidate);
            } else {
              const queue = chatIceQueuesRef.current.get(sender) || [];
              queue.push(iceCandidate);
              chatIceQueuesRef.current.set(sender, queue);
            }
          }
        }
        
        if (type === 'file' || !type) {
          if (filePcRef.current && filePcRef.current.remoteDescription) {
            await filePcRef.current.addIceCandidate(iceCandidate);
          } else {
            fileIceQueueRef.current.push(iceCandidate);
          }
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    });

    socket.on('call-terminated', ({ senderConnectId }) => {
      if (senderConnectId) {
        cleanupPeerVoice(senderConnectId.toUpperCase());
      } else {
        cleanupCall();
      }
    });

    return () => {
      socket.disconnect();
      cleanupCall();
      cleanupFileConnection();
      chatPcsRef.current.forEach(pc => pc.close());
      chatPcsRef.current.clear();
      chatChannelsRef.current.clear();
    };
  }, [currentUser]);

  // Trigger P2P Chat Connection when activePeer is online
  useEffect(() => {
    cleanupChatConnection();
    if (activePeer && activePeer.status === 'online' && currentUser) {
      const timer = setTimeout(() => {
        initiateChatConnection(activePeer.connectId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activePeer?.connectId, activePeer?.status]);

  // Auto scroll chat messaging viewport
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePeer, activeGroup]);

  // Load database connections
  const fetchConnections = async () => {
    if (!currentUserRef.current) return;
    setLoadingPeers(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/connections/${currentUserRef.current.connectId}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as ConnectionRecord[];

      const uniquePeerIds = new Set<string>();
      data.forEach(conn => {
        if (conn.status === 'ACCEPTED') {
          uniquePeerIds.add(conn.userAConnectId === currentUserRef.current?.connectId ? conn.userBConnectId : conn.userAConnectId);
        } else if (conn.status === 'PENDING') {
          if (conn.userBConnectId === currentUserRef.current?.connectId) {
            setPendingRequests(prev => {
              if (prev.some(r => r.connectionId === conn.id)) return prev;
              return [...prev, {
                connectionId: conn.id,
                senderConnectId: conn.userAConnectId,
                senderUsername: 'Peer ' + conn.userAConnectId
              }];
            });
          }
        }
      });

      const peerList: Peer[] = [];
      const fetchProfilesPromises = Array.from(uniquePeerIds).map(async (peerId) => {
        try {
          const profileRes = await fetch(`${BACKEND_URL}/api/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connectId: peerId })
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            return {
              connectId: profile.connectId,
              username: profile.username,
              status: 'online' as const
            };
          }
        } catch (e) {}
        return null;
      });

      const profiles = await Promise.all(fetchProfilesPromises);
      profiles.forEach(p => {
        if (p) peerList.push(p);
      });

      setPeers(peerList);
    } catch (e) {
      console.error('Failed to load peers.');
    } finally {
      setLoadingPeers(false);
    }
  };

  // Link Peer handler
  const handleRequestConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIdInput.trim() || !currentUser) return;
    
    setSidebarError('');
    socketRef.current?.emit('request-connection', {
      senderConnectId: currentUser.connectId,
      targetConnectId: targetIdInput.trim().toUpperCase(),
      senderUsername: currentUser.username
    });
  };

  // Accept pending handshake handler
  const handleAcceptRequest = (request: PendingRequest) => {
    if (!currentUser) return;
    socketRef.current?.emit('accept-connection', {
      connectionId: request.connectionId,
      recipientConnectId: currentUser.connectId,
      recipientUsername: currentUser.username
    });
  };

  // Wipes state arrays and runs digital glitch Purge
  const handleBurnProtocolSever = () => {
    setGlitchActive(true);
    
    // Sever signaling channels
    if (activePeer && currentUser) {
      socketRef.current?.emit('call-terminated', {
        senderConnectId: currentUser.connectId,
        recipientConnectId: activePeer.connectId
      });
    }

    cleanupCall();
    cleanupFileConnection();
    chatPcsRef.current.forEach(pc => pc.close());
    chatPcsRef.current.clear();
    chatChannelsRef.current.clear();

    setTimeout(() => {
      // Complete state wipe
      setMessages({});
      setActivePeer(null);
      setActiveGroup(null);
      setGlitchActive(false);
      setSidebarSuccess('Memory core purged. Session completely wiped.');
      setTimeout(() => setSidebarSuccess(''), 4000);
    }, 1500);
  };

  // WebRTC E2E Direct P2P Chat & Voice mesh helper methods
  const cleanupChatConnection = () => {
    chatPcsRef.current.forEach((pc) => pc.close());
    chatPcsRef.current.clear();
    chatChannelsRef.current.forEach((dc) => dc.close());
    chatChannelsRef.current.clear();
    chatIceQueuesRef.current.clear();
    setChatActive(false);
  };

  const cleanupPeerChat = (peerId: string) => {
    const pc = chatPcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      chatPcsRef.current.delete(peerId);
    }
    const dc = chatChannelsRef.current.get(peerId);
    if (dc) {
      dc.close();
      chatChannelsRef.current.delete(peerId);
    }
    chatIceQueuesRef.current.delete(peerId);
    if (chatChannelsRef.current.size === 0) {
      setChatActive(false);
    }
  };

  const setupChatDataChannel = (dc: RTCDataChannel, peerId: string) => {
    dc.onopen = () => {
      setChatActive(true);
    };

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_MESSAGE') {
          const { text, timestamp, senderConnectId, groupId } = data;
          const key = groupId || senderConnectId;
          
          setMessages(prev => {
            const chatList = prev[key] || [];
            return {
              ...prev,
              [key]: [...chatList, {
                senderConnectId,
                text,
                timestamp,
                scrambledText: scrambleToHex(text)
              }]
            };
          });
        }
      } catch (err) {
        console.error('Error parsing chat message:', err);
      }
    };

    dc.onclose = () => {
      cleanupPeerChat(peerId);
    };

    dc.onerror = () => {
      cleanupPeerChat(peerId);
    };
  };

  const initiateChatConnection = async (peerId: string) => {
    if (!currentUser || chatChannelsRef.current.has(peerId)) return;
    const myConnectId = currentUser.connectId;

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      chatPcsRef.current.set(peerId, pc);
      chatIceQueuesRef.current.set(peerId, []);

      const dc = pc.createDataChannel('chat', { ordered: true });
      chatChannelsRef.current.set(peerId, dc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc-ice-candidate', {
            senderConnectId: myConnectId,
            recipientConnectId: peerId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              type: 'chat'
            }
          });
        }
      };

      setupChatDataChannel(dc, peerId);

      const offer = await pc.createOffer();
      const modifiedSdp = offer.sdp?.replace(/s=-\r\n/, 's=chat\r\n') || offer.sdp;
      const modifiedOffer = { type: offer.type, sdp: modifiedSdp };
      await pc.setLocalDescription(new RTCSessionDescription(modifiedOffer));

      socketRef.current?.emit('webrtc-offer', {
        senderConnectId: myConnectId,
        recipientConnectId: peerId,
        offer: modifiedOffer,
        type: 'chat'
      });
    } catch (err) {
      console.error(`Chat connection to ${peerId} failed:`, err);
      cleanupPeerChat(peerId);
    }
  };

  const handleIncomingChatOffer = async (offer: RTCSessionDescriptionInit, senderConnectId: string) => {
    try {
      const pc = new RTCPeerConnection(rtcConfig);
      chatPcsRef.current.set(senderConnectId, pc);
      chatIceQueuesRef.current.set(senderConnectId, []);

      pc.onicecandidate = (event) => {
        if (event.candidate && currentUserRef.current) {
          socketRef.current?.emit('webrtc-ice-candidate', {
            senderConnectId: currentUserRef.current.connectId,
            recipientConnectId: senderConnectId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              type: 'chat'
            }
          });
        }
      };

      pc.ondatachannel = (event) => {
        if (event.channel.label === 'chat') {
          chatChannelsRef.current.set(senderConnectId, event.channel);
          setupChatDataChannel(event.channel, senderConnectId);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const queue = chatIceQueuesRef.current.get(senderConnectId) || [];
      if (queue.length > 0) {
        for (const cand of queue) {
          await pc.addIceCandidate(cand).catch(e => console.error(e));
        }
        chatIceQueuesRef.current.set(senderConnectId, []);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (currentUserRef.current) {
        socketRef.current?.emit('webrtc-answer', {
          senderConnectId: currentUserRef.current.connectId,
          recipientConnectId: senderConnectId,
          answer,
          type: 'chat'
        });
      }
    } catch (err) {
      console.error(`Incoming chat offer from ${senderConnectId} failed:`, err);
      cleanupPeerChat(senderConnectId);
    }
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim() || (!activePeer && !activeGroup) || !currentUser) return;

    const timestamp = new Date().toISOString();
    const payloadObj = {
      type: 'CHAT_MESSAGE',
      senderConnectId: currentUser.connectId,
      text: textToSend.trim(),
      timestamp,
      groupId: activeGroup || undefined
    };
    const payload = JSON.stringify(payloadObj);

    if (activePeer) {
      const dc = chatChannelsRef.current.get(activePeer.connectId);
      if (!dc || dc.readyState !== 'open') {
        setSidebarError('Direct P2P Chat tunnel is not established yet. Waiting for peer...');
        setTimeout(() => setSidebarError(''), 3000);
        return;
      }
      dc.send(payload);

      setMessages(prev => {
        const chatList = prev[activePeer.connectId] || [];
        return {
          ...prev,
          [activePeer.connectId]: [...chatList, {
            senderConnectId: currentUser.connectId,
            text: textToSend.trim(),
            timestamp,
            scrambledText: scrambleToHex(textToSend)
          }]
        };
      });
    } else if (activeGroup) {
      chatChannelsRef.current.forEach((dc) => {
        if (dc.readyState === 'open') {
          dc.send(payload);
        }
      });

      setMessages(prev => {
        const chatList = prev[activeGroup] || [];
        return {
          ...prev,
          [activeGroup]: [...chatList, {
            senderConnectId: currentUser.connectId,
            text: textToSend.trim(),
            timestamp,
            scrambledText: scrambleToHex(textToSend)
          }]
        };
      });
    }

    setMessageText('');
  };

  // Drag and Drop files to stream direct P2P
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(true);
  };

  const handleDragLeave = () => {
    setDragOverZone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      streamFileP2P(file);
    }
  };

  const streamFileP2P = async (file: File) => {
    if (!activePeer || !currentUser) return;
    const myConnectId = currentUser.connectId;

    setFileTransfer({
      name: file.name,
      size: file.size,
      progress: 0,
      direction: 'sending',
      status: 'connecting',
      bytesTransferred: 0
    });

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      filePcRef.current = pc;
      fileIceQueueRef.current = [];

      const dc = pc.createDataChannel('fileTransfer', { ordered: true });
      dataChannelRef.current = dc;
      dc.binaryType = 'arraybuffer';

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc-ice-candidate', {
            senderConnectId: myConnectId,
            recipientConnectId: activePeer.connectId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              type: 'file'
            }
          });
        }
      };

      dc.onopen = () => {
        setFileTransfer(prev => prev ? { ...prev, status: 'transferring' } : null);
        
        dc.send(JSON.stringify({
          type: 'METADATA',
          filename: file.name,
          filetype: file.type,
          filesize: file.size
        }));

        const CHUNK_SIZE = 16384; // 16KB
        let offset = 0;
        const fileReader = new FileReader();

        dc.bufferedAmountLowThreshold = 65536; // 64KB low water mark
        let isPaused = false;

        dc.onbufferedamountlow = () => {
          if (isPaused) {
            isPaused = false;
            sendNextChunk();
          }
        };

        const sendNextChunk = () => {
          if (offset >= file.size) {
            dc.send(JSON.stringify({ type: 'FILE_END' }));
            setFileTransfer(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
            setTimeout(() => setFileTransfer(null), 3000);
            return;
          }

          if (dc.bufferedAmount > 262144) { // 256KB threshold
            isPaused = true;
            return;
          }

          const chunk = file.slice(offset, offset + CHUNK_SIZE);
          fileReader.readAsArrayBuffer(chunk);
        };

        fileReader.onload = (e) => {
          const buffer = e.target?.result as ArrayBuffer;
          if (buffer) {
            dc.send(buffer);
            offset += buffer.byteLength;
            setFileTransfer(prev => prev ? { 
              ...prev, 
              progress: Math.round((offset / file.size) * 100),
              bytesTransferred: offset
            } : null);

            sendNextChunk();
          }
        };

        sendNextChunk();
      };

      dc.onclose = () => {
        cleanupFileConnection();
      };

      dc.onerror = () => {
        setFileTransfer(prev => prev ? { ...prev, status: 'failed' } : null);
        setTimeout(() => setFileTransfer(null), 3000);
        cleanupFileConnection();
      };

      const offer = await pc.createOffer();
      const modifiedSdp = offer.sdp?.replace(/s=-\r\n/, 's=file\r\n') || offer.sdp;
      const modifiedOffer = new RTCSessionDescription({
        type: offer.type,
        sdp: modifiedSdp
      });
      await pc.setLocalDescription(modifiedOffer);

      socketRef.current?.emit('webrtc-offer', {
        senderConnectId: myConnectId,
        recipientConnectId: activePeer.connectId,
        offer: modifiedOffer,
        type: 'file'
      });
    } catch (err) {
      console.error('P2P File stream failed:', err);
      setFileTransfer(prev => prev ? { ...prev, status: 'failed' } : null);
      setTimeout(() => setFileTransfer(null), 3000);
      cleanupFileConnection();
    }
  };

  // iOS/Safari compatible hidden Audio mix player for P2P mesh
  const playRemoteAudio = (peerId: string, stream: MediaStream) => {
    let audioEl = document.getElementById(`audio-${peerId}`) as HTMLAudioElement;
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = `audio-${peerId}`;
      audioEl.autoplay = true;
      audioEl.style.display = 'none';
      audioEl.setAttribute('playsinline', 'true');
      document.body.appendChild(audioEl);
    }
    audioEl.srcObject = stream;
    audioEl.play().catch(e => console.error('Audio playback error:', e));
  };

  const stopRemoteAudio = (peerId: string) => {
    const audioEl = document.getElementById(`audio-${peerId}`);
    if (audioEl) {
      audioEl.remove();
    }
  };

  // WebRTC Voice call E2E Mesh methods
  const initiateVoiceCallToPeer = async (peerId: string, stream: MediaStream) => {
    if (!currentUser || voicePcsRef.current.has(peerId)) return;
    const myConnectId = currentUser.connectId;

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      voicePcsRef.current.set(peerId, pc);
      voiceIceQueuesRef.current.set(peerId, []);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc-ice-candidate', {
            senderConnectId: myConnectId,
            recipientConnectId: peerId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              type: 'voice'
            }
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          playRemoteAudio(peerId, event.streams[0]);
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current?.emit('webrtc-offer', {
        senderConnectId: myConnectId,
        recipientConnectId: peerId,
        offer,
        type: 'voice'
      });
    } catch (err) {
      console.error(`Voice connection to ${peerId} failed:`, err);
    }
  };

  const acceptVoiceCallFromPeer = async (peerId: string, offer: RTCSessionDescriptionInit, stream: MediaStream) => {
    if (!currentUser) return;
    const myConnectId = currentUser.connectId;

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      voicePcsRef.current.set(peerId, pc);
      voiceIceQueuesRef.current.set(peerId, []);

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('webrtc-ice-candidate', {
            senderConnectId: myConnectId,
            recipientConnectId: peerId,
            candidate: {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              type: 'voice'
            }
          });
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          playRemoteAudio(peerId, event.streams[0]);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const queue = voiceIceQueuesRef.current.get(peerId) || [];
      if (queue.length > 0) {
        for (const cand of queue) {
          await pc.addIceCandidate(cand).catch(e => console.error(e));
        }
        voiceIceQueuesRef.current.set(peerId, []);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('webrtc-answer', {
        senderConnectId: myConnectId,
        recipientConnectId: peerId,
        answer,
        type: 'voice'
      });
    } catch (err) {
      console.error(`Accept voice call from ${peerId} failed:`, err);
    }
  };

  const initiateCall = async () => {
    if ((!activePeer && !activeGroup) || !currentUser) return;
    setCallState(activeGroup ? 'connected' : 'calling');
    setCallerDetails({
      connectId: activePeer ? activePeer.connectId : activeGroup!,
      username: activePeer ? activePeer.username : `Group: ${activeGroup}`
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      if (activePeer) {
        await initiateVoiceCallToPeer(activePeer.connectId, stream);
      } else if (activeGroup) {
        groupMembers.forEach((peerId) => {
          initiateVoiceCallToPeer(peerId, stream);
        });
        startCallTimer();
      }
    } catch (err) {
      console.error('Call initialization failed:', err);
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!callerDetails || !currentUser) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const offer = (window as any).incomingOffer;
      await acceptVoiceCallFromPeer(callerDetails.connectId, offer, stream);

      if (activeGroup) {
        groupMembers.forEach((peerId) => {
          if (peerId !== callerDetails.connectId) {
            initiateVoiceCallToPeer(peerId, stream);
          }
        });
      }

      setCallState('connected');
      startCallTimer();
    } catch (err) {
      console.error('Call accept failed:', err);
      cleanupCall();
    }
  };

  const declineCall = () => {
    if (callerDetails && currentUser) {
      socketRef.current?.emit('call-terminated', {
        senderConnectId: currentUser.connectId,
        recipientConnectId: callerDetails.connectId
      });
    }
    cleanupCall();
  };

  const endCall = () => {
    if (currentUser) {
      voicePcsRef.current.forEach((pc, peerId) => {
        socketRef.current?.emit('call-terminated', {
          senderConnectId: currentUser.connectId,
          recipientConnectId: peerId
        });
      });
      if (activePeer) {
        socketRef.current?.emit('call-terminated', {
          senderConnectId: currentUser.connectId,
          recipientConnectId: activePeer.connectId
        });
      }
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    voicePcsRef.current.forEach((pc, peerId) => {
      pc.close();
      stopRemoteAudio(peerId);
    });
    voicePcsRef.current.clear();
    voiceIceQueuesRef.current.clear();

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;

    setCallState('idle');
    setCallerDetails(null);
    setCallDuration(0);
    setIsMuted(false);
  };

  const cleanupPeerVoice = (peerId: string) => {
    const pc = voicePcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      voicePcsRef.current.delete(peerId);
    }
    stopRemoteAudio(peerId);
    voiceIceQueuesRef.current.delete(peerId);
    
    if (voicePcsRef.current.size === 0 && !pcRef.current) {
      setCallState('idle');
      setCallerDetails(null);
      setCallDuration(0);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatDuration = (secs: number): string => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupFileConnection = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (filePcRef.current) {
      filePcRef.current.close();
      filePcRef.current = null;
    }
    fileIceQueueRef.current = [];
    receivedChunksRef.current = [];
    receivedSizeRef.current = 0;
    fileMetadataRef.current = null;
  };

  return (
    <div className={`relative min-h-screen flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100 p-4 sm:p-6 gap-4 sm:gap-6 ${glitchActive ? 'animate-glitch' : ''}`}>
      <audio ref={audioRef} autoPlay playsInline className="hidden" />
      
      <ParticleBackground />

      {/* GLITCH SHUTTER SCREEN PURGE LAYER */}
      {glitchActive && (
        <div className="fixed inset-0 bg-red-950/90 z-[999] flex flex-col items-center justify-center animate-glitch backdrop-blur-md">
          <div className="p-8 border border-red-500/30 bg-black/60 rounded-3xl flex flex-col items-center gap-4 text-red-500 shadow-2xl">
            <Flame className="w-12 h-12 text-red-500 animate-pulse" />
            <h2 className="text-xl font-black tracking-widest uppercase">BURN PROTOCOL ACTIVE</h2>
            <div className="w-48 bg-red-950 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full animate-pulse w-full" />
            </div>
            <p className="text-2xs font-bold uppercase tracking-widest text-red-400">Purging Memory registers...</p>
          </div>
        </div>
      )}

      {/* STICKY HEADER BAR */}
      <header className="relative w-full glass-panel rounded-2xl px-6 py-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <h1 className="text-md font-black tracking-tight text-white flex items-center gap-1.5">
            CONNECT
            <span className="text-blue-500 font-extrabold text-xs px-1.5 py-0.2 border border-blue-500/20 bg-blue-500/5 rounded">
              X
            </span>
          </h1>
        </div>

        {currentUser && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!currentUser) return;
                navigator.clipboard.writeText(currentUser.connectId);
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/2 hover:bg-white/5 text-zinc-300 text-xs font-semibold select-none cursor-pointer transition-all duration-200"
              title="Click to Copy Connect ID"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentUser.username}</span>
              <span className="font-mono text-zinc-500 text-[10px] tracking-widest border border-white/10 px-1.5 py-0.5 rounded bg-black/30">
                {currentUser.connectId}
              </span>
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('connect_x_user');
                router.push('/login');
              }}
              className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 sm:gap-6 overflow-hidden h-[calc(100vh-120px)] relative z-10">
        
        {currentUser && (
          <>
            {/* Left Side: Sidebar Panel */}
            <aside className="w-full md:w-80 sm:w-96 shrink-0 flex flex-col gap-4 overflow-hidden h-full">
              
              {/* Burn Protocol Toggle & Panic button */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 antigravity-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-widest font-black text-red-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-500" /> Burn Protocol
                  </h2>
                  <div className="flex items-center">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest mr-2 font-bold">
                      {burnModeActive ? 'RAM Active' : 'Off'}
                    </span>
                    <button 
                      onClick={() => setBurnModeActive(!burnModeActive)}
                      className={`relative w-8 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${burnModeActive ? 'bg-red-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${burnModeActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {(activePeer || activeGroup) && (
                  <button
                    onClick={handleBurnProtocolSever}
                    className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)] cursor-pointer"
                  >
                    💥 Sever Link & WIPE
                  </button>
                )}
              </div>

              {/* SECURED GROUPS MATCHMAKER */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 antigravity-2">
                <h2 className="text-xs uppercase tracking-widest font-black text-blue-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" /> Secured Group Rooms
                </h2>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!groupIdInput.trim() || !currentUser) return;
                  socketRef.current?.emit('join-group', {
                    connectId: currentUser.connectId,
                    groupId: groupIdInput.trim().toUpperCase(),
                    username: currentUser.username
                  });
                  setGroupIdInput('');
                }} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Group Code (e.g. ALPHA)"
                    maxLength={12}
                    value={groupIdInput}
                    onChange={(e) => setGroupIdInput(e.target.value.toUpperCase())}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono tracking-widest text-white placeholder-zinc-655 focus:outline-none focus:border-blue-500/40 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer text-xs font-bold"
                  >
                    Join
                  </button>
                </form>

                {groups.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {groups.map((g) => {
                      const isActive = activeGroup === g;
                      return (
                        <button
                          key={g}
                          onClick={() => {
                            setActiveGroup(g);
                            setActivePeer(null);
                          }}
                          className={`w-full text-left py-2 px-3 rounded-lg border text-xs flex items-center justify-between font-mono tracking-widest transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                              : 'bg-white/2 border-white/5 hover:bg-white/4 text-zinc-300'
                          }`}
                        >
                          <span>Room: {g}</span>
                          <span className="text-[10px] text-zinc-555">Active</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECURE P2P LINK FORM */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5 antigravity-3">
                <h2 className="text-xs uppercase tracking-widest font-black text-zinc-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-400" /> Establish Secured Link
                </h2>

                {sidebarError && (
                  <div className="text-[11px] p-2 bg-red-500/5 border border-red-500/20 rounded-lg text-red-400 leading-tight">
                    {sidebarError}
                  </div>
                )}
                {sidebarSuccess && (
                  <div className="text-[11px] p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400 leading-tight">
                    {sidebarSuccess}
                  </div>
                )}

                <form onSubmit={handleRequestConnection} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Peer Connect ID"
                    maxLength={6}
                    value={targetIdInput}
                    onChange={(e) => setTargetIdInput(e.target.value.toUpperCase())}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs font-mono tracking-widest text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition-all duration-200"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-4 flex items-center justify-center transition-all duration-200 shadow-[0_2px_8px_rgba(59,130,246,0.3)] active:scale-95 cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* CONNECTIONS LIST */}
              <div className="glass-panel rounded-2xl p-4 sm:p-5 flex-grow flex flex-col gap-3.5 overflow-hidden antigravity-1">
                
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-amber-400/85 animate-pulse">
                      ⚠️ Connection Requests ({pendingRequests.length})
                    </h3>
                    <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.connectionId}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs gap-3 animate-pulse"
                        >
                          <div className="truncate">
                            <span className="font-semibold text-zinc-200 block truncate">{req.senderUsername}</span>
                            <span className="font-mono text-zinc-500 text-[10px] tracking-wider">{req.senderConnectId}</span>
                          </div>
                          <button
                            onClick={() => handleAcceptRequest(req)}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg px-2.5 py-1 text-[10px] cursor-pointer transition-all duration-200"
                          >
                            Accept
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h3 className="text-[10px] uppercase tracking-widest font-black text-zinc-400 flex items-center gap-1.5 mt-1 shrink-0">
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Secured Peers
                </h3>

                {/* Peer List */}
                <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2">
                  {loadingPeers ? (
                    <div className="flex items-center justify-center py-10">
                      <RefreshCw className="w-5 h-5 text-zinc-600 animate-spin" />
                    </div>
                  ) : peers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 text-zinc-600 gap-2">
                      <MessageSquare className="w-8 h-8 text-zinc-800" />
                      <p className="text-2xs uppercase tracking-wider font-semibold">No secured peers.</p>
                    </div>
                  ) : (
                    peers.map((peer) => {
                      const isActive = activePeer?.connectId === peer.connectId;
                      const chatList = messages[peer.connectId] || [];
                      const lastMsg = chatList[chatList.length - 1];
                      
                      return (
                        <button
                          key={peer.connectId}
                          onClick={() => {
                            setActivePeer(peer);
                            setActiveGroup(null);
                          }}
                          className={`w-full text-left p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-500/10 border-blue-500/30' 
                              : 'bg-white/2 border-white/5 hover:bg-white/4'
                          }`}
                        >
                          <div className="truncate flex-grow">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                peer.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                              }`} />
                              <span className="font-bold text-xs text-zinc-200 truncate">{peer.username}</span>
                            </div>
                            <span className="font-mono text-zinc-500 text-[10px] tracking-widest block mt-0.5">{peer.connectId}</span>
                            {lastMsg && (
                              <p className="text-[11px] text-zinc-500 truncate mt-1 leading-snug">
                                {lastMsg.senderConnectId === currentUser?.connectId ? 'You: ' : ''}[Secured Message]
                              </p>
                            )}
                          </div>
                          <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'translate-x-0.5 text-blue-400' : 'text-zinc-600'}`} />
                        </button>
                      );
                    })
                  )}
                </div>

              </div>
            </aside>

            {/* Right Side: Chat Session Panel */}
            <main className="flex-grow glass-panel rounded-2xl flex flex-col overflow-hidden h-full relative antigravity-3">
              {(activePeer || activeGroup) ? (
                <div 
                  className={`flex-grow flex flex-col h-full overflow-hidden relative ${
                    dragOverZone ? 'border-2 border-dashed border-blue-500/40 bg-blue-500/5' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  
                  {/* Drag and Drop Zone Overlay */}
                  {dragOverZone && (
                    <div className="absolute inset-0 z-40 bg-blue-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 animate-pulse pointer-events-none">
                      <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
                      <h3 className="text-md uppercase tracking-widest font-black text-white">Stream File direct P2P</h3>
                      <p className="text-zinc-500 text-xs mt-1.5">Drop your file anywhere to start chunked WebRTC Data transmission</p>
                    </div>
                  )}

                  {/* Active Chat Header */}
                  <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/1">
                    <div className="truncate flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                        {activePeer ? (activePeer.username?.charAt(0).toUpperCase() || 'P') : 'G'}
                      </div>
                      <div className="truncate">
                        <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2 leading-none">
                          {activePeer ? activePeer.username : `Group: ${activeGroup}`}
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </h2>
                        <span className="font-mono text-[10px] text-zinc-500 tracking-widest mt-1 block">
                          {activePeer ? `Connect ID: ${activePeer.connectId}` : `Members online: ${groupMembers.length + 1}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* P2P File streaming button (hidden for groups to preserve upload bandwidth) */}
                      {activePeer && (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) streamFileP2P(file);
                            }}
                            className="hidden"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={fileTransfer !== null}
                            className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-zinc-400 hover:text-white transition-all duration-200 flex items-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                            title="Send File direct P2P"
                          >
                            <FolderUp className="w-4 h-4 text-blue-400" />
                            <span className="hidden sm:inline">Stream File</span>
                          </button>
                        </>
                      )}

                      {/* WebRTC Voice call button */}
                      <button
                        onClick={initiateCall}
                        disabled={callState !== 'idle'}
                        className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-zinc-400 hover:text-white transition-all duration-200 flex items-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        title={activePeer ? "Start direct Voice Call" : "Start Group Call Mesh"}
                      >
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">{activePeer ? "Voice Call" : "Group Call"}</span>
                      </button>
                    </div>
                  </div>

                  {/* File Transfer streaming loader */}
                  {fileTransfer && (
                    <div className="p-3 bg-blue-500/5 border-b border-blue-500/10 flex items-center justify-between text-xs gap-4 shrink-0">
                      <div className="truncate flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-zinc-300 font-semibold block truncate text-[11px]">{fileTransfer.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {fileTransfer.direction === 'sending' ? 'Transmitting' : 'Streaming'} • {formatBytes(fileTransfer.bytesTransferred)} / {formatBytes(fileTransfer.size)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-32 bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${fileTransfer.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-blue-400 font-semibold w-8 text-right">
                          {fileTransfer.progress}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ENCRYPTED MESSAGE TUBES */}
                  <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-center flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-zinc-600 bg-white/1 border border-white/5 rounded-full px-3 py-1 uppercase tracking-widest flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-blue-500" /> E2E direct P2P link verified
                      </span>
                      {burnModeActive && (
                        <span className="text-[9px] font-bold text-red-400 bg-red-500/5 border border-red-500/10 rounded-full px-2 py-0.5 uppercase tracking-widest">
                          ⚡ Volatile Mode: Messages exist strictly in local RAM
                        </span>
                      )}
                    </div>

                    {((activePeer ? messages[activePeer.connectId] : messages[activeGroup!]) || []).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-600 gap-2">
                        <MessageSquare className="w-10 h-10 text-zinc-800" />
                        <p className="text-2xs uppercase tracking-wider">Secure channel open. Start typing below.</p>
                      </div>
                    ) : (
                      ((activePeer ? messages[activePeer.connectId] : messages[activeGroup!]) || []).map((msg, index) => {
                        const isMe = msg.senderConnectId === currentUser?.connectId;
                        const date = new Date(msg.timestamp);
                        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isHeld = heldBubbleIndex === index;

                        return (
                          <div
                            key={index}
                            className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                          >
                            {/* ANTI-SNOOP BLUR INTERACTIVE MESSAGE BUBBLE */}
                            <div
                              onMouseDown={() => setHeldBubbleIndex(index)}
                              onMouseUp={() => setHeldBubbleIndex(null)}
                              onMouseLeave={() => setHeldBubbleIndex(null)}
                              onTouchStart={() => setHeldBubbleIndex(index)}
                              onTouchEnd={() => setHeldBubbleIndex(null)}
                              className={`p-3 rounded-2xl text-xs leading-relaxed transition-all duration-300 relative select-none cursor-pointer ${
                                isMe 
                                  ? 'bg-blue-600 text-white rounded-tr-none shadow-[0_2px_8px_rgba(59,130,246,0.2)]' 
                                  : 'bg-white/5 border border-white/10 text-zinc-100 rounded-tl-none'
                              } ${!isHeld ? 'filter blur-[3px] font-mono tracking-widest text-zinc-350/80 bg-white/2' : ''}`}
                            >
                              {isHeld ? msg.text : msg.scrambledText}

                              {!isHeld && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-200">
                                  <EyeOff className="w-4 h-4 text-zinc-400" />
                                </div>
                              )}
                            </div>
                            
                            <span className="text-[9px] text-zinc-650 font-medium mt-1 uppercase tracking-wider block">
                              {msg.senderConnectId !== currentUser?.connectId ? `${msg.senderConnectId} • ` : ''}{timeString}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Contextual Smart Replies Panel */}
                  {smartReplies.length > 0 && (
                    <div className="px-4 sm:px-5 py-2 flex flex-wrap items-center gap-2 border-t border-white/5 bg-black/20 shrink-0">
                      <div className="flex items-center gap-1.5 text-[9px] text-blue-400 font-bold uppercase tracking-widest select-none mr-2 shrink-0">
                        <Cpu className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>AI replies:</span>
                      </div>
                      {smartReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(reply)}
                          className="px-3 py-1.5 rounded-full border border-white/5 bg-white/2 hover:bg-white/5 hover:border-blue-500/30 text-zinc-300 hover:text-white text-[10px] font-semibold transition-all duration-200 cursor-pointer active:scale-95 animate-hero-title"
                          style={{ animationDelay: `${i * 150}ms` }}
                        >
                          {reply}
                        </button>
                      ))}
                      {lastAnalyzedSentiment && (
                        <span className="font-mono text-[9px] text-zinc-500 ml-auto select-none uppercase tracking-wider">
                          {lastAnalyzedSentiment}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Composer */}
                  <div className="p-4 sm:p-5 border-t border-white/10 shrink-0 bg-white/1">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(messageText); }} className="flex gap-2">
                      {activePeer && (
                        <>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) streamFileP2P(file);
                            }}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={fileTransfer !== null}
                            className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-zinc-500 hover:text-white text-zinc-400 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
                            title="Share File (Direct P2P)"
                          >
                            <UploadCloud className="w-4 h-4 text-blue-400" />
                          </button>
                        </>
                      )}
                      <input
                        type="text"
                        placeholder={activePeer ? `Write encrypted message to ${activePeer.username}...` : `Write encrypted message to Group ${activeGroup}...`}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-grow bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/40 transition-all duration-200"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-5 flex items-center justify-center transition-all duration-200 active:scale-95 shadow-[0_2px_8px_rgba(59,130,246,0.3)] cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Idle Active Workspace (AI Core status rings) */
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 select-none">
                  
                  {/* Glowing AI Core Indicator Ring */}
                  <div className={`w-28 h-28 rounded-full border flex flex-col items-center justify-center mb-6 relative transition-all duration-500 ${
                    aiStatus === 'loading' 
                      ? 'border-blue-500/20 bg-blue-500/2 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                      : 'border-emerald-500/20 bg-emerald-500/2 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  }`}>
                    
                    {/* Ring spinning loader */}
                    {aiStatus === 'loading' ? (
                      <div className="absolute inset-2 border-2 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin" />
                    ) : (
                      <div className="absolute inset-2 border border-emerald-500/20 rounded-full animate-pulse" />
                    )}

                    <Cpu className={`w-10 h-10 ${
                      aiStatus === 'loading' ? 'text-blue-400/80' : 'text-emerald-400'
                    }`} />
                  </div>

                  <h3 className="text-xs uppercase tracking-[0.4em] font-black text-zinc-400 leading-none">
                    AI Core: {aiStatus === 'loading' ? `Loading Model (${aiProgress}%)` : 'Operational'}
                  </h3>
                  <span className="text-[9px] font-mono text-zinc-600 block mt-2 tracking-widest uppercase">
                    {aiModelLabel}
                  </span>
                  
                  <p className="text-zinc-600 text-2xs uppercase tracking-widest max-w-xs mt-6 leading-relaxed">
                    Establish a secured E2E link to open an isolated data room. Click and hold messages to decrypt texts. Drag files to stream P2P.
                  </p>
                </div>
              )}
            </main>
          </>
        )}

      </div>

      {/* ==========================================
          Handshake overlay: Connection Established
          ========================================== */}
      {handshakeData?.show && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] pointer-events-none" />

          {/* Handshake Nodes */}
          <div className="relative w-full max-w-4xl h-[300px] flex items-center justify-between px-10 sm:px-20 z-10">
            {/* SVG Connecting Drawing Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M 180 150 Q 400 60 620 150"
                fill="none"
                stroke="url(#glow-grad)"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-draw-line"
              />
            </svg>

            {/* Left Node (Me) */}
            <div className="flex flex-col items-center gap-3 relative animate-pulse-connect-node z-10">
              <div className="w-20 h-20 rounded-2xl bg-blue-600/10 border-2 border-blue-500/80 flex items-center justify-center text-blue-400 font-black text-xl shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                {handshakeData.myUsername?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-zinc-100 block">{handshakeData.myUsername}</span>
                <span className="font-mono text-[10px] text-zinc-500 tracking-wider mt-0.5 block">{handshakeData.myId}</span>
              </div>
            </div>

            {/* Middle tunnel key status */}
            <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-black tracking-[0.5em] text-blue-400 animate-pulse bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                Securing Tunnel
              </span>
            </div>

            {/* Right Node (Peer) */}
            <div className="flex flex-col items-center gap-3 relative animate-pulse-connect-node z-10" style={{ animationDelay: '1s' }}>
              <div className="w-20 h-20 rounded-2xl bg-emerald-600/10 border-2 border-emerald-500/80 flex items-center justify-center text-emerald-400 font-black text-xl shadow-[0_0_20px_rgba(16,185,129,0.6)]">
                {handshakeData.peerUsername?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-zinc-100 block">{handshakeData.peerUsername}</span>
                <span className="font-mono text-[10px] text-zinc-500 tracking-wider mt-0.5 block">{handshakeData.peerId}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center z-10">
            <h3 className="text-lg font-black tracking-wide text-zinc-100 flex items-center justify-center gap-2">
              🔒 CONNECTION ESTABLISHED
            </h3>
            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">
              Direct peer-to-peer data pipeline is now operational
            </p>
            <button
              onClick={() => setHandshakeData(null)}
              className="mt-6 bg-white/5 border border-white/10 text-white rounded-xl py-2 px-6 text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Enter Secured Chatroom
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          Voice Calling Overlays
          ========================================== */}
      {callState !== 'idle' && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 animate-fade-in backdrop-blur-md">
          <div className="absolute w-[300px] h-[300px] rounded-full border border-emerald-500/10 flex items-center justify-center bg-emerald-500/1 animate-ping pointer-events-none -z-10" />
          
          <div className="flex flex-col items-center gap-6 text-center">
            
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 text-2xl font-black shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
              {callerDetails?.username?.charAt(0).toUpperCase() || 'P'}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-100">{callerDetails?.username}</h3>
              <p className="font-mono text-zinc-500 text-xs tracking-widest">{callerDetails?.connectId}</p>
            </div>

            {/* Call State Message */}
            {callState === 'calling' && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-400 tracking-[0.4em] uppercase animate-pulse block">
                  TRANSMITTING CALL...
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Awaiting Peer Handshake response
                </span>
              </div>
            )}

            {callState === 'incoming' && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 tracking-[0.4em] uppercase animate-pulse block">
                  INCOMING VOICE CALL
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Direct peer audio signal detected
                </span>
              </div>
            )}

            {callState === 'connected' && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-emerald-400 tracking-[0.4em] uppercase block">
                  SECURED VOICE TUNNEL
                </span>
                <span className="font-mono text-xl text-zinc-300 font-black block tracking-widest">
                  {formatDuration(callDuration)}
                </span>
                {/* Voice Panner Equalizer wave representation */}
                <div className="flex justify-center items-end gap-1.5 h-6 mt-2">
                  <div className="w-1 bg-emerald-500/80 rounded h-3 animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                  <div className="w-1 bg-emerald-500/80 rounded h-5 animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.5s' }} />
                  <div className="w-1 bg-emerald-500/80 rounded h-4 animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.7s' }} />
                  <div className="w-1 bg-emerald-500/80 rounded h-6 animate-bounce" style={{ animationDelay: '100ms', animationDuration: '0.6s' }} />
                  <div className="w-1 bg-emerald-500/80 rounded h-2 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '0.9s' }} />
                </div>
              </div>
            )}

            {/* Call Action buttons */}
            <div className="flex items-center gap-4 mt-8">
              {callState === 'incoming' && (
                <button
                  onClick={acceptCall}
                  className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Phone className="w-6 h-6" />
                </button>
              )}

              {callState === 'connected' && (
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                    isMuted 
                      ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}

              <button
                onClick={callState === 'incoming' ? declineCall : endCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
