import { useEffect, useState } from 'react';
import { playersAPI, matchesAPI } from '../../api';
import { Loader, StatCard } from '../../components/common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0d9e6e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
    const [players, setPlayers] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, mRes] = await Promise.all([playersAPI.getAll(), matchesAPI.getAll()]);
                setPlayers(pRes.data.data);
                setMatches(mRes.data.data);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <Loader />;

    // Prepare analytics data
    const topRunScorers = [...players].sort((a, b) => (b.stats?.batting?.runs || 0) - (a.stats?.batting?.runs || 0)).slice(0, 10);
    const topWicketTakers = [...players].sort((a, b) => (b.stats?.bowling?.wickets || 0) - (a.stats?.bowling?.wickets || 0)).slice(0, 10);
    const roleDistribution = [
        { name: 'Batsmen', value: players.filter(p => p.role === 'batsman').length },
        { name: 'Bowlers', value: players.filter(p => p.role === 'bowler').length },
        { name: 'All-rounders', value: players.filter(p => p.role === 'allrounder').length },
        { name: 'WK', value: players.filter(p => p.role === 'wicketkeeper').length },
    ].filter(d => d.value > 0);

    const matchesByStatus = [
        { name: 'Upcoming', value: matches.filter(m => m.status === 'upcoming').length },
        { name: 'Live', value: matches.filter(m => m.status === 'live').length },
        { name: 'Completed', value: matches.filter(m => m.status === 'completed').length },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Analytics Dashboard</h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Players" value={players.length} icon="🧑‍🤝‍🧑" color="#6366f1" />
                <StatCard label="Matches Played" value={matches.filter(m => m.status === 'completed').length} icon="🏏" color="#0d9e6e" />
                <StatCard label="Total Runs" value={players.reduce((s, p) => s + (p.stats?.batting?.runs || 0), 0)} icon="🏃" color="#f59e0b" />
                <StatCard label="Total Wickets" value={players.reduce((s, p) => s + (p.stats?.bowling?.wickets || 0), 0)} icon="🎯" color="#ef4444" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Run Scorers */}
                <div className="card">
                    <h3 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 0.5 }}>Top Run Scorers</h3>
                    {topRunScorers.some(p => p.stats?.batting?.runs > 0) ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topRunScorers.filter(p => p.stats?.batting?.runs > 0).map(p => ({ name: p.name?.split(' ').pop(), runs: p.stats.batting.runs }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="runs" fill="#0d9e6e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No batting data yet. Complete some matches first!</p>
                    )}
                </div>

                {/* Top Wicket Takers */}
                <div className="card">
                    <h3 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 0.5 }}>Top Wicket Takers</h3>
                    {topWicketTakers.some(p => p.stats?.bowling?.wickets > 0) ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topWicketTakers.filter(p => p.stats?.bowling?.wickets > 0).map(p => ({ name: p.name?.split(' ').pop(), wickets: p.stats.bowling.wickets }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }} />
                                <Bar dataKey="wickets" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No bowling data yet. Complete some matches first!</p>
                    )}
                </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Player Role Distribution */}
                <div className="card">
                    <h3 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 0.5 }}>Player Roles</h3>
                    {roleDistribution.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {roleDistribution.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}: <strong>{d.value}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No players available</p>
                    )}
                </div>

                {/* Match Status */}
                <div className="card">
                    <h3 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 0.5 }}>Match Status Overview</h3>
                    {matchesByStatus.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={matchesByStatus} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                        {matchesByStatus.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {matchesByStatus.map((d, i) => (
                                    <div key={d.name} className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[(i + 2) % COLORS.length] }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}: <strong>{d.value}</strong></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No matches available</p>
                    )}
                </div>
            </div>

            {/* Player Stats Table */}
            <div className="card">
                <h3 className="text-sm font-bold uppercase mb-4" style={{ color: 'var(--text-muted)', letterSpacing: 0.5 }}>All Player Stats</h3>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead><tr>
                            <th>Player</th><th>Team</th><th>Role</th><th>Mat</th><th>Runs</th><th>HS</th><th>Avg</th><th>SR</th>
                            <th>Wkts</th><th>Econ</th><th>Best</th>
                        </tr></thead>
                        <tbody>
                            {players.map(p => (
                                <tr key={p._id}>
                                    <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.team?.shortName || '—'}</td>
                                    <td className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.role}</td>
                                    <td>{p.stats?.matches || 0}</td>
                                    <td className="font-bold">{p.stats?.batting?.runs || 0}</td>
                                    <td>{p.stats?.batting?.highestScore || 0}</td>
                                    <td>{p.battingAverage || '0.00'}</td>
                                    <td>{p.battingStrikeRate || '0.00'}</td>
                                    <td className="font-bold">{p.stats?.bowling?.wickets || 0}</td>
                                    <td>{p.bowlingEconomy || '0.00'}</td>
                                    <td>{p.stats?.bowling?.bestFiguresWickets || 0}/{p.stats?.bowling?.bestFiguresRuns || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
