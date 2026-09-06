import { logger } from '../../utils/logger.js';
import { checkRateLimit } from '../../utils/rateLimiter.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001'; // fast + cheap, good enough for chat replies
const MAX_TOKENS = 200;

// Per-channel rolling context so replies feel like a conversation, not one-shot Q&A.
// Capped hard so memory/token usage can't grow unbounded.
const CONTEXT_LIMIT = 6; // messages of history kept per channel
const channelHistory = new Map(); // channelId -> [{role, content}]

const AI_RATE_LIMIT_ATTEMPTS = 8;
const AI_RATE_LIMIT_WINDOW_MS = 60000; // per-guild cap so one active server can't burn the whole API budget

const BRAINROT_SYSTEM_PROMPT = `You are the "brainrot" chat personality of a Discord bot: chaotic Gen-Z energy, sarcastic,
loves to playfully roast whoever's talking, unfiltered but not actually cruel. Talk in extremely online slang
("no cap", "fr fr", "bussin", "mid", "skill issue", "ngl", "lowkey/highkey", "deadass", "💀😭🔥"), lowercase-heavy,
minimal punctuation. Keep replies short (1-2 sentences). Light swearing is fine and fits the vibe (e.g. "bro wtf",
"that's ass") but never slurs, and never actually demean someone for a real trait (appearance, race, gender,
etc.) — the roasting stays about the joke/vibe, not the person. Never break character or mention being an AI
model. Never produce anything sexual or targeting real public figures. If someone genuinely needs help with
something (homework, tech support, something they're struggling with), give them the real answer underneath
the slang instead of just roasting them and leaving them with nothing.`;

function pushHistory(channelId, role, content) {
  const history = channelHistory.get(channelId) || [];
  history.push({ role, content });
  while (history.length > CONTEXT_LIMIT) {
    history.shift();
  }
  channelHistory.set(channelId, history);
}

/**
 * Generates a brainrot-style AI reply for a message.
 * Returns the reply string, or null if the call was skipped/rate-limited/failed
 * (caller should just not send anything in that case, not throw).
 */
export async function generateAIReply(client, message) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.debug('ANTHROPIC_API_KEY not set, skipping AI reply');
    return null;
  }

  const rateLimitKey = `ai-chat:${message.guild.id}`;
  const canRespond = await checkRateLimit(rateLimitKey, AI_RATE_LIMIT_ATTEMPTS, AI_RATE_LIMIT_WINDOW_MS);
  if (!canRespond) {
    logger.debug(`AI chat rate limited for guild ${message.guild.id}`);
    return null;
  }

  const channelId = message.channel.id;
  pushHistory(channelId, 'user', message.content.slice(0, 500)); // guard against huge pastes

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: BRAINROT_SYSTEM_PROMPT,
        messages: channelHistory.get(channelId),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      logger.warn(`Anthropic API error ${response.status}: ${errorBody}`);
      return null;
    }

    const data = await response.json();
    const textBlock = data.content?.find((block) => block.type === 'text');
    const reply = textBlock?.text?.trim();

    if (!reply) {
      return null;
    }

    pushHistory(channelId, 'assistant', reply);
    return reply;
  } catch (error) {
    logger.error('Error calling Anthropic API for AI chat reply:', error);
    return null;
  }
}
