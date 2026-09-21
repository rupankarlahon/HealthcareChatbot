"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ArrowUp, Info, MoreVertical, Zap } from "lucide-react";
import BlobBot from "../components/BlobBot";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  uiCard?: any;
}



const parseBold = (str: string) => {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

const renderMessageContent = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const listMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (listMatch) {
       return (
         <div key={idx} className="flex items-start gap-3 mt-4 mb-2">
           <span className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-slate-200/60 border border-slate-300 text-[11px] font-bold text-slate-700 mt-0.5 shadow-sm">
             {listMatch[1]}
           </span>
           <span className="flex-1 text-slate-700 pt-0.5">{parseBold(listMatch[2])}</span>
         </div>
       );
    }
    return <div key={idx} className={line.trim() === "" ? "h-2" : "min-h-[1.5rem]"}>{parseBold(line)}</div>;
  });
};

function TrackingOrb({ 
  state, 
  mousePosition, 
}: { 
  state: "idle" | "typing" | "smile", 
  mousePosition: {x: number, y: number}, 
}) {
  const orbRef = useRef<HTMLDivElement>(null);
  const [orbCenter, setOrbCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCenter = () => {
      if (orbRef.current) {
        const rect = orbRef.current.getBoundingClientRect();
        setOrbCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }
    };
    updateCenter();
    window.addEventListener('resize', updateCenter);
    window.addEventListener('scroll', updateCenter);
    return () => {
      window.removeEventListener('resize', updateCenter);
      window.removeEventListener('scroll', updateCenter);
    };
  }, []);

  const dx = mousePosition.x - (orbCenter.x || window.innerWidth / 2);
  const dy = mousePosition.y - (orbCenter.y || window.innerHeight / 2);
  
  const normX = Math.max(-1, Math.min(1, dx / 400));
  const normY = Math.max(-1, Math.min(1, dy / 400));
  
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const triggerBlink = () => {
      if (state === "idle") {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
      timeout = setTimeout(triggerBlink, 2500 + Math.random() * 3000);
    };
    timeout = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(timeout);
  }, [state]);

  const eAngle = Math.atan2(dy, dx);
  const eDist = Math.min(Math.hypot(dx, dy) / 40, 8); 
  const eyeOffsetX = Math.cos(eAngle) * eDist;
  const eyeOffsetY = Math.sin(eAngle) * eDist;

  // Subtle 3D tilt
  const rotateY = normX * 15; 
  const rotateX = -normY * 15; 

  return (
    <div ref={orbRef} className="relative w-[120px] h-[100px] pointer-events-none flex flex-col items-center justify-end z-40" style={{ perspective: "800px" }}>
      
      {/* True 3D Avatar (Clean & Smooth) */}
      <motion.div 
        animate={{ 
          rotateX, 
          rotateY,
          y: [0, -4, 0]
        }}
        transition={{ 
          rotateX: { type: "spring", stiffness: 150, damping: 25 },
          rotateY: { type: "spring", stiffness: 150, damping: 25 },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
        className="relative flex flex-col items-center justify-center w-[110px] h-[110px] rounded-full bg-gradient-to-b from-[#1a2b3c] to-[#01060d] shadow-[0_15px_35px_rgba(44,176,255,0.4),inset_0_-15px_30px_rgba(0,0,0,0.9)] overflow-hidden"
      >
         {/* Smooth Dark Core */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e3a5f_0%,#01060d_70%)] opacity-80" />

         {/* Floating Inner Content (Eyes) */}
         <div 
           className="relative w-full h-full flex items-center justify-center z-10 gap-3 pb-8"
           style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)` }}
         >
            {/* Left Eye */}
            <motion.div 
              animate={{ scaleY: isBlinking ? 0.1 : 1 }}
              transition={{ duration: 0.15 }}
              className="relative w-[14px] h-[30px] bg-[#4bc4f9] rounded-[50%] shadow-[0_0_12px_#4bc4f9,inset_0_0_4px_#ffffff] flex justify-center items-center"
            >
              <div className="w-[4px] h-[16px] bg-[#0c1f2e]/60 rounded-full blur-[0.5px]" />
            </motion.div>
            
            {/* Right Eye */}
            <motion.div 
              animate={{ scaleY: isBlinking ? 0.1 : 1 }}
              transition={{ duration: 0.15 }}
              className="relative w-[14px] h-[30px] bg-[#4bc4f9] rounded-[50%] shadow-[0_0_12px_#4bc4f9,inset_0_0_4px_#ffffff] flex justify-center items-center"
            >
              <div className="w-[4px] h-[16px] bg-[#0c1f2e]/60 rounded-full blur-[0.5px]" />
            </motion.div>
         </div>
         
         {/* Clean Glassy Bottom Mask (Swoop) */}
         <div 
           className="absolute bottom-[-20%] left-[-15%] w-[130%] h-[65%] bg-gradient-to-t from-[#010812] via-[#0b2944] to-[#2ab2ff]/40 backdrop-blur-md rounded-[50%_50%_0_0] border-t-[2px] border-[#8ce1fa]/80 shadow-[inset_0_15px_20px_rgba(255,255,255,0.2),0_-10px_20px_rgba(42,178,255,0.3)] z-20"
           style={{ transform: "rotate(-10deg)" }}
         >
           {/* Highlight on the mask curve */}
           <div className="absolute top-[2px] left-[20%] w-[50%] h-[6px] bg-[#cffafe] blur-[2px] rounded-full" />
         </div>
         
         {/* Thick Clear Glass Rim Overlay */}
         <div className="absolute inset-0 rounded-full shadow-[inset_0_0_12px_3px_rgba(255,255,255,0.5),inset_0_10px_25px_rgba(255,255,255,0.15),inset_0_-8px_15px_rgba(40,150,255,0.3)] pointer-events-none z-30" />
         
         {/* Sharp top reflection highlight */}
         <div className="absolute top-[3px] left-[15%] w-[70%] h-[12px] bg-gradient-to-b from-white/60 to-transparent blur-[1px] rounded-[50%] z-30 pointer-events-none" />

      </motion.div>
    </div>
  );
}

export default function Home() {
  const [orbState, setOrbState] = useState<"idle" | "typing" | "smile">("idle");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "bot",
      text: "Hii, I am HealBridge AI. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: mainRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setOrbState("typing");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text, user_id: "demo-user" }),
      });
      if (!res.ok) throw new Error("Failed to fetch response");
      const data = await res.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: data.reply,
        uiCard: data.ui_card?.data || null,
      };

      setMessages((prev) => [...prev, botMessage]);
      setOrbState("smile");
      setTimeout(() => setOrbState("idle"), 2500);
    } catch (error) {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "bot", text: "Sorry, I am having trouble connecting to my servers." }]);
      setOrbState("idle");
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  let currentOrbState = orbState;
  if (orbState !== "smile" && (isLoading || input.length > 0)) {
    currentOrbState = "typing";
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col font-sans bg-[#f0fbff] text-slate-800">
      {/* Elegant Glass Circles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-[#9dcaff] via-[#6caaf5] to-[#cfe6ff]">
        
        {/* Soft Ambient Light Orbs (Behind the glass) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white opacity-60 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-300 opacity-50 blur-[120px]" />

        {/* Giant Moving Glass Circle 1 - Soft front layer */}
        <motion.div 
          animate={{ 
            x: ['0%', '15%', '-5%', '0%'],
            y: ['0%', '-10%', '10%', '0%']
          }} 
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[5%] w-[120vw] h-[120vw] sm:w-[80vw] sm:h-[80vw] rounded-full bg-gradient-to-br from-white/30 to-white/5 backdrop-blur-[40px] border border-white/50 shadow-[inset_0_0_60px_rgba(255,255,255,0.5),inset_4px_4px_20px_rgba(255,255,255,0.8),0_20px_40px_rgba(0,0,0,0.06)]" 
        />
        
        {/* Giant Moving Glass Circle 2 - Deep background layer */}
        <motion.div 
          animate={{ 
            x: ['0%', '-15%', '10%', '0%'],
            y: ['0%', '15%', '-10%', '0%']
          }} 
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-10%] w-[130vw] h-[130vw] sm:w-[90vw] sm:h-[90vw] rounded-full bg-gradient-to-tl from-white/20 to-transparent backdrop-blur-[60px] border-[1px] border-white/40 shadow-[inset_0_0_80px_rgba(255,255,255,0.3),inset_-4px_-4px_25px_rgba(255,255,255,0.6),0_25px_50px_rgba(0,0,0,0.04)]" 
        />

        {/* Giant Moving Glass Circle 3 - Crisp overlapping layer */}
        <motion.div 
          animate={{ 
            x: ['-5%', '15%', '-5%'],
            y: ['10%', '-5%', '10%']
          }} 
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[-20%] w-[100vw] h-[100vw] sm:w-[60vw] sm:h-[60vw] rounded-full bg-gradient-to-tr from-white/35 to-transparent backdrop-blur-[30px] border border-white/60 shadow-[inset_0_0_50px_rgba(255,255,255,0.6),inset_3px_-3px_15px_rgba(255,255,255,0.9),0_15px_30px_rgba(0,0,0,0.05)]" 
        />
      </div>

      {/* Background Watermark */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[20rem] font-bold text-[#0c1f2e]/[0.02] tracking-tighter whitespace-nowrap">
          HEALBRIDGE
        </h1>
      </div>

      {/* Main Layout - Grid */}
      <main className="flex-1 relative z-20 flex items-center justify-center w-full px-4 sm:px-8 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Column: Greeting & Cards */}
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            <div className="space-y-6 flex flex-col items-center text-center w-full">
              {/* Logo Centered Above Welcome */}
              <div className="w-full flex justify-center mb-2">
                <Image src="/images/logo-final.png" alt="HealBridge Logo" width={280} height={80} className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.05)]" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#0c1f2e] tracking-tight">
                Welcome to HealBridge
              </h1>
              <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
                Your intelligent healthcare companion. Let's make managing your health easier and more intuitive.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              {[
                { title: "Book Appointment", desc: "Schedule a visit with our specialists", iconSrc: "/images/calendar.png", action: "Book Appointment" },
                { title: "Explore Services", desc: "View services", iconSrc: "/images/medical.png", action: "Explore Services" },
                { title: "Check Status", desc: "Check your appointment status", iconSrc: "/images/report.png", action: "Check Status" }
              ].map((card, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleSend(card.action)}
                  className="w-full sm:w-[90%] md:w-[80%] lg:w-[75%] bg-white/60 hover:bg-white/80 backdrop-blur-2xl border-2 border-white/70 rounded-[1.5rem] p-6 flex items-center gap-6 cursor-pointer transition-all shadow-[0_8px_30px_rgba(0,0,0,0.05)] overflow-hidden group"
                >
                  <div className="w-16 h-16 flex items-center justify-center shrink-0 overflow-visible">
                    <Image src={card.iconSrc} alt={card.title} width={64} height={64} className="object-contain w-full h-full group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 drop-shadow-xl" />
                  </div>
                  <div>
                    <h3 className="text-[#0c1f2e] font-semibold text-lg">{card.title}</h3>
                    <p className="text-[#1a384f]/80 text-sm">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="flex-1 flex justify-center lg:justify-end order-1 lg:order-2 w-full lg:mt-12">
            <div className="w-full max-w-[800px] relative">


          {/* Chat Window Container */}
          <div className="w-full h-[70vh] min-h-[600px] max-h-[800px] bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] flex flex-col relative z-20 border border-white/50">
            
            {/* Chat Header */}
            <div className="px-6 py-3 flex justify-between items-center bg-gradient-to-b from-white/60 to-transparent rounded-t-[2rem]">
               <div className="flex items-center gap-4">
                 <Image src="/images/logo-final.png" alt="HealBridge Logo" width={110} height={30} className="object-contain drop-shadow-sm" />
               </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 sm:px-10 py-6" ref={mainRef}>
              <div className="space-y-6">
                {messages.map((msg, idx) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex w-full gap-4 items-center ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    
                    {msg.role !== "user" && (
                      <div className="shrink-0 drop-shadow-md">
                        {/* We use the "smile" state briefly for the absolute newest message, otherwise idle */}
                        <BlobBot size={60} state={idx === messages.length - 1 && !isLoading ? "smile" : "idle"} />
                      </div>
                    )}
                    
                    <div className={`relative max-w-[80%] rounded-[1.5rem] px-6 py-4 shadow-sm border ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-[#06b6d4] to-[#0284c7] border-blue-400 text-white shadow-[0_5px_15px_rgba(2,132,199,0.2)]"
                        : "bg-white border-white/50 text-slate-700 shadow-[0_5px_15px_rgba(0,0,0,0.02)]"
                    }`}>
                      {/* Bubble Tail */}
                      {msg.role === "user" ? (
                         <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-[#0284c7] border-t border-r border-blue-400 rotate-45 rounded-[2px]" />
                      ) : (
                         <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-white border-b border-l border-white/50 rotate-45 rounded-[2px]" />
                      )}

                      <div className="text-[15px] leading-relaxed relative z-10 break-words whitespace-pre-wrap overflow-hidden">
                        {renderMessageContent(msg.text)}
                      </div>
                      
                      {msg.uiCard && (
                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                          {msg.uiCard.type === 'lookup' ? (
                            <div className="flex flex-col gap-3">
                              <div className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" /> Found {msg.uiCard.bookings?.length || 0} Bookings
                              </div>
                              {msg.uiCard.bookings?.map((b: any, i: number) => (
                                <div key={i} className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-blue-600">{b.service}</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium border border-green-200">{b.status}</span>
                                  </div>
                                  <div className="text-sm text-slate-600 space-y-1">
                                    <p><strong>Patient:</strong> {b.patient}</p>
                                    <p><strong>Date:</strong> {b.date}</p>
                                    <p><strong>Details:</strong> {b.details}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : msg.uiCard.service ? (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 shadow-sm">
                               <div className="flex items-center gap-3 mb-3">
                                 <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-200">
                                   <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                 </div>
                                 <h4 className="font-bold text-slate-800">Booking Confirmed</h4>
                               </div>
                               <div className="space-y-2 text-sm text-slate-700 bg-white/60 p-3 rounded-lg border border-white">
                                 <div className="flex justify-between border-b border-slate-100 pb-2">
                                   <span className="text-slate-500">Service</span>
                                   <span className="font-medium text-slate-800">{msg.uiCard.service}</span>
                                 </div>
                                 <div className="flex justify-between border-b border-slate-100 pb-2">
                                   <span className="text-slate-500">Patient</span>
                                   <span className="font-medium text-slate-800">{msg.uiCard.patient}</span>
                                 </div>
                                 <div className="flex justify-between pt-1">
                                   <span className="text-slate-500">Status</span>
                                   <span className="font-medium text-green-600">{msg.uiCard.status}</span>
                                 </div>
                               </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {msg.role === "user" && (
                      <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center relative overflow-hidden shadow-sm">
                        <Image src="/images/user-avatar.png" alt="User Avatar" width={40} height={40} className="object-cover w-full h-full scale-125" />
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start items-center gap-4">
                    <div className="shrink-0 drop-shadow-md">
                      <BlobBot size={60} state="typing" />
                    </div>
                    <div className="relative bg-white border border-white/50 text-slate-500 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.02)] px-6 py-4 flex items-center gap-3">
                      <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-[12px] h-[12px] bg-white border-b border-l border-white/50 rotate-45 rounded-[2px]" />
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin relative z-10" />
                      <span className="text-[15px] font-medium relative z-10">Processing...</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottom Actions & Input */}
            <div className="p-6 pt-6 pb-6 bg-gradient-to-t from-[#e3e8ef] via-[#e3e8ef] to-transparent rounded-b-[2rem] relative">

              {/* Chat Input Wrapper */}
              <div className="relative w-full">

                {/* Chat Input */}
                <form onSubmit={onSubmit} className="relative w-full flex items-center z-10 bg-white/20 backdrop-blur-[40px] border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_15px_35px_rgba(0,0,0,0.05)] rounded-full transition-all duration-300 ease-out focus-within:scale-[1.03] focus-within:bg-white/30 focus-within:border-white focus-within:shadow-[inset_0_0_25px_rgba(255,255,255,1),0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message HealBridge AI..."
                  className="w-full bg-transparent text-slate-800 font-medium text-[15px] placeholder-slate-500/80 focus:outline-none rounded-full pl-6 pr-14 py-4"
                  disabled={isLoading}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 shrink-0 w-[36px] h-[36px] rounded-full flex items-center justify-center transition-all duration-300 ${
                    input.trim() && !isLoading
                      ? "bg-blue-500/90 backdrop-blur-md text-white shadow-[0_4px_12px_rgba(59,130,246,0.4)] hover:bg-blue-600 hover:scale-105 active:scale-95"
                      : "bg-slate-300/40 backdrop-blur-md text-slate-500 pointer-events-none"
                  }`}
                >
                  <ArrowUp className="w-5 h-5 font-bold" />
                </button>
              </form>
              </div>

            </div>
          </div>
        </div>
      </div>
      </div>
      </main>

    </div>
  );
}
