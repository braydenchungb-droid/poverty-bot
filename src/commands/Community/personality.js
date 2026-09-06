import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {
  getGuildPersonality,
  setGuildPersonality,
  getAvailablePersonalities,
  getPersonalityDetails,
} from '../../services/personality/personalityService.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('personality')
    .setDescription('Configure the bot\'s personality and conversational responses')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set the bot\'s personality')
        .addStringOption(option =>
          option
            .setName('style')
            .setDescription('Choose a personality style')
            .setRequired(true)
            .addChoices(
              { name: 'Neutral', value: 'neutral' },
              { name: 'Friendly', value: 'friendly' },
              { name: 'Sarcastic', value: 'sarcastic' },
              { name: 'Professional', value: 'professional' },
              { name: 'Nerdy', value: 'nerdy' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('current')
        .setDescription('View the current personality settings')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all available personalities')
    ),

  category: 'Community',
  permissions: ['ManageGuild'],

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'set') {
        await handleSetPersonality(interaction, client);
      } else if (subcommand === 'current') {
        await handleCurrentPersonality(interaction, client);
      } else if (subcommand === 'list') {
        await handleListPersonalities(interaction, client);
      }
    } catch (error) {
      logger.error('Error in personality command:', error);
      await interaction.reply({
        embeds: [createEmbed({
          title: 'Error',
          description: 'Failed to process personality command.',
          color: 'error',
        })],
        ephemeral: true,
      });
    }
  },
};

async function handleSetPersonality(interaction, client) {
  const style = interaction.options.getString('style');

  try {
    // Set the personality
    const personality = await setGuildPersonality(client, interaction.guildId, style);

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Personality Updated')
      .setDescription(`The bot's personality has been set to **${personality.name}**`)
      .addFields(
        { name: 'Description', value: personality.description },
        { name: 'Traits', value: personality.traits.join(', ') || 'None' },
        { name: 'Response Chance', value: `${(personality.responseChance * 100).toFixed(0)}%` }
      )
      .setFooter({ text: 'The bot will now respond with this personality in conversation.' });

    await interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  } catch (error) {
    logger.error(`Error setting personality for guild ${interaction.guildId}:`, error);
    throw error;
  }
}

async function handleCurrentPersonality(interaction, client) {
  try {
    const personality = await getGuildPersonality(client, interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🤖 Current Personality')
      .setDescription(`The bot is currently using the **${personality.name}** personality.`)
      .addFields(
        { name: 'Description', value: personality.description },
        { name: 'Traits', value: personality.traits.join(', ') || 'None' },
        { name: 'Response Triggers', value: personality.triggerPatterns?.join(', ') || 'Direct mentions only' },
        { name: 'Response Chance', value: `${(personality.responseChance * 100).toFixed(0)}%` },
        { name: 'Status', value: personality.enabled ? '✅ Enabled' : '❌ Disabled' }
      );

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Error getting personality for guild ${interaction.guildId}:`, error);
    throw error;
  }
}

async function handleListPersonalities(interaction, client) {
  try {
    const personalities = getAvailablePersonalities();

    const embed = new EmbedBuilder()
      .setColor('#9900ff')
      .setTitle('🎭 Available Personalities')
      .setDescription('Use `/personality set` to choose one of these personalities:\n')
      .setFooter({ text: 'Each personality has its own unique traits and response style.' });

    for (const personality of personalities) {
      embed.addFields({
        name: personality.name,
        value: `${personality.description}\n*Traits:* ${personality.traits.join(', ')}`,
        inline: false,
      });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Error listing personalities:', error);
    throw error;
  }
}

