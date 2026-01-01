/**
 * Feature Extraction Module
 * Extracts 55+ normalized features across 6 categories for ML models
 * 
 * Categories:
 * - Team Performance (10 features)
 * - Situational (10 features) 
 * - Betting Market (15 features)
 * - Temporal (10 features)
 * - Statistical Anomalies (5 features)
 * - Sport-Specific (5 features)
 */

class FeatureExtractor {
    constructor() {
        this.featureCount = 55;
        this.featureNames = this._initFeatureNames();
    }

    /**
     * Initialize feature names for transparency
     */
    _initFeatureNames() {
        return [
            // Team Performance (10)
            'team_win_rate', 'team_recent_form', 'team_h2h_record', 'team_streak',
            'team_avg_score', 'opp_win_rate', 'opp_recent_form', 'opp_h2h_record',
            'opp_streak', 'opp_avg_score',
            
            // Situational (10)
            'home_advantage', 'rest_days_team', 'rest_days_opp', 'travel_distance',
            'timezone_diff', 'altitude_diff', 'weather_impact', 'injury_impact',
            'motivation_factor', 'schedule_position',
            
            // Betting Market (15)
            'odds_value', 'line_movement', 'sharp_money_indicator', 'public_betting_pct',
            'market_efficiency', 'clv_potential', 'bookmaker_edge', 'odds_consensus',
            'steam_move_detected', 'reverse_line_movement', 'opening_odds', 'closing_odds',
            'odds_volatility', 'market_liquidity', 'arbitrage_opportunity',
            
            // Temporal (10)
            'day_of_week', 'time_of_day', 'season_phase', 'games_played_ratio',
            'playoff_implications', 'recent_momentum', 'fatigue_factor', 'peak_performance_time',
            'historical_same_matchup', 'time_since_last_game',
            
            // Statistical Anomalies (5)
            'outlier_detection', 'regression_to_mean', 'variance_ratio', 
            'consistency_score', 'performance_deviation',
            
            // Sport-Specific (5)
            'scoring_pace', 'defensive_strength', 'offensive_efficiency',
            'special_teams_rating', 'coaching_advantage'
        ];
    }

    /**
     * Extract all 55 features from game data
     * @param {Object} game - Raw game data
     * @param {Object} historicalData - Historical performance data
     * @param {Object} marketData - Betting market data
     * @returns {Array<number>} 55-element feature vector (normalized 0-1)
     */
    extract(game, historicalData = {}, marketData = {}) {
        const features = new Array(this.featureCount).fill(0);
        
        try {
            // Extract each category
            const teamPerf = this._extractTeamPerformance(game, historicalData);
            const situational = this._extractSituational(game, historicalData);
            const market = this._extractMarket(game, marketData);
            const temporal = this._extractTemporal(game);
            const anomalies = this._extractAnomalies(game, historicalData);
            const sportSpecific = this._extractSportSpecific(game, historicalData);
            
            // Combine all features
            let idx = 0;
            features.splice(idx, teamPerf.length, ...teamPerf); idx += teamPerf.length;
            features.splice(idx, situational.length, ...situational); idx += situational.length;
            features.splice(idx, market.length, ...market); idx += market.length;
            features.splice(idx, temporal.length, ...temporal); idx += temporal.length;
            features.splice(idx, anomalies.length, ...anomalies); idx += anomalies.length;
            features.splice(idx, sportSpecific.length, ...sportSpecific);
            
            return features;
        } catch (error) {
            console.warn('Feature extraction error:', error);
            return features; // Return zeros on error
        }
    }

    /**
     * Team Performance Features (10)
     */
    _extractTeamPerformance(game, historicalData) {
        const features = new Array(10).fill(0.5);
        
        try {
            const teamStats = historicalData.teamStats || {};
            const oppStats = historicalData.oppStats || {};
            
            // Team metrics
            features[0] = this._normalize(teamStats.winRate || 0.5, 0, 1);
            features[1] = this._normalize(teamStats.recentForm || 0.5, 0, 1); // Last 5 games
            features[2] = this._normalize(teamStats.h2hRecord || 0.5, 0, 1);
            features[3] = this._normalizeStreak(teamStats.streak || 0);
            features[4] = this._normalize(teamStats.avgScore || 0, 0, 200); // Sport-adjusted max
            
            // Opponent metrics
            features[5] = this._normalize(oppStats.winRate || 0.5, 0, 1);
            features[6] = this._normalize(oppStats.recentForm || 0.5, 0, 1);
            features[7] = this._normalize(oppStats.h2hRecord || 0.5, 0, 1);
            features[8] = this._normalizeStreak(oppStats.streak || 0);
            features[9] = this._normalize(oppStats.avgScore || 0, 0, 200);
        } catch (error) {
            console.warn('Team performance extraction error:', error);
        }
        
        return features;
    }

