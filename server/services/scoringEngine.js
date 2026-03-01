const Match = require('../models/Match');
const Player = require('../models/Player');
const Tournament = require('../models/Tournament');

class ScoringEngine {
    /**
     * Record a ball delivery and update all statistics
     * @param {string} matchId 
     * @param {object} ballData - { runs, extraType, extraRuns, isWicket, wicketType, batsmanOut, fielder, newBatsman, newBowler }
     * @returns Updated match document
     */
    static async recordBall(matchId, ballData) {
        const match = await Match.findById(matchId);
        if (!match || match.status !== 'live') throw new Error('Match not found or not live');

        const inningsIndex = match.currentInnings - 1;
        const innings = match.innings[inningsIndex];
        if (!innings || innings.isCompleted) throw new Error('Current innings is completed');

        const currentOver = innings.overs[innings.overs.length - 1];
        const { runs = 0, extraType = 'none', extraRuns = 0, isWicket = false,
            wicketType = '', batsmanOut, fielder, newBatsman, newBowler } = ballData;

        // Calculate total runs for this delivery
        let totalRuns = runs;
        let isLegal = true;

        // Handle extras
        if (extraType === 'wide') {
            totalRuns = 1 + extraRuns; // Wide = 1 extra + any additional runs
            isLegal = false;
            innings.extras.wides += totalRuns;
            innings.extras.total += totalRuns;
        } else if (extraType === 'noBall') {
            totalRuns = 1 + runs + extraRuns; // NoBall = 1 extra + batsman runs + overthrows
            isLegal = false;
            innings.extras.noBalls += 1;
            innings.extras.total += 1;
        } else if (extraType === 'bye') {
            totalRuns = extraRuns;
            innings.extras.byes += extraRuns;
            innings.extras.total += extraRuns;
        } else if (extraType === 'legBye') {
            totalRuns = extraRuns;
            innings.extras.legByes += extraRuns;
            innings.extras.total += extraRuns;
        }

        // Create ball entry
        const legalBallsInOver = currentOver.balls.filter(b => b.isLegal).length;
        const ball = {
            ballNumber: legalBallsInOver + 1,
            batsman: innings.currentBatsman,
            bowler: innings.currentBowler,
            nonStriker: innings.currentNonStriker,
            runs,
            extras: { type: extraType, runs: extraType !== 'none' ? (extraType === 'wide' ? totalRuns : extraRuns + (extraType === 'noBall' ? 1 : 0)) : 0 },
            totalRuns,
            isWicket,
            isLegal,
            commentary: this.generateCommentary(runs, extraType, isWicket, wicketType),
        };

        if (isWicket) {
            const wicketBatsman = batsmanOut || innings.currentBatsman;
            ball.wicket = {
                type: wicketType,
                batsman: wicketBatsman,
                fielder: fielder || null,
                bowlerCredit: !['runOut', 'retiredHurt', 'retired', 'obstructing'].includes(wicketType),
            };
        }

        currentOver.balls.push(ball);
        currentOver.runs += totalRuns;
        if (isWicket) currentOver.wickets += 1;

        // Update innings totals
        innings.totalRuns += totalRuns;
        if (isLegal) innings.totalBalls += 1;

        // Update batsman stats
        const batsmanEntry = innings.batsmen.find(b => b.player.toString() === innings.currentBatsman.toString());
        if (batsmanEntry) {
            if (extraType !== 'wide') { // Wides don't count as balls faced
                if (extraType !== 'bye' && extraType !== 'legBye') {
                    batsmanEntry.runs += runs;
                }
                if (isLegal || extraType === 'noBall') batsmanEntry.ballsFaced += 1;
                if (runs === 4 && extraType === 'none') batsmanEntry.fours += 1;
                if (runs === 6 && extraType === 'none') batsmanEntry.sixes += 1;
                batsmanEntry.strikeRate = batsmanEntry.ballsFaced > 0
                    ? parseFloat(((batsmanEntry.runs / batsmanEntry.ballsFaced) * 100).toFixed(2)) : 0;
            }
        }

        // Update bowler stats
        const bowlerEntry = innings.bowlers.find(b => b.player.toString() === innings.currentBowler.toString());
        if (bowlerEntry) {
            if (isLegal) bowlerEntry.ballsBowled += 1;
            if (extraType === 'wide') {
                bowlerEntry.wides += 1;
                bowlerEntry.runsConceded += totalRuns;
            } else if (extraType === 'noBall') {
                bowlerEntry.noBalls += 1;
                bowlerEntry.runsConceded += 1 + runs; // NoBall penalty + batsman runs
            } else if (extraType === 'bye' || extraType === 'legBye') {
                // Byes and leg byes don't count against bowler
            } else {
                bowlerEntry.runsConceded += runs;
            }
            if (isWicket && ball.wicket?.bowlerCredit) bowlerEntry.wickets += 1;
            if (totalRuns === 0 && isLegal && !isWicket) bowlerEntry.dots += 1;
            const bowlerOvers = bowlerEntry.ballsBowled / 6;
            bowlerEntry.economy = bowlerOvers > 0
                ? parseFloat((bowlerEntry.runsConceded / bowlerOvers).toFixed(2)) : 0;
            bowlerEntry.overs = Math.floor(bowlerEntry.ballsBowled / 6);
        }

        // Update partnership
        const currentPartnership = innings.partnerships[innings.partnerships.length - 1];
        if (currentPartnership) {
            currentPartnership.runs += totalRuns;
            if (isLegal) currentPartnership.balls += 1;
        }

        // Handle wicket
        if (isWicket) {
            const wicketBatsman = batsmanOut || innings.currentBatsman;
            innings.totalWickets += 1;

            // Update batsman dismissal
            const outBatsman = innings.batsmen.find(b => b.player.toString() === wicketBatsman.toString());
            if (outBatsman) {
                outBatsman.isOut = true;
                outBatsman.dismissal = {
                    type: wicketType,
                    bowler: ball.wicket?.bowlerCredit ? innings.currentBowler : undefined,
                    fielder: fielder || undefined,
                };
            }

            // Fall of wicket
            const completedOvers = Math.floor(innings.totalBalls / 6);
            const remainingBalls = innings.totalBalls % 6;
            innings.fallOfWickets.push({
                wicketNumber: innings.totalWickets,
                player: wicketBatsman,
                score: innings.totalRuns,
                overs: `${completedOvers}.${remainingBalls}`,
            });

            // New batsman comes in
            if (newBatsman) {
                const newBattingOrder = innings.batsmen.length + 1;
                innings.batsmen.push({ player: newBatsman, battingOrder: newBattingOrder });

                // Determine who is on strike
                if (wicketBatsman.toString() === innings.currentBatsman.toString()) {
                    innings.currentBatsman = newBatsman;
                } else {
                    innings.currentNonStriker = newBatsman;
                }

                // New partnership
                innings.partnerships.push({
                    batsman1: innings.currentBatsman,
                    batsman2: innings.currentNonStriker,
                    runs: 0, balls: 0,
                    wicketNumber: innings.totalWickets + 1,
                });
            }
        }

        // Rotate strike on odd runs (only for legal deliveries or NoBalls with runs)
        const shouldRotate = (runs % 2 !== 0) && !isWicket;
        if (shouldRotate) {
            const temp = innings.currentBatsman;
            innings.currentBatsman = innings.currentNonStriker;
            innings.currentNonStriker = temp;
        }

        // Check if over is complete (6 legal deliveries)
        const legalBallsNow = currentOver.balls.filter(b => b.isLegal).length;
        if (legalBallsNow >= 6) {
            // Check for maiden over
            const overRunsFromBat = currentOver.balls.reduce((sum, b) => {
                if (b.extras.type === 'bye' || b.extras.type === 'legBye') return sum;
                return sum + b.totalRuns;
            }, 0);
            currentOver.isMaiden = overRunsFromBat === 0;
            if (currentOver.isMaiden && bowlerEntry) bowlerEntry.maidens += 1;

            // Rotate strike at end of over
            const temp = innings.currentBatsman;
            innings.currentBatsman = innings.currentNonStriker;
            innings.currentNonStriker = temp;

            // Set new bowler for next over
            if (newBowler) {
                innings.currentBowler = newBowler;
                // Add bowler entry if new
                const existingBowler = innings.bowlers.find(b => b.player.toString() === newBowler.toString());
                if (!existingBowler) {
                    innings.bowlers.push({ player: newBowler });
                }
                // Create new over
                innings.overs.push({
                    overNumber: innings.overs.length + 1,
                    bowler: newBowler,
                    balls: [],
                });
            }
        }

        // Calculate overs display
        innings.totalOvers = parseFloat(`${Math.floor(innings.totalBalls / 6)}.${innings.totalBalls % 6}`);

        // Calculate CRR
        const oversDecimal = innings.totalBalls / 6;
        innings.currentRunRate = oversDecimal > 0
            ? parseFloat((innings.totalRuns / oversDecimal).toFixed(2)) : 0;

        // Calculate RRR (if second innings)
        if (inningsIndex === 1 && innings.target > 0) {
            const runsNeeded = innings.target - innings.totalRuns;
            const ballsRemaining = (match.oversPerInning * 6) - innings.totalBalls;
            const oversRemaining = ballsRemaining / 6;
            innings.requiredRunRate = oversRemaining > 0
                ? parseFloat((runsNeeded / oversRemaining).toFixed(2)) : 0;
        }

        // Check innings completion
        const maxOvers = match.oversPerInning;
        const allOut = innings.totalWickets >= 10;
        const oversComplete = innings.totalBalls >= maxOvers * 6;
        const targetChased = inningsIndex === 1 && innings.totalRuns >= innings.target;

        if (allOut || oversComplete || targetChased) {
            innings.isCompleted = true;

            // If first innings complete, prepare second innings
            if (inningsIndex === 0) {
                // Second innings target
                const target = innings.totalRuns + 1;
                match.currentInnings = 2;
                // Second innings will be created when scorers start it
            }

            // If second innings complete or target chased — match is done
            if (inningsIndex === 1) {
                match.status = 'completed';
                this.calculateResult(match);
            }
        }

        match.innings[inningsIndex] = innings;
        await match.save();

        return match;
    }

