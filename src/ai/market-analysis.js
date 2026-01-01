// Market Analysis for detecting inefficiencies and opportunities
class MarketAnalyzer {
  constructor() {
    this.oddsHistory = new Map();
  }

  detectArbitrageOpportunities(games) {
    const opportunities = [];
    
    for (const game of games) {
      const bookmakers = game.bookmakers || [];
      
      if (bookmakers.length < 2) continue;
      
      // Find best odds across bookmakers
      let bestHome = -Infinity;
      let bestAway = -Infinity;
      
      for (const bookmaker of bookmakers) {
        const market = bookmaker.markets?.[0];
        if (market && market.outcomes && market.outcomes.length >= 2) {
          const homeOdds = market.outcomes[0]?.price || 0;
          const awayOdds = market.outcomes[1]?.price || 0;
          
          if (homeOdds > bestHome) bestHome = homeOdds;
          if (awayOdds > bestAway) bestAway = awayOdds;
        }
      }
      
      if (bestHome === -Infinity || bestAway === -Infinity) continue;
      
      // Check for arbitrage
      const impliedProbSum = this.oddsToProb(bestHome) + this.oddsToProb(bestAway);
      
      if (impliedProbSum < 1) {
        opportunities.push({
          game,
          profit: ((1 / impliedProbSum) - 1) * 100,
          betHome: 1 / this.oddsToProb(bestHome),
          betAway: 1 / this.oddsToProb(bestAway),
          impliedProbSum
        });
      }
    }
    
    return opportunities;
  }

  detectSteamMoves(game, oddsHistory) {
    // Detect rapid line movement indicating sharp money
    if (!oddsHistory || oddsHistory.length < 2) return false;
    
    const recent = oddsHistory.slice(-5);
    const changes = recent.map((odds, i) => 
      i === 0 ? 0 : Math.abs(odds - recent[i - 1])
    );
    
    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    
    return avgChange > 10; // Significant movement
  }

  detectReverseLineMovement(game) {
    // Detect when line moves opposite to public betting
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length < 2) return false;
    
    // Would need betting percentage data for full implementation
    // Placeholder implementation
    return false;
  }

  calculateMarketEfficiency(game) {
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length === 0) return 0.5;
    
    // Calculate variance in odds across bookmakers
    const homeOdds = [];
    const awayOdds = [];
    
    for (const bookmaker of bookmakers) {
      const market = bookmaker.markets?.[0];
      if (market && market.outcomes && market.outcomes.length >= 2) {
        homeOdds.push(market.outcomes[0].price);
        awayOdds.push(market.outcomes[1].price);
      }
    }
    
    if (homeOdds.length < 2) return 0.5;
    
    const homeVariance = this.calculateVariance(homeOdds);
    const awayVariance = this.calculateVariance(awayOdds);
    
    // Lower variance = more efficient market
    const avgVariance = (homeVariance + awayVariance) / 2;
    return Math.max(0, Math.min(1, 1 - (avgVariance / 100)));
  }

  estimateBookmakerEdge(game) {
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length === 0) return 0.05;
    
    const market = bookmakers[0].markets?.[0];
    if (!market || !market.outcomes) return 0.05;
    
    const totalImpliedProb = market.outcomes.reduce((sum, outcome) => {
      return sum + this.oddsToProb(outcome.price);
    }, 0);
    
    return Math.max(0, totalImpliedProb - 1);
  }

  detectValueBets(game, modelProbability) {
    const bookmakers = game.bookmakers || [];
    if (bookmakers.length === 0) return null;
    
    const market = bookmakers[0].markets?.[0];
    if (!market || !market.outcomes || market.outcomes.length < 2) return null;
    
    const homeOdds = market.outcomes[0].price;
    const impliedProb = this.oddsToProb(homeOdds);
    
    // Value bet if model probability > implied probability + edge
    const edge = modelProbability - impliedProb;
    
    if (edge > 0.05) { // 5% edge threshold
      return {
        edge,
        expectedValue: this.calculateEV(modelProbability, homeOdds),
        recommended: true
      };
    }
    
    return null;
  }

  calculateEV(probability, americanOdds) {
    const decimalOdds = americanOdds > 0 
      ? (americanOdds / 100) + 1 
      : (100 / Math.abs(americanOdds)) + 1;
    
    return (probability * decimalOdds) - 1;
  }

  oddsToProb(americanOdds) {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }

  trackOddsMovement(game) {
    const gameId = game.id;
    const bookmakers = game.bookmakers || [];
    
    if (bookmakers.length === 0) return;
    
    const market = bookmakers[0].markets?.[0];
    if (!market || !market.outcomes || market.outcomes.length < 2) return;
    
    const homeOdds = market.outcomes[0].price;
    const timestamp = Date.now();
    
    if (!this.oddsHistory.has(gameId)) {
      this.oddsHistory.set(gameId, []);
    }
    
    const history = this.oddsHistory.get(gameId);
    history.push({ odds: homeOdds, timestamp });
    
    // Keep only last 20 entries
    if (history.length > 20) {
      history.shift();
    }
  }

  getOddsMovement(game) {
    const gameId = game.id;
    const history = this.oddsHistory.get(gameId);
    
    if (!history || history.length < 2) return 0;
    
    const latest = history[history.length - 1].odds;
    const earliest = history[0].odds;
    
    return latest - earliest;
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketAnalyzer;
}
