/**
 * Quantum-Inspired Optimizer Module
 * Uses quantum-inspired algorithms for hyperparameter optimization
 * 
 * Features:
 * - Normalized quantum states (α²+β²=1)
 * - Quantum rotation gates
 * - Quantum tunneling for escaping local optima
 * - Convergence detection with early stopping
 * - Hyperparameter tuning wrapper
 */

class QuantumOptimizer {
    constructor(options = {}) {
        this.populationSize = options.populationSize || 20;
        this.maxIterations = options.maxIterations || 100;
        this.convergenceThreshold = options.convergenceThreshold || 1e-6;
        this.tunnelingProbability = options.tunnelingProbability || 0.1;
        this.rotationAngle = options.rotationAngle || 0.05 * Math.PI;
        
        // Convergence tracking
        this.bestFitness = -Infinity;
        this.bestParams = null;
        this.fitnessHistory = [];
        this.convergenceCounter = 0;
        this.patience = 10;
    }

    /**
     * Quantum state representation using single angle θ
     * Ensures normalization: α² + β² = 1
     * α = cos(θ), β = sin(θ)
     */
    _createQuantumState(theta) {
        return {
            theta: theta,
            alpha: Math.cos(theta),
            beta: Math.sin(theta)
        };
    }

    /**
     * Initialize quantum population
     * Each individual represents a set of hyperparameters
     */
    _initializePopulation(paramRanges) {
        const population = [];
        
        for (let i = 0; i < this.populationSize; i++) {
            const individual = {
                quantumStates: [],
                params: {},
                fitness: -Infinity
            };
            
            // Create quantum state for each parameter
            for (const [param, range] of Object.entries(paramRanges)) {
                const theta = Math.random() * Math.PI / 2; // 0 to π/2
                individual.quantumStates.push(this._createQuantumState(theta));
                
                // Decode to actual parameter value
                individual.params[param] = this._decodeParameter(theta, range);
            }
            
            population.push(individual);
        }
        
        return population;
    }

    /**
     * Decode quantum state to parameter value
     */
    _decodeParameter(theta, range) {
        const { min, max, type } = range;
        
        // Use probability amplitude to map to parameter range
        const prob = Math.cos(theta) * Math.cos(theta); // |α|²
        let value = min + prob * (max - min);
        
        if (type === 'int') {
            value = Math.round(value);
        } else if (type === 'log') {
            // Logarithmic scale for learning rates, etc.
            value = Math.exp(Math.log(min) + prob * (Math.log(max) - Math.log(min)));
        }
        
        return value;
    }

    /**
     * Apply quantum rotation gate
     * Rotates quantum state by rotation angle
     */
    _quantumRotate(theta, direction) {
        // direction: 1 for increase, -1 for decrease
        const delta = direction * this.rotationAngle;
        let newTheta = theta + delta;
        
        // Keep theta in valid range [0, π/2]
        newTheta = Math.max(0, Math.min(Math.PI / 2, newTheta));
        
        return newTheta;
    }

    /**
     * Quantum tunneling - escape local optima
     * Randomly jump to a different state with small probability
     */
    _quantumTunnel(theta) {
        if (Math.random() < this.tunnelingProbability) {
            // Large quantum jump
            return Math.random() * Math.PI / 2;
        }
        return theta;
    }

    /**
     * Update population based on fitness
     */
    _updatePopulation(population, bestIndividual, paramRanges) {
        const paramNames = Object.keys(paramRanges);
        
        for (const individual of population) {
            for (let i = 0; i < individual.quantumStates.length; i++) {
                const paramName = paramNames[i];
                const currentTheta = individual.quantumStates[i].theta;
                const bestValue = bestIndividual.params[paramName];
                const currentValue = individual.params[paramName];
                
                // Determine rotation direction
                let direction = 0;
                if (bestValue > currentValue) {
                    direction = 1; // Rotate towards higher values
                } else if (bestValue < currentValue) {
                    direction = -1; // Rotate towards lower values
                }
                
                // Apply quantum rotation
                let newTheta = this._quantumRotate(currentTheta, direction);
                
                // Apply quantum tunneling
                newTheta = this._quantumTunnel(newTheta);
                
                // Update quantum state
                individual.quantumStates[i] = this._createQuantumState(newTheta);
                
                // Update parameter value
                individual.params[paramName] = this._decodeParameter(newTheta, paramRanges[paramName]);
            }
        }
    }

    /**
     * Check convergence
     */
    _checkConvergence() {
        if (this.fitnessHistory.length < 2) return false;
        
        const recentFitness = this.fitnessHistory.slice(-5);
        const variance = this._calculateVariance(recentFitness);
        
        if (variance < this.convergenceThreshold) {
            this.convergenceCounter++;
        } else {
            this.convergenceCounter = 0;
        }
        
        return this.convergenceCounter >= this.patience;
    }

