/**
 * Market Analysis Module
 * Detects market inefficiencies and opportunities
 * 
 * Features:
 * - Arbitrage opportunity detection
 * - Steam move detection (rapid line movement)
 * - Market efficiency calculation
 * - Value bet identification (>5% edge)
 * - Bookmaker edge estimation (vig calculation)
 */

class MarketAnalyzer {
    constructor(options = {}) {
        this.valueThreshold = options.valueThreshold || 0.05; // 5% edge minimum
        this.steamMoveThreshold = options.steamMoveThreshold || 0.03; // 3% rapid movement
        this.arbitrageThreshold = options.arbitrageThreshold || 0.98; // <1 = arbitrage
        this.sharpThreshold = options.sharpThreshold || 0.02; // 2% reverse line movement
        
        // Market tracking
        this.lineHistory = {};
        this.volumeTracking = {};
    }

    /**
     * Analyze market for a game
     * @param {Object} game - Game data with bookmakers
     * @returns {Object} - Market analysis results
     */
    analyzeMarket(game) {
        const analysis = {
            hasArbitrage: false,
            arbitrageProfit: 0,
            hasSteamMove: false,
            steamMoveSize: 0,
            hasValueBet: false,
            valueEdge: 0,
            marketEfficiency: 0,
            bookmakerEdge: 0,
            sharpMoney: false,
            reverseLine: false,
            bestOdds: null,
            consensus: null
        };
        
        try {
            const bookmakers = game.bookmakers || [];
            if (bookmakers.length === 0) {
                return analysis;
            }
            
            // Extract all odds across bookmakers
            const oddsData = this._extractOddsData(bookmakers);
            
            // Detect arbitrage opportunities
            const arbitrage = this._detectArbitrage(oddsData);
            analysis.hasArbitrage = arbitrage.exists;
            analysis.arbitrageProfit = arbitrage.profit;
            
            // Detect steam moves
            const steam = this._detectSteamMove(game.id, oddsData);
            analysis.hasSteamMove = steam.detected;
            analysis.steamMoveSize = steam.size;
            
            // Calculate market efficiency
            analysis.marketEfficiency = this._calculateMarketEfficiency(oddsData);
            
            // Calculate bookmaker edge (vig)
            analysis.bookmakerEdge = this._calculateBookmakerEdge(oddsData);
            
            // Detect sharp money (reverse line movement)
            const sharp = this._detectSharpMoney(game.id, oddsData);
            analysis.sharpMoney = sharp.detected;
            analysis.reverseLine = sharp.reverse;
            
            // Find best odds
            analysis.bestOdds = this._findBestOdds(oddsData);
            
            // Calculate consensus odds
            analysis.consensus = this._calculateConsensus(oddsData);
            
            // Identify value bets
            const value = this._identifyValueBet(analysis.consensus, analysis.bestOdds, analysis.marketEfficiency);
            analysis.hasValueBet = value.exists;
            analysis.valueEdge = value.edge;
            
        } catch (error) {
            console.warn('Market analysis error:', error);
        }
        
        return analysis;
    }

    /**
     * Extract odds data from bookmakers
     */
    _extractOddsData(bookmakers) {
        const oddsData = {
            h2h: [], // Head-to-head (moneyline)
            spreads: [],
            totals: []
        };
        
        for (const bookmaker of bookmakers) {
            const bookmakerName = bookmaker.key || bookmaker.title;
            
            for (const market of bookmaker.markets || []) {
                const marketKey = market.key;
                const outcomes = market.outcomes || [];
                
                if (marketKey === 'h2h') {
                    for (const outcome of outcomes) {
                        oddsData.h2h.push({
                            bookmaker: bookmakerName,
                            team: outcome.name,
                            odds: outcome.price,
                            timestamp: market.last_update || Date.now()
                        });
                    }
                } else if (marketKey === 'spreads') {
                    for (const outcome of outcomes) {
                        oddsData.spreads.push({
                            bookmaker: bookmakerName,
                            team: outcome.name,
                            point: outcome.point,
                            odds: outcome.price,
                            timestamp: market.last_update || Date.now()
                        });
                    }
                } else if (marketKey === 'totals') {
                    for (const outcome of outcomes) {
                        oddsData.totals.push({
                            bookmaker: bookmakerName,
                            name: outcome.name,
                            point: outcome.point,
                            odds: outcome.price,
                            timestamp: market.last_update || Date.now()
                        });
                    }
                }
            }
        }
        
        return oddsData;
    }

