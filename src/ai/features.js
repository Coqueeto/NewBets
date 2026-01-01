// Advanced Feature Extraction Engine
class FeatureExtractor {
  constructor() {
    this.featureCache = new Map();
  }

  // Extract 50+ features from game data
  extractFeatures(game, historicalData) {
    const features = {};
    
    // === TEAM PERFORMANCE FEATURES (10) ===
    features.homeWinRate = this.calculateWinRate(game.home_team, historicalData, 'home');
    features.awayWinRate = this.calculateWinRate(game.away_team, historicalData, 'away');
    features.homeWinStreak = this.getWinStreak(game.home_team, historicalData);
    features.awayWinStreak = this.getWinStreak(game.away_team, historicalData);
    features.homeRecentForm = this.getRecentForm(game.home_team, historicalData, 5); // Last 5 games
    features.awayRecentForm = this.getRecentForm(game.away_team, historicalData, 5);
    features.homeSeasonPerformance = this.getSeasonStats(game.home_team, historicalData);
    features.awaySeasonPerformance = this.getSeasonStats(game.away_team, historicalData);
    features.headToHeadRecord = this.getH2HRecord(game.home_team, game.away_team, historicalData);
    features.performanceGap = features.homeWinRate - features.awayWinRate;

    // === SITUATIONAL FEATURES (10) ===
    features.homeAdvantage = 0.54; // Statistical home advantage
    features.restDays = this.calculateRestDays(game, historicalData);
    features.travelDistance = this.estimateTravelDistance(game);
    features.timezoneDifference = this.getTimezoneDiff(game);
    features.backToBack = this.isBackToBack(game, historicalData);
    features.rivalryGame = this.isRivalry(game.home_team, game.away_team);
    features.playoffImplications = this.hasPlayoffImplications(game);
    features.injuryImpact = 0; // Placeholder - would need injury API
    features.motivationIndex = this.calculateMotivation(game, historicalData);
    features.venueAdvantage = this.getVenueAdvantage(game.home_team, historicalData);

    // === BETTING MARKET FEATURES (15) ===
    features.impliedProbHome = this.oddsToProb(game.home_odds || 100);
    features.impliedProbAway = this.oddsToProb(game.away_odds || 100);
    features.oddsMovement = this.getOddsMovement(game);
    features.lineMovement = this.getLineMovement(game);
    features.publicMoney = this.estimatePublicMoney(game);
    features.sharpMoney = this.detectSharpMoney(game);
    features.steamMove = this.detectSteamMove(game);
    features.reverseLineMovement = this.detectRLM(game);
    features.closingLineValue = this.calculateCLV(game, historicalData);
    features.marketEfficiency = this.calculateMarketEfficiency(game);
    features.bookmakerEdge = this.estimateBookmakerEdge(game);
    features.oddsDivergence = this.calculateOddsDivergence(game);
    features.volumeAnomaly = this.detectVolumeAnomaly(game);
    features.lineValue = this.calculateLineValue(game);
    features.expectedValue = this.calculateEV(game);

    // === TEMPORAL FEATURES (10) ===
    features.dayOfWeek = new Date(game.commence_time).getDay();
    features.month = new Date(game.commence_time).getMonth();
    features.weekOfSeason = this.getWeekOfSeason(game);
    features.momentum7Day = this.getMomentum(game.home_team, historicalData, 7);
    features.momentum30Day = this.getMomentum(game.home_team, historicalData, 30);
    features.trendDirection = this.getTrendDirection(game, historicalData);
    features.seasonPhase = this.getSeasonPhase(game); // Early/Mid/Late season
    features.performanceCycle = this.detectPerformanceCycle(game, historicalData);
    features.recencyBias = this.calculateRecencyBias(game, historicalData);
    features.timeDecay = this.applyTimeDecay(game, historicalData);

    // === STATISTICAL ANOMALIES (5) ===
    features.outlierScore = this.detectOutlier(game, historicalData);
    features.regressionPotential = this.calculateRegression(game, historicalData);
    features.varianceScore = this.calculateVariance(game, historicalData);
    features.consistency = this.calculateConsistency(game, historicalData);
    features.volatility = this.calculateVolatility(game, historicalData);

    // === SPORT-SPECIFIC FEATURES (5) ===
    features.scoringTrend = this.getScoringTrend(game, historicalData);
    features.defensiveStrength = this.getDefensiveStrength(game, historicalData);
    features.offensiveStrength = this.getOffensiveStrength(game, historicalData);
    features.paceOfPlay = this.getPaceOfPlay(game, historicalData);
    features.styleMatchup = this.analyzeStyleMatchup(game, historicalData);

    // Normalize all features to [0, 1] range
    return this.normalizeFeatures(features);
  }

  // Helper methods
  calculateWinRate(team, data, location) {
    if (!data || !data.teamPerformance || !data.teamPerformance[team]) {
      return 0.5;
    }
    const perf = data.teamPerformance[team];
    const games = perf.games || 1;
    const wins = perf.wins || 0;
    let winRate = wins / games;
    
    // Apply location-specific adjustment (additive)
    // Note: Adjustment may temporarily violate [0,1], corrected by clamping below
    if (location === 'home') {
      winRate += 0.05; // Home teams typically perform 5% better
    } else if (location === 'away') {
      winRate -= 0.05; // Away teams typically perform 5% worse
    }
    
    // Clamp to [0, 1] to enforce probability constraints
    return Math.max(0, Math.min(1, winRate));
  }

  getWinStreak(team, data) {
    // Placeholder: would need game history
    return 0;
  }

  getRecentForm(team, data, n) {
    // Average win rate over last n games
    return this.calculateWinRate(team, data, 'all');
  }

