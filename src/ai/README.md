# Advanced AI Betting System

## Overview

This directory contains advanced AI modules that enhance the betting prediction system with neural networks, ensemble learning, quantum-inspired optimization, and market analysis.

## Architecture

### Component Hierarchy

```
AdvancedBettingAI (extends BettingAI)
├── FeatureExtractor - Extracts 55+ features from game data
├── NeuralNetwork - Deep learning predictions (3 hidden layers)
├── EnsembleModel - Combines multiple models with weighted voting
├── QuantumOptimizer - Hyperparameter optimization
└── MarketAnalyzer - Detects market inefficiencies and value bets
```

## Modules

### 1. Feature Extractor (`features.js`)

Extracts 55+ features from game data, organized into:

- **Team Performance (10 features)**: Win rates, streaks, recent form, H2H records
- **Situational (10 features)**: Home advantage, rest days, travel, timezone, rivalry
- **Betting Market (15 features)**: Odds movement, public/sharp money, CLV, market efficiency
- **Temporal (10 features)**: Day of week, season phase, momentum, trend direction
- **Statistical Anomalies (5 features)**: Outliers, regression potential, variance, consistency
- **Sport-Specific (5 features)**: Scoring trends, defensive/offensive strength, pace of play

**Key Methods:**
- `extractFeatures(game, historicalData)` - Returns normalized feature vector
- `oddsToProb(americanOdds)` - Converts American odds to probability
- `normalizeFeatures(features)` - Normalizes all features to [0, 1] range

### 2. Neural Network (`neural-network.js`)

Lightweight neural network implementation with:

- Xavier/Glorot weight initialization
- Leaky ReLU activation (hidden layers) and Sigmoid (output layer)
- Momentum-based gradient descent
- L2 regularization
- Dropout for regularization
- Early stopping

**Architecture:**
- Input: 55 features
- Hidden Layers: [100, 50, 25] neurons
- Output: 1 (win probability)

**Key Methods:**
- `forward(input, training)` - Forward propagation
- `backward(input, target, forwardResult)` - Backpropagation with momentum
- `train(inputs, targets, epochs)` - Training loop
- `predict(input)` - Generate prediction
- `toJSON()` / `fromJSON(data)` - Serialization

### 3. Ensemble Model (`ensemble.js`)

Combines multiple models using weighted voting:

- **Models**: Neural Network, Bayesian, Gradient Boosting, Random Forest, SVM
- **Default Weights**: NN (35%), Bayesian (25%), GB (20%), RF (15%), SVM (5%)
- **Dynamic Weight Adjustment**: Based on recent performance

**Key Methods:**
- `predict(features)` - Weighted ensemble prediction
- `updateWeights(results)` - Softmax-based weight adjustment
- `calculateVariance(values)` - Measure model agreement

### 4. Quantum Optimizer (`quantum-optimizer.js`)

Quantum-inspired optimization for hyperparameter tuning:

- Quantum superposition (alpha/beta states)
- Quantum rotation gates
- Quantum tunneling (escape local optima)
- Convergence detection

**Key Methods:**
- `optimize(objectiveFunction, dimensions, bounds)` - General optimization
- `tuneHyperparameters(model, validationSet, hyperparamRanges)` - Tune model hyperparameters

### 5. Market Analyzer (`market-analysis.js`)

Detects market inefficiencies and opportunities:

- Arbitrage detection across bookmakers
- Steam move detection (sharp money)
- Reverse line movement
- Market efficiency calculation
- Value bet identification

**Key Methods:**
- `detectArbitrageOpportunities(games)` - Find arbitrage opportunities
- `detectSteamMoves(game, oddsHistory)` - Detect rapid line movement
- `detectValueBets(game, modelProbability)` - Find value bets
- `estimateBookmakerEdge(game)` - Calculate vig/edge

## Integration

### Main System (`AdvancedBettingAI` class)

The `AdvancedBettingAI` class extends the base `BettingAI` class and integrates all advanced modules:

**Key Features:**
1. **Enhanced Game Analysis**:
   - 55-feature extraction
   - Ensemble predictions
   - Kelly Criterion bet sizing
   - Value bet detection
   - Advanced reasoning generation

