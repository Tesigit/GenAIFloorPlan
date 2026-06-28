import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ImageIcon, AlertTriangle } from 'lucide-react';
import FabricCanvas from './FabricCanvas';
import type { Plan } from '../types/plan';

interface OutputSectionProps {
  floorPlanImage: string | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  onDownload: () => void;
  onFullscreen?: () => void;
  plan?: Plan | null;
  messages?: string[];
  promptSent?: string;
  plotWidth?: number;
  plotLength?: number;
}

/* ─────────────────────────────────────────────────────
   Blueprint Loading Animation
   ───────────────────────────────────────────────────── */
const LoadingAnimation: React.FC = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: 'Analyzing plot dimensions', icon: '📐' },
    { text: 'Computing room adjacencies', icon: '🧩' },
    { text: 'Optimizing traffic flow', icon: '🚶' },
    { text: 'Placing structural walls', icon: '🧱' },
    { text: 'Arranging furniture layout', icon: '🛋️' },
    { text: 'Applying style preferences', icon: '🎨' },
    { text: 'Finalizing blueprint', icon: '✨' },
  ];

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      {/* Subtle animated blueprint background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(to right, #3b82f6 1px, transparent 1px),
          linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div className="text-center">
        {/* Central animation */}
        <div className="relative mx-auto w-36 h-36 mb-8">
          {/* Outer subtle ring */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_15s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59,130,246,0.06)" strokeWidth="0.3" strokeDasharray="4 6" />
          </svg>

          {/* Blueprint center */}
          <div className="absolute inset-4 rounded-xl bg-slate-800/80 border border-blue-500/20 overflow-hidden backdrop-blur-sm shadow-2xl shadow-blue-500/5">
            {/* Grid */}
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(96,165,250,0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(96,165,250,0.12) 1px, transparent 1px)
              `,
              backgroundSize: '16px 16px',
            }} />

            {/* Animated rooms */}
            <div className="absolute top-[10%] left-[8%] w-[42%] h-[35%] border border-blue-400/30 rounded-[2px] bg-blue-400/[0.06]"
              style={{ animation: 'roomFadeIn 0.6s ease-out 0.3s both' }} />
            <div className="absolute top-[10%] right-[8%] w-[34%] h-[35%] border border-emerald-400/30 rounded-[2px] bg-emerald-400/[0.06]"
              style={{ animation: 'roomFadeIn 0.6s ease-out 0.7s both' }} />
            <div className="absolute bottom-[10%] left-[8%] w-[38%] h-[40%] border border-violet-400/30 rounded-[2px] bg-violet-400/[0.06]"
              style={{ animation: 'roomFadeIn 0.6s ease-out 1.1s both' }} />
            <div className="absolute bottom-[10%] right-[8%] w-[38%] h-[40%] border border-amber-400/30 rounded-[2px] bg-amber-400/[0.06]"
              style={{ animation: 'roomFadeIn 0.6s ease-out 1.5s both' }} />

            {/* Scan line */}
            <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
              style={{ animation: 'scanY 2.5s ease-in-out infinite' }} />
          </div>

          {/* Glow */}
          <div className="absolute -inset-4 bg-blue-500/[0.04] blur-3xl rounded-full animate-pulse" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white/90 mb-4 tracking-wide">
          Designing your floor plan
        </h3>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-500 ${i <= step ? 'w-5 h-1 bg-blue-400/80' : 'w-1 h-1 bg-white/10'
              }`} />
          ))}
        </div>

        <p className="text-blue-300/70 text-sm font-medium h-5">
          <span className="mr-1.5">{steps[step].icon}</span>
          {steps[step].text}
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   Main Output Section
   ───────────────────────────────────────────────────── */
