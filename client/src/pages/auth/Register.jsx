import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
    const { register, loading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await register(form.name, form.email, form.password, form.role);
        if (success) navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(13,158,110,0.3) 0%, transparent 60%)' }} />
            <div className="w-full max-w-md relative animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                        style={{ background: 'linear-gradient(135deg, #0d9e6e, #065f46)' }}>🏏</div>
                    <h1 className="text-3xl font-bold" style={{ fontFamily: 'Outfit', color: 'var(--text-primary)' }}>CricScore</h1>
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">Create your account</p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Register</h2>
                    {error && (
                        <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                            {error} <button onClick={clearError} className="float-right font-bold">&times;</button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                            <input type="text" className="input" placeholder="John Doe"
                                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                            <input type="email" className="input" placeholder="you@example.com"
                                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                            <input type="password" className="input" placeholder="At least 6 characters"
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Role</label>
                            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <option value="viewer">Viewer</option>
                                <option value="scorer">Scorer</option>
                                <option value="coordinator">Coordinator</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                    <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
                        Already have an account? <Link to="/login" className="font-semibold" style={{ color: 'var(--color-primary)' }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