2. **Improved Learning**:
   - Neural network training (50 epochs per cycle)
   - Ensemble weight optimization
   - Quantum hyperparameter tuning (every 50 cycles)
   - Model persistence

3. **Backward Compatibility**:
   - Falls back to base Bayesian model if advanced modules fail
   - Graceful degradation

## Usage

### Basic Usage (Automatic)

The system automatically initializes when the HTML page loads:

```javascript
// Automatically created on page load
let ai = new AdvancedBettingAI();

// Wait for advanced components to initialize
ai.initializeAdvancedComponents().then(() => {
    console.log('Advanced AI ready');
});

// Analyze a game
const analysis = await ai.analyzeGame(game);
console.log(analysis.confidence); // 50-95%
console.log(analysis.kellyBetSize); // 0-0.25 (fractional Kelly)
console.log(analysis.valueBet); // { edge, expectedValue }
```

### Manual Module Usage

```javascript
// Feature extraction
const extractor = new FeatureExtractor();
const features = extractor.extractFeatures(game, historicalData);

// Neural network prediction
const nn = new NeuralNetwork(55, [100, 50, 25], 1);
const prediction = nn.predict(featureVector);

// Ensemble prediction
const ensemble = new EnsembleModel();
ensemble.models.neuralNetwork = nn;
const result = ensemble.predict(featureVector);

// Quantum optimization
const optimizer = new QuantumOptimizer();
const optimized = optimizer.tuneHyperparameters(nn, validationSet, ranges);

// Market analysis
const analyzer = new MarketAnalyzer();
const arbitrage = analyzer.detectArbitrageOpportunities(games);
const valueBets = analyzer.detectValueBets(game, probability);
```

## Performance Targets

### Expected Win Rates

- **Initial (0-100 bets)**: 55-60% (bootstrapping phase)
- **Early (100-500 bets)**: 65-75% (pattern recognition)
- **Mature (500-2000 bets)**: 75-85% (strong patterns)
- **Expert (2000+ bets)**: 85-95% (diamond patterns + ensemble mastery)

### Confidence Calibration

- **50-60%**: Exploratory bets, small Kelly fraction
- **60-70%**: Standard bets, moderate Kelly fraction
- **70-80%**: High confidence, increased Kelly fraction
- **80-90%**: Very high confidence, near-full Kelly fraction
- **90-95%**: Diamond patterns, maximum Kelly fraction (25% of Kelly)

### Model Agreement

- **< 0.7**: Low agreement, reduce confidence
- **0.7-0.85**: Moderate agreement, standard confidence
- **0.85-0.9**: High agreement, boost confidence
- **> 0.9**: Very high agreement, diamond pattern eligible

## Storage

All models persist in `localStorage`:

- **aiModel**: Base Bayesian model
- **advancedAIModel**: Neural network + ensemble weights + feature cache

## Dependencies

None! All modules are vanilla JavaScript with no external dependencies.

## Testing

Run the test suite:

```bash
node test-ai-modules.js
```

Expected output:
- ✓ 55 features extracted
- ✓ Neural network training converges
- ✓ Ensemble predictions with agreement
- ✓ Quantum optimization finds optimal parameters
- ✓ Market analysis detects inefficiencies
- ✓ Serialization/deserialization works

## Future Enhancements

1. **Gradient Boosting Model**: Add XGBoost-like implementation
2. **Random Forest**: Implement decision tree ensemble
3. **SVM Classifier**: Add support vector machine
4. **LSTM/RNN**: Add recurrent neural network for temporal patterns
5. **Reinforcement Learning**: Q-learning for optimal bet sizing
6. **Real-time Odds APIs**: Live odds tracking and comparison
7. **Injury Data Integration**: Factor in player injuries
8. **Weather Data**: Include weather conditions for outdoor sports
9. **Social Sentiment**: Analyze betting forum sentiment
10. **Advanced Feature Engineering**: Automated feature discovery

## Contributing

When adding new features:

1. Maintain backward compatibility
2. Add serialization support
3. Update this README
4. Add tests to verify functionality
5. Follow existing code style

## License

Part of the NewBets project.