    /**
     * Situational Features (10)
     */
    _extractSituational(game, historicalData) {
        const features = new Array(10).fill(0.5);
        
        try {
            const isHome = game.home_team && game.home_team === game.team;
            features[0] = isHome ? 0.65 : 0.35; // Home advantage
            
            features[1] = this._normalize(historicalData.restDaysTeam || 3, 0, 10);
            features[2] = this._normalize(historicalData.restDaysOpp || 3, 0, 10);
            features[3] = this._normalize(historicalData.travelDistance || 0, 0, 3000);
            features[4] = this._normalize(Math.abs(historicalData.timezoneDiff || 0), 0, 3);
            features[5] = this._normalize(Math.abs(historicalData.altitudeDiff || 0), 0, 7000);
            features[6] = this._normalizeWeather(historicalData.weatherImpact || 0);
            features[7] = this._normalize(historicalData.injuryImpact || 0, 0, 1);
            features[8] = this._normalize(historicalData.motivationFactor || 0.5, 0, 1);
            features[9] = this._normalize(historicalData.schedulePosition || 0.5, 0, 1);
        } catch (error) {
            console.warn('Situational extraction error:', error);
        }
        
        return features;
    }

    /**
     * Betting Market Features (15)
     */
    _extractMarket(game, marketData) {
        const features = new Array(15).fill(0.5);
        
        try {
            const odds = this._extractOdds(game);
            const opening = odds.opening || 0;
            const current = odds.current || 0;
            const closing = odds.closing || current;
            
            features[0] = this._normalizeOddsValue(marketData.oddsValue || 0);
            features[1] = this._normalizeLineMovement(opening, current);
            features[2] = marketData.sharpMoney ? 0.7 : 0.3;
            features[3] = this._normalize(marketData.publicBettingPct || 50, 0, 100);
            features[4] = this._normalize(marketData.marketEfficiency || 0.9, 0, 1);
            features[5] = this._normalizeCLV(opening, closing);
            features[6] = this._normalize(marketData.bookmakerEdge || 0.05, 0, 0.15);
            features[7] = this._normalize(marketData.oddsConsensus || 0.5, 0, 1);
            features[8] = marketData.steamMove ? 0.8 : 0.2;
            features[9] = marketData.reverseLine ? 0.8 : 0.2;
            features[10] = this._normalizeOdds(opening);
            features[11] = this._normalizeOdds(closing);
            features[12] = this._normalize(marketData.oddsVolatility || 0, 0, 1);
            features[13] = this._normalize(marketData.marketLiquidity || 0.5, 0, 1);
            features[14] = marketData.arbitrage ? 0.9 : 0.1;
        } catch (error) {
            console.warn('Market extraction error:', error);
        }
        
        return features;
    }

    /**
     * Temporal Features (10)
     */
    _extractTemporal(game) {
        const features = new Array(10).fill(0.5);
        
        try {
            const gameDate = new Date(game.commence_time || Date.now());
            
            features[0] = this._normalize(gameDate.getDay(), 0, 6); // Day of week
            features[1] = this._normalize(gameDate.getHours(), 0, 23); // Time of day
            features[2] = this._normalizeSeasonPhase(gameDate);
            features[3] = this._normalize(game.gamesPlayedRatio || 0.5, 0, 1);
            features[4] = game.playoffImplications ? 0.8 : 0.2;
            features[5] = this._normalize(game.recentMomentum || 0, -5, 5);
            features[6] = this._normalize(game.fatigueScore || 0, 0, 10);
            features[7] = this._normalizePeakTime(gameDate);
            features[8] = this._normalize(game.historicalMatchups || 0, 0, 20);
            features[9] = this._normalize(game.timeSinceLastGame || 3, 0, 14);
        } catch (error) {
            console.warn('Temporal extraction error:', error);
        }
        
        return features;
    }

    /**
     * Statistical Anomalies Features (5)
     */
    _extractAnomalies(game, historicalData) {
        const features = new Array(5).fill(0.5);
        
        try {
            const stats = historicalData.teamStats || {};
            
            features[0] = this._detectOutlier(stats.recentPerformance || []);
            features[1] = this._regressionToMean(stats.currentForm || 0.5, stats.careerAvg || 0.5);
            features[2] = this._calculateVarianceRatio(stats.scores || []);
            features[3] = this._calculateConsistency(stats.scores || []);
            features[4] = this._performanceDeviation(stats.recent || [], stats.season || []);
        } catch (error) {
            console.warn('Anomaly extraction error:', error);
        }
        
        return features;
    }

