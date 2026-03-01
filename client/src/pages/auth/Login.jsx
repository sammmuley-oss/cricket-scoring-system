import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        if (success) navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            {/* Background gradient */}
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(13,158,110,0.3) 0%, transparent 60%)' }} />

            <div className="w-full max-w-md relative animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                        style={{ background: 'linear-gradient(135deg, #0d9e6e, #065f46)' }}>🏏</div>
                    <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit', color: 'var(--text-primary)' }}>CricScore</h1>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Live Cricket Scoring Platform</p>
                </div>

                {/* Form Card */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            {error}
                            <button onClick={clearError} className="float-right font-bold">&times;</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                            <input type="email" className="input" placeholder="admin@cricket.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                            <input type="password" className="input" placeholder="••••••••" value={password}
                                onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                        Don't have an account? <Link to="/register" className="font-semibold" style={{ color: 'var(--color-primary)' }}>Create one</Link>
                    </p>

                    {/* Demo credentials */}
                    <div className="mt-6 p-3 rounded-lg text-xs" style={{ background: 'rgba(13,158,110,0.08)', border: '1px solid rgba(13,158,110,0.15)' }}>
                        <p className="font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Demo Credentials</p>
                        <p style={{ color: 'var(--text-muted)' }}>Admin: admin@cricket.com / password123</p>
                        <p style={{ color: 'var(--text-muted)' }}>Scorer: scorer@cricket.com / password123</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
