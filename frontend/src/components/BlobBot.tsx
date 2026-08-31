"use client";

import React, { useEffect, useRef, useState } from "react";

type BlobBotProps = {
  state?: "idle" | "typing" | "smile";
  size?: number; // Size in pixels
};

export default function BlobBot({ state = "idle", size = 40 }: BlobBotProps) {
  const headRef = useRef<HTMLDivElement>(null);
  const eyeLeftRef = useRef<HTMLDivElement>(null);
  const eyeRightRef = useRef<HTMLDivElement>(null);
  const socketLeftRef = useRef<HTMLDivElement>(null);
  const socketRightRef = useRef<HTMLDivElement>(null);
  
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      if (state === "idle") {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 160);
      }
      blinkTimeout = setTimeout(triggerBlink, 2500 + Math.random() * 3000);
    };
    
    blinkTimeout = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(blinkTimeout);
  }, [state]);

  useEffect(() => {
    let animationFrameId: number;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curRotate = 0, curShiftX = 0, curShiftY = 0;

    const MAX_HEAD_ROTATE = 10;
    const MAX_HEAD_SHIFT = 6;
    const MAX_EYE_OFFSET = 4;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) {
        if (e.touches[0]) {
          mouseX = e.touches[0].clientX;
          mouseY = e.touches[0].clientY;
        }
      } else {
        mouseX = (e as MouseEvent).clientX;
        mouseY = (e as MouseEvent).clientY;
      }
    };
    
    window.addEventListener("mousemove", handleMouseMove as any);
    window.addEventListener("touchmove", handleMouseMove as any, { passive: true });

    const updateHeadAndEyes = () => {
      const head = headRef.current;
      if (!head) return;

      const rect = head.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const angle = Math.atan2(dy, dx);

      const normX = Math.max(-1, Math.min(1, dx / 400));
      const normY = Math.max(-1, Math.min(1, dy / 400));

      const targetRotate = normX * MAX_HEAD_ROTATE;
      const targetShiftX = normX * MAX_HEAD_SHIFT;
      const targetShiftY = normY * MAX_HEAD_SHIFT * 0.6;

      curRotate += (targetRotate - curRotate) * 0.12;
      curShiftX += (targetShiftX - curShiftX) * 0.12;
      curShiftY += (targetShiftY - curShiftY) * 0.12;

      head.style.transform = `translate(calc(-50% + ${curShiftX}px), calc(-50% + ${curShiftY}px)) rotate(${curRotate}deg)`;

      const sockets = [socketLeftRef, socketRightRef];
      const eyes = [eyeLeftRef, eyeRightRef];

      for (let i = 0; i < 2; i++) {
        const eye = eyes[i].current;
        const socket = sockets[i].current;
        if (!eye || !socket) continue;

        const srect = socket.getBoundingClientRect();
        const scx = srect.left + srect.width / 2;
        const scy = srect.top + srect.height / 2;

        const edx = mouseX - scx;
        const edy = mouseY - scy;
        const eAngle = Math.atan2(edy, edx);
        const eDist = Math.min(Math.hypot(edx, edy), MAX_EYE_OFFSET);

        const offsetX = Math.cos(eAngle) * eDist;
        const offsetY = Math.sin(eAngle) * eDist;
        const rotateDeg = (eAngle * 180 / Math.PI) + 90;

        eye.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotateDeg}deg)`;
      }

      animationFrameId = requestAnimationFrame(updateHeadAndEyes);
    };

    updateHeadAndEyes();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove as any);
      window.removeEventListener("touchmove", handleMouseMove as any);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Base scale ratio, the original blob was designed in a 220x220 box
  const scale = size / 220;

  return (
    <div 
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        overflow: 'hidden',
        borderRadius: '50%'
      }}
    >
      <div style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: "top left", 
        width: '220px', 
        height: '220px', 
        position: 'absolute', 
        top: 0, 
        left: 0 
      }}>
        {/* Glow */}
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.95) 0%, rgba(147, 238, 255, 0.6) 40%, rgba(44, 176, 255, 0.0) 72%)",
          filter: "blur(6px)"
        }}></div>

        {/* Head */}
        <div 
          ref={headRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "150px",
            height: "150px",
            transform: "translate(-50%, -50%) rotate(0deg)",
            transformOrigin: "50% 50%",
            willChange: "transform"
          }}
        >
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #ffffff 0%, #e6fbff 30%, #bdf2ff 60%, #93eeff 100%)",
            filter: "blur(3px)",
            boxShadow: "0 10px 40px rgba(44, 176, 255, 0.4)"
          }}></div>
          
          <div style={{
            position: "absolute",
            width: "30px",
            height: "20px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(44, 176, 255, 0.45) 0%, rgba(44, 176, 255, 0) 70%)",
            filter: "blur(4px)",
            top: "58%",
            left: "12%"
          }}></div>
          
          <div style={{
            position: "absolute",
            width: "30px",
            height: "20px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(44, 176, 255, 0.45) 0%, rgba(44, 176, 255, 0) 70%)",
            filter: "blur(4px)",
            top: "58%",
            left: "58%"
          }}></div>
        </div>

        {/* States container */}
        <div style={{
          position: "absolute",
          top: "44%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Typing */}
          <div style={{
            position: "absolute",
            opacity: state === "typing" ? 1 : 0,
            transition: "opacity 0.35s ease",
            display: "flex",
            gap: "6px"
          }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="blob-dot" style={{ animationDelay: `${i * 0.15}s` }}></span>
            ))}
          </div>

          {/* Smile */}
          <div style={{
            position: "absolute",
            opacity: state === "smile" ? 1 : 0,
            transition: "opacity 0.35s ease",
            transform: "translateY(15px)" // Push smile down below the eyes
          }}>
             <svg viewBox="0 0 34 18" style={{ width: "24px", height: "12px", display: "block" }}>
                <path d="M2 2 Q17 20 32 2" fill="none" stroke="#0c1f2e" strokeWidth="4" strokeLinecap="round" />
             </svg>
          </div>

          {/* Idle Eyes (Visible during idle and smile) */}
          <div style={{
            position: "absolute",
            opacity: (state === "idle" || state === "smile") ? 1 : 0,
            transition: "opacity 0.35s ease",
            display: "flex",
            gap: "13px",
            transform: state === "smile" ? "translateY(-5px)" : "translateY(0px)" // Shift eyes up slightly when smiling
          }}>
             <div ref={socketLeftRef} style={{ position: "relative", width: "4px", height: "16px" }}>
                <div ref={eyeLeftRef} style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  width: "4px",
                  height: isBlinking ? "2px" : "16px",
                  marginLeft: "-2px", marginTop: "-8px",
                  borderRadius: "3px",
                  background: "#0c1f2e",
                  transformOrigin: "50% 50%",
                  transition: "height 0.12s ease"
                }}></div>
             </div>
             <div ref={socketRightRef} style={{ position: "relative", width: "4px", height: "16px" }}>
                <div ref={eyeRightRef} style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  width: "4px",
                  height: isBlinking ? "2px" : "16px",
                  marginLeft: "-2px", marginTop: "-8px",
                  borderRadius: "3px",
                  background: "#0c1f2e",
                  transformOrigin: "50% 50%",
                  transition: "height 0.12s ease"
                }}></div>
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .blob-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #0c1f2e;
          animation: blobDotPulse 1.1s infinite ease-in-out;
        }
        @keyframes blobDotPulse {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
