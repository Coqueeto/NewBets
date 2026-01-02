// Quantum-Inspired Optimization Algorithm (async, reproducible, evaluative)
// Improved implementation: deterministic seeded RNG, per-dimension quantum state,
// async-friendly training/evaluation, progress callbacks, and non-blocking behavior.

class QuantumOptimizer {
  constructor({ populationSize = 30, maxIterations = 50, seed = 2463534242 } = {}) {
    this.populationSize = populationSize;
    this.maxIterations = maxIterations;
    this.seed = seed >>> 0;

    this.population = [];
    this.bestSolution = null;
    this.bestFitness = -Infinity;
    this.history = [];
  }

  // xorshift32 RNG wrapped for convenience and determinism
  seededRng(seed = this.seed) {
    let x = seed >>> 0;
    return {
      // returns float in [0,1)
      random() {
        x ^= (x << 13) >>> 0;
        x ^= x >>> 17;
        x ^= (x << 5) >>> 0;
        return (x >>> 0) / 0x100000000; // divide by 2^32
      },
      // integer in [0, n)
      int(n) {
        return Math.floor(this.random() * n);
      },
      // advance the RNG state by n steps (useful for reproducibility in parallel evaluations)
      advance(steps = 1) {
        for (let i = 0; i < steps; i++) this.random();
      }
    };
  }

  // Map position vector (values in [0,1]) to hyperparameter object using bounds
  // hyperparamRanges: { name: [min,max] }
  // If min/max are integers, values will be rounded to integers.
  mapPositionToParams(position, keys, bounds) {
    const params = {};
    for (let i = 0; i < keys.length; i++) {
      const [min, max] = bounds[i];
      const raw = min + position[i] * (max - min);
      // If both min and max are integers, treat param as integer
      if (Number.isInteger(min) && Number.isInteger(max)) {
        params[keys[i]] = Math.round(raw);
      } else {
        params[keys[i]] = raw;
      }
    }
    return params;
  }

  // Initialize population with positions in [0,1] and per-dimension quantum angles (theta)
  initializePopulation(dimension, rng) {
    this.population = [];
    for (let i = 0; i < this.populationSize; i++) {
      const position = new Array(dimension);
      const theta = new Array(dimension);
      for (let d = 0; d < dimension; d++) {
        position[d] = rng.random();
        theta[d] = rng.random() * Math.PI * 2; // full circle
      }
      this.population.push({ position, theta, fitness: -Infinity });
    }
    this.bestSolution = null;
    this.bestFitness = -Infinity;
    this.history = [];
  }

  // Convert theta to normalized q-state (alpha,beta) that satisfy alpha^2 + beta^2 = 1
  thetaToQstate(theta) {
    return { alpha: Math.cos(theta), beta: Math.sin(theta) };
  }

