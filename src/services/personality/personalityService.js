import { logger } from '../../utils/logger.js';

/**
 * Personality Service - Manages bot personality traits and responses
 * 
 * Each guild can have its own personality configuration.
 * The personality determines how the bot responds to messages in conversation.
 */

const DEFAULT_PERSONALITY = {
  name: 'Neutral',
  description: 'Default neutral personality',
  traits: [],
  responseStyle: 'neutral',
  enabled: true,
};

const PERSONALITY_PRESETS = {
  neutral: {
    name: 'Neutral',
    description: 'Calm and helpful, straightforward responses',
    traits: ['helpful', 'calm', 'professional'],
    responseStyle: 'neutral',
    triggerPatterns: ['@bot', 'bot', 'hey'],
    responseChance: 0.5, // 50% chance to respond to casual mentions
    enabled: true,
  },
  friendly: {
    name: 'Friendly',
    description: 'Warm, welcoming, uses emojis and casual language',
    traits: ['warm', 'welcoming', 'humorous', 'casual'],
    responseStyle: 'friendly',
    triggerPatterns: ['@bot', 'hey', 'yo', 'sup'],
    responseChance: 0.7,
    enabled: true,
  },
  sarcastic: {
    name: 'Sarcastic',
    description: 'Witty, sarcastic responses with dry humor',
    traits: ['witty', 'sarcastic', 'humorous', 'clever'],
    responseStyle: 'sarcastic',
    triggerPatterns: ['@bot', 'bot', 'hey'],
    responseChance: 0.6,
    enabled: true,
  },
  professional: {
    name: 'Professional',
    description: 'Business-like, formal, detail-oriented',
    traits: ['formal', 'professional', 'thorough', 'methodical'],
    responseStyle: 'professional',
    triggerPatterns: ['@bot', 'bot'],
    responseChance: 0.8, // More likely to respond to direct addresses
    enabled: true,
  },
  nerdy: {
    name: 'Nerdy',
    description: 'References pop culture, tech, uses lots of references',
    traits: ['nerdy', 'geeky', 'clever', 'humorous'],
    responseStyle: 'nerdy',
    triggerPatterns: ['@bot', 'hey', 'bot'],
    responseChance: 0.65,
    enabled: true,
  },
};

const RESPONSE_TEMPLATES = {
  neutral: {
    greeting: ['Hey there!', 'Hello!', 'What\'s up?'],
    acknowledgment: ['Got it.', 'Sure thing.', 'I hear you.'],
    unsure: ['Not sure about that one.', 'I don\'t have a good answer for that.'],
    help: ['How can I help?', 'What do you need?', 'I\'m here to help.'],
    humor: ['Ha, that\'s funny.', 'I see what you did there.'],
  },
  friendly: {
    greeting: ['Hey! 👋', 'Yo! What\'s good?', 'Heyyy! 💙', 'Sup friend!'],
    acknowledgment: ['Got it! 😊', 'You got it! 👍', 'For sure!', 'Yep yep!'],
    unsure: ['Hmm, that\'s a tricky one! 🤔', 'Not totally sure, but I like the question!'],
    help: ['Happy to help! 🎉', 'What\'s on your mind?', 'I\'m all ears! 👂'],
    humor: ['Haha that\'s great! 😄', 'Okay that made me laugh lol 😆', 'You\'re funny!'],
  },
  sarcastic: {
    greeting: ['Oh wow, it\'s YOU. Wonderful.', 'Well, well, well... look who it is.', 'Ah yes, here we go.'],
    acknowledgment: ['Yeah, sure, whatever.', 'Oh, groundbreaking stuff here.', 'Noted. Very important.'],
    unsure: ['Yeah, I got nothing. Shocking, I know.', 'Your guess is as good as mine, which is... not great.'],
    help: ['As if I have nothing better to do... fine, I\'ll help.', 'Oh, you need ME? How flattering.'],
    humor: ['Wow, hilarious. Really, I\'m crying.', 'Good one. I\'m being sincere, obviously.'],
  },
  professional: {
    greeting: ['Greetings. How may I be of assistance?', 'Good day. What can I do for you?'],
    acknowledgment: ['Understood. Proceeding accordingly.', 'Acknowledged. That is noted.', 'Confirmed.'],
    unsure: ['I do not possess sufficient information to provide a confident response.', 'That falls outside my current knowledge base.'],
    help: ['Please outline your requirements.', 'I am prepared to assist. What is needed?'],
    humor: ['I acknowledge that statement\'s humorous intent.'],
  },
  nerdy: {
    greeting: ['Well, well, well, greetings! 🖖', 'Ahoy! Ready to engage?', 'Initializing conversational protocols...'],
    acknowledgment: ['Affirmative! 🎮', 'Understood, fellow human.', 'Executing your command... jk it worked!'],
    unsure: ['That query exceeds my current stack. 🤷', 'Unknown error 404 - but seriously idk lol'],
    help: ['Your quest is my quest! 🗡️', 'I have prepared my spellbook. How may I assist? ✨'],
    humor: ['That\'s a quality reference. I respect it. 🤓', 'I see what you did there... NERD! (said with love)'],
  },
};

