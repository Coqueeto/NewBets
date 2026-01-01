/**
 * Neural Network Module
 * 3-layer feedforward neural network: 55 → 100 → 50 → 25 → 1
 * 
 * Features:
 * - Xavier/Glorot initialization
 * - Leaky ReLU activation (hidden) + Sigmoid (output)
 * - Momentum-based gradient descent
 * - L2 regularization (0.0001)
 * - Inverted Dropout (0.2)
 * - Early stopping
 * - Full serialization support
 */

class NeuralNetwork {
    constructor(inputSize = 55, hiddenLayers = [100, 50, 25], outputSize = 1) {
        this.inputSize = inputSize;
        this.hiddenLayers = hiddenLayers;
        this.outputSize = outputSize;
        this.layers = [inputSize, ...hiddenLayers, outputSize];
        
        // Hyperparameters
        this.learningRate = 0.001;
        this.momentum = 0.9;
        this.l2Lambda = 0.0001;
        this.dropoutRate = 0.2;
        this.leakyAlpha = 0.01;
        
        // Training state
        this.epochs = 0;
        this.trainingLoss = [];
        this.validationLoss = [];
        this.bestLoss = Infinity;
        this.patience = 10;
        this.patienceCounter = 0;
        
        // Initialize weights and biases
        this.weights = [];
        this.biases = [];
        this.velocities = []; // For momentum
        
        this._initializeWeights();
    }

    /**
     * Xavier/Glorot weight initialization
     * Ensures proper gradient flow through deep networks
     */
    _initializeWeights() {
        for (let i = 0; i < this.layers.length - 1; i++) {
            const inputDim = this.layers[i];
            const outputDim = this.layers[i + 1];
            
            // Xavier initialization: scale by sqrt(2 / (fan_in + fan_out))
            const scale = Math.sqrt(2.0 / (inputDim + outputDim));
            
            // Weight matrix [outputDim x inputDim]
            const weight = Array(outputDim).fill(0).map(() =>
                Array(inputDim).fill(0).map(() => (Math.random() * 2 - 1) * scale)
            );
            
            // Bias vector [outputDim]
            const bias = Array(outputDim).fill(0).map(() => (Math.random() * 2 - 1) * 0.01);
            
            this.weights.push(weight);
            this.biases.push(bias);
            
            // Initialize velocity matrices for momentum
            this.velocities.push({
                weight: Array(outputDim).fill(0).map(() => Array(inputDim).fill(0)),
                bias: Array(outputDim).fill(0)
            });
        }
    }

    /**
     * Leaky ReLU activation function
     * f(x) = x if x > 0, else alpha * x
     */
    _leakyReLU(x) {
        return x > 0 ? x : this.leakyAlpha * x;
    }

    _leakyReLUDerivative(x) {
        return x > 0 ? 1 : this.leakyAlpha;
    }