    /**
     * Start second innings
     */
    static async startSecondInnings(matchId, { openingBatsmen, openingBowler }) {
        const match = await Match.findById(matchId);
        if (!match) throw new Error('Match not found');

        const firstInnings = match.innings[0];
        const target = firstInnings.totalRuns + 1;

        const secondInnings = {
            inningsNumber: 2,
            battingTeam: firstInnings.bowlingTeam,
            bowlingTeam: firstInnings.battingTeam,
            target,
            batsmen: [
                { player: openingBatsmen[0], battingOrder: 1 },
                { player: openingBatsmen[1], battingOrder: 2 },
            ],
            bowlers: [{ player: openingBowler }],
            partnerships: [{
                batsman1: openingBatsmen[0],
                batsman2: openingBatsmen[1],
                runs: 0, balls: 0, wicketNumber: 1,
            }],
            currentBatsman: openingBatsmen[0],
            currentNonStriker: openingBatsmen[1],
            currentBowler: openingBowler,
            overs: [{ overNumber: 1, bowler: openingBowler, balls: [] }],
        };

        match.innings.push(secondInnings);
        match.currentInnings = 2;
        await match.save();
        return match;
    }

    /**
     * Undo the last ball
     */
    static async undoLastBall(matchId) {
        const match = await Match.findById(matchId);
        if (!match || match.status !== 'live') throw new Error('Match not found or not live');

        const innings = match.innings[match.currentInnings - 1];
        const currentOver = innings.overs[innings.overs.length - 1];

        if (currentOver.balls.length === 0) {
            if (innings.overs.length <= 1) throw new Error('No balls to undo');
            // Go back to previous over
            innings.overs.pop();
            const prevOver = innings.overs[innings.overs.length - 1];
            prevOver.isMaiden = false;
        }

        const lastOver = innings.overs[innings.overs.length - 1];
        const lastBall = lastOver.balls.pop();
        if (!lastBall) throw new Error('No balls to undo');

        // Reverse stats
        innings.totalRuns -= lastBall.totalRuns;
        if (lastBall.isLegal) innings.totalBalls -= 1;
        lastOver.runs -= lastBall.totalRuns;
        if (lastBall.isWicket) {
            lastOver.wickets -= 1;
            innings.totalWickets -= 1;
            innings.fallOfWickets.pop();
            // Remove last batsman if was new
            const lastBatsman = innings.batsmen[innings.batsmen.length - 1];
            if (lastBatsman && !lastBatsman.isOut && lastBatsman.ballsFaced === 0) {
                innings.batsmen.pop();
                innings.partnerships.pop();
            }
            // Restore dismissed batsman
            const outBatsman = innings.batsmen.find(b => b.player.toString() === lastBall.wicket?.batsman?.toString());
            if (outBatsman) {
                outBatsman.isOut = false;
                outBatsman.dismissal = { type: 'not out' };
            }
        }

        // Reverse extras
        if (lastBall.extras.type === 'wide') innings.extras.wides -= lastBall.totalRuns;
        if (lastBall.extras.type === 'noBall') innings.extras.noBalls -= 1;
        if (lastBall.extras.type === 'bye') innings.extras.byes -= lastBall.extras.runs;
        if (lastBall.extras.type === 'legBye') innings.extras.legByes -= lastBall.extras.runs;
        if (lastBall.extras.type !== 'none') innings.extras.total -= lastBall.extras.runs;

        // Restore batsman/bowler to the state before this ball (best effort)
        innings.currentBatsman = lastBall.batsman;
        innings.currentNonStriker = lastBall.nonStriker;
        innings.currentBowler = lastBall.bowler;

        // Recalculate totals
        innings.totalOvers = parseFloat(`${Math.floor(innings.totalBalls / 6)}.${innings.totalBalls % 6}`);
        const oversDecimal = innings.totalBalls / 6;
        innings.currentRunRate = oversDecimal > 0 ? parseFloat((innings.totalRuns / oversDecimal).toFixed(2)) : 0;

        match.innings[match.currentInnings - 1] = innings;
        await match.save();
        return match;
    }