/**
 * Get a random element from an array
 */
function getRandomResponse(responses) {
  if (!Array.isArray(responses) || responses.length === 0) {
    return null;
  }
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Get personality config for a guild
 */
export async function getGuildPersonality(client, guildId) {
  try {
    // Store personality in database or memory
    // For now, return default personality
    // You can extend this to persist to database later
    const stored = client.guildPersonalities?.get(guildId);
    if (stored) {
      return stored;
    }
    return DEFAULT_PERSONALITY;
  } catch (error) {
    logger.error(`Error getting personality for guild ${guildId}:`, error);
    return DEFAULT_PERSONALITY;
  }
}

/**
 * Set personality for a guild
 */
export async function setGuildPersonality(client, guildId, personalityKey) {
  try {
    const personality = PERSONALITY_PRESETS[personalityKey];
    if (!personality) {
      throw new Error(`Unknown personality: ${personalityKey}`);
    }

    if (!client.guildPersonalities) {
      client.guildPersonalities = new Map();
    }

    client.guildPersonalities.set(guildId, personality);
    logger.info(`Set personality for guild ${guildId} to ${personalityKey}`);
    return personality;
  } catch (error) {
    logger.error(`Error setting personality for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Check if the bot should respond to a message
 * Based on mentions and trigger patterns
 */
export function shouldBotRespond(message, personality) {
  if (!personality.enabled) {
    return false;
  }

  // Always respond to direct mentions
  if (message.mentions.has(message.client.user.id)) {
    return true;
  }

  // Check for trigger patterns
  const content = message.content.toLowerCase();
  const patterns = personality.triggerPatterns || [];
  
  for (const pattern of patterns) {
    if (content.includes(pattern.toLowerCase())) {
      // Random chance based on responseChance
      const chance = personality.responseChance || 0.5;
      if (Math.random() < chance) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Generate a response based on personality and context
 */
export function generateResponse(context, personality) {
  const style = personality.responseStyle || 'neutral';
  const templates = RESPONSE_TEMPLATES[style] || RESPONSE_TEMPLATES.neutral;

  // Determine response type based on context
  let responseType = 'acknowledgment';
  
  if (context.isGreeting) {
    responseType = 'greeting';
  } else if (context.isQuestion) {
    responseType = 'unsure';
  } else if (context.isHelpRequest) {
    responseType = 'help';
  } else if (context.isHumor) {
    responseType = 'humor';
  }

  const possibleResponses = templates[responseType] || templates.acknowledgment;
  return getRandomResponse(possibleResponses);
}

/**
 * Detect context from message content
 */
export function detectContext(content) {
  const lowerContent = content.toLowerCase().trim();

  return {
    isGreeting: /^(hi|hello|hey|yo|sup|howdy|greetings)/.test(lowerContent),
    isQuestion: lowerContent.endsWith('?'),
    isHelpRequest: /help|assist|can you|could you|would you|please/.test(lowerContent),
    isHumor: /lol|lmao|haha|hehe|;-?\)|XD|😂|😆/.test(content),
  };
}

/**
 * Get all available personalities
 */
export function getAvailablePersonalities() {
  return Object.keys(PERSONALITY_PRESETS).map(key => ({
    key,
    ...PERSONALITY_PRESETS[key],
  }));
}

/**
 * Get personality details
 */
export function getPersonalityDetails(personalityKey) {
  return PERSONALITY_PRESETS[personalityKey] || null;
}