    /**
     * Sigmoid activation function
     * f(x) = 1 / (1 + e^(-x))
     */
    _sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))); // Clamp to prevent overflow
    }

    _sigmoidDerivative(x) {
        const sig = this._sigmoid(x);
        return sig * (1 - sig);
    }

    /**
     * Forward propagation with dropout
     * @param {Array<number>} input - Input feature vector
     * @param {boolean} training - Whether in training mode
     * @returns {Object} - Activations and pre-activations for each layer
     */
    forward(input, training = false) {
        const activations = [input];
        const preActivations = [];
        const dropoutMasks = [];
        
        let current = input;
        
        for (let i = 0; i < this.weights.length; i++) {
            const isOutputLayer = i === this.weights.length - 1;
            
            // Linear transformation: z = Wx + b
            const z = this.weights[i].map((w, j) => {
                let sum = this.biases[i][j];
                for (let k = 0; k < current.length; k++) {
                    sum += w[k] * current[k];
                }
                return sum;
            });
            
            preActivations.push(z);
            
            // Apply activation function
            let a;
            if (isOutputLayer) {
                // Sigmoid for output layer (probability)
                a = z.map(val => this._sigmoid(val));
            } else {
                // Leaky ReLU for hidden layers
                a = z.map(val => this._leakyReLU(val));
                
                // Apply inverted dropout during training
                if (training && !isOutputLayer) {
                    const mask = a.map(() => Math.random() > this.dropoutRate ? 1 / (1 - this.dropoutRate) : 0);
                    a = a.map((val, idx) => val * mask[idx]);
                    dropoutMasks.push(mask);
                } else {
                    dropoutMasks.push(null);
                }
            }
            
            activations.push(a);
            current = a;
        }
        
        return { activations, preActivations, dropoutMasks };
    }

    /**
     * Backward propagation with momentum and L2 regularization
     */
    _backward(input, target, forwardResult) {
        const { activations, preActivations, dropoutMasks } = forwardResult;
        const numLayers = this.weights.length;
        
        // Gradients for each layer
        const weightGrads = [];
        const biasGrads = [];
        
        // Output layer error (delta)
        const outputActivation = activations[activations.length - 1][0];
        let delta = [(outputActivation - target) * this._sigmoidDerivative(preActivations[numLayers - 1][0])];
        
        // Backpropagate through layers
        for (let i = numLayers - 1; i >= 0; i--) {
            const isOutputLayer = i === numLayers - 1;
            const prevActivation = activations[i];
            
            // Compute weight gradients
            const wGrad = delta.map(d => 
                prevActivation.map(a => d * a)
            );
            
            // Compute bias gradients
            const bGrad = delta.slice();
            
            weightGrads.unshift(wGrad);
            biasGrads.unshift(bGrad);
            
            // Propagate error to previous layer
            if (i > 0) {
                const newDelta = Array(prevActivation.length).fill(0);
                
                for (let j = 0; j < prevActivation.length; j++) {
                    let error = 0;
                    for (let k = 0; k < delta.length; k++) {
                        error += delta[k] * this.weights[i][k][j];
                    }
                    
                    // Apply activation derivative
                    newDelta[j] = error * this._leakyReLUDerivative(preActivations[i - 1][j]);
                    
                    // Apply dropout mask if present
                    if (dropoutMasks[i - 1]) {
                        newDelta[j] *= dropoutMasks[i - 1][j];
                    }
                }
                
                delta = newDelta;
            }
        }
        
        return { weightGrads, biasGrads };
    }

    /**
     * Update weights using momentum and L2 regularization
     */
    _updateWeights(weightGrads, biasGrads, batchSize) {
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 0; k < this.weights[i][j].length; k++) {
                    // Gradient with L2 regularization
                    const grad = weightGrads[i][j][k] / batchSize + 
                                this.l2Lambda * this.weights[i][j][k];
                    
                    // Momentum update
                    this.velocities[i].weight[j][k] = 
                        this.momentum * this.velocities[i].weight[j][k] - 
                        this.learningRate * grad;
                    
                    // Update weight
                    this.weights[i][j][k] += this.velocities[i].weight[j][k];
                }
                
                // Update bias
                const bGrad = biasGrads[i][j] / batchSize;
                this.velocities[i].bias[j] = 
                    this.momentum * this.velocities[i].bias[j] - 
                    this.learningRate * bGrad;
                this.biases[i][j] += this.velocities[i].bias[j];
            }
        }
    }

    /**
     * Calculate Mean Squared Error loss with L2 regularization
     */
    _calculateLoss(predictions, targets) {
        let mse = 0;
        for (let i = 0; i < predictions.length; i++) {
            mse += Math.pow(predictions[i] - targets[i], 2);
        }
        mse /= predictions.length;
        
        // Add L2 regularization term
        let l2 = 0;
        for (const w of this.weights) {
            for (const row of w) {
                for (const val of row) {
                    l2 += val * val;
                }
            }
        }
        l2 *= this.l2Lambda / 2;
        
        return mse + l2;
    }

    /**
     * Train the neural network
     * @param {Array<Array<number>>} inputs - Training inputs
     * @param {Array<number>} targets - Training targets
     * @param {Object} options - Training options
     */
    train(inputs, targets, options = {}) {
        const {
            epochs = 50,
            batchSize = 32,
            validationSplit = 0.2,
            verbose = true
        } = options;
        
        // Split into training and validation
        const splitIdx = Math.floor(inputs.length * (1 - validationSplit));
        const trainInputs = inputs.slice(0, splitIdx);
        const trainTargets = targets.slice(0, splitIdx);
        const valInputs = inputs.slice(splitIdx);
        const valTargets = targets.slice(splitIdx);
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            // Shuffle training data
            const indices = Array.from({ length: trainInputs.length }, (_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            
            let epochLoss = 0;
            let numBatches = 0;
            
            // Mini-batch training
            for (let i = 0; i < trainInputs.length; i += batchSize) {
                const batchIndices = indices.slice(i, Math.min(i + batchSize, trainInputs.length));
                const batchInputs = batchIndices.map(idx => trainInputs[idx]);
                const batchTargets = batchIndices.map(idx => trainTargets[idx]);
                
                // Accumulate gradients
                const accWeightGrads = this.weights.map(w => w.map(row => row.map(() => 0)));
                const accBiasGrads = this.biases.map(b => b.map(() => 0));
                
                for (let j = 0; j < batchInputs.length; j++) {
                    const forwardResult = this.forward(batchInputs[j], true);
                    const { weightGrads, biasGrads } = this._backward(batchInputs[j], batchTargets[j], forwardResult);
                    
                    // Accumulate gradients
                    for (let l = 0; l < weightGrads.length; l++) {
                        for (let m = 0; m < weightGrads[l].length; m++) {
                            for (let n = 0; n < weightGrads[l][m].length; n++) {
                                accWeightGrads[l][m][n] += weightGrads[l][m][n];
                            }
                            accBiasGrads[l][m] += biasGrads[l][m];
                        }
                    }
                    
                    epochLoss += Math.pow(forwardResult.activations[forwardResult.activations.length - 1][0] - batchTargets[j], 2);
                }
                
                // Update weights with accumulated gradients
                this._updateWeights(accWeightGrads, accBiasGrads, batchInputs.length);
                numBatches++;
            }
            
            // Calculate epoch losses
            epochLoss /= trainInputs.length;
            this.trainingLoss.push(epochLoss);
            
            // Validation loss
            let valLoss = 0;
            if (valInputs.length > 0) {
                for (let i = 0; i < valInputs.length; i++) {
                    const prediction = this.predict(valInputs[i]);
                    valLoss += Math.pow(prediction - valTargets[i], 2);
                }
                valLoss /= valInputs.length;
                this.validationLoss.push(valLoss);
                
                // Early stopping
                if (valLoss < this.bestLoss) {
                    this.bestLoss = valLoss;
                    this.patienceCounter = 0;
                } else {
                    this.patienceCounter++;
                    if (this.patienceCounter >= this.patience) {
                        if (verbose) {
                            console.log(`Early stopping at epoch ${epoch + 1}`);
                        }
                        break;
                    }
                }
            }
            
            this.epochs++;
            
            if (verbose && (epoch + 1) % 10 === 0) {
                console.log(`Epoch ${epoch + 1}/${epochs} - Loss: ${epochLoss.toFixed(6)} - Val Loss: ${valLoss.toFixed(6)}`);
            }
        }
        
        return {
            finalLoss: this.trainingLoss[this.trainingLoss.length - 1],
            finalValLoss: this.validationLoss[this.validationLoss.length - 1] || null,
            epochs: this.epochs
        };
    }

    /**
     * Make a prediction
     * @param {Array<number>} input - Input feature vector
     * @returns {number} - Predicted probability (0-1)
     */
    predict(input) {
        const result = this.forward(input, false);
        return result.activations[result.activations.length - 1][0];
    }

    /**
     * Serialize network to JSON
     */
    toJSON() {
        return {
            inputSize: this.inputSize,
            hiddenLayers: this.hiddenLayers,
            outputSize: this.outputSize,
            weights: this.weights,
            biases: this.biases,
            learningRate: this.learningRate,
            momentum: this.momentum,
            l2Lambda: this.l2Lambda,
            dropoutRate: this.dropoutRate,
            epochs: this.epochs,
            trainingLoss: this.trainingLoss,
            validationLoss: this.validationLoss,
            bestLoss: this.bestLoss
        };
    }

    /**
     * Deserialize network from JSON
     */
    static fromJSON(json) {
        const nn = new NeuralNetwork(json.inputSize, json.hiddenLayers, json.outputSize);
        nn.weights = json.weights;
        nn.biases = json.biases;
        nn.learningRate = json.learningRate || nn.learningRate;
        nn.momentum = json.momentum || nn.momentum;
        nn.l2Lambda = json.l2Lambda || nn.l2Lambda;
        nn.dropoutRate = json.dropoutRate || nn.dropoutRate;
        nn.epochs = json.epochs || 0;
        nn.trainingLoss = json.trainingLoss || [];
        nn.validationLoss = json.validationLoss || [];
        nn.bestLoss = json.bestLoss || Infinity;
        
        // Reinitialize velocities
        nn.velocities = [];
        for (let i = 0; i < nn.weights.length; i++) {
            nn.velocities.push({
                weight: nn.weights[i].map(row => row.map(() => 0)),
                bias: nn.biases[i].map(() => 0)
            });
        }
        
        return nn;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuralNetwork;
}
