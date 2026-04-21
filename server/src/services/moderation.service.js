import { pipeline } from '@xenova/transformers';

let sentimentAnalyzer = null;
let toxicityClassifier = null;

/**
 * Lazy-load sentiment analysis model (Cardiff NLP)
 */
async function getSentimentAnalyzer() {
    if (!sentimentAnalyzer) {
        console.log('🔄 Loading sentiment model...');
        sentimentAnalyzer = await pipeline(
            'sentiment-analysis',
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        );
        console.log('✅ Sentiment model loaded');
    }
    return sentimentAnalyzer;
}

/**
 * Lazy-load toxicity classification model (Unitary/toxic-bert)
 */
async function getToxicityClassifier() {
    if (!toxicityClassifier) {
        console.log('🔄 Loading toxicity model...');
        toxicityClassifier = await pipeline(
            'text-classification',
            'Xenova/toxic-bert'
        );
        console.log('✅ Toxicity model loaded');
    }
    return toxicityClassifier;
}

/**
 * Analyze a chat message for sentiment and toxicity
 * @param {string} text - the chat message
 * @returns {{ sentiment: string, sentimentScore: number, toxicity: string, toxicityScore: number, isToxic: boolean, isNegative: boolean }}
 */
export async function analyzeMessage(text) {
    if (!text || text.trim().length === 0) {
        return {
            sentiment: 'NEUTRAL',
            sentimentScore: 0.5,
            toxicity: 'non-toxic',
            toxicityScore: 0,
            isToxic: false,
            isNegative: false,
        };
    }

    // Run both models in parallel
    const [sentimentModel, toxicityModel] = await Promise.all([
        getSentimentAnalyzer(),
        getToxicityClassifier(),
    ]);

    const [sentimentResult, toxicityResult] = await Promise.all([
        sentimentModel(text),
        toxicityModel(text),
    ]);

    const sentiment = sentimentResult[0];
    const toxicity = toxicityResult[0];

    // Toxicity threshold: score > 0.7 = toxic
    const isToxic = toxicity.label === 'toxic' && toxicity.score > 0.7;

    // Negative sentiment with high confidence
    const isNegative = sentiment.label === 'NEGATIVE' && sentiment.score > 0.8;

    return {
        sentiment: sentiment.label,
        sentimentScore: sentiment.score,
        toxicity: toxicity.label,
        toxicityScore: toxicity.score,
        isToxic,
        isNegative,
    };
}

/**
 * Pre-warm models on server startup
 */
export async function warmUpModerationModels() {
    try {
        await Promise.all([getSentimentAnalyzer(), getToxicityClassifier()]);
    } catch (err) {
        console.warn('⚠️ Failed to pre-warm moderation models:', err.message);
    }
}
