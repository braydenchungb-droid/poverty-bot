/**
 * Brainrot Response Generator
 * ---------------------------
 * Instead of one giant flat list per category (which gets repetitive fast
 * once you've read the first 20-30 lines), this builds responses out of
 * small interchangeable pieces: an opener + a reaction + an optional tag.
 * Random combination of these pools produces thousands of distinct-feeling
 * lines from a much smaller, higher-quality set of authored fragments.
 *
 * Drop this file in src/services/personality/ and import buildBrainrotResponse
 * from personalityService.js instead of pulling flat arrays.
 */

// ---------------------------------------------------------------------------
// SHARED FRAGMENT POOLS
// Reused across many categories so the vocabulary stays consistent, but
// combinations still multiply out to a huge number of unique outputs.
// ---------------------------------------------------------------------------

const EMOJIS = ['💀', '😭', '🔥', '💯', '😂', '🤣', '✨', '💅', '😴', '🐐', '🚩', '🫡', '😮‍💨', '🎯', '🗿'];

const FILLERS = [
  'no cap', 'fr fr', 'ngl', 'deadass', 'lowkey', 'highkey', 'periodt',
  'on god', 'not gonna lie', 'real talk', 'straight up', 'frfr no cap',
  'i\'m not even joking', 'and i mean that', 'say less',
];

