import { db } from "@workspace/db";
import { knowledgeBaseTable } from "@workspace/db/schema";

const newEntries = [
  // ── Unsupervised Machine Learning ─────────────────────────────────────────
  {
    question: "What is unsupervised machine learning?",
    answer: "Unsupervised machine learning is a type of ML where the algorithm learns patterns from unlabelled data — there are no predefined outputs or correct answers. The model discovers hidden structure on its own. Common tasks include clustering (grouping similar data), dimensionality reduction (compressing data), and anomaly detection. Examples: K-Means, DBSCAN, PCA, Autoencoders.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is clustering in machine learning?",
    answer: "Clustering is an unsupervised ML task that groups data points so that items in the same cluster are more similar to each other than to those in other clusters. No labels are needed — the algorithm finds natural groupings. Applications include customer segmentation, document grouping, and image segmentation. Popular algorithms: K-Means, DBSCAN, Hierarchical Clustering.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is K-Means clustering?",
    answer: "K-Means is an unsupervised clustering algorithm that partitions data into K clusters. It works by: (1) Randomly placing K centroids, (2) Assigning each data point to the nearest centroid, (3) Recalculating centroids as the mean of their cluster, (4) Repeating until centroids stop moving. Time complexity: O(n·K·i·d) where i=iterations, d=dimensions. Limitation: requires K to be specified in advance.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is DBSCAN?",
    answer: "DBSCAN (Density-Based Spatial Clustering of Applications with Noise) is an unsupervised clustering algorithm that groups points that are close together and marks outliers as noise. Unlike K-Means, it does not require specifying the number of clusters. It uses two parameters: eps (neighbourhood radius) and min_samples (minimum points in a neighbourhood). Great for detecting arbitrarily shaped clusters and anomalies.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is hierarchical clustering?",
    answer: "Hierarchical clustering builds a tree of clusters (a dendrogram) without requiring a pre-specified number of clusters. Two approaches: Agglomerative (bottom-up — each point starts as its own cluster, clusters merge until one remains) and Divisive (top-down — starts with one cluster, splits recursively). You cut the dendrogram at the desired level to get K clusters. Useful for visualising data structure.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is Principal Component Analysis (PCA)?",
    answer: "PCA is an unsupervised dimensionality reduction technique that transforms high-dimensional data into fewer dimensions (principal components) while retaining maximum variance. It works by finding the directions (eigenvectors) of greatest variance in the data. Used to speed up training, remove noise, and visualise high-dimensional data. Example: compressing 100-feature data to 2D for plotting.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is dimensionality reduction?",
    answer: "Dimensionality reduction is the process of reducing the number of input features (dimensions) in a dataset while preserving important information. It combats the 'curse of dimensionality' — where too many features slow training and cause overfitting. Techniques: PCA (linear), t-SNE (non-linear visualisation), UMAP, and Autoencoders (deep learning-based). Essential in image and text processing.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is t-SNE?",
    answer: "t-SNE (t-Distributed Stochastic Neighbour Embedding) is a non-linear dimensionality reduction technique used mainly for visualising high-dimensional data in 2D or 3D. It models similarity between points as probabilities and minimises the difference between high-dimensional and low-dimensional distributions using KL divergence. Very useful for exploring clusters in datasets like MNIST or word embeddings, but not suited for general dimensionality reduction.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is an autoencoder?",
    answer: "An autoencoder is an unsupervised neural network that learns to compress (encode) input data into a smaller latent representation and then reconstruct (decode) it back. Architecture: Input → Encoder → Bottleneck (latent space) → Decoder → Output. Trained to minimise reconstruction error. Used for dimensionality reduction, anomaly detection, image denoising, and generative modelling (Variational Autoencoders).",
    category: "ML-Unsupervised",
  },
  {
    question: "What is anomaly detection in machine learning?",
    answer: "Anomaly detection (outlier detection) identifies data points that deviate significantly from normal patterns. It is often unsupervised since anomalies are rare and unlabelled. Techniques: Isolation Forest, One-Class SVM, Autoencoders, DBSCAN. Applications: fraud detection, network intrusion detection, manufacturing defect detection, medical diagnosis. The model learns 'normal' and flags deviations.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is association rule learning?",
    answer: "Association rule learning discovers interesting relationships (rules) between variables in large datasets. Classic example: 'Customers who buy bread and butter also buy milk' (market basket analysis). Key metrics: Support (frequency of item set), Confidence (accuracy of rule), Lift (strength of association). Most famous algorithm: Apriori. Used in recommendation systems, retail analytics, and medical diagnosis.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is a Generative Adversarial Network (GAN)?",
    answer: "A GAN is an unsupervised deep learning model with two competing networks: a Generator (creates fake data from noise) and a Discriminator (classifies data as real or fake). They train adversarially — the generator tries to fool the discriminator, and the discriminator tries to catch fakes. Result: the generator learns to produce highly realistic data. Used for image synthesis, video generation, data augmentation, and deepfakes.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is the difference between supervised and unsupervised learning?",
    answer: "Supervised learning trains on labelled data (input-output pairs) — the model learns to map inputs to known outputs. Examples: classification, regression. Unsupervised learning trains on unlabelled data — the model finds hidden patterns on its own. Examples: clustering, dimensionality reduction. Supervised learning requires human annotation effort but produces more targeted models; unsupervised is useful when labels are unavailable or expensive.",
    category: "ML-Unsupervised",
  },
  {
    question: "What is semi-supervised machine learning?",
    answer: "Semi-supervised learning uses a small amount of labelled data combined with a large amount of unlabelled data for training. It sits between supervised and unsupervised learning. The model uses the structure in unlabelled data to improve its learning. Techniques include self-training, label propagation, and consistency regularisation. Used when labelling is expensive (e.g. medical imaging, speech recognition).",
    category: "ML-Unsupervised",
  },

  // ── Supervised Machine Learning ────────────────────────────────────────────
  {
    question: "What is supervised machine learning?",
    answer: "Supervised machine learning trains models on labelled datasets — each training example has an input and a known correct output. The model learns the mapping from inputs to outputs and can then predict outputs for new, unseen inputs. Two main tasks: Classification (predicting a category, e.g. spam/not spam) and Regression (predicting a continuous value, e.g. house price). Examples: Decision Trees, SVM, Logistic Regression, Neural Networks.",
    category: "ML-Supervised",
  },
  {
    question: "What is classification in machine learning?",
    answer: "Classification is a supervised ML task where the model predicts which category (class) an input belongs to. Output is a discrete label. Examples: email spam detection (spam/not spam), image recognition (cat/dog), disease diagnosis (positive/negative). Algorithms: Logistic Regression, Decision Trees, Random Forest, SVM, KNN, and Neural Networks. Evaluated using accuracy, precision, recall, and F1-score.",
    category: "ML-Supervised",
  },
  {
    question: "What is regression in machine learning?",
    answer: "Regression is a supervised ML task where the model predicts a continuous numerical value. Examples: house price prediction, stock price forecasting, temperature prediction. Common algorithms: Linear Regression (straight line fit), Polynomial Regression, Ridge/Lasso Regression, and Neural Networks. Evaluated using Mean Squared Error (MSE), Root MSE (RMSE), and R-squared.",
    category: "ML-Supervised",
  },
  {
    question: "What is a Decision Tree?",
    answer: "A Decision Tree is a supervised ML algorithm that makes predictions by splitting data into branches based on feature values, forming a tree structure. Each internal node tests a feature, each branch represents an outcome, and each leaf is a prediction. Easy to interpret and visualise. Prone to overfitting on small datasets — solved by pruning or using Random Forests (ensembles of trees).",
    category: "ML-Supervised",
  },
  {
    question: "What is a Random Forest?",
    answer: "Random Forest is an ensemble supervised ML algorithm that builds multiple Decision Trees on random subsets of the data and averages their predictions (bagging). It reduces overfitting compared to a single tree and works well on both classification and regression tasks. Key hyperparameters: number of trees, max depth, min samples per leaf. Generally achieves high accuracy with minimal tuning.",
    category: "ML-Supervised",
  },
  {
    question: "What is Support Vector Machine (SVM)?",
    answer: "SVM is a supervised ML algorithm that finds the optimal hyperplane that best separates classes with the maximum margin. Data points closest to the hyperplane are called support vectors. SVMs work well for high-dimensional data and can handle non-linear separation using the kernel trick (RBF, polynomial kernels). Used for text classification, image recognition, and bioinformatics.",
    category: "ML-Supervised",
  },
  {
    question: "What is K-Nearest Neighbours (KNN)?",
    answer: "KNN is a simple supervised ML algorithm that classifies a new point based on the K closest training points (neighbours) — predicting the majority class among them (for classification) or their average (for regression). No training phase — it is lazy learning. Distance metrics: Euclidean, Manhattan. Sensitive to feature scaling and the choice of K. Computationally expensive at prediction time for large datasets.",
    category: "ML-Supervised",
  },
  {
    question: "What is logistic regression?",
    answer: "Logistic regression is a supervised classification algorithm that models the probability of a binary outcome (0 or 1) using the logistic (sigmoid) function. Despite the name, it is a classification algorithm, not regression. Output is a probability (0-1) that is thresholded to produce a class label. Used for spam detection, disease prediction, and sentiment analysis. Easily interpretable and fast to train.",
    category: "ML-Supervised",
  },
  {
    question: "What is gradient boosting?",
    answer: "Gradient boosting is an ensemble supervised ML technique that builds models sequentially — each new model corrects the errors of the previous one by fitting the residuals. Popular implementations: XGBoost, LightGBM, CatBoost. It is one of the most powerful algorithms for structured/tabular data and wins many ML competitions. Hyperparameters include learning rate, number of estimators, and max depth.",
    category: "ML-Supervised",
  },
  {
    question: "What is overfitting in machine learning?",
    answer: "Overfitting occurs when an ML model learns the training data too well — including noise and random fluctuations — and performs poorly on new, unseen data. Signs: very high training accuracy but low validation/test accuracy (high variance). Solutions: more training data, regularisation (L1/L2), dropout (neural networks), cross-validation, pruning (trees), and simpler models.",
    category: "ML-Supervised",
  },
  {
    question: "What is underfitting in machine learning?",
    answer: "Underfitting occurs when an ML model is too simple to capture the underlying pattern in the data, resulting in poor performance on both training and test data (high bias). Causes: model is too simple, too few features, too much regularisation. Solutions: use a more complex model, add more features, reduce regularisation, train longer, or use feature engineering.",
    category: "ML-Supervised",
  },
  {
    question: "What is cross-validation?",
    answer: "Cross-validation is a model evaluation technique that assesses how well a model generalises to unseen data. K-Fold CV splits data into K folds, trains on K-1 folds, tests on the remaining fold, and repeats K times, averaging results. Reduces evaluation variance compared to a single train/test split. Common values: K=5 or K=10. Stratified K-Fold preserves class proportions in each fold.",
    category: "ML-Supervised",
  },
  {
    question: "What is a loss function in machine learning?",
    answer: "A loss function (cost function) measures how far a model's predictions are from the true values. The training process minimises this function. Common loss functions: MSE (Mean Squared Error) for regression, Cross-Entropy (Log Loss) for classification, Hinge Loss for SVM. The choice of loss function depends on the task and determines what the model optimises for.",
    category: "ML-Supervised",
  },
  {
    question: "What is backpropagation?",
    answer: "Backpropagation is the algorithm used to train neural networks. It calculates the gradient of the loss function with respect to each weight by applying the chain rule of calculus backwards from the output layer to the input layer. These gradients tell the optimiser (e.g. Adam, SGD) how to adjust each weight to reduce the loss. It is the core of modern deep learning training.",
    category: "AI",
  },
  {
    question: "What is reinforcement learning?",
    answer: "Reinforcement learning (RL) is an ML paradigm where an agent learns to make decisions by interacting with an environment. The agent takes actions, receives rewards or penalties, and learns a policy that maximises cumulative reward. Key concepts: State, Action, Reward, Policy, Value Function, Q-Learning. Used in game playing (AlphaGo), robotics, autonomous driving, and recommendation systems.",
    category: "AI",
  },
  {
    question: "What is feature engineering?",
    answer: "Feature engineering is the process of using domain knowledge to create, select, or transform input variables (features) to improve model performance. Techniques: normalisation/standardisation, one-hot encoding, polynomial features, log transforms, interaction terms, and embedding creation. Good feature engineering can dramatically improve model accuracy and is often more impactful than choosing a different algorithm.",
    category: "ML-Supervised",
  },
  {
    question: "What is transfer learning?",
    answer: "Transfer learning is an ML technique where a model trained on one task is reused as the starting point for a different but related task. Instead of training from scratch, the pre-trained model's learned features are fine-tuned on new data. Examples: using GPT (trained on text) for sentiment analysis, or ResNet (trained on ImageNet) for medical imaging. Greatly reduces training time and data requirements.",
    category: "AI",
  },

  // ── Machine Language & Low-Level Computing ─────────────────────────────────
  {
    question: "What is machine language?",
    answer: "Machine language (machine code) is the lowest-level programming language consisting of binary instructions (0s and 1s) that the CPU executes directly. Every instruction — add, move, jump — is encoded as a sequence of bits. Machine language is processor-specific (x86, ARM, RISC-V have different instruction sets). Programmers rarely write machine language directly; compilers translate high-level languages into it.",
    category: "Computer Science",
  },
  {
    question: "What is assembly language?",
    answer: "Assembly language is a low-level programming language that uses human-readable mnemonics (MOV, ADD, JMP) to represent machine code instructions. Each assembly instruction maps almost 1:1 to a machine code instruction. An assembler converts assembly into machine code. Assembly is used in embedded systems, OS kernels, device drivers, and performance-critical code where direct hardware control is needed.",
    category: "Computer Science",
  },
  {
    question: "What is binary code?",
    answer: "Binary code represents data and instructions using only two symbols: 0 and 1 (bits). Computers use binary because transistors have two states (on/off). A byte is 8 bits (e.g. 01000001 = ASCII 'A'). All data — text, images, video, programs — is ultimately stored and processed as binary. Binary arithmetic uses base-2, where each position represents a power of 2.",
    category: "Computer Science",
  },
  {
    question: "What is bytecode?",
    answer: "Bytecode is an intermediate representation of a program that is more abstract than machine code but lower-level than source code. It is executed by a virtual machine (VM) rather than directly by hardware. Java compiles to JVM bytecode (.class files), Python compiles to CPython bytecode (.pyc files). Bytecode enables platform independence — the same bytecode runs on any OS with the appropriate VM.",
    category: "Programming",
  },
  {
    question: "What is the difference between high-level and low-level programming languages?",
    answer: "High-level languages (Python, Java, C++) are close to human language, portable across hardware, and abstracted from hardware details — they are easier to write but need compilation/interpretation. Low-level languages (Assembly, Machine Code) are close to hardware, processor-specific, and give direct control over memory and CPU — they are harder to write but execute very fast. C is considered mid-level as it bridges both worlds.",
    category: "Programming",
  },
  {
    question: "What is an instruction set architecture (ISA)?",
    answer: "An Instruction Set Architecture (ISA) is the set of binary instructions that a CPU understands — it defines the interface between software and hardware. Common ISAs: x86/x86-64 (Intel/AMD PCs), ARM (mobile phones, Apple Silicon), RISC-V (open-source). The ISA specifies available registers, data types, memory addressing modes, and the binary encoding of each instruction.",
    category: "Computer Science",
  },
  {
    question: "What is a register in computer architecture?",
    answer: "A register is a small, extremely fast storage location inside the CPU used to hold data that the processor is currently working on. Registers are much faster than RAM but very limited in number and size (typically 8–64 bytes each). Types: General-purpose registers (hold data/addresses), Program Counter (holds next instruction address), Stack Pointer, and Flag registers (hold status bits).",
    category: "Computer Science",
  },

  // ── Additional AI / Deep Learning ──────────────────────────────────────────
  {
    question: "What is a convolutional neural network (CNN)?",
    answer: "A CNN is a deep learning model designed for processing grid-structured data like images. It uses convolutional layers that apply learned filters (kernels) to detect local features (edges, textures, shapes). Architecture: Convolutional → Pooling → Fully Connected layers. CNNs achieve state-of-the-art performance in image classification, object detection, and medical imaging. Famous architectures: LeNet, AlexNet, VGG, ResNet.",
    category: "AI",
  },
  {
    question: "What is a recurrent neural network (RNN)?",
    answer: "An RNN is a neural network designed for sequential data (text, speech, time series). It has recurrent connections that pass the hidden state from one step to the next, giving the network 'memory'. Suffers from vanishing gradients for long sequences. Solved by LSTM (Long Short-Term Memory) and GRU (Gated Recurrent Unit). Used in language modelling, machine translation, and speech recognition.",
    category: "AI",
  },
  {
    question: "What is a transformer model?",
    answer: "The Transformer is a deep learning architecture introduced in 'Attention Is All You Need' (2017) that uses self-attention mechanisms instead of recurrence. It processes all tokens in parallel, making it much faster to train than RNNs. It is the foundation of all modern large language models (GPT, BERT, T5, LLaMA). Self-attention lets the model weigh the importance of every word relative to every other word in the sequence.",
    category: "AI",
  },
  {
    question: "What is gradient descent?",
    answer: "Gradient descent is an optimisation algorithm used to minimise the loss function in machine learning by iteratively moving in the direction of the steepest descent (negative gradient). Variants: Batch GD (uses all data), Stochastic GD (uses one sample), Mini-Batch GD (uses small batches). Improved optimisers: Momentum, RMSProp, Adam. Learning rate controls step size — too large overshoots, too small converges slowly.",
    category: "AI",
  },
  {
    question: "What is dropout in neural networks?",
    answer: "Dropout is a regularisation technique for neural networks that randomly 'drops' (sets to zero) a fraction of neurons during each training step. This prevents neurons from co-adapting too much and forces the network to learn more robust, distributed representations. At inference time, all neurons are active but their weights are scaled. Typical dropout rates: 0.2–0.5. Very effective for preventing overfitting in large networks.",
    category: "AI",
  },
  {
    question: "What is batch normalisation?",
    answer: "Batch Normalisation (BatchNorm) is a technique that normalises the inputs of each layer to have zero mean and unit variance within each mini-batch during training. This stabilises and accelerates training, allows higher learning rates, and acts as a mild regulariser. It is applied between a layer's linear transformation and activation function. Essential in training deep networks like ResNet and Transformers.",
    category: "AI",
  },
  {
    question: "What is the attention mechanism in AI?",
    answer: "Attention is a mechanism that allows a model to focus on the most relevant parts of the input when producing each output. In sequence-to-sequence tasks, instead of compressing the entire input into one vector, attention computes a weighted sum of all input representations. Self-attention (used in Transformers) computes attention between all positions within the same sequence. It is the key innovation behind GPT, BERT, and all modern LLMs.",
    category: "AI",
  },
  {
    question: "What is a large language model (LLM)?",
    answer: "A Large Language Model (LLM) is a deep learning model with billions of parameters trained on massive text corpora to understand and generate human language. Built on the Transformer architecture, LLMs learn language patterns, facts, and reasoning through next-token prediction. Examples: GPT-4, Gemini, LLaMA, Claude. They are used for chatbots, code generation, translation, summarisation, and question answering.",
    category: "AI",
  },
  {
    question: "What is prompt engineering?",
    answer: "Prompt engineering is the practice of designing and optimising text inputs (prompts) to elicit the best responses from large language models. Techniques include: zero-shot prompting (direct instruction), few-shot prompting (including examples), chain-of-thought (asking the model to reason step by step), role prompting (telling the model to act as an expert), and retrieval-augmented generation (RAG). Critical for getting accurate, reliable LLM outputs.",
    category: "AI",
  },
  {
    question: "What is Retrieval-Augmented Generation (RAG)?",
    answer: "RAG is an AI technique that enhances LLM responses by first retrieving relevant documents from a knowledge base and then feeding them as context to the language model. It combines the power of information retrieval (TF-IDF, vector search) with generation (LLMs). Benefits: reduces hallucinations, allows models to access up-to-date information, and grounds answers in specific knowledge sources. Used in chatbots, customer support, and educational AI systems.",
    category: "AI",
  },
];

async function addKnowledge() {
  console.log("Adding new knowledge base entries...");

  const existing = await db.select().from(knowledgeBaseTable);
  const existingQuestions = new Set(existing.map((e) => e.question.toLowerCase().trim()));

  let added = 0;
  let skipped = 0;

  for (const entry of newEntries) {
    if (existingQuestions.has(entry.question.toLowerCase().trim())) {
      skipped++;
      continue;
    }
    await db.insert(knowledgeBaseTable).values(entry);
    console.log(`  ✓ Added: ${entry.question}`);
    added++;
  }

  console.log(`\nDone. Added ${added} new entries, skipped ${skipped} duplicates.`);
  console.log(`Total knowledge base size: ${existing.length + added} entries.`);
}

addKnowledge()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  });
