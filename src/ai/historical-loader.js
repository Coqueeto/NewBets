/**
 * Historical Data Loader
 * Bootstraps AI with historical game data from multiple sports
 * 
 * Supports:
 * - MLB (5 years of historical data)
 * - NFL (3 years)
 * - NBA (3 years)
 * - NHL (3 years)
 * - College Football (3 years)
 * - Soccer (3 years)
 */

class HistoricalDataLoader {
    constructor(espnApiBase = 'https://sports.core.api.espn.com/v2') {
        this.espnApiBase = espnApiBase;
        this.featureExtractor = new FeatureExtractor();
        
        // Sport configuration with years to load
        this.sportConfig = {
            'baseball_mlb': {
                name: 'MLB',
                league: 'mlb',
                sport: 'baseball',
                yearsBack: 5,
                minGames: 500  // MLB plays 162 games per season
            },
            'americanfootball_nfl': {
                name: 'NFL',
                league: 'nfl',
                sport: 'football',
                yearsBack: 3,
                minGames: 300  // NFL plays 17 games per season
            },
            'basketball_nba': {
                name: 'NBA',
                league: 'nba',
                sport: 'basketball',
                yearsBack: 3,
                minGames: 400  // NBA plays 82 games per season
            },
            'icehockey_nhl': {
                name: 'NHL',
                league: 'nhl',
                sport: 'ice-hockey',
                yearsBack: 3,
                minGames: 350  // NHL plays 82 games per season
            },
            'americanfootball_ncaaf': {
                name: 'NCAAF',
                league: 'college-football',
                sport: 'football',
                yearsBack: 3,
                minGames: 200
            },
            'soccer_epl': {
                name: 'EPL',
                league: 'eng.1',
                sport: 'soccer',
                yearsBack: 3,
                minGames: 250  // EPL plays 38 games per season
            }
        };
    }

    /**
     * Load historical data for all sports
     * Returns array of training examples with features and outcomes
     */
    async loadAllHistoricalData(progressCallback = null) {
        console.log('🏟️ Starting historical data load from ESPN API...');
        
        const allData = [];
        let totalGames = 0;
        
        for (const [sportKey, config] of Object.entries(this.sportConfig)) {
            try {
                console.log(`\n📊 Loading ${config.name} (${config.yearsBack} years)...`);
                
                const sportData = await this.loadSportHistoricalData(
                    config,
                    (current, total) => {
                        if (progressCallback) {
                            const overall = Math.round((allData.length / 1000) * 100);
                            progressCallback({
                                sport: config.name,
                                current,
                                total,
                                overall,
                                status: `Loading ${config.name}...`
                            });
                        }
                    }
                );
                
                allData.push(...sportData);
                totalGames += sportData.length;
                
                console.log(`✅ ${config.name}: ${sportData.length} games loaded`);
                
            } catch (error) {
                console.warn(`❌ Failed to load ${config.name}:`, error);
                // Continue with other sports
            }
        }
        
        console.log(`\n✅ Historical data load complete: ${totalGames} total games`);
        
        if (progressCallback) {
            progressCallback({
                sport: 'Complete',
                current: totalGames,
                total: totalGames,
                overall: 100,
                status: `✅ Loaded ${totalGames} historical games`
            });
        }
        
        return allData;
    }

    /**
     * Load historical data for a single sport
     */
    async loadSportHistoricalData(config, progressCallback = null) {
        const games = [];
        const currentYear = new Date().getFullYear();
        
        for (let yearsAgo = 0; yearsAgo < config.yearsBack; yearsAgo++) {
            const year = currentYear - yearsAgo;
            
            try {
                const yearGames = await this.loadSeasonGames(config, year);
                games.push(...yearGames);
                
                if (progressCallback) {
                    progressCallback(games.length, config.minGames);
                }
                
                // Stop if we have enough
                if (games.length >= config.minGames) {
                    break;
                }
                
            } catch (error) {
                console.warn(`⚠️ Failed to load ${config.name} ${year}:`, error);
            }
        }
        
        return games;
    }