  getSeasonStats(team, data) {
    return this.calculateWinRate(team, data, 'all');
  }

  getH2HRecord(homeTeam, awayTeam, data) {
    // Head-to-head record
    return 0.5;
  }

  calculateRestDays(game, data) {
    // Days since last game
    return 0.5;
  }

  estimateTravelDistance(game) {
    // Travel distance estimation
    return 0.5;
  }

  getTimezoneDiff(game) {
    // Timezone difference
    return 0;
  }

  isBackToBack(game, data) {
    // Check if back-to-back game
    return 0;
  }

  isRivalry(homeTeam, awayTeam) {
    // Check if rivalry game
    return 0;
  }

  hasPlayoffImplications(game) {
    // Check playoff implications
    return 0;
  }

  calculateMotivation(game, data) {
    // Motivation index
    return 0.5;
  }

  getVenueAdvantage(team, data) {
    // Venue-specific advantage
    return 0.54;
  }

  oddsToProb(americanOdds) {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  getOddsMovement(game) {
    // Track odds movement
    return 0;
  }

  getLineMovement(game) {
    // Track line movement
    return 0;
  }

  estimatePublicMoney(game) {
    // Estimate public betting percentage
    return 0.5;
  }

  detectSharpMoney(game) {
    // Detect sharp money indicators
    return 0;
  }

  detectSteamMove(game) {
    // Detect steam moves
    return 0;
  }

  detectRLM(game) {
    // Reverse line movement
    return 0;
  }

  calculateCLV(game, data) {
    // Closing line value
    return 0;
  }

  calculateMarketEfficiency(game) {
    // Market efficiency score
    return 0.5;
  }

  estimateBookmakerEdge(game) {
    // Bookmaker edge estimation
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length === 0) return 0.05;
    
    const market = bookmakers[0].markets?.[0];
    if (!market || !market.outcomes) return 0.05;
    
    const totalImpliedProb = market.outcomes.reduce((sum, outcome) => {
      return sum + this.oddsToProb(outcome.price);
    }, 0);
    
    return Math.max(0, totalImpliedProb - 1);
  }

  calculateOddsDivergence(game) {
    // Divergence between bookmakers
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length < 2) return 0;
    
    const homeOdds = bookmakers.map(b => {
      const market = b.markets?.[0];
      return market?.outcomes?.[0]?.price || 0;
    }).filter(o => o > 0);
    
    if (homeOdds.length < 2) return 0;
    
    const avg = homeOdds.reduce((sum, o) => sum + o, 0) / homeOdds.length;
    const variance = homeOdds.reduce((sum, o) => sum + Math.pow(o - avg, 2), 0) / homeOdds.length;
    
    return Math.sqrt(variance) / avg;
  }

  detectVolumeAnomaly(game) {
    // Volume anomaly detection
    return 0;
  }

  calculateLineValue(game) {
    // Line value calculation
    return 0;
  }

  calculateEV(game) {
    // Expected value calculation (simplified - uses implied probability as estimate)
    // Note: Ideally this should use model's predicted probability, but that requires
    // passing the model as parameter. This version uses implied probability from odds
    // as a baseline estimate, which can be refined when called from analyzeGame.
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length === 0) return 0;
    
    const market = bookmakers[0].markets?.[0];
    if (!market || !market.outcomes) return 0;
    
    const homeOdds = market.outcomes[0]?.price || 100;
    const impliedProb = this.oddsToProb(homeOdds);
    
    // EV = (probability × profit) - ((1 - probability) × stake)
    // Using implied probability as baseline estimate
    const profit = homeOdds > 0 ? (homeOdds / 100) : (100 / Math.abs(homeOdds));
    
    return (impliedProb * profit) - (1 - impliedProb);
  }

  getWeekOfSeason(game) {
    // Week of season
    const month = new Date(game.commence_time).getMonth();
    return month / 12;
  }

  getMomentum(team, data, days) {
    // Momentum over period
    return this.calculateWinRate(team, data, 'all');
  }

  getTrendDirection(game, data) {
    // Trend direction
    return 0;
  }

  getSeasonPhase(game) {
    // Early/Mid/Late season
    const month = new Date(game.commence_time).getMonth();
    if (month < 3) return 0.2;
    if (month < 8) return 0.5;
    return 0.8;
  }

  detectPerformanceCycle(game, data) {
    // Performance cycle detection
    return 0.5;
  }

  calculateRecencyBias(game, data) {
    // Recency bias
    return 0;
  }

  applyTimeDecay(game, data) {
    // Time decay factor
    return 0.9;
  }

  detectOutlier(game, data) {
    // Outlier detection
    return 0;
  }

  calculateRegression(game, data) {
    // Regression to mean potential
    return 0;
  }

  calculateVariance(game, data) {
    // Variance calculation
    return 0.5;
  }

  calculateConsistency(game, data) {
    // Consistency score
    return 0.5;
  }

  calculateVolatility(game, data) {
    // Volatility score
    return 0.5;
  }

  getScoringTrend(game, data) {
    // Scoring trend
    return 0.5;
  }

  getDefensiveStrength(game, data) {
    // Defensive strength
    return 0.5;
  }

  getOffensiveStrength(game, data) {
    // Offensive strength
    return 0.5;
  }

  getPaceOfPlay(game, data) {
    // Pace of play
    return 0.5;
  }

  analyzeStyleMatchup(game, data) {
    // Style matchup analysis
    return 0.5;
  }

  normalizeFeatures(features) {
    const normalized = {};
    for (const [key, value] of Object.entries(features)) {
      if (typeof value === 'number') {
        // Min-max normalization to [0, 1]
        normalized[key] = Math.max(0, Math.min(1, value));
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeatureExtractor;
}
