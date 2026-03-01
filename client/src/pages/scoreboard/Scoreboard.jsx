import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMatchStore from '../../store/matchStore';
import { Loader } from '../../components/common';

/**
 * Public Live Scoreboard - Big screen optimized view
 * No admin controls, auto-refreshes via Socket.io
 */
export default function Scoreboard() {
    const { id } = useParams();
    const { currentMatch, fetchMatch, connectToMatch, disconnectFromMatch } = useMatchStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            await fetchMatch(id);
            connectToMatch(id);
            setLoading(false);
        };
        init();
        // Auto-refresh fallback every 15s
        const interval = setInterval(() => fetchMatch(id), 15000);
        return () => { disconnectFromMatch(); clearInterval(interval); };
    }, [id]);

    if (loading || !currentMatch) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#070e1a' }}>
            <Loader />
        </div>
    );

    const match = currentMatch;
    const innings = match.innings?.[match.currentInnings - 1];
    const firstInnings = match.innings?.[0];
    const secondInnings = match.innings?.[1];

    const currentBatsmen = innings?.batsmen?.filter(b => !b.isOut).slice(-2) || [];
    const currentBowlerEntry = innings?.bowlers?.find(b =>
        (b.player?._id || b.player)?.toString() === (innings?.currentBowler?._id || innings?.currentBowler)?.toString()
    );
    const currentOver = innings?.overs?.[innings.overs.length - 1];
    const recentOvers = innings?.overs?.slice(-6) || [];

    return (
        <div className="min-h-screen p-4 md:p-8 text-white" style={{ background: 'linear-gradient(180deg, #070e1a 0%, #0d1b2a 50%, #1b2838 100%)', fontFamily: 'Outfit, Inter, sans-serif' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="text-2xl">🏏</div>
                    <div>
                        <h1 className="text-xl font-bold">CricScore</h1>
                        <p className="text-xs text-slate-400">{match.format} • {match.venue || 'Live Match'}</p>
                    </div>
                </div>
                {match.status === 'live' && (
                    <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-bold tracking-wider">LIVE</span>
                    </div>
                )}
                {match.status === 'completed' && (
                    <span className="text-sm font-bold bg-green-500/20 text-green-400 px-4 py-2 rounded-full">COMPLETED</span>
                )}
            </div>

            {/* Main Score Display */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Team A Score */}
                <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl"
                        style={{ background: `linear-gradient(135deg, ${match.teamA?.color || '#3b82f6'}, ${match.teamA?.color || '#3b82f6'}aa)` }}>
                        {match.teamA?.shortName?.substring(0, 2)}
                    </div>
                    <h2 className="text-lg font-bold mb-2">{match.teamA?.name}</h2>
                    {firstInnings && (
                        <>
                            <p className="text-5xl font-black tracking-tight">{firstInnings.totalRuns}<span className="text-2xl text-slate-400">/{firstInnings.totalWickets}</span></p>
                            <p className="text-sm text-slate-400 mt-1">({firstInnings.totalOvers} overs)</p>
                            <p className="text-xs text-slate-500 mt-1">CRR: {firstInnings.currentRunRate}</p>
                        </>
                    )}
                    {!firstInnings && <p className="text-slate-500 text-sm">Yet to bat</p>}
                </div>

                {/* VS / Match Info */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-600 mb-4">VS</span>
                    {innings?.target > 0 && (
                        <div className="space-y-2 text-center">
                            <p className="text-sm text-slate-400">Target <span className="text-2xl font-bold text-amber-400">{innings.target}</span></p>
                            <p className="text-sm text-slate-400">Need <span className="text-lg font-bold text-amber-400">{innings.target - innings.totalRuns}</span> from <span className="font-bold">{(match.oversPerInning * 6) - innings.totalBalls}</span> balls</p>
                            <p className="text-sm text-slate-400">RRR: <span className="font-bold text-amber-400">{innings.requiredRunRate}</span></p>
                        </div>
                    )}
                    {match.result?.resultText && (
                        <div className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-sm font-bold text-emerald-400">{match.result.winner?.name || ''} won</p>
                            <p className="text-xs text-emerald-300">by {match.result.resultText}</p>
                        </div>
                    )}
                </div>

                {/* Team B Score */}
                <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl"
                        style={{ background: `linear-gradient(135deg, ${match.teamB?.color || '#ef4444'}, ${match.teamB?.color || '#ef4444'}aa)` }}>
                        {match.teamB?.shortName?.substring(0, 2)}
                    </div>
                    <h2 className="text-lg font-bold mb-2">{match.teamB?.name}</h2>
                    {secondInnings && (
                        <>
                            <p className="text-5xl font-black tracking-tight">{secondInnings.totalRuns}<span className="text-2xl text-slate-400">/{secondInnings.totalWickets}</span></p>
                            <p className="text-sm text-slate-400 mt-1">({secondInnings.totalOvers} overs)</p>
                            <p className="text-xs text-slate-500 mt-1">CRR: {secondInnings.currentRunRate}</p>
                        </>
                    )}
                    {!secondInnings && <p className="text-slate-500 text-sm">Yet to bat</p>}
                </div>
            </div>

            {/* Current Players & Over Progress */}
            {match.status === 'live' && innings && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {/* Current Batsmen */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">At the Crease</h3>
                        {currentBatsmen.map((b, i) => (
                            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                                <span className="text-sm font-medium">
                                    {(b.player?._id || b.player)?.toString() === (innings.currentBatsman?._id || innings.currentBatsman)?.toString() ? '🏏 ' : ''}
                                    {b.player?.name || 'Batsman'}
                                </span>
                                <span className="font-bold">{b.runs}<span className="text-xs text-slate-400">({b.ballsFaced})</span></span>
                            </div>
                        ))}
                    </div>

                    {/* Current Bowler */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bowling</h3>
                        {currentBowlerEntry && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{currentBowlerEntry.player?.name || 'Bowler'}</span>
                                <span className="font-bold text-sm">
                                    {currentBowlerEntry.overs}.{(currentBowlerEntry.ballsBowled || 0) % 6}-{currentBowlerEntry.maidens}-{currentBowlerEntry.runsConceded}-{currentBowlerEntry.wickets}
                                </span>
                            </div>
                        )}
                        <p className="text-xs text-slate-500 mt-1">Econ: {currentBowlerEntry?.economy || '0.00'}</p>
                    </div>

                    {/* Over Progress */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">This Over</h3>
                        <div className="flex gap-2 flex-wrap">
                            {currentOver?.balls?.map((ball, i) => {
                                let cls = `run-${ball.runs}`;
                                if (ball.isWicket) cls = 'run-w';
                                else if (ball.extras?.type === 'wide') cls = 'run-wd';
                                else if (ball.extras?.type === 'noBall') cls = 'run-nb';
                                return (
                                    <div key={i} className={`run-dot ${cls}`}>
                                        {ball.isWicket ? 'W' : ball.extras?.type === 'wide' ? 'Wd' : ball.extras?.type === 'noBall' ? 'Nb' : ball.runs}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Overs */}
            {recentOvers.length > 1 && (
                <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Overs</h3>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {recentOvers.map((over, i) => (
                            <div key={i} className="flex-shrink-0">
                                <p className="text-[10px] text-slate-500 mb-1">Over {over.overNumber} ({over.runs} runs)</p>
                                <div className="flex gap-1">
                                    {over.balls?.map((ball, j) => {
                                        let cls = `run-${ball.runs}`;
                                        if (ball.isWicket) cls = 'run-w';
                                        else if (ball.extras?.type === 'wide') cls = 'run-wd';
                                        else if (ball.extras?.type === 'noBall') cls = 'run-nb';
                                        return <div key={j} className={`run-dot ${cls}`} style={{ width: 22, height: 22, fontSize: '0.6rem' }}>
                                            {ball.isWicket ? 'W' : ball.extras?.type === 'wide' ? 'Wd' : ball.runs}
                                        </div>;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Scorecard Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {match.innings?.map((inn, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <h3 className="text-sm font-bold">{inn.battingTeam?.name || `Innings ${idx + 1}`}</h3>
                            <p className="text-xs text-slate-400">{inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov) • CRR: {inn.currentRunRate}</p>
                        </div>
                        <table className="w-full text-xs">
                            <thead><tr className="text-slate-500 border-b border-white/5">
                                <th className="text-left px-4 py-2">Batter</th><th className="px-2 py-2">R</th><th className="px-2 py-2">B</th>
                                <th className="px-2 py-2">4s</th><th className="px-2 py-2">6s</th><th className="px-2 py-2">SR</th>
                            </tr></thead>
                            <tbody>
                                {inn.batsmen?.map((b, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="px-4 py-2">
                                            <span className="font-medium">{b.player?.name || 'Unknown'}</span>
                                            <span className={`ml-1 text-[10px] ${b.isOut ? 'text-red-400' : 'text-green-400'}`}>{b.isOut ? b.dismissal?.type : 'not out'}</span>
                                        </td>
                                        <td className="px-2 py-2 font-bold text-center">{b.runs}</td>
                                        <td className="px-2 py-2 text-center text-slate-400">{b.ballsFaced}</td>
                                        <td className="px-2 py-2 text-center">{b.fours}</td>
                                        <td className="px-2 py-2 text-center">{b.sixes}</td>
                                        <td className="px-2 py-2 text-center text-slate-400">{b.strikeRate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-4 py-2 text-[10px] text-slate-500">
                            Extras: {inn.extras?.total || 0} (Wd {inn.extras?.wides}, Nb {inn.extras?.noBalls}, B {inn.extras?.byes}, Lb {inn.extras?.legByes})
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-xs text-slate-600">
                Powered by CricScore • Real-time Cricket Scoring
            </div>
        </div>
    );
}