    /**
     * Calculate variance
     */
    _calculateVariance(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Optimize hyperparameters
     * @param {Function} objectiveFunction - Function to maximize (returns fitness score)
     * @param {Object} paramRanges - Parameter ranges to optimize
     * @returns {Object} - Best parameters found
     */
    optimize(objectiveFunction, paramRanges) {
        // Initialize population
        let population = this._initializePopulation(paramRanges);
        
        // Evaluate initial population
        for (const individual of population) {
            individual.fitness = objectiveFunction(individual.params);
        }
        
        // Find initial best
        let bestIndividual = population.reduce((best, ind) => 
            ind.fitness > best.fitness ? ind : best
        );
        
        this.bestFitness = bestIndividual.fitness;
        this.bestParams = { ...bestIndividual.params };
        this.fitnessHistory.push(this.bestFitness);
        
        // Optimization loop
        for (let iteration = 0; iteration < this.maxIterations; iteration++) {
            // Update population based on best individual
            this._updatePopulation(population, bestIndividual, paramRanges);
            
            // Evaluate new population
            for (const individual of population) {
                individual.fitness = objectiveFunction(individual.params);
                
                // Update global best
                if (individual.fitness > this.bestFitness) {
                    this.bestFitness = individual.fitness;
                    this.bestParams = { ...individual.params };
                    bestIndividual = individual;
                }
            }
            
            this.fitnessHistory.push(this.bestFitness);
            
            // Check convergence
            if (this._checkConvergence()) {
                console.log(`Converged at iteration ${iteration + 1}`);
                break;
            }
            
            // Log progress every 10 iterations
            if ((iteration + 1) % 10 === 0) {
                console.log(`Iteration ${iteration + 1}: Best Fitness = ${this.bestFitness.toFixed(6)}`);
            }
        }
        
        return {
            params: this.bestParams,
            fitness: this.bestFitness,
            iterations: this.fitnessHistory.length,
            history: this.fitnessHistory
        };
    }

    /**
     * Optimize neural network hyperparameters
     */
    optimizeNeuralNetwork(neuralNetwork, trainData, trainTargets, validData, validTargets) {
        // Define parameter ranges for neural network
        const paramRanges = {
            learningRate: { min: 0.0001, max: 0.01, type: 'log' },
            momentum: { min: 0.5, max: 0.99, type: 'float' },
            l2Lambda: { min: 0.00001, max: 0.001, type: 'log' },
            dropoutRate: { min: 0.0, max: 0.5, type: 'float' }
        };
        
        // Objective function: validation accuracy
        const objectiveFunction = (params) => {
            // Create a copy of neural network with new hyperparameters
            const nn = NeuralNetwork.fromJSON(neuralNetwork.toJSON());
            nn.learningRate = params.learningRate;
            nn.momentum = params.momentum;
            nn.l2Lambda = params.l2Lambda;
            nn.dropoutRate = params.dropoutRate;
            
            // Train on subset (quick evaluation)
            const subsetSize = Math.min(100, trainData.length);
            const trainSubset = trainData.slice(0, subsetSize);
            const targetSubset = trainTargets.slice(0, subsetSize);
            
            try {
                nn.train(trainSubset, targetSubset, {
                    epochs: 10,
                    batchSize: 16,
                    verbose: false
                });
                
                // Evaluate on validation set
                let correct = 0;
                for (let i = 0; i < validData.length; i++) {
                    const prediction = nn.predict(validData[i]);
                    const predictedClass = prediction > 0.5 ? 1 : 0;
                    if (predictedClass === validTargets[i]) {
                        correct++;
                    }
                }
                
                return correct / validData.length;
            } catch (error) {
                console.warn('Neural network training error:', error);
                return 0; // Return 0 fitness on error
            }
        };
        
        // Run optimization
        return this.optimize(objectiveFunction, paramRanges);
    }

    /**
     * Serialize optimizer state to JSON
     */
    toJSON() {
        return {
            bestFitness: this.bestFitness,
            bestParams: this.bestParams,
            fitnessHistory: this.fitnessHistory
        };
    }

    /**
     * Deserialize optimizer state from JSON
     */
    static fromJSON(json) {
        const optimizer = new QuantumOptimizer();
        optimizer.bestFitness = json.bestFitness || -Infinity;
        optimizer.bestParams = json.bestParams || null;
        optimizer.fitnessHistory = json.fitnessHistory || [];
        return optimizer;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuantumOptimizer;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.QuantumOptimizer = QuantumOptimizer;
}