    /**
     * Calculate match result
     */
    static calculateResult(match) {
        const first = match.innings[0];
        const second = match.innings[1];

        if (second.totalRuns >= second.target) {
            // Batting second team wins
            match.result = {
                winner: second.battingTeam,
                winMargin: 10 - second.totalWickets,
                winType: 'wickets',
                resultText: `${10 - second.totalWickets} wickets`,
            };
        } else if (second.isCompleted && second.totalRuns < second.target - 1) {
            // Batting first team wins
            const margin = first.totalRuns - second.totalRuns;
            match.result = {
                winner: first.battingTeam,
                winMargin: margin,
                winType: 'runs',
                resultText: `${margin} runs`,
            };
        } else if (second.isCompleted && second.totalRuns === first.totalRuns) {
            match.result = {
                resultText: 'Match Tied',
                winType: 'tie',
            };
        }
    }

    /**
     * Generate automatic commentary
     */
    static generateCommentary(runs, extraType, isWicket, wicketType) {
        if (isWicket) return `WICKET! ${wicketType}`;
        if (extraType === 'wide') return 'Wide ball';
        if (extraType === 'noBall') return `No ball${runs > 0 ? `, ${runs} runs` : ''}`;
        if (runs === 0) return 'Dot ball';
        if (runs === 4) return 'FOUR!';
        if (runs === 6) return 'SIX!';
        return `${runs} run${runs > 1 ? 's' : ''}`;
    }

