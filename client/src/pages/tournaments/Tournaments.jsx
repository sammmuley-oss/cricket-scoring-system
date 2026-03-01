import { useEffect, useState } from 'react';
import { tournamentsAPI, teamsAPI } from '../../api';
import { Modal, Loader, Badge, EmptyState } from '../../components/common';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', format: 'T20', oversPerInning: 20, venue: '', description: '' });
    const [showAddTeam, setShowAddTeam] = useState(null);

    const fetchData = async () => {
        try {
            const [tRes, tmRes] = await Promise.all([tournamentsAPI.getAll(), teamsAPI.getAll()]);
            setTournaments(tRes.data.data);
            setTeams(tmRes.data.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await tournamentsAPI.create(form);
            setShowCreate(false);
            setForm({ name: '', format: 'T20', oversPerInning: 20, venue: '', description: '' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleAddTeam = async (tournamentId, teamId) => {
        try {
            await tournamentsAPI.addTeam(tournamentId, teamId);
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this tournament?')) return;
        try { await tournamentsAPI.delete(id); fetchData(); } catch (e) { console.error(e); }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Tournaments</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Tournament</button>
            </div>

            {tournaments.length === 0 ? (
                <EmptyState icon="🏆" title="No Tournaments Yet" description="Create your first tournament to start organizing cricket matches."
                    action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Tournament</button>} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tournaments.map((t) => (
                        <div key={t._id} className="card space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{t.name}</h3>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.venue || 'No venue'}</p>
                                </div>
                                <Badge type={t.status}>{t.status}</Badge>
                            </div>
                            <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                <span>📋 {t.format}</span>
                                <span>🏏 {t.oversPerInning} overs</span>
                                <span>👥 {t.teams?.length || 0} teams</span>
                            </div>

                            {/* Points Table Preview */}
                            {t.pointsTable?.length > 0 && (
                                <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                                    <table className="data-table w-full text-xs">
                                        <thead><tr>
                                            <th>Team</th><th>P</th><th>W</th><th>L</th><th>NRR</th><th>Pts</th>
                                        </tr></thead>
                                        <tbody>
                                            {t.pointsTable.sort((a, b) => b.points - a.points || b.nrr - a.nrr).map((e, i) => (
                                                <tr key={i}>
                                                    <td className="font-medium">{e.team?.shortName || e.team?.name || '—'}</td>
                                                    <td>{e.played}</td><td>{e.won}</td><td>{e.lost}</td>
                                                    <td>{e.nrr > 0 ? '+' : ''}{e.nrr?.toFixed(3)}</td>
                                                    <td className="font-bold">{e.points}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button className="btn btn-secondary btn-sm flex-1" onClick={() => setShowAddTeam(t._id)}>+ Add Team</button>
                                <button className="btn btn-sm flex-1" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                                    onClick={() => handleDelete(t._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Tournament Modal */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Tournament">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
                        <input className="input" placeholder="Champions Trophy 2026" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Format</label>
                            <select className="input" value={form.format} onChange={(e) => {
                                const format = e.target.value;
                                const overs = format === 'T20' ? 20 : format === 'ODI' ? 50 : format === 'Test' ? 90 : form.oversPerInning;
                                setForm({ ...form, format, oversPerInning: overs });
                            }}>
                                <option value="T20">T20</option><option value="ODI">ODI</option>
                                <option value="Test">Test</option><option value="Custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Overs/Innings</label>
                            <input type="number" className="input" value={form.oversPerInning}
                                onChange={(e) => setForm({ ...form, oversPerInning: parseInt(e.target.value) })} min={1} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Venue</label>
                        <input className="input" placeholder="Stadium name" value={form.venue}
                            onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Create Tournament</button>
                </form>
            </Modal>

            {/* Add Team Modal */}
            <Modal open={!!showAddTeam} onClose={() => setShowAddTeam(null)} title="Add Team to Tournament">
                <div className="space-y-2">
                    {teams.map((team) => (
                        <button key={team._id}
                            className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-black/5"
                            style={{ border: '1px solid var(--border-color)' }}
                            onClick={() => { handleAddTeam(showAddTeam, team._id); setShowAddTeam(null); }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: team.color || '#3b82f6' }}>{team.shortName?.charAt(0)}</div>
                            <div>
                                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{team.name}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.shortName} • {team.players?.length || 0} players</p>
                            </div>
                        </button>
                    ))}
                    {teams.length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No teams available. Create teams first.</p>}
                </div>
            </Modal>
        </div>
    );
}