const OutputSection: React.FC<OutputSectionProps> = ({
  floorPlanImage,
  isGenerating,
  onRegenerate,
  onDownload,
  onFullscreen,
  plan,
  messages,
  promptSent,
  plotWidth,
  plotLength
}) => {
  const [showDetails] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 520 });
  const [activeFloor, setActiveFloor] = useState(0);

  useEffect(() => {
    setActiveFloor(0);
  }, [plan]);

  // Dynamically size the canvas to fill available space EXACTLY
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          // Fill the entire available area
          setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasPlan = plan && (plan.rooms?.length || (plan.floors && plan.floors.length > 0));
  const hasApiError = messages?.some(m =>
    m.includes('API_KEY') || m.includes('quota') || m.includes('GEMINI_ERROR')
  );

  return (
    <div className="h-full flex flex-col gap-3">

      {/* ── Top bar: Integrated Architectural Dashboard ── */}
      <div className="flex items-center justify-between flex-shrink-0 px-6 py-4 bg-[#0a0f1d]/60 backdrop-blur-xl border-b border-white/5 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight leading-none mb-1">Architectural Design</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Preview</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasPlan && (
            <button
              onClick={onDownload}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-300 flex items-center gap-2 group"
            >
              <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
              Export Blueprint
            </button>
          )}
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-xl ${isGenerating
              ? 'bg-slate-700/50 text-white/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 ring-1 ring-white/20 active:scale-95'
              }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Computing...' : (hasPlan ? 'New Concept' : 'Generate Design')}
          </button>
        </div>
      </div>

      {/* ── Infinite Canvas Workspace ── */}
      <div
        ref={canvasWrapRef}
        className="relative flex-1 min-h-0 bg-[#0f172a] mx-4 mb-4 rounded-2xl border border-white/10 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
      >
        {/* Elite Subtle Drafting Grid - Dark Blueprint Theme */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.15]" style={{
          backgroundImage: `
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
          backgroundImage: `
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: '8px 8px',
        }} />

        {/* Subtle radial center glow */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Floor selector tabs */}
        {!isGenerating && plan && plan.floors && plan.floors.length > 1 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xl">
            {plan.floors.map((flr, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveFloor(i); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFloor === i 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {flr.name}
              </button>
            ))}
          </div>
        )}

        {isGenerating ? (
          <LoadingAnimation />
        ) : hasPlan ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-pointer group" onClick={onFullscreen} title="Click to view fullscreen">
            <FabricCanvas
              plan={{ ...plan!, rooms: plan?.floors && plan.floors.length > 0 ? plan.floors[activeFloor].rooms : plan!.rooms || [] }}
              width={canvasSize.w}
              height={canvasSize.h}
              plotWidth={plotWidth}
              plotLength={plotLength}
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 flex items-center justify-center pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-semibold bg-blue-600/80 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-xl">
                Expand to Fullscreen
              </span>
            </div>
          </div>
        ) : floorPlanImage ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={floorPlanImage} alt="Floor Plan" className="max-w-full max-h-full shadow-lg" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className={`p-4 ${hasApiError ? 'bg-amber-500/10' : 'bg-red-500/10'} rounded-2xl w-fit mx-auto mb-5`}>
                <AlertTriangle className={`w-10 h-10 ${hasApiError ? 'text-amber-400' : 'text-red-400/80'}`} />
              </div>
              <h3 className="text-lg font-semibold text-white/90 mb-2">
                {hasApiError ? 'API Key Issue' : 'Generation Issue'}
              </h3>
              {hasApiError && (
                <p className="text-amber-200/70 mb-3 text-sm">
                  Update GEMINI_API_KEY in your .env file.
                </p>
              )}
              <div className={`${hasApiError ? 'bg-amber-500/5 border-amber-500/10' : 'bg-red-500/5 border-red-500/10'} border rounded-lg p-3 text-left`}>
                {messages.map((m, i) => (
                  <p key={i} className="text-white/40 mb-1 font-mono text-xs break-words">{m}</p>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="p-5 bg-white/[0.03] rounded-2xl w-fit mx-auto mb-5 border border-white/[0.04]">
                <ImageIcon className="w-12 h-12 text-white/10" />
              </div>
              <h3 className="text-base font-semibold text-white/60 mb-1.5">Ready to Design</h3>
              <p className="text-white/25 text-sm max-w-xs mx-auto">Configure specs on the left and generate.</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Collapsible details (AI messages + prompt) ── */}
      {showDetails && !isGenerating && (messages || promptSent) && (
        <div className="flex-shrink-0 space-y-2 max-h-32 overflow-y-auto rounded-lg">
          {messages && messages.length > 0 && (
            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
              <p className="text-[9px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">AI Insight</p>
              {messages.map((m, i) => (
                <p key={i} className="text-[11px] text-white/40 leading-relaxed">
                  <span className="text-blue-400/50 mr-1">›</span>{m}
                </p>
              ))}
            </div>
          )}
          {promptSent && (
            <details className="bg-white/[0.02] rounded-lg border border-white/[0.04] overflow-hidden">
              <summary className="px-2.5 py-1.5 text-[9px] font-semibold text-white/20 uppercase tracking-widest cursor-pointer hover:bg-white/[0.02] transition-colors">
                Prompt Sent
              </summary>
              <pre className="px-2.5 pb-2.5 text-[9px] text-white/20 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">{promptSent}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default OutputSection;