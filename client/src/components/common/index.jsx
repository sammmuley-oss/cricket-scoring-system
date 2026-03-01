export function Loader() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: 'var(--color-primary)', borderRightColor: 'var(--color-primary)' }} />
                <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: 'var(--color-accent)', animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
        </div>
    );
}

export function Modal({ open, onClose, title, children, maxWidth = '500px' }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full animate-slide-up" style={{ maxWidth, background: 'var(--bg-card)', borderRadius: 16, border: '1px solid var(--border-color)' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{title}</h3>
                    <button onClick={onClose} className="text-2xl leading-none hover:opacity-70" style={{ color: 'var(--text-muted)' }}>&times;</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export function StatCard({ label, value, icon, trend, color = 'var(--color-primary)' }) {
    return (
        <div className="card flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{value}</p>
                {trend && <p className="text-xs mt-0.5" style={{ color: trend > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                </p>}
            </div>
        </div>
    );
}

export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="text-center py-16 px-4">
            <div className="text-5xl mb-4">{icon || '🏏'}</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>{description}</p>
            {action}
        </div>
    );
}

export function Badge({ type, children }) {
    const cls = type === 'live' ? 'badge-live' : type === 'upcoming' ? 'badge-upcoming' : 'badge-completed';
    return <span className={`badge ${cls}`}>{children}</span>;
}