    /**
     * Sport-Specific Features (5)
     */
    _extractSportSpecific(game, historicalData) {
        const features = new Array(5).fill(0.5);
        
        try {
            const stats = historicalData.teamStats || {};
            const sport = game.sport_key || '';
            
            // Adjust based on sport
            if (sport.includes('basketball')) {
                features[0] = this._normalize(stats.pace || 100, 80, 120);
                features[1] = this._normalize(stats.defRating || 100, 90, 120);
                features[2] = this._normalize(stats.offRating || 100, 90, 120);
            } else if (sport.includes('football')) {
                features[0] = this._normalize(stats.rushYards || 100, 0, 200);
                features[1] = this._normalize(stats.passYardsAllowed || 200, 100, 300);
                features[2] = this._normalize(stats.yardsPerPlay || 5, 3, 7);
                features[3] = this._normalize(stats.thirdDownPct || 0.4, 0.2, 0.6);
            } else if (sport.includes('hockey')) {
                features[0] = this._normalize(stats.corsiFor || 50, 40, 60);
                features[1] = this._normalize(stats.goalsAgainst || 3, 1, 5);
                features[2] = this._normalize(stats.powerPlayPct || 0.2, 0, 0.4);
            } else if (sport.includes('baseball')) {
                features[0] = this._normalize(stats.runsPerGame || 4.5, 2, 7);
                features[1] = this._normalize(stats.era || 4.0, 2, 6);
                features[2] = this._normalize(stats.whip || 1.3, 0.9, 1.7);
            } else if (sport.includes('soccer')) {
                features[0] = this._normalize(stats.goalsPerGame || 1.5, 0, 4);
                features[1] = this._normalize(stats.goalsAllowed || 1.2, 0, 4);
                features[2] = this._normalize(stats.possession || 50, 30, 70);
            }
            
            features[4] = this._normalize(stats.coachingAdvantage || 0, -5, 5);
        } catch (error) {
            console.warn('Sport-specific extraction error:', error);
        }
        
        return features;
    }

    // ============ Normalization Helpers ============

    _normalize(value, min, max) {
        if (max === min) return 0.5;
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    _normalizeStreak(streak) {
        // Convert streak to 0-1 (negative = losing, positive = winning)
        return this._normalize(streak, -10, 10);
    }

    _normalizeOdds(odds) {
        // American odds to probability then normalize
        const prob = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
        return prob;
    }

    _normalizeOddsValue(value) {
        // Value bet edge percentage
        return this._normalize(value, -0.1, 0.2);
    }

    _normalizeLineMovement(opening, current) {
        if (!opening || !current) return 0.5;
        const change = (current - opening) / Math.abs(opening);
        return this._normalize(change, -0.2, 0.2);
    }

    _normalizeCLV(opening, closing) {
        if (!opening || !closing) return 0.5;
        // Closing Line Value - positive is good
        const clv = (closing - opening) / Math.abs(opening);
        return this._normalize(clv, -0.1, 0.1);
    }

    _normalizeWeather(impact) {
        // Weather impact score -1 to 1
        return this._normalize(impact, -1, 1);
    }

    _normalizeSeasonPhase(date) {
        // Early season = 0, mid = 0.5, late = 1
        const month = date.getMonth();
        return this._normalize(month, 0, 11);
    }

    _normalizePeakTime(date) {
        // Peak performance hours (typically evening games)
        const hour = date.getHours();
        if (hour >= 18 && hour <= 21) return 0.8;
        if (hour >= 12 && hour <= 17) return 0.6;
        return 0.4;
    }

    // ============ Statistical Helpers ============

    _detectOutlier(values) {
        if (!values || values.length < 3) return 0.5;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
        const latest = values[values.length - 1];
        const zScore = Math.abs((latest - mean) / (std || 1));
        return this._normalize(zScore, 0, 3);
    }

    _regressionToMean(current, historical) {
        // Likelihood of regressing to mean
        const deviation = Math.abs(current - historical);
        return this._normalize(deviation, 0, 0.3);
    }

    _calculateVarianceRatio(values) {
        if (!values || values.length < 3) return 0.5;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
        const cv = Math.sqrt(variance) / (mean || 1); // Coefficient of variation
        return this._normalize(cv, 0, 1);
    }

    _calculateConsistency(values) {
        if (!values || values.length < 3) return 0.5;
        const variance = this._calculateVarianceRatio(values);
        return 1 - variance; // Lower variance = higher consistency
    }

    _performanceDeviation(recentValues, seasonValues) {
        if (!recentValues || !seasonValues || recentValues.length === 0 || seasonValues.length === 0) {
            return 0.5;
        }
        const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
        const seasonAvg = seasonValues.reduce((a, b) => a + b, 0) / seasonValues.length;
        const deviation = (recentAvg - seasonAvg) / (seasonAvg || 1);
        return this._normalize(deviation, -0.5, 0.5);
    }

    _extractOdds(game) {
        const odds = { opening: 0, current: 0, closing: 0 };
        try {
            if (game.bookmakers && game.bookmakers[0]) {
                const market = game.bookmakers[0].markets?.[0];
                if (market && market.outcomes && market.outcomes[0]) {
                    odds.current = market.outcomes[0].price || 0;
                    odds.opening = game.openingOdds || odds.current;
                    odds.closing = game.closingOdds || odds.current;
                }
            }
        } catch (error) {
            console.warn('Odds extraction error:', error);
        }
        return odds;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureExtractor;
}