    /**
     * Update tournament points table after a match
     */
    static async updateTournamentPoints(matchId) {
        const match = await Match.findById(matchId);
        if (!match || !match.tournament || match.status !== 'completed') return;

        const tournament = await Tournament.findById(match.tournament);
        if (!tournament) return;

        const first = match.innings[0];
        const second = match.innings[1];

        // Helper to update a team's entry
        const updateTeam = (teamId, won, lost, tied) => {
            let entry = tournament.pointsTable.find(e => e.team.toString() === teamId.toString());
            if (!entry) {
                tournament.pointsTable.push({ team: teamId });
                entry = tournament.pointsTable[tournament.pointsTable.length - 1];
            }
            entry.played += 1;
            entry.won += won;
            entry.lost += lost;
            entry.tied += tied;
            entry.points += won * tournament.pointsPerWin + tied * tournament.pointsPerTie;
        };

        // Determine result
        if (match.result.winType === 'tie') {
            updateTeam(first.battingTeam, 0, 0, 1);
            updateTeam(second.battingTeam, 0, 0, 1);
        } else if (match.result.winner) {
            const loser = match.result.winner.toString() === first.battingTeam.toString()
                ? second.battingTeam : first.battingTeam;
            updateTeam(match.result.winner, 1, 0, 0);
            updateTeam(loser, 0, 1, 0);
        }

        // Update NRR for both teams
        const updateNRR = (teamId) => {
            const entry = tournament.pointsTable.find(e => e.team.toString() === teamId.toString());
            if (!entry) return;

            // Add this match's data
            const isTeamBattingFirst = first.battingTeam.toString() === teamId.toString();
            const teamBatting = isTeamBattingFirst ? first : second;
            const teamBowling = isTeamBattingFirst ? second : first;

            entry.runsScored += teamBatting.totalRuns;
            entry.oversPlayed += teamBatting.totalBalls / 6;
            entry.runsConceded += teamBowling.totalRuns;
            entry.oversFaced += teamBowling.totalBalls / 6;

            // NRR = (runsScored / oversPlayed) - (runsConceded / oversFaced)
            const forRate = entry.oversPlayed > 0 ? entry.runsScored / entry.oversPlayed : 0;
            const againstRate = entry.oversFaced > 0 ? entry.runsConceded / entry.oversFaced : 0;
            entry.nrr = parseFloat((forRate - againstRate).toFixed(3));
        };

        updateNRR(first.battingTeam);
        updateNRR(second.battingTeam);

        await tournament.save();
    }

