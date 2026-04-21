import { pipeline } from '@xenova/transformers';

let embedder = null;

/**
 * Initialize the sentence transformer model (lazy-loaded, cached)
 * Uses all-MiniLM-L6-v2 for 384-dimensional embeddings
 */
async function getEmbedder() {
    if (!embedder) {
        console.log('🔄 Loading embedding model (all-MiniLM-L6-v2)...');
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Embedding model loaded');
    }
    return embedder;
}

/**
 * Generate a 384-dim embedding from text
 * @param {string} text - interests + description combined
 * @returns {number[]} 384-dimensional float array
 */
export async function generateEmbedding(text) {
    const model = await getEmbedder();
    const output = await model(text, { pooling: 'mean', normalize: true });
    // output.data is a Float32Array, convert to regular array
    return Array.from(output.data);
}

/**
 * Compute cosine similarity between two vectors
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Pre-warm the model on server startup (optional)
 */
export async function warmUpEmbeddingModel() {
    try {
        await getEmbedder();
    } catch (err) {
        console.warn('⚠️ Failed to pre-warm embedding model:', err.message);
    }
}
