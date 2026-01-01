/**
 * Ensemble Model Module
 * Combines multiple models using weighted voting
 * 
 * Model Slots:
 * - Neural Network (35%)
 * - Bayesian (25%)
 * - Gradient Boosting (20%)
 * - Random Forest (15%)
 * - SVM (5%)
 * 
 * Features:
 * - Dynamic weight adjustment via softmax
 * - Model agreement calculation
 * - Confidence calibration
 */

class EnsembleModel {
    constructor() {
        // Model weights (default distribution)
        this.modelWeights = {
            neuralNetwork: 0.35,
            bayesian: 0.25,
            gradientBoosting: 0.20,
            randomForest: 0.15,
            svm: 0.05
        };
        
        // Temperature for softmax weighting
        this.temperature = 5.0;
        
        // Model performance tracking
        this.modelPerformance = {
            neuralNetwork: { correct: 0, total: 0 },
            bayesian: { correct: 0, total: 0 },
            gradientBoosting: { correct: 0, total: 0 },
            randomForest: { correct: 0, total: 0 },
            svm: { correct: 0, total: 0 }
        };
        
        // Model instances (to be set externally)
        this.models = {
            neuralNetwork: null,
            bayesian: null,
            gradientBoosting: null,
            randomForest: null,
            svm: null
        };
    }

    /**
     * Register a model
     * @param {string} name - Model name
     * @param {Object} model - Model instance with predict() method
     */
    registerModel(name, model) {
        if (this.models.hasOwnProperty(name)) {
            this.models[name] = model;
        } else {
            console.warn(`Model ${name} not recognized`);
        }
    }

    /**
     * Make ensemble prediction
     * @param {Array<number>} features - Feature vector
     * @returns {Object} - Prediction with confidence and agreement metrics
     */
    predict(features) {
        const predictions = {};
        const activeModels = [];
        
        // Get predictions from all available models
        for (const [name, model] of Object.entries(this.models)) {
            if (model && typeof model.predict === 'function') {
                try {
                    predictions[name] = model.predict(features);
                    activeModels.push(name);
                } catch (error) {
                    console.warn(`Model ${name} prediction failed:`, error);
                    predictions[name] = null;
                }
            }
        }
        
        // Calculate weighted ensemble prediction
        let weightedSum = 0;
        let weightSum = 0;
        
        for (const name of activeModels) {
            if (predictions[name] !== null) {
                const weight = this.modelWeights[name];
                weightedSum += predictions[name] * weight;
                weightSum += weight;
            }
        }
        
        const ensemblePrediction = weightSum > 0 ? weightedSum / weightSum : 0.5;
        
        // Calculate model agreement
        const agreement = this._calculateAgreement(predictions, activeModels);
        
        // Calculate confidence based on agreement
        const confidence = this._calibrateConfidence(ensemblePrediction, agreement);
        
        return {
            prediction: ensemblePrediction,
            confidence: confidence,
            agreement: agreement,
            modelPredictions: predictions,
            activeModels: activeModels
        };
    }

    /**
     * Calculate agreement between models (using variance)
     * Lower variance = higher agreement
     */
    _calculateAgreement(predictions, activeModels) {
        if (activeModels.length < 2) return 1.0;
        
        const values = activeModels
            .map(name => predictions[name])
            .filter(v => v !== null);
        
        if (values.length < 2) return 1.0;
        
        // Calculate mean
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        
        // Calculate variance
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        
        // Convert variance to agreement score (0-1, higher is better)
        // Use exponential decay: agreement = exp(-k * variance)
        const k = 10; // Sensitivity parameter
        const agreement = Math.exp(-k * variance);
        
        return agreement;
    }

    /**
     * Calibrate confidence based on ensemble prediction and agreement
     */
    _calibrateConfidence(prediction, agreement) {
        // Base confidence from prediction distance from 0.5
        const baseConfidence = Math.abs(prediction - 0.5) * 2;
        
        // Adjust confidence by agreement
        // High agreement = boost confidence
        // Low agreement = reduce confidence
        const adjustedConfidence = baseConfidence * (0.5 + 0.5 * agreement);
        
        return Math.min(1.0, Math.max(0.0, adjustedConfidence));
    }

    /**
     * Update model weights dynamically based on performance
     */
    updateWeights() {
        const scores = {};
        
        // Calculate accuracy for each model
        for (const [name, perf] of Object.entries(this.modelPerformance)) {
            if (perf.total > 0) {
                scores[name] = perf.correct / perf.total;
            } else {
                scores[name] = 0.5; // Default for untested models
            }
        }
        
        // Apply softmax with temperature to calculate new weights
        this.modelWeights = this._softmax(scores, this.temperature);
        
        return this.modelWeights;
    }

