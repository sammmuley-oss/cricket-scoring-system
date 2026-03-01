import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesAPI } from '../../api';
import { Loader, Badge } from '../../components/common';

export default function MatchDetail() {
    const { id } = useParams();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try { const res = await matchesAPI.getById(id); setMatch(res.data.data); } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetch();
    }, [id]);

    if (loading) return <Loader />;
    if (!match) return <div className="card text-center py-10"><p>Match not found</p></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="stadium-gradient rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-xs opacity-70">{match.format} • {match.venue || 'Venue TBD'}</span>
                        <h2 className="text-xl font-bold mt-1">{match.teamA?.name} vs {match.teamB?.name}</h2>
                    </div>
                    <Badge type={match.status}>{match.status}</Badge>
                </div>
                {match.result?.resultText && (
                    <p className="text-sm font-bold mt-2" style={{ color: '#fbbf24' }}>
                        {match.result.winner?.name} won by {match.result.resultText}
                    </p>
                )}
                <div className="flex gap-2 mt-4">
                    {match.status === 'live' && <Link to={`/scoring/${match._id}`} className="btn btn-accent btn-sm">Continue Scoring</Link>}
                    {match.status === 'live' && <Link to={`/scoreboard/${match._id}`} target="_blank" className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>📺 Live Scoreboard</Link>}
                    {match.status === 'upcoming' && <Link to={`/scoring/${match._id}`} className="btn btn-primary btn-sm">Setup Match</Link>}
                </div>
            </div>

            {/* Innings Scorecards */}
            {match.innings?.map((inn, idx) => (
                <div key={idx} className="card">
                    <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                        {inn.battingTeam?.name || `Innings ${idx + 1}`} — {inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)
                        <span className="text-xs font-normal ml-2" style={{ color: 'var(--text-muted)' }}>CRR: {inn.currentRunRate}</span>
                    </h3>

                    {/* Batting */}
                    <div className="overflow-x-auto mb-4">
                        <table className="data-table">
                            <thead><tr><th>Batsman</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                            <tbody>
                                {inn.batsmen?.map((b, i) => (
                                    <tr key={i}>
                                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.player?.name}</td>
                                        <td className="text-xs" style={{ color: b.isOut ? '#ef4444' : '#22c55e' }}>
                                            {b.isOut ? `${b.dismissal?.type} ${b.dismissal?.bowler?.name ? `b ${b.dismissal.bowler.name}` : ''}` : 'not out'}
                                        </td>
                                        <td className="font-bold">{b.runs}</td><td>{b.ballsFaced}</td><td>{b.fours}</td><td>{b.sixes}</td><td>{b.strikeRate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Extras */}
                    <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                        Extras: {inn.extras?.total || 0} (Wd {inn.extras?.wides}, Nb {inn.extras?.noBalls}, B {inn.extras?.byes}, Lb {inn.extras?.legByes})
                    </p>

                    {/* Bowling */}
                    <div className="overflow-x-auto mb-4">
                        <table className="data-table">
                            <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
                            <tbody>
                                {inn.bowlers?.map((b, i) => (
                                    <tr key={i}>
                                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.player?.name}</td>
                                        <td>{b.overs}.{(b.ballsBowled || 0) % 6}</td><td>{b.maidens}</td>
                                        <td>{b.runsConceded}</td><td className="font-bold">{b.wickets}</td><td>{b.economy}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Partnerships */}
                    {inn.partnerships?.length > 0 && (
                        <div className="mb-4">
                            <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Partnerships</h4>
                            <div className="flex flex-wrap gap-2">
                                {inn.partnerships.map((p, i) => (
                                    <div key={i} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(13,158,110,0.08)' }}>
                                        <span style={{ color: 'var(--text-primary)' }}>{p.batsman1?.name} & {p.batsman2?.name}</span>
                                        <span className="font-bold ml-2" style={{ color: 'var(--color-primary)' }}>{p.runs}({p.balls})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fall of Wickets */}
                    {inn.fallOfWickets?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Fall of Wickets</h4>
                            <div className="flex flex-wrap gap-2">
                                {inn.fallOfWickets.map((f, i) => (
                                    <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>
                                        {f.score}/{f.wicketNumber} ({f.overs}) {f.player?.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
