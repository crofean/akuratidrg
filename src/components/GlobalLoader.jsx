import React from 'react';

export default function GlobalLoader({ title, subtitle, percent, fullScreen = false, children }) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[9999] bg-gradient-to-br from-teal-50/90 via-white/95 to-slate-50/90 flex flex-col items-center justify-center overflow-hidden"
    : "relative flex flex-col items-center justify-center p-16 min-h-[60vh] overflow-hidden bg-white/50 rounded-[2.5rem] border border-slate-200/50 shadow-[0_8px_40px_rgba(0,0,0,0.04)]";

  return (
    <div className={containerClasses}>
      {/* Concentric Background Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-teal-600/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-teal-600/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border border-teal-600/5 pointer-events-none" />

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center justify-center z-10 mb-10 mt-4">
        
        {/* The Teal Loading Rings */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-6">
          {/* The rings */}
          <div className="absolute inset-[-4px] rounded-full border-[3px] border-teal-600/10 border-t-teal-600 animate-[spin_2s_linear_infinite]" />
          <div className="absolute inset-2 rounded-full border-[2px] border-teal-500/10 border-b-teal-500 animate-[spin_1.5s_linear_infinite_reverse]" />

          {/* The Pure SVG 3D Logo "A" and Diagram Rings */}
          <div className="relative flex flex-col items-center justify-center mt-2 w-32 h-32">
            
            {/* The Blueprint Animated Rings */}
            <div className="absolute inset-[-10px] w-[calc(100%+20px)] h-[calc(100%+20px)]">
              {/* Outer dashed spinning ring */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_10s_linear_infinite] transform-gpu">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#0d9488" strokeWidth="0.5" opacity="0.4" />
                <circle cx="50" cy="50" r="48" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="20 10" strokeLinecap="round" />
              </svg>
              {/* Inner static fill ring (Animation removed for performance) */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full transform-gpu">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              </svg>
            </div>

            {/* Fake GPU accelerated glow behind logo to save performance instead of heavy SVG drop-shadows */}
            <div className="absolute inset-0 m-auto w-16 h-16 bg-cyan-400/30 rounded-full blur-[20px]" style={{ willChange: 'transform, opacity' }}></div>

            {/* The 3D Faceted SVG "A" */}
            <svg viewBox="0 0 100 100" className="relative w-20 h-20 z-10 a-logo transform-gpu">
              <defs>
                <linearGradient id="tealDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0f766e" />
                  <stop offset="100%" stopColor="#042f2e" />
                </linearGradient>
                <linearGradient id="tealLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="crystalGradientCorrected" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ccfbf1" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>

              {/* Left Pillar */}
              <polygon points="45,5 15,95 30,95" fill="url(#tealDark)" />
              <polygon points="45,5 30,95 45,95" fill="url(#tealLight)" />

              {/* Right Pillar */}
              <polygon points="65,40 55,95 70,95" fill="url(#tealDark)" />
              <polygon points="65,40 70,95 85,95" fill="url(#tealLight)" />

              {/* Swoosh Bottom Face */}
              <path d="M 5,70 Q 50,55 95,25 Q 60,65 35,80 Z" fill="url(#tealDark)" />
              {/* Swoosh Top Face */}
              <path d="M 5,70 Q 40,40 95,25 Q 50,55 5,70 Z" className="a-logo-fill" />
              
              {/* Edge Highlights for extra 3D pop */}
              <polyline points="45,5 30,95" fill="none" stroke="#a7f3d0" strokeWidth="0.5" opacity="0.8" />
              <polyline points="65,40 70,95" fill="none" stroke="#a7f3d0" strokeWidth="0.5" opacity="0.8" />
              <path d="M 5,70 Q 40,40 95,25" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
            </svg>
            
            {percent !== undefined && percent !== null && (
              <span className="absolute -bottom-6 text-xs font-black text-teal-600 drop-shadow-sm bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200">
                {percent}%
              </span>
            )}
          </div>
        </div>

        {/* AKURAT text */}
        <div className="flex flex-col items-center z-10 relative">
          <h1 className="font-sans font-black text-2xl tracking-[0.3em] ml-2 mb-1" style={{
              background: 'linear-gradient(to right, #0f766e, #2dd4bf, #0f766e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 1px 2px rgba(13,148,136,0.2))'
          }}>
            AKURAT
          </h1>
          <div className="flex items-center gap-2 w-full justify-center">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-teal-600"></div>
            <span className="font-sans font-semibold tracking-[0.4em] text-teal-700 text-[10px] ml-1">iDRG</span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-teal-600"></div>
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <h2 className="text-2xl font-black text-slate-800 tracking-tight z-10 mb-3 text-center drop-shadow-sm">
        {title || 'Menunggu Dataset Utama'}
      </h2>
      
      {subtitle && (
        <p className="text-[14px] font-medium text-slate-500 z-10 mb-8 text-center max-w-md leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* 4 Pulsing Dots in Teal */}
      <div className={`flex gap-2.5 z-10 ${children ? 'mb-8' : ''}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.32s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:-0.16s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-[bounce_1.4s_infinite_ease-in-out_both]" />
        <div className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-[bounce_1.4s_infinite_ease-in-out_both] [animation-delay:0.16s]" />
      </div>

      {/* Extra Action Buttons / Shimmers */}
      {children && (
        <div className="z-20 relative w-full max-w-md flex flex-col items-center">
          {children}
        </div>
      )}

      {/* Blueprint Diagram Animations & User CSS Corrections */}
      <style>{`
        /* Efek Cahaya Neon & Kristal (Logo 'A') */
        .a-logo {
          /* OPTIMASI PERFORMA: Filter SVG dihapus total untuk menghindari bottleneck rendering GPU. 
             Efek glow murni mengandalkan elemen background <div> di belakangnya. */
          
          /* Amplifikasi efek cahaya pada kristal */
          mix-blend-mode: normal; 
          
          /* Memaksa browser menggunakan Hardware Acceleration */
          will-change: transform;
        }

        /* Pengisian Gradien Dinamis (Fill Logo 'A') */
        .a-logo-fill {
          fill: url(#crystalGradientCorrected); 
        }
      `}</style>
    </div>
  );
}
