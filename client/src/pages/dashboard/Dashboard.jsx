import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { matchesAPI, tournamentsAPI, teamsAPI, playersAPI } from '../../api';
import { StatCard, Badge, Loader } from '../../components/common';
import { HiOutlineTrophy, HiOutlineUserGroup, HiOutlineUsers, HiOutlinePlayCircle } from 'react-icons/hi2';

export default function Dashboard() {
    const [stats, setStats] = useState({ tournaments: 0, teams: 0, players: 0, matches: 0 });
    const [liveMatches, setLiveMatches] = useState([]);
    const [recentMatches, setRecentMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [tourRes, teamRes, playerRes, matchRes, liveRes] = await Promise.all([
                    tournamentsAPI.getAll(), teamsAPI.getAll(), playersAPI.getAll(),
                    matchesAPI.getAll(), matchesAPI.getLive(),
                ]);
                setStats({
                    tournaments: tourRes.data.data.length,
                    teams: teamRes.data.data.length,
                    players: playerRes.data.data.length,
                    matches: matchRes.data.data.length,
                });
                setLiveMatches(liveRes.data.data);
                setRecentMatches(matchRes.data.data.slice(0, 5));
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchDashboard();
    }, []);

    if (loading) return <Loader />;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Tournaments" value={stats.tournaments} icon={<HiOutlineTrophy />} color="#6366f1" />
                <StatCard label="Teams" value={stats.teams} icon={<HiOutlineUserGroup />} color="#0d9e6e" />
                <StatCard label="Players" value={stats.players} icon={<HiOutlineUsers />} color="#f59e0b" />
                <StatCard label="Matches" value={stats.matches} icon={<HiOutlinePlayCircle />} color="#3b82f6" />
            </div>

            {/* Live Matches */}
            {liveMatches.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                        <span className="live-indicator">LIVE</span> Live Matches
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {liveMatches.map((match) => (
                            <Link key={match._id} to={`/scoring/${match._id}`} className="card hover:border-red-400 cursor-pointer">
                                <div className="flex items-center justify-between mb-3">
                                    <Badge type="live">LIVE</Badge>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{match.tournament?.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-center">
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{match.teamA?.shortName}</p>
                                        <p className="score-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {match.innings?.[0]?.totalRuns || 0}/{match.innings?.[0]?.totalWickets || 0}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>({match.innings?.[0]?.totalOvers || 0} ov)</p>
                                    </div>
                                    <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>VS</span>
                                    <div className="text-center">
                                        <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{match.teamB?.shortName}</p>
                                        <p className="score-medium mt-1" style={{ color: 'var(--text-primary)' }}>
                                            {match.innings?.[1]?.totalRuns || '-'}{match.innings?.[1] ? `/${match.innings[1].totalWickets}` : ''}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {match.innings?.[1] ? `(${match.innings[1].totalOvers} ov)` : 'Yet to bat'}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Matches */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Recent Matches</h3>
                    <Link to="/matches" className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>View all →</Link>
                </div>
                {recentMatches.length === 0 ? (
                    <div className="card text-center py-8">
                        <p className="text-3xl mb-2">🏏</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No matches yet. Create your first tournament to get started!</p>
                        <Link to="/tournaments" className="btn btn-primary btn-sm mt-4">Create Tournament</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentMatches.map((match) => (
                            <Link key={match._id} to={`/matches/${match._id}`}
                                className="card flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <Badge type={match.status}>{match.status}</Badge>
                                    <div>
                                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {match.teamA?.name || 'TBA'} vs {match.teamB?.name || 'TBA'}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                            {match.venue || 'Venue TBD'} • {new Date(match.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{match.format}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link to="/tournaments" className="card text-center py-5 cursor-pointer hover:border-purple-400">
                        <p className="text-2xl mb-2">🏆</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Tournament</p>
                    </Link>
                    <Link to="/matches" className="card text-center py-5 cursor-pointer hover:border-blue-400">
                        <p className="text-2xl mb-2">📋</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Match</p>
                    </Link>
                    <Link to="/teams" className="card text-center py-5 cursor-pointer hover:border-green-400">
                        <p className="text-2xl mb-2">👥</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Team</p>
                    </Link>
                    <Link to="/players" className="card text-center py-5 cursor-pointer hover:border-yellow-400">
                        <p className="text-2xl mb-2">🧑‍🤝‍🧑</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Player</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
