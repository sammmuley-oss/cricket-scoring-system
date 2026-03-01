import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useMatchStore from '../../store/matchStore';
import { matchesAPI, playersAPI } from '../../api';
import { Loader, Modal } from '../../components/common';

export default function LiveScoring() {
    const { id } = useParams();
    const { currentMatch, fetchMatch, recordBall, undoLastBall, startSecondInnings, connectToMatch, disconnectFromMatch } = useMatchStore();
    const [loading, setLoading] = useState(true);
    const [teamPlayers, setTeamPlayers] = useState({ teamA: [], teamB: [] });
    const [showSetup, setShowSetup] = useState(false);
    const [showToss, setShowToss] = useState(false);
    const [showNewBatsman, setShowNewBatsman] = useState(false);
    const [showNewBowler, setShowNewBowler] = useState(false);
    const [showSecondInnings, setShowSecondInnings] = useState(false);
    const [tossForm, setTossForm] = useState({ winner: '', decision: 'bat' });
    const [setupForm, setSetupForm] = useState({ openingBatsmen: ['', ''], openingBowler: '' });
    const [newBatsman, setNewBatsman] = useState('');
    const [newBowler, setNewBowler] = useState('');
    const [pendingBall, setPendingBall] = useState(null);
    const [lastAction, setLastAction] = useState('');

    useEffect(() => {
        const init = async () => {
            await fetchMatch(id);
            connectToMatch(id);
            setLoading(false);
        };
        init();
        return () => disconnectFromMatch();
    }, [id]);

    // Fetch team players when match loads
    useEffect(() => {
        if (!currentMatch) return;
        const fetchPlayers = async () => {
            try {
                const [pA, pB] = await Promise.all([
                    playersAPI.getAll({ team: currentMatch.teamA?._id }),
                    playersAPI.getAll({ team: currentMatch.teamB?._id }),
                ]);
                setTeamPlayers({ teamA: pA.data.data, teamB: pB.data.data });
            } catch (e) { console.error(e); }
        };
        fetchPlayers();
    }, [currentMatch?.teamA?._id, currentMatch?.teamB?._id]);

    if (loading || !currentMatch) return <Loader />;

    const match = currentMatch;
    const innings = match.innings?.[match.currentInnings - 1];
    const isLive = match.status === 'live';
    const isFirstInningsComplete = match.innings?.[0]?.isCompleted;
    const needsSecondInnings = isFirstInningsComplete && !match.innings?.[1];

    // Get current batting/bowling team players
    const getBattingTeamPlayers = () => {
        if (!innings) return [];
        const battingTeamId = innings.battingTeam?._id || innings.battingTeam;
        return battingTeamId?.toString() === match.teamA?._id?.toString() ? teamPlayers.teamA : teamPlayers.teamB;
    };
    const getBowlingTeamPlayers = () => {
        if (!innings) return [];
        const bowlingTeamId = innings.bowlingTeam?._id || innings.bowlingTeam;
        return bowlingTeamId?.toString() === match.teamA?._id?.toString() ? teamPlayers.teamA : teamPlayers.teamB;
    };

    // Check if over just completed (need new bowler)
    const currentOver = innings?.overs?.[innings.overs.length - 1];
    const legalBallsInOver = currentOver?.balls?.filter(b => b.isLegal).length || 0;
    const overComplete = legalBallsInOver >= 6;

    // Handle ball recording
    const handleBall = async (runs, extraType = 'none', isWicket = false, wicketType = '') => {
        if (!isLive || !innings) return;

        const ballData = { runs, extraType, isWicket, wicketType };

        if (isWicket && innings.totalWickets < 9) {
            setPendingBall(ballData);
            setShowNewBatsman(true);
            return;
        }

        if (overComplete && !isWicket) {
            setPendingBall(ballData);
            setShowNewBowler(true);
            return;
        }

        try {
            await recordBall(id, ballData);
            setLastAction(getActionText(runs, extraType, isWicket, wicketType));
            // Check if over just completed after this ball
            const updatedMatch = useMatchStore.getState().currentMatch;
            const updatedInnings = updatedMatch?.innings?.[updatedMatch.currentInnings - 1];
            const updatedOver = updatedInnings?.overs?.[updatedInnings.overs.length - 1];
            const updatedLegal = updatedOver?.balls?.filter(b => b.isLegal).length || 0;
            if (updatedLegal >= 6) setShowNewBowler(true);
        } catch (e) { console.error(e); }
    };

    const confirmNewBatsman = async () => {
        if (!pendingBall || !newBatsman) return;
        try {
            await recordBall(id, { ...pendingBall, newBatsman });
            setShowNewBatsman(false); setPendingBall(null); setNewBatsman('');
            setLastAction(getActionText(pendingBall.runs, pendingBall.extraType, true, pendingBall.wicketType));
        } catch (e) { console.error(e); }
    };

    const confirmNewBowler = async () => {
        if (!newBowler) return;
        if (pendingBall) {
            try {
                await recordBall(id, { ...pendingBall, newBowler });
                setPendingBall(null);
            } catch (e) { console.error(e); }
        }
        setShowNewBowler(false); setNewBowler('');
    };

    const handleToss = async (e) => {
        e.preventDefault();
        try { await matchesAPI.setToss(id, tossForm); setShowToss(false); await fetchMatch(id); } catch (e) { console.error(e); }
    };

    const handleStartMatch = async (e) => {
        e.preventDefault();
        try {
            await matchesAPI.start(id, { openingBatsmen: setupForm.openingBatsmen, openingBowler: setupForm.openingBowler });
            setShowSetup(false); await fetchMatch(id);
        } catch (e) { console.error(e); }
    };

    const handleStartSecondInnings = async (e) => {
        e.preventDefault();
        try {
            await startSecondInnings(id, { openingBatsmen: setupForm.openingBatsmen, openingBowler: setupForm.openingBowler });
            setShowSecondInnings(false); await fetchMatch(id);
        } catch (e) { console.error(e); }
    };

    const getActionText = (runs, extra, wicket, wType) => {
        if (wicket) return `🔴 WICKET! ${wType}`;
        if (extra === 'wide') return '⚪ Wide';
        if (extra === 'noBall') return `⚪ No Ball${runs > 0 ? ` + ${runs}` : ''}`;
        if (runs === 0) return '⚫ Dot ball';
        if (runs === 4) return '🟢 FOUR!';
        if (runs === 6) return '🟠 SIX!';
        return `${runs} run${runs > 1 ? 's' : ''}`;
    };

    // Find current batsman/bowler names
    const findBatsmanEntry = (playerId) => innings?.batsmen?.find(b => (b.player?._id || b.player)?.toString() === playerId?.toString());
    const findBowlerEntry = (playerId) => innings?.bowlers?.find(b => (b.player?._id || b.player)?.toString() === playerId?.toString());
    const currentBatsman = findBatsmanEntry(innings?.currentBatsman?._id || innings?.currentBatsman);
    const currentNonStriker = findBatsmanEntry(innings?.currentNonStriker?._id || innings?.currentNonStriker);
    const currentBowlerEntry = findBowlerEntry(innings?.currentBowler?._id || innings?.currentBowler);

    return (
        <div className="space-y-4">
            {/* Match Header */}
            <div className="stadium-gradient rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs opacity-70">{match.format} • {match.venue || 'Venue TBD'}</span>
                    {isLive && <div className="live-indicator" style={{ color: 'white', background: 'rgba(255,255,255,0.15)' }}>LIVE</div>}
                    {match.status === 'completed' && <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">COMPLETED</span>}
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div>
                        <p className="text-sm opacity-80">{innings?.battingTeam?.name || match.teamA?.name || 'Team A'}</p>
                        <p className="score-big mt-1">{innings?.totalRuns || 0}<span className="text-2xl opacity-60">/{innings?.totalWickets || 0}</span></p>
                        <p className="text-sm opacity-70 mt-1">({innings?.totalOvers || 0} / {match.oversPerInning} ov)</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-xs opacity-60">CRR: <span className="font-bold text-sm">{innings?.currentRunRate || '0.00'}</span></p>
                        {innings?.target > 0 && <>
                            <p className="text-xs opacity-60">Target: <span className="font-bold text-sm">{innings.target}</span></p>
                            <p className="text-xs opacity-60">RRR: <span className="font-bold text-sm">{innings.requiredRunRate || '0.00'}</span></p>
                            <p className="text-sm font-bold mt-2" style={{ color: '#fbbf24' }}>
                                Need {innings.target - innings.totalRuns} off {(match.oversPerInning * 6) - innings.totalBalls} balls
                            </p>
                        </>}
                    </div>
                </div>

                {/* Extras */}
                <div className="flex gap-3 mt-3 text-xs opacity-70">
                    <span>Extras: {innings?.extras?.total || 0}</span>
                    <span>(Wd: {innings?.extras?.wides || 0}, Nb: {innings?.extras?.noBalls || 0}, B: {innings?.extras?.byes || 0}, Lb: {innings?.extras?.legByes || 0})</span>
                </div>
            </div>

            {/* Current Players */}
            {isLive && innings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Batsmen */}
                    <div className="card">
                        <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>Batting</h4>
                        {[{ entry: currentBatsman, label: '🏏', isStriker: true }, { entry: currentNonStriker, label: '', isStriker: false }].map((b, i) => b.entry && (
                            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i === 0 ? '1px solid var(--border-color)' : 'none' }}>
                                <div className="flex items-center gap-2">
                                    {b.isStriker && <span className="text-xs">*</span>}
                                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                        {b.entry.player?.name || 'Batsman'}
                                    </p>
                                </div>
                                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="font-bold">{b.entry.runs || 0}<span className="opacity-50">({b.entry.ballsFaced || 0})</span></span>
                                    <span>4s: {b.entry.fours || 0}</span>
                                    <span>6s: {b.entry.sixes || 0}</span>
                                    <span>SR: {b.entry.strikeRate || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bowler */}
                    <div className="card">
                        <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>Bowling</h4>
                        {currentBowlerEntry && (
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {currentBowlerEntry.player?.name || 'Bowler'}
                                </p>
                                <div className="flex gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    <span className="font-bold">{currentBowlerEntry.overs || 0}.{(currentBowlerEntry.ballsBowled || 0) % 6}-{currentBowlerEntry.maidens || 0}-{currentBowlerEntry.runsConceded || 0}-{currentBowlerEntry.wickets || 0}</span>
                                    <span>Econ: {currentBowlerEntry.economy || 0}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Over Progress */}
            {isLive && currentOver && (
                <div className="card">
                    <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>
                        Over {currentOver.overNumber} {currentOver.balls?.length ? `(${legalBallsInOver}/6)` : ''}
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                        {currentOver.balls?.map((ball, i) => {
                            let cls = `run-${ball.runs}`;
                            if (ball.isWicket) cls = 'run-w';
                            else if (ball.extras?.type === 'wide') cls = 'run-wd';
                            else if (ball.extras?.type === 'noBall') cls = 'run-nb';
                            return (
                                <div key={i} className={`run-dot ${cls} animate-count-up`} style={{ animationDelay: `${i * 50}ms` }}>
                                    {ball.isWicket ? 'W' : ball.extras?.type === 'wide' ? 'Wd' : ball.extras?.type === 'noBall' ? 'Nb' : ball.runs}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Last Action */}
            {lastAction && (
                <div className="text-center py-2 rounded-lg animate-score-flash font-bold text-sm"
                    style={{ background: 'rgba(13,158,110,0.1)', color: 'var(--color-primary)' }}>
                    {lastAction}
                </div>
            )}

            {/* Scoring Controls */}
            {isLive && innings && !innings.isCompleted && (
                <div className="card space-y-4">
                    <h4 className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>Score Input</h4>

                    {/* Runs */}
                    <div>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Runs</p>
                        <div className="grid grid-cols-7 gap-2">
                            {[0, 1, 2, 3, 4, 5, 6].map(r => (
                                <button key={r} onClick={() => handleBall(r)}
                                    className={`btn ${r === 4 ? 'btn-primary' : r === 6 ? 'btn-accent' : 'btn-secondary'} py-3`}
                                    style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Extras */}
                    <div>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Extras</p>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBall(0, 'wide')} className="btn btn-secondary py-2.5 text-xs">Wide</button>
                            <button onClick={() => handleBall(0, 'noBall')} className="btn btn-secondary py-2.5 text-xs">No Ball</button>
                            <button onClick={() => handleBall(0, 'bye', false, '', 1)} className="btn btn-secondary py-2.5 text-xs">Bye</button>
                            <button onClick={() => handleBall(0, 'legBye', false, '', 1)} className="btn btn-secondary py-2.5 text-xs">Leg Bye</button>
                        </div>
                    </div>

                    {/* Wicket */}
                    <div>
                        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Wicket</p>
                        <div className="grid grid-cols-4 gap-2">
                            {['bowled', 'caught', 'lbw', 'runOut', 'stumped', 'hitWicket'].map(w => (
                                <button key={w} onClick={() => handleBall(0, 'none', true, w)}
                                    className="btn btn-danger btn-sm py-2 text-xs capitalize">
                                    {w === 'runOut' ? 'Run Out' : w === 'hitWicket' ? 'Hit Wkt' : w === 'lbw' ? 'LBW' : w}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <button onClick={() => undoLastBall(id)} className="btn btn-secondary btn-sm">↩ Undo</button>
                    </div>
                </div>
            )}

            {/* Pre-match setup */}
            {match.status === 'upcoming' && (
                <div className="card text-center py-8">
                    <p className="text-3xl mb-3">🏏</p>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Match Not Started</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Set the toss and start the match</p>
                    <button className="btn btn-primary" onClick={() => setShowToss(true)}>Set Toss</button>
                </div>
            )}

            {match.status === 'toss' && (
                <div className="card text-center py-8">
                    <p className="text-3xl mb-3">✅</p>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Toss Done</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Set openers and start innings</p>
                    <button className="btn btn-primary" onClick={() => setShowSetup(true)}>Start Match</button>
                </div>
            )}

            {needsSecondInnings && (
                <div className="card text-center py-8">
                    <p className="text-3xl mb-3">🔄</p>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>First Innings Complete</h3>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
                        {match.innings[0]?.battingTeam?.name}: {match.innings[0]?.totalRuns}/{match.innings[0]?.totalWickets} ({match.innings[0]?.totalOvers} ov)
                    </p>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Target: {match.innings[0]?.totalRuns + 1}</p>
                    <button className="btn btn-primary" onClick={() => setShowSecondInnings(true)}>Start 2nd Innings</button>
                </div>
            )}

            {match.status === 'completed' && (
                <div className="card text-center py-8">
                    <p className="text-3xl mb-3">🏆</p>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Match Completed</h3>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                        {match.result?.winner?.name || ''} won by {match.result?.resultText || ''}
                    </p>
                </div>
            )}

            {/* Batting Scorecard */}
            {innings?.batsmen?.length > 0 && (
                <div className="card">
                    <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>Batting Scorecard</h4>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead><tr><th>Batsman</th><th>Dismissal</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
                            <tbody>
                                {innings.batsmen.map((b, i) => (
                                    <tr key={i}>
                                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.player?.name || 'Unknown'}</td>
                                        <td className="text-xs" style={{ color: b.isOut ? 'var(--color-danger)' : 'var(--color-success)' }}>
                                            {b.isOut ? `${b.dismissal?.type || 'out'} ${b.dismissal?.bowler?.name ? `b ${b.dismissal.bowler.name}` : ''}` : 'not out'}
                                        </td>
                                        <td className="font-bold">{b.runs}</td><td>{b.ballsFaced}</td>
                                        <td>{b.fours}</td><td>{b.sixes}</td><td>{b.strikeRate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bowling Scorecard */}
            {innings?.bowlers?.length > 0 && (
                <div className="card">
                    <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>Bowling Scorecard</h4>
                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead><tr><th>Bowler</th><th>O</th><th>M</th><th>R</th><th>W</th><th>Econ</th><th>Dots</th></tr></thead>
                            <tbody>
                                {innings.bowlers.map((b, i) => (
                                    <tr key={i}>
                                        <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{b.player?.name || 'Unknown'}</td>
                                        <td>{b.overs}.{(b.ballsBowled || 0) % 6}</td><td>{b.maidens}</td>
                                        <td>{b.runsConceded}</td><td className="font-bold">{b.wickets}</td><td>{b.economy}</td><td>{b.dots}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Fall of Wickets */}
            {innings?.fallOfWickets?.length > 0 && (
                <div className="card">
                    <h4 className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>Fall of Wickets</h4>
                    <div className="flex flex-wrap gap-3">
                        {innings.fallOfWickets.map((fow, i) => (
                            <div key={i} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                {fow.score}/{fow.wicketNumber} ({fow.overs} ov) - {fow.player?.name || ''}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Toss Modal */}
            <Modal open={showToss} onClose={() => setShowToss(false)} title="Set Toss">
                <form onSubmit={handleToss} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Toss Winner</label>
                        <select className="input" value={tossForm.winner} onChange={(e) => setTossForm({ ...tossForm, winner: e.target.value })} required>
                            <option value="">Select</option>
                            <option value={match.teamA?._id}>{match.teamA?.name}</option>
                            <option value={match.teamB?._id}>{match.teamB?.name}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Decision</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['bat', 'bowl'].map(d => (
                                <button key={d} type="button" onClick={() => setTossForm({ ...tossForm, decision: d })}
                                    className={`btn ${tossForm.decision === d ? 'btn-primary' : 'btn-secondary'} py-3 capitalize`}>{d}</button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Confirm Toss</button>
                </form>
            </Modal>

            {/* Start Match Setup Modal */}
            <Modal open={showSetup} onClose={() => setShowSetup(false)} title="Start Match - Set Openers">
                <form onSubmit={handleStartMatch} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Opening Batsman 1</label>
                        <select className="input" value={setupForm.openingBatsmen[0]}
                            onChange={(e) => setSetupForm({ ...setupForm, openingBatsmen: [e.target.value, setupForm.openingBatsmen[1]] })} required>
                            <option value="">Select</option>
                            {getBattingTeamPlayers().map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Opening Batsman 2</label>
                        <select className="input" value={setupForm.openingBatsmen[1]}
                            onChange={(e) => setSetupForm({ ...setupForm, openingBatsmen: [setupForm.openingBatsmen[0], e.target.value] })} required>
                            <option value="">Select</option>
                            {getBattingTeamPlayers().filter(p => p._id !== setupForm.openingBatsmen[0]).map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Opening Bowler</label>
                        <select className="input" value={setupForm.openingBowler}
                            onChange={(e) => setSetupForm({ ...setupForm, openingBowler: e.target.value })} required>
                            <option value="">Select</option>
                            {getBowlingTeamPlayers().map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-full">🏏 Start Match</button>
                </form>
            </Modal>

            {/* Second Innings Modal */}
            <Modal open={showSecondInnings} onClose={() => setShowSecondInnings(false)} title="Start 2nd Innings">
                <form onSubmit={handleStartSecondInnings} className="space-y-4">
                    <p className="text-sm font-medium p-3 rounded-lg" style={{ background: 'rgba(13,158,110,0.1)', color: 'var(--color-primary)' }}>
                        Target: {(match.innings[0]?.totalRuns || 0) + 1} runs
                    </p>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Opening Batsman 1</label>
                        <select className="input" value={setupForm.openingBatsmen[0]}
                            onChange={(e) => setSetupForm({ ...setupForm, openingBatsmen: [e.target.value, setupForm.openingBatsmen[1]] })} required>
                            <option value="">Select</option>
                            {getBattingTeamPlayers().map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Opening Batsman 2</label>
                        <select className="input" value={setupForm.openingBatsmen[1]}
                            onChange={(e) => setSetupForm({ ...setupForm, openingBatsmen: [setupForm.openingBatsmen[0], e.target.value] })} required>
                            <option value="">Select</option>
                            {getBattingTeamPlayers().filter(p => p._id !== setupForm.openingBatsmen[0]).map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Opening Bowler</label>
                        <select className="input" value={setupForm.openingBowler}
                            onChange={(e) => setSetupForm({ ...setupForm, openingBowler: e.target.value })} required>
                            <option value="">Select</option>
                            {getBowlingTeamPlayers().map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Start 2nd Innings</button>
                </form>
            </Modal>

            {/* New Batsman Modal */}
            <Modal open={showNewBatsman} onClose={() => { setShowNewBatsman(false); setPendingBall(null); }} title="Select New Batsman">
                <div className="space-y-2">
                    {getBattingTeamPlayers()
                        .filter(p => !innings?.batsmen?.some(b => (b.player?._id || b.player)?.toString() === p._id && !b.isOut) || true)
                        .filter(p => !innings?.batsmen?.find(b => (b.player?._id || b.player)?.toString() === p._id))
                        .map(p => (
                            <button key={p._id} onClick={() => { setNewBatsman(p._id); }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${newBatsman === p._id ? 'border-green-500' : ''}`}
                                style={{ borderColor: newBatsman === p._id ? 'var(--color-primary)' : 'var(--border-color)', background: newBatsman === p._id ? 'rgba(13,158,110,0.1)' : 'transparent' }}>
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({p.role})</span>
                            </button>
                        ))}
                    <button onClick={confirmNewBatsman} className="btn btn-primary w-full mt-4" disabled={!newBatsman}>Confirm</button>
                </div>
            </Modal>

            {/* New Bowler Modal */}
            <Modal open={showNewBowler} onClose={() => { setShowNewBowler(false); setPendingBall(null); }} title="Select Next Over Bowler">
                <div className="space-y-2">
                    {getBowlingTeamPlayers()
                        .filter(p => (innings?.currentBowler?._id || innings?.currentBowler)?.toString() !== p._id)
                        .map(p => (
                            <button key={p._id} onClick={() => setNewBowler(p._id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all`}
                                style={{ borderColor: newBowler === p._id ? 'var(--color-primary)' : 'var(--border-color)', background: newBowler === p._id ? 'rgba(13,158,110,0.1)' : 'transparent' }}>
                                <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                                <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>({p.role})</span>
                                {innings?.bowlers?.find(b => (b.player?._id || b.player)?.toString() === p._id) && (
                                    <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
                                        {(() => { const b = innings.bowlers.find(b => (b.player?._id || b.player)?.toString() === p._id); return `${b.overs}.${b.ballsBowled % 6}-${b.runsConceded}-${b.wickets}`; })()}
                                    </span>
                                )}
                            </button>
                        ))}
                    <button onClick={confirmNewBowler} className="btn btn-primary w-full mt-4" disabled={!newBowler}>Start Over</button>
                </div>
            </Modal>
        </div>
    );
}
