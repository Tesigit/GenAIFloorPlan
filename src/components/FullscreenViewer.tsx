import React, { useEffect, useState } from 'react';
import { X, Download, ZoomIn } from 'lucide-react';
import FabricCanvas from './FabricCanvas';
import type { Plan } from '../types/plan';

interface FullscreenViewerProps {
    plan: Plan;
    plotWidth?: number;
    plotLength?: number;
    onClose: () => void;
    onDownload: () => void;
}

const FullscreenViewer: React.FC<FullscreenViewerProps> = ({
    plan,
    plotWidth,
    plotLength,
    onClose,
    onDownload,
}) => {
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    const [activeFloor, setActiveFloor] = useState(0);

    useEffect(() => {
        const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Close on Escape key
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Prevent body scroll while fullscreen is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Calculate canvas size to fill viewport with proportional aspect ratio
    const padding = 80; // leave space for buttons
    const availW = size.w - padding;
    const availH = size.h - padding;

    let canvasW = availW;
    let canvasH = availH;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Floating top bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2">
                    <ZoomIn className="w-5 h-5 text-white/60" />
                    <span className="text-white/80 text-sm font-semibold tracking-wide">Full View</span>
                    {plotWidth && plotLength && (
                        <span className="text-white/30 text-xs ml-2">
                            {plotWidth}m × {plotLength}m
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:text-white transition-all backdrop-blur-md shadow-lg"
                    >
                        <Download className="w-4 h-4" />
                        Download PNG
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl bg-white/10 text-white/70 border border-white/15 hover:bg-red-500/30 hover:text-white hover:border-red-500/30 transition-all backdrop-blur-md shadow-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Floor selector tabs */}
            {plan && plan.floors && plan.floors.length > 1 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex bg-slate-900/80 backdrop-blur-md p-1 rounded-full border border-white/10 shadow-xl">
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

            {/* Canvas */}
            <div
                className="relative z-[1] flex items-center justify-center transition-all duration-300 pointer-events-none"
                style={{ width: Math.floor(canvasW), height: Math.floor(canvasH) }}
            >
                <div className="pointer-events-auto">
                    <FabricCanvas
                        plan={{ ...plan, rooms: plan.floors && plan.floors.length > 0 ? plan.floors[activeFloor].rooms : plan.rooms || [] }}
                        width={Math.floor(canvasW)}
                        height={Math.floor(canvasH)}
                        plotWidth={plotWidth}
                        plotLength={plotLength}
                    />
                </div>
            </div>

            {/* Hint text */}
            <p className="absolute bottom-4 text-white/20 text-xs z-10">
                Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/40 text-[10px] font-mono">Esc</kbd> or click backdrop to close
            </p>
        </div>
    );
};

export default FullscreenViewer;
