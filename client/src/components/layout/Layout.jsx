import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    HiOutlineHome, HiOutlineTrophy, HiOutlineUserGroup, HiOutlineUsers,
    HiOutlinePlayCircle, HiOutlinePresentationChartBar, HiOutlineSun, HiOutlineMoon,
    HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineXMark, HiOutlineTv
} from 'react-icons/hi2';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const navItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/tournaments', label: 'Tournaments', icon: HiOutlineTrophy },
    { path: '/matches', label: 'Matches', icon: HiOutlinePlayCircle },
    { path: '/teams', label: 'Teams', icon: HiOutlineUserGroup },
    { path: '/players', label: 'Players', icon: HiOutlineUsers },
    { path: '/analytics', label: 'Analytics', icon: HiOutlinePresentationChartBar },
];

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { dark, toggle } = useThemeStore();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ background: 'var(--bg-sidebar)' }}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: 'linear-gradient(135deg, #0d9e6e, #065f46)' }}>🏏</div>
                    <div>
                        <h1 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'Outfit' }}>CricScore</h1>
                        <p className="text-xs text-slate-400">Live Cricket Scoring</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto text-slate-400 hover:text-white">
                        <HiOutlineXMark size={24} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="px-3 py-4 space-y-1">
                    {navItems.map(({ path, label, icon: Icon }) => {
                        const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                        return (
                            <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                style={active ? { background: 'linear-gradient(135deg, rgba(13,158,110,0.2), rgba(13,158,110,0.1))', color: '#10b981' } : {}}>
                                <Icon size={20} />
                                {label}
                                {active && <div className="ml-auto w-1 h-5 rounded-full" style={{ background: '#10b981' }} />}
                            </Link>
                        );
                    })}

                    {/* Live Scoreboard link */}
                    <div className="pt-4 mt-4 border-t border-white/10">
                        <Link to="/scoreboard" target="_blank" onClick={() => setSidebarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                            <HiOutlineTv size={20} />
                            Live Scoreboard
                            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded font-bold">LIVE</span>
                        </Link>
                    </div>
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role || 'viewer'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggle}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                            {dark ? <HiOutlineSun size={16} /> : <HiOutlineMoon size={16} />}
                            {dark ? 'Light' : 'Dark'}
                        </button>
                        <button onClick={handleLogout}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <HiOutlineArrowRightOnRectangle size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Top bar */}
                <header className="sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center gap-4 border-b"
                    style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', backdropFilter: 'blur(8px)' }}>
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-black/5" style={{ color: 'var(--text-primary)' }}>
                        <HiOutlineBars3 size={24} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                            {navItems.find(n => n.path === location.pathname)?.label || 'CricScore'}
                        </h2>
                    </div>
                    <div className="live-indicator">
                        <span>LIVE</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 lg:p-8 animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