    /**
     * Load games for a specific season
     */
    async loadSeasonGames(config, season) {
        const games = [];
        
        try {
            // ESPN API endpoint for season games
            const url = `${this.espnApiBase}/sports/${config.sport}/leagues/${config.league}/seasons/${season}/events`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            const events = data.events || [];
            
            for (const event of events) {
                try {
                    const trainingExample = await this._eventToTrainingExample(event, config);
                    if (trainingExample) {
                        games.push(trainingExample);
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to process event:', error);
                }
            }
            
        } catch (error) {
            console.warn(`⚠️ Failed to load season ${season} for ${config.name}:`, error);
        }
        
        return games;
    }

    /**
     * Convert ESPN event to training example
     */
    async _eventToTrainingExample(event, config) {
        try {
            // Only include completed games
            if (event.status.type.name !== 'STATUS_FINAL') {
                return null;
            }
            
            const competitors = event.competitions[0].competitors;
            if (!competitors || competitors.length < 2) {
                return null;
            }
            
            const homeTeam = competitors.find(c => c.homeAway === 'home');
            const awayTeam = competitors.find(c => c.homeAway === 'away');
            
            if (!homeTeam || !awayTeam) {
                return null;
            }
            
            // Extract scores
            const homeScore = parseInt(homeTeam.score) || 0;
            const awayScore = parseInt(awayTeam.score) || 0;
            
            // Determine winner
            const homeWon = homeScore > awayScore;
            
            // Build game object
            const game = {
                sport_key: config.sport,
                sport_name: config.name,
                commence_time: event.date,
                home_team: homeTeam.team.name,
                away_team: awayTeam.team.name,
                home_score: homeScore,
                away_score: awayScore,
                completed: true,
                winner: homeWon ? 'home' : 'away'
            };
            
            // Extract 55 features
            const features = this.featureExtractor.extract(game, {
                teamStats: this._getTeamStats(homeTeam, config),
                oppStats: this._getTeamStats(awayTeam, config),
                restDaysTeam: this._estimateRestDays(event),
                restDaysOpp: this._estimateRestDays(event),
                travelDistance: this._estimateTravelDistance(homeTeam, awayTeam),
                weatherImpact: this._getWeatherImpact(event)
            });
            
            // Outcome: 1 if home won, 0 if lost
            const outcome = homeWon ? 1 : 0;
            
            return {
                features,
                outcome,
                game: game.home_team + ' vs ' + game.away_team,
                sport: config.name,
                date: new Date(event.date).getTime(),
                homeTeam: game.home_team,
                awayTeam: game.away_team,
                homeScore: homeScore,
                awayScore: awayScore
            };
            
        } catch (error) {
            console.warn('⚠️ Error converting event to training example:', error);
            return null;
        }
    }

    /**
     * Extract team statistics from ESPN event
     */
    _getTeamStats(team, config) {
        try {
            const stats = {
                winRate: 0.5,  // Would need historical record
                recentForm: 0.5,
                avgScore: parseInt(team.score) || 0,
                defRating: 100,
                offRating: 100,
                pace: 100
            };
            
            // Try to extract from statistics if available
            if (team.statistics) {
                for (const stat of team.statistics) {
                    if (stat.name === 'averagePoints') {
                        stats.avgScore = parseFloat(stat.value) || 0;
                    }
                }
            }
            
            return stats;
            
        } catch (error) {
            console.warn('⚠️ Error extracting team stats:', error);
            return { winRate: 0.5, recentForm: 0.5, avgScore: 0 };
        }
    }

    /**
     * Estimate rest days (simplified)
     */
    _estimateRestDays(event) {
        // Default estimate: 3 days
        // In production, would track actual game schedule
        return 3;
    }

    /**
     * Estimate travel distance
     */
    _estimateTravelDistance(homeTeam, awayTeam) {
        // Simplified: return 0 (would need venue data)
        // In production, would calculate actual distance
        return 0;
    }

    /**
     * Get weather impact
     */
    _getWeatherImpact(event) {
        // Default: neutral weather
        // In production, would fetch actual weather data
        return 0;
    }

    /**
     * Save historical data to localStorage
     */
    saveToLocalStorage(data, key = 'historicalGameData') {
        try {
            // Limit to last 1000 entries to avoid localStorage limits
            const limited = data.slice(-1000);
            localStorage.setItem(key, JSON.stringify(limited));
            console.log(`✅ Saved ${limited.length} historical games to localStorage`);
            return limited;
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
            return data;
        }
    }

    /**
     * Load historical data from localStorage
     */
    loadFromLocalStorage(key = 'historicalGameData') {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`✅ Loaded ${parsed.length} historical games from localStorage`);
                return parsed;
            }
        } catch (error) {
            console.warn('⚠️ Failed to load from localStorage:', error);
        }
        return [];
    }

    /**
     * Bootstrap AI with historical data
     * Trains neural network on historical games
     */
    async bootstrapAI(neuralNetwork, progressCallback = null) {
        try {
            console.log('🚀 Bootstrapping AI with historical data...');
            
            // Load historical data
            let historicalData = this.loadFromLocalStorage();
            
            // If no cached data, fetch from ESPN
            if (historicalData.length === 0) {
                historicalData = await this.loadAllHistoricalData(progressCallback);
                this.saveToLocalStorage(historicalData);
            }
            
            if (historicalData.length === 0) {
                console.warn('⚠️ No historical data available for bootstrap');
                return null;
            }
            
            // Prepare training data
            const inputs = historicalData.map(d => d.features);
            const targets = historicalData.map(d => [d.outcome]);
            
            console.log(`\n📚 Training on ${inputs.length} historical games...`);
            
            // Train neural network
            const result = neuralNetwork.train(inputs, targets, {
                epochs: 100,
                batchSize: 32,
                validationSplit: 0.2,
                verbose: true
            });
            
            console.log(`✅ Bootstrap training complete:`);
            console.log(`   Final Loss: ${result.finalLoss.toFixed(6)}`);
            console.log(`   Val Loss: ${(result.finalValLoss || 0).toFixed(6)}`);
            console.log(`   Epochs: ${result.epochs}`);
            
            return {
                success: true,
                gamesUsed: inputs.length,
                finalLoss: result.finalLoss,
                valLoss: result.finalValLoss,
                epochs: result.epochs
            };
            
        } catch (error) {
            console.error('❌ Bootstrap failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get statistics about loaded data
     */
    getDataStatistics(data) {
        if (data.length === 0) return null;
        
        const stats = {
            totalGames: data.length,
            sportBreakdown: {},
            dateRange: {
                oldest: Math.min(...data.map(d => d.date)),
                newest: Math.max(...data.map(d => d.date))
            },
            outcomeDistribution: {
                wins: data.filter(d => d.outcome === 1).length,
                losses: data.filter(d => d.outcome === 0).length
            }
        };
        
        // Count by sport
        for (const item of data) {
            stats.sportBreakdown[item.sport] = (stats.sportBreakdown[item.sport] || 0) + 1;
        }
        
        stats.winRate = (stats.outcomeDistribution.wins / stats.totalGames * 100).toFixed(1) + '%';
        
        return stats;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoricalDataLoader;
}

if (typeof window !== 'undefined') {
    window.HistoricalDataLoader = HistoricalDataLoader;
}