    /**
     * Detect arbitrage opportunities
     * Arbitrage exists when sum of implied probabilities < 1
     */
    _detectArbitrage(oddsData) {
        const result = { exists: false, profit: 0, combination: null };
        
        // Check moneyline arbitrage (2-way)
        if (oddsData.h2h.length >= 2) {
            const teams = [...new Set(oddsData.h2h.map(o => o.team))];
            
            if (teams.length === 2) {
                // Find best odds for each team
                const bestOdds = teams.map(team => {
                    const teamOdds = oddsData.h2h.filter(o => o.team === team);
                    return teamOdds.reduce((best, curr) => 
                        curr.odds > best.odds ? curr : best
                    );
                });
                
                // Calculate implied probabilities
                const impliedProbs = bestOdds.map(o => this._oddsToImpliedProb(o.odds));
                const totalProb = impliedProbs.reduce((sum, p) => sum + p, 0);
                
                // Arbitrage exists if total < 1
                if (totalProb < this.arbitrageThreshold) {
                    result.exists = true;
                    result.profit = (1 / totalProb) - 1; // Profit percentage
                    result.combination = bestOdds;
                }
            }
        }
        
        return result;
    }

    /**
     * Detect steam moves (rapid line movement)
     */
    _detectSteamMove(gameId, oddsData) {
        const result = { detected: false, size: 0, direction: null };
        
        if (!this.lineHistory[gameId]) {
            // Initialize line history
            this.lineHistory[gameId] = {
                h2h: oddsData.h2h.map(o => ({ ...o })),
                timestamp: Date.now()
            };
            return result;
        }
        
        // Compare current odds with history
        const history = this.lineHistory[gameId];
        const timeDiff = (Date.now() - history.timestamp) / 1000 / 60; // minutes
        
        // Only detect if update is within 15 minutes
        if (timeDiff <= 15) {
            // Check for significant movement
            for (const current of oddsData.h2h) {
                const historical = history.h2h.find(h => 
                    h.team === current.team && h.bookmaker === current.bookmaker
                );
                
                if (historical) {
                    const movement = this._calculateOddsMovement(historical.odds, current.odds);
                    
                    if (Math.abs(movement) >= this.steamMoveThreshold) {
                        result.detected = true;
                        result.size = Math.abs(movement);
                        result.direction = movement > 0 ? 'up' : 'down';
                        break;
                    }
                }
            }
        }
        
        // Update history
        this.lineHistory[gameId] = {
            h2h: oddsData.h2h.map(o => ({ ...o })),
            timestamp: Date.now()
        };
        
        return result;
    }

    /**
     * Detect sharp money (reverse line movement)
     * Line moves against public betting percentage
     */
    _detectSharpMoney(gameId, oddsData) {
        const result = { detected: false, reverse: false };
        
        // This requires public betting percentage data
        // For now, we detect based on line movement patterns
        if (!this.lineHistory[gameId]) {
            return result;
        }
        
        const history = this.lineHistory[gameId];
        
        // Check if line moved significantly in short time
        for (const current of oddsData.h2h) {
            const historical = history.h2h.find(h => 
                h.team === current.team && h.bookmaker === current.bookmaker
            );
            
            if (historical) {
                const movement = this._calculateOddsMovement(historical.odds, current.odds);
                
                // Sharp money typically indicated by 2%+ movement
                if (Math.abs(movement) >= this.sharpThreshold) {
                    result.detected = true;
                    
                    // If odds improved (got better), it's reverse line movement
                    // Better odds = higher value, indicates sharp money on this side
                    if (movement > 0) {
                        result.reverse = true;
                    }
                }
            }
        }
        
        return result;
    }

    /**
     * Calculate market efficiency
     * Efficient market: low variance in implied probabilities across bookmakers
     */
    _calculateMarketEfficiency(oddsData) {
        if (oddsData.h2h.length < 2) return 0.5;
        
        // Group by team
        const teams = [...new Set(oddsData.h2h.map(o => o.team))];
        let totalVariance = 0;
        
        for (const team of teams) {
            const teamOdds = oddsData.h2h.filter(o => o.team === team);
            const impliedProbs = teamOdds.map(o => this._oddsToImpliedProb(o.odds));
            
            if (impliedProbs.length >= 2) {
                const mean = impliedProbs.reduce((sum, p) => sum + p, 0) / impliedProbs.length;
                const variance = impliedProbs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / impliedProbs.length;
                totalVariance += variance;
            }
        }
        
        // Convert variance to efficiency score (0-1, higher is more efficient)
        // Lower variance = higher efficiency
        const avgVariance = totalVariance / teams.length;
        const efficiency = 1 - Math.min(1, avgVariance * 100); // Scale variance
        
        return efficiency;
    }

    /**
     * Calculate bookmaker edge (vig/juice)
     */
    _calculateBookmakerEdge(oddsData) {
        if (oddsData.h2h.length < 2) return 0;
        
        // Group by bookmaker
        const bookmakers = [...new Set(oddsData.h2h.map(o => o.bookmaker))];
        let totalEdge = 0;
        let count = 0;
        
        for (const bookmaker of bookmakers) {
            const bookmakerOdds = oddsData.h2h.filter(o => o.bookmaker === bookmaker);
            const teams = [...new Set(bookmakerOdds.map(o => o.team))];
            
            if (teams.length === 2) {
                // Get implied probabilities for both teams
                const impliedProbs = teams.map(team => {
                    const odds = bookmakerOdds.find(o => o.team === team);
                    return this._oddsToImpliedProb(odds.odds);
                });
                
                // Edge = sum of implied probabilities - 1
                const edge = impliedProbs.reduce((sum, p) => sum + p, 0) - 1;
                totalEdge += edge;
                count++;
            }
        }
        
        return count > 0 ? totalEdge / count : 0;
    }

