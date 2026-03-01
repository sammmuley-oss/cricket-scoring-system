import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { matchesAPI, teamsAPI, tournamentsAPI } from '../../api';
import { Modal, Loader, Badge, EmptyState } from '../../components/common';

export default function Matches() {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('');
    const [form, setForm] = useState({ teamA: '', teamB: '', tournament: '', format: 'T20', oversPerInning: 20, venue: '', date: '' });

    const fetchData = async () => {
        try {
            const [mRes, tRes, trRes] = await Promise.all([
                matchesAPI.getAll({ status: filter || undefined }), teamsAPI.getAll(), tournamentsAPI.getAll()
            ]);
            setMatches(mRes.data.data); setTeams(tRes.data.data); setTournaments(trRes.data.data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };
    useEffect(() => { fetchData(); }, [filter]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const data = { ...form, tournament: form.tournament || undefined, date: form.date || new Date() };
            await matchesAPI.create(data);
            setShowCreate(false); setForm({ teamA: '', teamB: '', tournament: '', format: 'T20', oversPerInning: 20, venue: '', date: '' }); fetchData();
        } catch (e) { console.error(e); }
    };

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Matches</h2>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Match</button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'upcoming', 'live', 'completed'].map((f) => (
                    <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(f)}>{f || 'All'}</button>
                ))}
            </div>

            {matches.length === 0 ? (
                <EmptyState icon="📋" title="No Matches Found" description="Create a new match to get the action started."
                    action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Match</button>} />
            ) : (
                <div className="space-y-3">
                    {matches.map((match, i) => (
                        <div key={match._id} className="card animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Badge type={match.status}>{match.status}</Badge>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{match.format} • {match.tournament?.name || 'Friendly'}</span>
                                </div>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(match.date).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-6">
                                {/* Team A */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: match.teamA?.color || '#3b82f6' }}>
                                        {match.teamA?.shortName?.substring(0, 2) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{match.teamA?.name || 'TBA'}</p>
                                        {match.innings?.[0] && (
                                            <p className="score-medium" style={{ color: 'var(--text-primary)' }}>
                                                {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                                                <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>({match.innings[0].totalOvers} ov)</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <span className="text-sm font-bold px-3" style={{ color: 'var(--text-muted)' }}>VS</span>

                                {/* Team B */}
                                <div className="flex items-center gap-3 flex-1 justify-end text-right">
                                    <div>
                                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{match.teamB?.name || 'TBA'}</p>
                                        {match.innings?.[1] && (
                                            <p className="score-medium" style={{ color: 'var(--text-primary)' }}>
                                                {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                                                <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>({match.innings[1].totalOvers} ov)</span>
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ background: match.teamB?.color || '#ef4444' }}>
                                        {match.teamB?.shortName?.substring(0, 2) || '?'}
                                    </div>
                                </div>
                            </div>

                            {/* Result text */}
                            {match.result?.resultText && (
                                <p className="text-xs font-semibold mt-3 text-center" style={{ color: 'var(--color-primary)' }}>
                                    {match.result.winner?.name || ''} won by {match.result.resultText}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                                {match.status === 'upcoming' && (
                                    <Link to={`/scoring/${match._id}`} className="btn btn-primary btn-sm flex-1">Setup & Start</Link>
                                )}
                                {match.status === 'live' && (
                                    <>
                                        <Link to={`/scoring/${match._id}`} className="btn btn-accent btn-sm flex-1">Continue Scoring</Link>
                                        <Link to={`/scoreboard/${match._id}`} target="_blank" className="btn btn-secondary btn-sm">📺 Scoreboard</Link>
                                    </>
                                )}
                                {match.status === 'completed' && (
                                    <Link to={`/matches/${match._id}`} className="btn btn-secondary btn-sm flex-1">View Scorecard</Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Match Modal */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Match" maxWidth="550px">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Team A</label>
                            <select className="input" value={form.teamA} onChange={(e) => setForm({ ...form, teamA: e.target.value })} required>
                                <option value="">Select Team</option>
                                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Team B</label>
                            <select className="input" value={form.teamB} onChange={(e) => setForm({ ...form, teamB: e.target.value })} required>
                                <option value="">Select Team</option>
                                {teams.filter(t => t._id !== form.teamA).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tournament (optional)</label>
                        <select className="input" value={form.tournament} onChange={(e) => setForm({ ...form, tournament: e.target.value })}>
                            <option value="">Friendly Match</option>
                            {tournaments.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Format</label>
                            <select className="input" value={form.format} onChange={(e) => {
                                const f = e.target.value; const o = f === 'T20' ? 20 : f === 'ODI' ? 50 : 20;
                                setForm({ ...form, format: f, oversPerInning: o });
                            }}>
                                <option value="T20">T20</option><option value="ODI">ODI</option><option value="Custom">Custom</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Overs</label>
                            <input type="number" className="input" value={form.oversPerInning}
                                onChange={(e) => setForm({ ...form, oversPerInning: parseInt(e.target.value) })} min={1} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Date</label>
                            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Venue</label>
                        <input className="input" placeholder="Ground name" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Create Match</button>
                </form>
            </Modal>
        </div>
    );
}