    /**
     * Softmax function with temperature
     * @param {Object} scores - Model scores
     * @param {number} temperature - Controls distribution sharpness
     */
    _softmax(scores, temperature) {
        const modelNames = Object.keys(scores);
        const expScores = {};
        let sumExp = 0;
        
        // Calculate exp(score / temperature)
        for (const name of modelNames) {
            const exp = Math.exp(scores[name] / temperature);
            expScores[name] = exp;
            sumExp += exp;
        }
        
        // Normalize to get probabilities
        const weights = {};
        for (const name of modelNames) {
            weights[name] = expScores[name] / sumExp;
        }
        
        return weights;
    }

    /**
     * Record model performance
     * @param {Object} predictions - Model predictions
     * @param {number} actual - Actual outcome (0 or 1)
     */
    recordPerformance(predictions, actual) {
        for (const [name, prediction] of Object.entries(predictions)) {
            if (prediction !== null && this.modelPerformance.hasOwnProperty(name)) {
                // Binary classification: round prediction to 0 or 1
                const predicted = prediction > 0.5 ? 1 : 0;
                const correct = predicted === actual ? 1 : 0;
                
                this.modelPerformance[name].correct += correct;
                this.modelPerformance[name].total += 1;
            }
        }
    }

    /**
     * Get performance report
     */
    getPerformanceReport() {
        const report = {};
        
        for (const [name, perf] of Object.entries(this.modelPerformance)) {
            const accuracy = perf.total > 0 ? (perf.correct / perf.total) : 0;
            report[name] = {
                accuracy: accuracy,
                correct: perf.correct,
                total: perf.total,
                weight: this.modelWeights[name]
            };
        }
        
        return report;
    }

    /**
     * Reset performance tracking
     */
    resetPerformance() {
        for (const name of Object.keys(this.modelPerformance)) {
            this.modelPerformance[name] = { correct: 0, total: 0 };
        }
    }

    /**
     * Serialize ensemble to JSON
     */
    toJSON() {
        return {
            modelWeights: this.modelWeights,
            temperature: this.temperature,
            modelPerformance: this.modelPerformance
        };
    }

    /**
     * Deserialize ensemble from JSON
     */
    static fromJSON(json) {
        const ensemble = new EnsembleModel();
        ensemble.modelWeights = json.modelWeights || ensemble.modelWeights;
        ensemble.temperature = json.temperature || ensemble.temperature;
        ensemble.modelPerformance = json.modelPerformance || ensemble.modelPerformance;
        return ensemble;
    }
}

/**
 * Simple Bayesian Model (for ensemble slot)
 */
class SimpleBayesianModel {
    constructor() {
        this.priors = { win: 0.5, loss: 0.5 };
        this.likelihoods = {};
    }

    predict(features) {
        // Simple Bayesian inference based on feature patterns
        // This is a placeholder - the existing BettingAI provides better Bayesian logic
        let winProb = this.priors.win;
        
        // Adjust based on key features
        if (features[0] > 0.5) winProb += 0.1; // Team win rate
        if (features[10] > 0.5) winProb += 0.05; // Home advantage
        if (features[20] > 0.5) winProb += 0.05; // Odds value
        
        return Math.max(0, Math.min(1, winProb));
    }

    train(features, targets) {
        // Update priors based on outcomes
        const wins = targets.filter(t => t === 1).length;
        const total = targets.length;
        this.priors.win = wins / total;
        this.priors.loss = 1 - this.priors.win;
    }
}

/**
 * Placeholder models for ensemble slots
 * These provide baseline predictions that can be improved over time
 */
class PlaceholderModel {
    constructor(name = 'placeholder') {
        this.name = name;
        this.baseAccuracy = 0.5 + Math.random() * 0.1; // 50-60% baseline
    }

    predict(features) {
        // Weighted combination of features with some randomness
        let score = 0.5;
        
        // Use key features
        score += (features[0] - 0.5) * 0.2; // Team performance
        score += (features[10] - 0.5) * 0.1; // Home advantage
        score += (features[20] - 0.5) * 0.15; // Odds value
        score += (features[30] - 0.5) * 0.05; // Temporal factors
        
        // Add small random noise for diversity
        score += (Math.random() - 0.5) * 0.05;
        
        return Math.max(0, Math.min(1, score));
    }

    train(features, targets) {
        // Placeholder training - calculate simple accuracy
        // In a real implementation, this would update model parameters
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EnsembleModel,
        SimpleBayesianModel,
        PlaceholderModel
    };
}