    /**
     * Find best odds across all bookmakers
     */
    _findBestOdds(oddsData) {
        if (oddsData.h2h.length === 0) return null;
        
        const teams = [...new Set(oddsData.h2h.map(o => o.team))];
        const bestOdds = {};
        
        for (const team of teams) {
            const teamOdds = oddsData.h2h.filter(o => o.team === team);
            const best = teamOdds.reduce((best, curr) => 
                curr.odds > best.odds ? curr : best
            );
            bestOdds[team] = best;
        }
        
        return bestOdds;
    }

    /**
     * Calculate consensus odds (average across bookmakers)
     */
    _calculateConsensus(oddsData) {
        if (oddsData.h2h.length === 0) return null;
        
        const teams = [...new Set(oddsData.h2h.map(o => o.team))];
        const consensus = {};
        
        for (const team of teams) {
            const teamOdds = oddsData.h2h.filter(o => o.team === team);
            const impliedProbs = teamOdds.map(o => this._oddsToImpliedProb(o.odds));
            const avgProb = impliedProbs.reduce((sum, p) => sum + p, 0) / impliedProbs.length;
            
            consensus[team] = {
                probability: avgProb,
                odds: this._impliedProbToOdds(avgProb)
            };
        }
        
        return consensus;
    }

    /**
     * Identify value bets
     * Value exists when best odds imply lower probability than consensus
     */
    _identifyValueBet(consensus, bestOdds, marketEfficiency) {
        const result = { exists: false, edge: 0, team: null };
        
        if (!consensus || !bestOdds) return result;
        
        for (const [team, best] of Object.entries(bestOdds)) {
            if (!consensus[team]) continue;
            
            const bestImplied = this._oddsToImpliedProb(best.odds);
            const consensusProb = consensus[team].probability;
            
            // Value edge = consensus probability - best implied probability
            const edge = consensusProb - bestImplied;
            
            // Adjust for market efficiency
            const adjustedEdge = edge * marketEfficiency;
            
            if (adjustedEdge >= this.valueThreshold) {
                if (adjustedEdge > result.edge) {
                    result.exists = true;
                    result.edge = adjustedEdge;
                    result.team = team;
                    result.bookmaker = best.bookmaker;
                    result.odds = best.odds;
                }
            }
        }
        
        return result;
    }

    // ============ Helper Functions ============

    /**
     * Convert American odds to implied probability
     */
    _oddsToImpliedProb(odds) {
        if (odds > 0) {
            return 100 / (odds + 100);
        } else {
            return Math.abs(odds) / (Math.abs(odds) + 100);
        }
    }

    /**
     * Convert implied probability to American odds
     */
    _impliedProbToOdds(prob) {
        if (prob >= 0.5) {
            return -100 * prob / (1 - prob);
        } else {
            return 100 * (1 - prob) / prob;
        }
    }

    /**
     * Calculate odds movement percentage
     */
    _calculateOddsMovement(oldOdds, newOdds) {
        const oldProb = this._oddsToImpliedProb(oldOdds);
        const newProb = this._oddsToImpliedProb(newOdds);
        return (newProb - oldProb) / oldProb;
    }

    /**
     * Clear old line history (memory management)
     */
    clearOldHistory(maxAge = 86400000) { // 24 hours default
        const now = Date.now();
        for (const [gameId, history] of Object.entries(this.lineHistory)) {
            if (now - history.timestamp > maxAge) {
                delete this.lineHistory[gameId];
            }
        }
    }

    /**
     * Serialize analyzer state to JSON
     */
    toJSON() {
        return {
            valueThreshold: this.valueThreshold,
            steamMoveThreshold: this.steamMoveThreshold,
            arbitrageThreshold: this.arbitrageThreshold,
            sharpThreshold: this.sharpThreshold,
            lineHistory: this.lineHistory
        };
    }

    /**
     * Deserialize analyzer state from JSON
     */
    static fromJSON(json) {
        const analyzer = new MarketAnalyzer({
            valueThreshold: json.valueThreshold,
            steamMoveThreshold: json.steamMoveThreshold,
            arbitrageThreshold: json.arbitrageThreshold,
            sharpThreshold: json.sharpThreshold
        });
        analyzer.lineHistory = json.lineHistory || {};
        return analyzer;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketAnalyzer;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.MarketAnalyzer = MarketAnalyzer;
}
