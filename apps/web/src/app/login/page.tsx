// apps/web/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Coffee, Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/users/login', form);
            localStorage.setItem('admin_session', JSON.stringify(res.data));
            router.push('/');
        } catch (err) {
            setError('Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 text-amber-700 mb-4">
                        <Coffee size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-900 tracking-tight uppercase">Flamboys Roaster</h1>
                    <p className="text-stone-500 text-sm mt-2">Admin Dashboard Access</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Username</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-3 text-stone-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 pl-10 text-stone-800 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                    placeholder="Enter your username"
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 text-stone-400 group-focus-within:text-amber-600 transition-colors" size={18} />
                                <input
                                    type="password"
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 pl-10 text-stone-800 placeholder:text-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    Sign In <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-xs text-stone-400">
                    &copy; 2025 Flamboys Roastery System
                </p>
            </div>
        </div>
    );
}