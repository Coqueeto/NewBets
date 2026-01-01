// Ensemble Learning System
class EnsembleModel {
  constructor() {
    this.models = {
      neuralNetwork: null,
      bayesian: null,
      gradientBoosting: null,
      randomForest: null,
      svmClassifier: null
    };
    
    this.weights = {
      neuralNetwork: 0.35,
      bayesian: 0.25,
      gradientBoosting: 0.20,
      randomForest: 0.15,
      svmClassifier: 0.05
    };
    
    this.performanceHistory = [];
  }

  // Weighted voting ensemble
  predict(features) {
    const predictions = {};
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [modelName, model] of Object.entries(this.models)) {
      if (model && model.predict) {
        try {
          const prediction = model.predict(features);
          // Handle both scalar and array predictions
          const predValue = Array.isArray(prediction) ? prediction[0] : prediction;
          predictions[modelName] = predValue;
          
          const weight = this.weights[modelName];
          weightedSum += predValue * weight;
          totalWeight += weight;
        } catch (err) {
          console.warn(`Model ${modelName} prediction failed:`, err);
        }
      }
    }

    const ensemblePrediction = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    
    // Calculate confidence based on agreement
    const predictionValues = Object.values(predictions);
    const variance = predictionValues.length > 1 ? this.calculateVariance(predictionValues) : 0;
    const confidence = Math.max(50, 100 - (variance * 50)); // Higher agreement = higher confidence

    return {
      prediction: ensemblePrediction,
      confidence,
      individualPredictions: predictions,
      modelAgreement: 1 - variance
    };
  }

  // Dynamic weight adjustment based on recent performance
  updateWeights(results) {
    const performances = {};
    
    for (const modelName of Object.keys(this.models)) {
      const modelResults = results.filter(r => r.model === modelName);
      if (modelResults.length > 0) {
        const accuracy = modelResults.filter(r => r.correct).length / modelResults.length;
        performances[modelName] = accuracy;
      }
    }

    // Softmax normalization of weights based on performance
    const scores = Object.entries(performances).map(([name, perf]) => 
      [name, Math.exp(perf * 5)] // Temperature = 5
    );
    
    const totalScore = scores.reduce((sum, [_, score]) => sum + score, 0);
    
    if (totalScore > 0) {
      for (const [modelName, score] of scores) {
        this.weights[modelName] = score / totalScore;
      }
    }
  }

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }

  // Stacking ensemble (meta-learner)
  stackPredictions(features, metaModel) {
    const basePredictions = [];
    
    for (const model of Object.values(this.models)) {
      if (model && model.predict) {
        try {
          const pred = model.predict(features);
          basePredictions.push(Array.isArray(pred) ? pred[0] : pred);
        } catch (err) {
          console.warn('Model prediction failed in stacking:', err);
        }
      }
    }

    // Use meta-model to combine base predictions
    if (basePredictions.length > 0 && metaModel) {
      return metaModel.predict(basePredictions);
    }
    
    return basePredictions.length > 0 
      ? basePredictions.reduce((sum, p) => sum + p, 0) / basePredictions.length 
      : 0.5;
  }

  // Serialize for storage
  toJSON() {
    return {
      weights: this.weights,
      performanceHistory: this.performanceHistory
    };
  }

  // Deserialize from storage
  static fromJSON(data) {
    const ensemble = new EnsembleModel();
    ensemble.weights = data.weights || ensemble.weights;
    ensemble.performanceHistory = data.performanceHistory || [];
    return ensemble;
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnsembleModel;
}
