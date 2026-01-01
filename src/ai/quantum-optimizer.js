// Quantum-Inspired Optimization Algorithm
class QuantumOptimizer {
  constructor(populationSize = 50, maxIterations = 100) {
    this.populationSize = populationSize;
    this.maxIterations = maxIterations;
    this.population = [];
    this.bestSolution = null;
    this.bestFitness = -Infinity;
  }

  // Quantum-inspired superposition and entanglement
  initialize(dimensions, bounds) {
    this.population = [];
    
    for (let i = 0; i < this.populationSize; i++) {
      const individual = {
        position: [],
        velocity: [],
        qstate: [], // Quantum state (superposition)
        fitness: 0
      };
      
      for (let d = 0; d < dimensions; d++) {
        individual.position[d] = Math.random() * (bounds[d][1] - bounds[d][0]) + bounds[d][0];
        individual.velocity[d] = (Math.random() - 0.5) * 0.1;
        
        // Proper quantum state initialization with normalization constraint
        // Using single angle theta: alpha = cos(theta), beta = sin(theta)
        // This automatically satisfies alpha² + beta² = cos²(theta) + sin²(theta) = 1
        const theta = Math.random() * Math.PI; // Single random angle
        individual.qstate[d] = {
          alpha: Math.cos(theta), // Amplitude for |0⟩
          beta: Math.sin(theta)   // Amplitude for |1⟩
        };
      }
      
      this.population.push(individual);
    }
  }

  // Quantum rotation gate
  quantumRotate(individual, globalBest, iteration) {
    const theta = (Math.PI / this.maxIterations) * (1 + iteration);
    
    for (let d = 0; d < individual.position.length; d++) {
      const delta = globalBest.position[d] - individual.position[d];
      
      // Rotation matrix application
      const newAlpha = individual.qstate[d].alpha * Math.cos(theta) - 
                       individual.qstate[d].beta * Math.sin(theta);
      const newBeta = individual.qstate[d].alpha * Math.sin(theta) + 
                      individual.qstate[d].beta * Math.cos(theta);
      
      individual.qstate[d].alpha = newAlpha;
      individual.qstate[d].beta = newBeta;
      
      // Collapse quantum state to classical position
      const probability = Math.pow(individual.qstate[d].alpha, 2);
      individual.position[d] += delta * probability * 0.1;
    }
  }

  // Quantum tunneling (escape local optima)
  quantumTunnel(individual, tunnelProbability = 0.1) {
    if (Math.random() < tunnelProbability) {
      const dimension = Math.floor(Math.random() * individual.position.length);
      individual.position[dimension] += (Math.random() - 0.5) * 2; // Jump
    }
  }

  // Optimize hyperparameters or model weights
  optimize(objectiveFunction, dimensions, bounds) {
    this.initialize(dimensions, bounds);
    const history = [];

    for (let iter = 0; iter < this.maxIterations; iter++) {
      // Evaluate fitness
      for (const individual of this.population) {
        individual.fitness = objectiveFunction(individual.position);
        
        if (individual.fitness > this.bestFitness) {
          this.bestFitness = individual.fitness;
          this.bestSolution = [...individual.position];
        }
      }

      // Quantum operations
      for (const individual of this.population) {
        this.quantumRotate(individual, { position: this.bestSolution }, iter);
        this.quantumTunnel(individual, 0.05);
      }

      history.push({
        iteration: iter,
        bestFitness: this.bestFitness,
        avgFitness: this.population.reduce((sum, ind) => sum + ind.fitness, 0) / this.populationSize
      });

      // Convergence check
      if (iter > 10) {
        const recentBest = history.slice(-10).map(h => h.bestFitness);
        const improvement = Math.max(...recentBest) - Math.min(...recentBest);
        if (improvement < 0.0001) break; // Converged
      }
    }

    return {
      solution: this.bestSolution,
      fitness: this.bestFitness,
      history
    };
  }

  // Hyperparameter tuning wrapper
  tuneHyperparameters(model, validationSet, hyperparamRanges) {
    const objectiveFunction = (hyperparams) => {
      // Set hyperparameters
      model.learningRate = hyperparams[0];
      model.momentum = hyperparams[1];
      model.l2Regularization = hyperparams[2];
      
      // Train and evaluate
      const predictions = validationSet.map(sample => 
        model.predict(sample.features)
      );
      
      const accuracy = predictions.filter((pred, idx) => {
        const predValue = Array.isArray(pred) ? pred[0] : pred;
        return Math.round(predValue) === validationSet[idx].label;
      }).length / validationSet.length;
      
      return accuracy;
    };

    const dimensions = Object.keys(hyperparamRanges).length;
    const bounds = Object.values(hyperparamRanges);
    
    return this.optimize(objectiveFunction, dimensions, bounds);
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumOptimizer;
}