  // Quantum rotate per-dimension -- deterministic with provided rng
  quantumRotate(individual, globalBestPosition, iter, maxIter, rng) {
    const progressFactor = iter / Math.max(1, maxIter - 1); // grows with iterations
    const baseStep = 0.5 * (1 - progressFactor) + 0.05; // decreasing exploration

    for (let d = 0; d < individual.position.length; d++) {
      // direction deterministic: toward global best if exists, otherwise random
      let direction = 0;
      if (globalBestPosition) {
        const diff = globalBestPosition[d] - individual.position[d];
        direction = diff === 0 ? (rng.random() < 0.5 ? -1 : 1) : Math.sign(diff);
      } else {
        direction = rng.random() < 0.5 ? -1 : 1;
      }

      // Controlled rotation magnitude
      const step = baseStep * (0.3 + rng.random() * 0.7);
      individual.theta[d] += direction * step;

      // normalize theta into [0, 2PI)
      individual.theta[d] = ((individual.theta[d] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

      // Collapse to position using cos^2(theta) mapping -> probability-like
      const q = this.thetaToQstate(individual.theta[d]);
      const prob = Math.min(1, Math.max(0, q.alpha * q.alpha));

      if (globalBestPosition) {
        // move position towards best based on prob scaled by progress
        individual.position[d] = individual.position[d] * (1 - prob) + globalBestPosition[d] * prob;
      } else {
        // small deterministic perturbation
        const perturb = (rng.random() - 0.5) * 0.02;
        individual.position[d] = Math.min(1, Math.max(0, individual.position[d] + perturb));
      }
    }
  }

  // Quantum tunneling to escape local optima (deterministic via rng)
  quantumTunnel(individual, rng, tunnelProbability = 0.02) {
    if (rng.random() < tunnelProbability) {
      const dim = rng.int(individual.position.length);
      individual.position[dim] = Math.min(1, Math.max(0, individual.position[dim] + (rng.random() - 0.5) * 0.2));
      individual.theta[dim] = (individual.theta[dim] + rng.random() * (Math.PI / 2)) % (Math.PI * 2);
    }
  }

  // Async-friendly training wrapper that supports sync or Promise-based model.train
  // Accepts inputs (array of features) and targets (array of arrays/values)
  async trainModelAsync(model, inputs, targets, epochs = 3, yieldEvery = 1) {
    // If model.train returns a Promise, await it directly
    if (typeof model.train === 'function') {
      try {
        const ret = model.train(inputs, targets, epochs);
        if (ret && typeof ret.then === 'function') {
          await ret;
        } else {
          // assume synchronous; break into single-epoch steps to yield
          for (let e = 0; e < epochs; e++) {
            try {
              model.train(inputs, targets, 1);
            } catch (err) {
              // if single-epoch call fails, try calling without epoch argument
              try { model.train(inputs, targets); } catch (err2) { break; }
            }
            if ((e + 1) % yieldEvery === 0) await new Promise(r => setTimeout(r, 0));
          }
        }
      } catch (err) {
        // training failed, don't throw — just return so tuning can continue
        console.warn('QuantumOptimizer.trainModelAsync: training failed', err);
      }
    } else if (typeof model.fit === 'function') {
      // some libraries use fit which may accept epochs
      try {
        const ret = model.fit(inputs, targets, { epochs });
        if (ret && typeof ret.then === 'function') await ret;
      } catch (err) {
        console.warn('QuantumOptimizer.trainModelAsync: model.fit failed', err);
      }
    } else {
      // No training API detectable; just yield once to avoid blocking
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Evaluate model on validation set (supports async or sync predict)
  // Returns fitness (accuracy by default). validationSet: [{features,label},...]
  async evaluateModelAsync(model, validationSet, yieldEvery = 64) {
    let correct = 0;
    for (let i = 0; i < validationSet.length; i++) {
      const input = validationSet[i].features;
      const label = validationSet[i].label;
      try {
        const pred = model.predict ? model.predict(input) : (typeof model.forward === 'function' ? model.forward(input) : null);
        const resolved = (pred && typeof pred.then === 'function') ? await pred : pred;
        const predVal = Array.isArray(resolved) ? resolved[0] : resolved;
        const predictedLabel = predVal >= 0.5 ? 1 : 0;
        if (predictedLabel === label) correct++;
      } catch (err) {
        // prediction failed for this sample; treat as incorrect
      }

      if ((i + 1) % yieldEvery === 0) await new Promise(r => setTimeout(r, 0));
    }
    return validationSet.length > 0 ? correct / validationSet.length : 0;
  }

  // Main async tuning entrypoint
  // modelFactory: () => new Model() - must produce a fresh model instance (same architecture)
  // trainingSet / validationSet: arrays of {features, label}
  // hyperparamRanges: { paramName: [min,max], ... }
  // options: { epochsPerCandidate, maxIterations, populationSize, seed, onProgress, yieldEvery, tunnelProbability }
  async tuneHyperparametersAsync(modelFactory, trainingSet, validationSet, hyperparamRanges, options = {}) {
    const epochsPerCandidate = options.epochsPerCandidate || 3;
    const maxIter = options.maxIterations || this.maxIterations;
    const popSize = options.populationSize || this.populationSize;
    const seed = (options.seed != null) ? (options.seed >>> 0) : this.seed;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
    const yieldEvery = options.yieldEvery || 1; // yield from training every N epochs
    const evalYieldEvery = options.evalYieldEvery || 64; // yield during evaluation
    const tunnelProb = (typeof options.tunnelProbability === 'number') ? options.tunnelProbability : 0.02;

    // Prepare RNG and bounds
    const masterRng = this.seededRng(seed);
    const keys = Object.keys(hyperparamRanges);
    const bounds = keys.map(k => hyperparamRanges[k]);
    const dim = keys.length;

    // Initialize population
    this.populationSize = popSize;
    this.maxIterations = maxIter;
    this.initializePopulation(dim, masterRng);

    // Helper to create deterministic per-individual RNG from master (advance a consistent number of steps)
    const createIndividualRng = (index) => {
      // Clone the master seed but advance by index steps deterministically
      // We'll generate a seed integer by running masterRng a few times
      const forkSeedRng = this.seededRng(seed);
      // Advance and mix to produce a new 32-bit seed based on index
      let s = 2166136261 >>> 0;
      // incorporate index and some master randomness
      s = (s ^ index) >>> 0;
      for (let i = 0; i < 8; i++) s = (s ^ Math.floor(forkSeedRng.random() * 0xFFFFFFFF)) >>> 0;
      return this.seededRng(s);
    };

    // Evaluate initial population and iterate
    for (let iter = 0; iter < maxIter; iter++) {
      // Evaluate each individual sequentially (deterministic ordering)
      for (let i = 0; i < this.population.length; i++) {
        const individual = this.population[i];
        const individualRng = createIndividualRng(i + iter * this.population.length);

        // Map to hyperparams
        const params = this.mapPositionToParams(individual.position, keys, bounds);

        // Create fresh model instance
        const model = modelFactory();

        // Prefer setParams if available, otherwise assign properties
        if (typeof model.setParams === 'function') {
          try { model.setParams(params); } catch (err) { /* fallback to assigning properties */ }
        } else {
          for (const k of keys) {
            try {
              // Allow nested assignment if model expects different names
              model[k] = params[k];
            } catch (err) { /* ignore */ }
          }
        }

        // Prepare inputs/targets format expected by model.train
        const inputs = trainingSet.map(d => d.features);
        const targets = trainingSet.map(d => [d.label]);

        // Train briefly (async-friendly)
        await this.trainModelAsync(model, inputs, targets, epochsPerCandidate, yieldEvery);

        // Evaluate on validation set
        const fitness = await this.evaluateModelAsync(model, validationSet, evalYieldEvery);
        individual.fitness = fitness;

        // Track best
        if (fitness > this.bestFitness) {
          this.bestFitness = fitness;
          this.bestSolution = {
            position: individual.position.slice(),
            params: this.mapPositionToParams(individual.position, keys, bounds)
          };
        }

        // Non-blocking: yield occasionally between candidates
        if ((i + 1) % Math.max(1, Math.floor(this.populationSize / 4)) === 0) await new Promise(r => setTimeout(r, 0));
      }

      // Record iteration stats
      const avgFitness = this.population.reduce((s, ind) => s + (ind.fitness || 0), 0) / Math.max(1, this.population.length);
      this.history.push({ iteration: iter, bestFitness: this.bestFitness, avgFitness });

      // Progress callback (safe call)
      try {
        onProgress({ iteration: iter, bestFitness: this.bestFitness, bestParams: this.bestSolution ? this.bestSolution.params : null, avgFitness, population: this.population.map(p => ({ position: p.position.slice(), fitness: p.fitness })) });
      } catch (err) {
        // swallow errors from callback
        console.warn('QuantumOptimizer.onProgress threw', err);
      }

      // Apply quantum operators: rotate towards best and allow tunneling
      const globalBestPos = this.bestSolution ? this.bestSolution.position : null;
      for (let i = 0; i < this.population.length; i++) {
        const ind = this.population[i];
        const indRng = createIndividualRng(i + iter * this.population.length + 12345);
        this.quantumRotate(ind, globalBestPos, iter, maxIter, indRng);
        this.quantumTunnel(ind, indRng, tunnelProb);
      }

      // Simple convergence check: if recent best didn't improve
      if (this.history.length > 8) {
        const recent = this.history.slice(-8).map(h => h.bestFitness);
        const improvement = Math.max(...recent) - Math.min(...recent);
        if (improvement < 1e-9) break;
      }

      // yield to avoid blocking long loops
      await new Promise(r => setTimeout(r, 0));
    }

    return {
      solution: this.bestSolution ? this.bestSolution.params : null,
      fitness: this.bestFitness,
      history: this.history
    };
  }
}

// Export for Node/CommonJS and browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QuantumOptimizer;
} else if (typeof window !== 'undefined') {
  window.QuantumOptimizer = QuantumOptimizer;
}
