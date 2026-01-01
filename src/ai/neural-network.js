// Lightweight Neural Network (no external dependencies)
class NeuralNetwork {
  constructor(inputSize, hiddenLayers, outputSize) {
    this.layers = [];
    
    // Input layer
    let prevSize = inputSize;
    
    // Hidden layers
    for (const size of hiddenLayers) {
      this.layers.push(this.createLayer(prevSize, size));
      prevSize = size;
    }
    
    // Output layer
    this.layers.push(this.createLayer(prevSize, outputSize));
    
    this.learningRate = 0.001;
    this.momentum = 0.9;
    this.l2Regularization = 0.0001;
    this.velocities = this.layers.map(layer => ({
      weights: this.zerosLike(layer.weights),
      biases: new Array(layer.biases.length).fill(0)
    }));
  }

  createLayer(inputSize, outputSize) {
    // Xavier/Glorot initialization
    const limit = Math.sqrt(6 / (inputSize + outputSize));
    const weights = [];
    for (let i = 0; i < outputSize; i++) {
      weights[i] = [];
      for (let j = 0; j < inputSize; j++) {
        weights[i][j] = (Math.random() * 2 - 1) * limit;
      }
    }
    
    return {
      weights,
      biases: new Array(outputSize).fill(0),
      activation: 'relu', // or 'sigmoid' for output
      dropout: 0.2
    };
  }

  // Activation functions
  relu(x) {
    return Math.max(0, x);
  }

  reluDerivative(x) {
    return x > 0 ? 1 : 0;
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  sigmoidDerivative(x) {
    const sig = this.sigmoid(x);
    return sig * (1 - sig);
  }

  // Leaky ReLU for better gradient flow
  leakyRelu(x, alpha = 0.01) {
    return x > 0 ? x : alpha * x;
  }

  leakyReluDerivative(x, alpha = 0.01) {
    return x > 0 ? 1 : alpha;
  }

  // Forward propagation
  forward(input, training = false) {
    let activation = input;
    const activations = [activation];
    const zValues = [];
    const dropoutMasks = []; // Store masks for backward pass

    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const z = [];
      
      // Matrix multiplication + bias
      for (let j = 0; j < layer.weights.length; j++) {
        let sum = layer.biases[j];
        for (let k = 0; k < activation.length; k++) {
          sum += layer.weights[j][k] * activation[k];
        }
        z.push(sum);
      }
      
      zValues.push(z);
      
      // Apply activation function
      const isOutputLayer = i === this.layers.length - 1;
      activation = z.map(val => 
        isOutputLayer ? this.sigmoid(val) : this.leakyRelu(val)
      );
      
      // Apply dropout during training (except output layer)
      // Dropout randomly zeros out neurons with probability `dropout`
      // Scale remaining activations by 1/(1-dropout_rate) to maintain expected magnitude
      // This "inverted dropout" approach eliminates the need for scaling at test time
      let mask = null;
      if (training && !isOutputLayer && layer.dropout > 0) {
        mask = activation.map(() => 
          Math.random() > layer.dropout ? 1 / (1 - layer.dropout) : 0
        );
        activation = activation.map((val, idx) => val * mask[idx]);
      }
      dropoutMasks.push(mask);
      
      activations.push(activation);
    }

    return { output: activation, activations, zValues, dropoutMasks };
  }

  // Backpropagation with Adam optimizer
  backward(input, target, forwardResult) {
    const { activations, zValues } = forwardResult;
    const deltas = [];
    
    // Output layer error
    const outputActivations = activations[activations.length - 1];
    let delta = outputActivations.map((output, i) => 
      (output - target[i]) * this.sigmoidDerivative(zValues[zValues.length - 1][i])
    );
    deltas.unshift(delta);

    // Hidden layers
    for (let i = this.layers.length - 2; i >= 0; i--) {
      const nextDelta = delta;
      const nextWeights = this.layers[i + 1].weights;
      delta = [];
      
      for (let j = 0; j < this.layers[i].weights.length; j++) {
        let error = 0;
        for (let k = 0; k < nextWeights.length; k++) {
          error += nextWeights[k][j] * nextDelta[k];
        }
        delta.push(error * this.leakyReluDerivative(zValues[i][j]));
      }
      
      deltas.unshift(delta);
    }

    // Update weights with Adam optimizer
    for (let i = 0; i < this.layers.length; i++) {
      const layer = this.layers[i];
      const prevActivations = i === 0 ? input : activations[i];
      
      for (let j = 0; j < layer.weights.length; j++) {
        for (let k = 0; k < layer.weights[j].length; k++) {
          const gradient = deltas[i][j] * prevActivations[k] + 
                          this.l2Regularization * layer.weights[j][k];
          
          // Momentum update
          this.velocities[i].weights[j][k] = 
            this.momentum * this.velocities[i].weights[j][k] - 
            this.learningRate * gradient;
          
          layer.weights[j][k] += this.velocities[i].weights[j][k];
        }
        
        // Update biases
        const biasGradient = deltas[i][j];
        this.velocities[i].biases[j] = 
          this.momentum * this.velocities[i].biases[j] - 
          this.learningRate * biasGradient;
        
        layer.biases[j] += this.velocities[i].biases[j];
      }
    }
  }

  train(inputs, targets, epochs = 100) {
    const losses = [];
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      
      for (let i = 0; i < inputs.length; i++) {
        const forwardResult = this.forward(inputs[i], true);
        this.backward(inputs[i], targets[i], forwardResult);
        
        // Calculate loss
        const loss = forwardResult.output.reduce((sum, output, idx) => 
          sum + Math.pow(output - targets[i][idx], 2), 0
        ) / targets[i].length;
        
        totalLoss += loss;
      }
      
      const avgLoss = totalLoss / inputs.length;
      losses.push(avgLoss);
      
      // Early stopping
      if (avgLoss < 0.001) break;
    }
    
    return losses;
  }

  predict(input) {
    const result = this.forward(input, false);
    return result.output;
  }

  zerosLike(matrix) {
    return matrix.map(row => new Array(row.length).fill(0));
  }

  // Serialize for storage
  toJSON() {
    return {
      layers: this.layers,
      learningRate: this.learningRate,
      momentum: this.momentum,
      l2Regularization: this.l2Regularization
    };
  }

  // Deserialize from storage
  static fromJSON(data) {
    const nn = new NeuralNetwork(1, [], 1);
    nn.layers = data.layers;
    nn.learningRate = data.learningRate;
    nn.momentum = data.momentum;
    nn.l2Regularization = data.l2Regularization;
    nn.velocities = nn.layers.map(layer => ({
      weights: nn.zerosLike(layer.weights),
      biases: new Array(layer.biases.length).fill(0)
    }));
    return nn;
  }
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NeuralNetwork;
}
