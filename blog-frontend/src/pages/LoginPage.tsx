
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenTool, Loader2, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useStore } from '../store/useStore';

type AuthMode = 'login' | 'signup';

const AuthPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, signup } = useStore();
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
            } else {
                if (!formData.name) {
                    setError('Name is required');
                    setIsLoading(false);
                    return;
                }
                await signup(formData.email, formData.name, formData.password);
            }
            navigate('/dashboard'); // Navigate to dashboard after successful login/signup
        } catch (err: any) {
            setError(err.message || `${mode === 'login' ? 'Login' : 'Signup'} failed`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="min-h-screen flex bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white transition-colors duration-300">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white dark:bg-[#0a0a0a] items-center justify-center border-r border-neutral-200 dark:border-white/5">
                {/* <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div> */}
                <div className="absolute inset-0 bg-neutral-100 dark:bg-[#0a0a0a] opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 dark:bg-orange-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>

                <div className="relative z-10 max-w-lg px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-8 inline-block"
                    >
                        <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                            <PenTool size={40} className="text-white dark:text-black" />
                        </div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white"
                    >
                        Intelligence for the<br />Modern Creator
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed"
                    >
                        Access the world's most advanced autonomous content engine.
                        Draft, refine, and publish with military-grade precision.
                    </motion.p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-neutral-50 dark:bg-[#050505]">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
                >
                    <ArrowRight className="rotate-180" size={16} /> Back to Home
                </button>

                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-neutral-500 mb-8">
                            {mode === 'login'
                                ? 'Sign in to your account to continue.'
                                : 'Join Lumina to start creating amazing content.'}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full h-12 pl-10 pr-4 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-neutral-900 dark:text-white"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full h-12 pl-10 pr-4 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-neutral-900 dark:text-white"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-neutral-700 dark:text-neutral-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full h-12 pl-10 pr-4 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-neutral-900 dark:text-white"
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                {mode === 'signup' && (
                                    <p className="text-xs text-neutral-500 mt-1">Must be at least 6 characters</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    mode === 'login' ? 'Sign In' : 'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'signup' : 'login');
                                    setError('');
                                }}
                                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                            >
                                {mode === 'login'
                                    ? "Don't have an account? Sign up"
                                    : 'Already have an account? Sign in'}
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-xs text-neutral-500 dark:text-neutral-600 leading-relaxed">
                                By continuing, you acknowledge that Lumina AI utilizes autonomous agents
                                to process data. Review our <span className="text-neutral-900 dark:text-neutral-400 hover:underline cursor-pointer">Terms of Service</span>.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