    /**
     * Update player career stats after a match
     */
    static async updatePlayerCareerStats(matchId) {
        const match = await Match.findById(matchId);
        if (!match || match.status !== 'completed') return;

        for (const innings of match.innings) {
            // Update batting stats
            for (const batsman of innings.batsmen) {
                const player = await Player.findById(batsman.player);
                if (!player) continue;
                player.stats.batting.innings += 1;
                player.stats.batting.runs += batsman.runs;
                player.stats.batting.ballsFaced += batsman.ballsFaced;
                player.stats.batting.fours += batsman.fours;
                player.stats.batting.sixes += batsman.sixes;
                if (!batsman.isOut) player.stats.batting.notOuts += 1;
                if (batsman.runs > player.stats.batting.highestScore) player.stats.batting.highestScore = batsman.runs;
                if (batsman.runs >= 100) player.stats.batting.hundreds += 1;
                else if (batsman.runs >= 50) player.stats.batting.fifties += 1;
                player.stats.matches = Math.max(player.stats.matches, (player.stats.matches || 0));
                await player.save();
            }

            // Update bowling stats
            for (const bowler of innings.bowlers) {
                const player = await Player.findById(bowler.player);
                if (!player) continue;
                player.stats.bowling.innings += 1;
                player.stats.bowling.ballsBowled += bowler.ballsBowled;
                player.stats.bowling.runsConceded += bowler.runsConceded;
                player.stats.bowling.wickets += bowler.wickets;
                player.stats.bowling.maidens += bowler.maidens;
                if (bowler.wickets > player.stats.bowling.bestFiguresWickets ||
                    (bowler.wickets === player.stats.bowling.bestFiguresWickets && bowler.runsConceded < player.stats.bowling.bestFiguresRuns)) {
                    player.stats.bowling.bestFiguresWickets = bowler.wickets;
                    player.stats.bowling.bestFiguresRuns = bowler.runsConceded;
                }
                if (bowler.wickets >= 5) player.stats.bowling.fiveWickets += 1;
                await player.save();
            }
        }
    }
}

module.exports = ScoringEngine;
