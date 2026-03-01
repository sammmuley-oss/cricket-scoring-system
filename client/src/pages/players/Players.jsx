import { useEffect, useState } from 'react';
import { playersAPI, teamsAPI } from '../../api';
import { Modal, Loader, EmptyState } from '../../components/common';

export default function Players() {
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [form, setForm] = useState({ name: '', team: '', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'none', jerseyNumber: '' });

    const fetchData = async () => {
        try {
            const [pRes, tRes] = await Promise.all([playersAPI.getAll({ search, role: filterRole || undefined }), teamsAPI.getAll()]);
            setPlayers(pRes.data.data);
            setTeams(tRes.data.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, [search, filterRole]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await playersAPI.create({ ...form, jerseyNumber: form.jerseyNumber ? parseInt(form.jerseyNumber) : undefined });
            setShowCreate(false); setForm({ name: '', team: '', role: 'batsman', battingStyle: 'right-hand', bowlingStyle: 'none', jerseyNumber: '' }); fetchData();
        }
        catch (e) { console.error(e); }
    };

    const getRoleBadge = (role) => {
        const colors = { batsman: '#3b82f6', bowler: '#ef4444', allrounder: '#8b5cf6', wicketkeeper: '#f59e0b' };
        return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${colors[role]}20`, color: colors[role] }}>{role?.toUpperCase()}</span>;
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Players</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Player</button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <input className="input" style={{ maxWidth: 250 }} placeholder="Search players..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="input" style={{ maxWidth: 150 }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="">All Roles</option>
                    <option value="batsman">Batsman</option><option value="bowler">Bowler</option>
                    <option value="allrounder">All-rounder</option><option value="wicketkeeper">Wicket-keeper</option>
                </select>
            </div>

            {players.length === 0 ? (
                <EmptyState icon="🧑‍🤝‍🧑" title="No Players Found" description="Add players to start building your squads."
                    action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Add Player</button>} />
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border-color)' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th>#</th><th>Name</th><th>Team</th><th>Role</th><th>Bat</th><th>Bowl</th>
                            <th>Mat</th><th>Runs</th><th>Wkts</th><th>Avg</th>
                        </tr></thead>
                        <tbody>
                            {players.map((p, i) => (
                                <tr key={p._id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                                    <td className="font-bold" style={{ color: 'var(--text-muted)' }}>{p.jerseyNumber || '-'}</td>
                                    <td>
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.name}</p>
                                    </td>
                                    <td className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.team?.name || '—'}</td>
                                    <td>{getRoleBadge(p.role)}</td>
                                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.battingStyle}</td>
                                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.bowlingStyle === 'none' ? '—' : p.bowlingStyle}</td>
                                    <td>{p.stats?.matches || 0}</td>
                                    <td className="font-medium">{p.stats?.batting?.runs || 0}</td>
                                    <td className="font-medium">{p.stats?.bowling?.wickets || 0}</td>
                                    <td>{p.battingAverage || '0.00'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Player">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Player Name</label>
                        <input className="input" placeholder="Virat Kohli" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Team</label>
                            <select className="input" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })}>
                                <option value="">Select Team</option>
                                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Jersey #</label>
                            <input type="number" className="input" placeholder="18" value={form.jerseyNumber}
                                onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Role</label>
                            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <option value="batsman">Batsman</option><option value="bowler">Bowler</option>
                                <option value="allrounder">All-rounder</option><option value="wicketkeeper">WK</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Batting</label>
                            <select className="input" value={form.battingStyle} onChange={(e) => setForm({ ...form, battingStyle: e.target.value })}>
                                <option value="right-hand">Right</option><option value="left-hand">Left</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Bowling</label>
                            <select className="input" value={form.bowlingStyle} onChange={(e) => setForm({ ...form, bowlingStyle: e.target.value })}>
                                <option value="none">None</option><option value="right-arm-fast">RF</option>
                                <option value="left-arm-fast">LF</option><option value="right-arm-medium">RM</option>
                                <option value="right-arm-offspin">OB</option><option value="left-arm-orthodox">SLA</option>
                                <option value="right-arm-legspin">LB</option><option value="left-arm-chinaman">LC</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Add Player</button>
                </form>
            </Modal>
        </div>
    );
}
