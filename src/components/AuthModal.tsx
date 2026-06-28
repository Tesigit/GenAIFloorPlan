import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
    onClose: () => void;
    onSuccess: (user: { name: string; email: string; token: string }) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
            const body = mode === 'signup'
                ? { name, email, password }
                : { email, password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Authentication failed');

            localStorage.setItem('gplan_token', data.token);
            localStorage.setItem('gplan_user', JSON.stringify({ name: data.name, email: data.email }));
            onSuccess({ name: data.name, email: data.email, token: data.token });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                {/* Top gradient bar */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {mode === 'login' ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {mode === 'login' ? 'Sign in to save and view your plans' : 'Join GPlan to save your generated floor plans'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Tab switcher */}
                <div className="flex mx-6 mt-4 bg-black/30 rounded-xl p-1 gap-1">
                    {(['login', 'signup'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(''); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {m === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={submit} className="px-6 pb-6 pt-4 space-y-3">
                    {mode === 'signup' && (
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text" placeholder="Full name" value={name}
                                onChange={(e) => setName(e.target.value)} required
                                className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/60 transition-all"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="email" placeholder="Email address" value={email}
                            onChange={(e) => setEmail(e.target.value)} required
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/60 transition-all"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
                            onChange={(e) => setPassword(e.target.value)} required minLength={6}
                            className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500/60 transition-all"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    {error && (
                        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="w-full py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                        {loading
                            ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> Processing...</>
                            : mode === 'login'
                                ? <><LogIn className="w-4 h-4" /> Sign In</>
                                : <><UserPlus className="w-4 h-4" /> Create Account</>
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AuthModal;
