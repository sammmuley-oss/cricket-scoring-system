import { useEffect, useState } from 'react';
import { teamsAPI, playersAPI } from '../../api';
import { Modal, Loader, EmptyState } from '../../components/common';

export default function Teams() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', shortName: '', color: '#0d9e6e', coach: '', homeGround: '' });

    const fetchTeams = async () => {
        try { const res = await teamsAPI.getAll(); setTeams(res.data.data); } catch (e) { console.error(e); }
        setLoading(false);
    };
    useEffect(() => { fetchTeams(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try { await teamsAPI.create(form); setShowCreate(false); setForm({ name: '', shortName: '', color: '#0d9e6e', coach: '', homeGround: '' }); fetchTeams(); }
        catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this team?')) return;
        try { await teamsAPI.delete(id); fetchTeams(); } catch (e) { console.error(e); }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Teams</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Team</button>
            </div>

            {teams.length === 0 ? (
                <EmptyState icon="👥" title="No Teams Yet" description="Register your first team to start building squads."
                    action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Team</button>} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                        <div key={team._id} className="card">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                                    style={{ background: `linear-gradient(135deg, ${team.color}, ${team.color}bb)` }}>
                                    {team.shortName?.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.shortName} • {team.homeGround || 'No ground'}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                                <span>👤 {team.captain?.name || 'No captain'}</span>
                                <span>🧑‍🏫 {team.coach || 'No coach'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {team.players?.slice(0, 6).map((p, i) => (
                                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                                        {p.name || 'Player'}
                                    </span>
                                ))}
                                {(team.players?.length || 0) > 6 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                                        +{team.players.length - 6} more
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{team.players?.length || 0} players</span>
                                <button className="text-xs font-medium" style={{ color: '#ef4444' }} onClick={() => handleDelete(team._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Team">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Team Name</label>
                        <input className="input" placeholder="India" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Short Name</label>
                            <input className="input" placeholder="IND" maxLength={5} value={form.shortName}
                                onChange={(e) => setForm({ ...form, shortName: e.target.value.toUpperCase() })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Color</label>
                            <input type="color" className="input h-10 p-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Coach</label>
                        <input className="input" placeholder="Coach name" value={form.coach} onChange={(e) => setForm({ ...form, coach: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Home Ground</label>
                        <input className="input" placeholder="Stadium" value={form.homeGround} onChange={(e) => setForm({ ...form, homeGround: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Create Team</button>
                </form>
            </Modal>
        </div>
    );
}
