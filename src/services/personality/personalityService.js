import { buildBrainrotResponse } from './brainrotResponses.js';
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
  brainrot: {
    name: 'Brainrot',
    description: 'Gen-Z chaos energy, sarcastic, swears, roasts, pure unfiltered vibes',
    traits: ['chaotic', 'brainrotted', 'sarcastic', 'ruthless', 'funny', 'unfiltered'],
    responseStyle: 'brainrot',
    triggerPatterns: ['@bot', 'bot', 'hey', 'yo', 'ayo'],
    responseChance: 0.75, // Loves to respond
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
  brainrot: {
    greeting: [
      'Yooo what\'s good, what\'s poppin\' 💀',
      'Ayo who tf just summoned me lmao',
      'no cap who called me out 😭',
      'bruh what do you want fr fr 💯',
      'ayo it\'s ya boy, what\'s twisted',
      'yo yo yo, it\'s me, your favorite menace',
    ],
    acknowledgment: [
      'no cap that\'s lowkey fire 🔥',
      'fr fr that hit different bruh',
      'bet bet i see you 💯',
      'nah that\'s actually kinda fax',
      'yo that\'s bussin bussin deadass',
      'periodt, you spilled ✨',
    ],
    unsure: [
      'bro i haven\'t got a clue what the fuck you\'re on about 💀',
      'nah chief that question is giving unhinged energy',
      'dawg that one broke my brain fr fr',
      'that\'s some out of pocket shit ngl',
      'bro idk i ain\'t paid enough for this',
      'that question is just not it chief 😭',
    ],
    help: [
      'yo i gotchu no cap, what\'s the tea ☕',
      'bro i\'m lowkey the realest, ask away 💪',
      'aight let\'s get this bread, what you need',
      'fr fr i can help you not be so mid',
      'ayo i\'ll assist, but no promises lmao',
      'ok but first lemme warn you i might roast you while i help',
    ],
    humor: [
      'nah that\'s actually hilarious i can\'t lie 💀💀',
      'omg that broke me fr fr i\'m deceased 😭',
      'yo that one just had me in a chokehold bruh',
      'that\'s unhinged i fw it 🤣',
      'ok that was peak comedy no cap',
      'bro that shit had me shaking lmaooo',
    ],
    roast: [
      'bro your vibe is NOT it 💀',
      'nah you mid fr fr, skill issue tbh',
      'that\'s giving desperate energy dawg',
      'chief that ain\'t it, not even close',
      'yo this is embarrassing for you fr',
      'nah you down bad for real 😭',
      'ok but that was cringe as fuck ngl',
      'bro you fell off quick lmaoo',
      'that energy is NOT serving, bestie 💋',
    ],
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
    const key = `guild:${guildId}:personality`;
    const storedKey = await client.db.get(key, null);

    if (storedKey && PERSONALITY_PRESETS[storedKey]) {
      return PERSONALITY_PRESETS[storedKey];
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

    const key = `guild:${guildId}:personality`;
    await client.db.set(key, personalityKey);

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

  // Special handling for brainrot - sometimes just roast for fun
  if (style === 'brainrot' && Math.random() < 0.15) {
    return getRandomResponse(templates.roast);
  }

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
    isGreeting: /^(hi|hello|hey|yo|sup|howdy|greetings|ayo)/.test(lowerContent),
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