const ADDRESS = [
  'bro', 'chief', 'dawg', 'bestie', 'king', 'fam', 'g', 'homie', 'my guy',
  'twin', 'champ', 'legend', 'captain',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function maybeEmoji(chance = 0.6) {
  return Math.random() < chance ? ` ${pick(EMOJIS)}` : '';
}

function maybeFiller(chance = 0.5) {
  return Math.random() < chance ? `${pick(FILLERS)}, ` : '';
}

function maybeAddress(chance = 0.35) {
  return Math.random() < chance ? `${pick(ADDRESS)}, ` : '';
}

// ---------------------------------------------------------------------------
// CATEGORY DEFINITIONS
// Each category = { openers: [...], reactions: [...] }
// A response = maybeAddress + maybeFiller + opener + reaction + maybeEmoji
// With ~15 openers x ~15 reactions x fillers x address x emoji odds, each
// category alone produces low-thousands of distinct combinations.
// ---------------------------------------------------------------------------

const CATEGORIES = {
  greeting: {
    openers: [
      'yo what\'s good', 'ayo who summoned me', 'sup', 'oh word we doing this',
      'wassup gang', 'yo yo yo', 'aight bet i\'m here', 'oh you woke me up',
      'the goat has entered the chat', 'ok who called me out',
      'yo i was literally just chillin', 'sup nerd', 'oh hey it\'s you',
      'aight aight i see you', 'yo what\'s the move',
    ],
    reactions: [
      'what you need', 'what\'s the situation', 'talk to me',
      'what we doing today', 'i\'m listening', 'go off then',
      'lay it on me', 'what\'s the vibe', 'speak now',
      'i got time for this', 'let\'s hear it', 'don\'t waste my energy',
      'this better be good', 'i\'m all ears', 'spill it',
    ],
  },

  acknowledgment: {
    openers: [
      'that\'s', 'ok that\'s actually', 'not gonna lie that\'s',
      'ok i\'ll admit that\'s', 'gotta say that\'s', 'lowkey that\'s',
      'ok respectfully that\'s', 'i mean that\'s', 'ok fine that\'s',
      'not me agreeing but that\'s',
    ],
    reactions: [
      'fire', 'bussin', 'valid', 'based', 'the move', 'a whole vibe',
      'sending me', 'kinda genius', 'peak', 'elite', 'top tier',
      'the blueprint', 'exactly it', 'facts', 'real',
    ],
  },

  unsure: {
    openers: [
      'bro i genuinely have no clue', 'chief that question is',
      'ngl my brain just', 'dawg that one', 'bro i wasn\'t built for',
      'that\'s just', 'ok that question needs', 'i blacked out reading',
      'not me having zero answers for', 'bro you lost me at',
    ],
    reactions: [
      'unhinged energy', 'buffered forever', 'broke my brain', 'out of pocket',
      'above my pay grade', 'not it', 'its own therapist', 'that one',
      'a whole mystery', 'hello', 'error 404', 'not making it to me',
      'a genuine crisis', 'too much for a tuesday', 'beyond me fr',
    ],
  },

  help: {
    openers: [
      'aight bet i got you', 'yo i\'ll help but', 'ok fine i\'ll help',
      'say the word and', 'bro you\'re lucky', 'i\'ll assist but',
      'lemme lock in,', 'aight lemme cook,', 'bet, i got you but',
      'ok i\'m helping this once,',
    ],
    reactions: [
      'no promises tho', 'don\'t embarrass yourself', 'i\'m even nice today',
      'i\'m on it', 'this better be worth it', 'let\'s get this bread',
      'watch and learn', 'i might roast you while i do it',
      'don\'t waste it', 'let\'s go',
    ],
  },

  humor: {
    openers: [
      'nah that\'s actually', 'omg that', 'yo that one just',
      'ok that was', 'bro that shit', 'i\'m', 'not me actually',
      'ok that sent me to', 'bro called it and', 'that\'s comedy gold,',
    ],
    reactions: [
      'hilarious i can\'t lie', 'broke me fr fr', 'had me in a chokehold',
      'peak comedy', 'had me shaking', 'wheezing rn', 'another dimension',
      'laughing out loud fr', 'i respect the bit', 'screenshot that',
    ],
  },

  roast: {
    openers: [
      'bro your vibe is', 'nah you', 'that\'s giving', 'chief that ain\'t it,',
      'yo this is', 'nah you\'re', 'ok but that was', 'bro you fell off,',
      'that energy is not serving,', 'ok this you? because it should not be,',
    ],
    reactions: [
      'not it', 'mid fr fr, skill issue', 'desperate energy', 'not even close',
      'embarrassing for you', 'down bad for real', 'cringe as fuck ngl',
      'quick lmaoo', 'bestie', 'fr', 'an L take honestly',
    ],
  },

  boredom: {
    openers: [
      'bro same,', 'ngl relatable,', 'fr this server is', 'ok mood,',
      'not me also being', 'this chat is', 'ok true,',
    ],
    reactions: [
      'i\'m bored out my mind too', 'nothing happening today', 'so mid rn',
      'dead today ngl', 'i need something to happen', 'zero action today',
      'we need chaos in here fr',
    ],
  },

  compliment_received: {
    openers: [
      'aw shucks', 'ok stop', 'ngl i needed that,', 'ok flattery noted,',
      'not me blushing but', 'ok you\'re not wrong,',
    ],
    reactions: [
      'that\'s sweet fr', 'i appreciate that', 'you\'re alright too ig',
      'i\'ll allow it', 'noted, you may continue', 'thanks i guess',
    ],
  },

  insult_received: {
    openers: [
      'ok rude,', 'damn ok,', 'wow didn\'t need that but ok,',
      'ok pipe down,', 'bold of you to say that,',
    ],
    reactions: [
      'i\'m built different tho', 'that ain\'t gonna work on me',
      'i\'ve heard worse', 'ratio', 'ok whatever you say chief',
      'ok and? i\'m still him',
    ],
  },

  agreement: {
    openers: [
      'facts,', 'no cap you right,', 'ok true,', 'yeah exactly,',
      'this,', 'real,',
    ],
    reactions: [
      'you cooked with that', 'said it best', 'that\'s the take',
      'couldn\'t agree more', 'exactly the point', 'nailed it',
    ],
  },

  disagreement: {
    openers: [
      'nah,', 'respectfully nah,', 'ok i disagree,', 'not gonna lie nah,',
      'hard disagree but,',
    ],
    reactions: [
      'that ain\'t it', 'that\'s not the move', 'gonna have to stop you there',
      'that take is not it', 'gonna disagree on that one',
    ],
  },
};

// ---------------------------------------------------------------------------
// GENERATOR
// ---------------------------------------------------------------------------

/**
 * Build a brainrot-style response for a given category, tracking the
 * last response per channel so it never repeats twice in a row.
 */
const lastByChannel = new Map();

export function buildBrainrotResponse(categoryKey, channelId = null) {
  const category = CATEGORIES[categoryKey] || CATEGORIES.acknowledgment;
  let attempt;
  let guard = 0;

  do {
    const opener = pick(category.openers);
    const reaction = pick(category.reactions);
    attempt = `${maybeAddress()}${maybeFiller()}${opener} ${reaction}${maybeEmoji()}`;
    guard += 1;
  } while (channelId && attempt === lastByChannel.get(channelId) && guard < 5);

  if (channelId) {
    lastByChannel.set(channelId, attempt);
  }
  return attempt;
}

export function getAvailableCategories() {
  return Object.keys(CATEGORIES);
}
