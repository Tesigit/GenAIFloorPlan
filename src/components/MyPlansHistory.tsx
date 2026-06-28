import React, { useEffect, useState } from 'react';
import { X, Trash2, Eye, Clock, Home, Cpu, Zap } from 'lucide-react';
import { Plan } from '../types/plan';

interface SavedPlan {
    id: string;
    title: string;
    source: 'ai' | 'fallback';
    constraints: Record<string, any>;
    plan_json: any;
    messages: string[];
    created_at: string;
}

interface MyPlansHistoryProps {
    token: string;
    isOpen: boolean;
    onClose: () => void;
    onLoad: (plan: Plan, constraints: any) => void;
}

const MyPlansHistory: React.FC<MyPlansHistoryProps> = ({ token, isOpen, onClose, onLoad }) => {
    const [plans, setPlans] = useState<SavedPlan[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !token) return;
        setLoading(true);
        setError('');
        fetch('/api/plans/my', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) setPlans(data);
                else setError(data.detail || 'Failed to load plans');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, [isOpen, token]);

    const deletePlan = async (id: string) => {
        await fetch(`/api/plans/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        setPlans((prev) => prev.filter((p) => p.id !== id));
    };

    const loadPlan = (saved: SavedPlan) => {
        // Convert stored JSON back to Plan type
        const plan: Plan = saved.plan_json as Plan;
        onLoad(plan, saved.constraints);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[80vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Home className="w-4 h-4 text-blue-400" /> My Floor Plans
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''} saved</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full" />
                        </div>
                    )}
                    {error && <div className="text-red-400 text-sm text-center py-8">{error}</div>}
                    {!loading && plans.length === 0 && !error && (
                        <div className="text-center py-12 text-slate-400">
                            <Home className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No plans saved yet. Generate one and it saves automatically!</p>
                        </div>
                    )}
                    {plans.map((p) => {
                        const c = p.constraints;
                        const date = new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                        });
                        return (
                            <div
                                key={p.id}
                                className="flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:border-white/[0.14] transition-all group"
                            >
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                                    {p.source === 'ai'
                                        ? <Cpu className="w-4 h-4 text-blue-400" />
                                        : <Zap className="w-4 h-4 text-yellow-400" />
                                    }
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white truncate">{p.title}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                        <span>{c.length}×{c.width}m</span>
                                        <span>•</span>
                                        <span>{c.bedrooms}BHK</span>
                                        <span>•</span>
                                        <span className={p.source === 'ai' ? 'text-blue-400' : 'text-yellow-400'}>
                                            {p.source === 'ai' ? 'AI' : 'Engine'}
                                        </span>
                                        <span>•</span>
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{date}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => loadPlan(p)}
                                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-xs text-blue-300 font-medium flex items-center gap-1.5 transition-all"
                                    >
                                        <Eye className="w-3 h-3" /> Load
                                    </button>
                                    <button
                                        onClick={() => deletePlan(p.id)}
                                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MyPlansHistory;
