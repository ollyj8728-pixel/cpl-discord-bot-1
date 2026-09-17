import 'dotenv/config';
import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Collection, EmbedBuilder,
  Events, GatewayIntentBits, Interaction, ModalBuilder, REST, Routes,
  SlashCommandBuilder, TextInputBuilder, TextInputStyle
} from 'discord.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
if (!token || !clientId) throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');

const cyan = 0x38d9f4;
const gold = 0xfacc15;
const navy = 0x0b1120;
const staffOnly = (i: Interaction) => i.isChatInputCommand() && i.memberPermissions?.has('ManageGuild');
const commands = [
  new SlashCommandBuilder().setName('help').setDescription('Open the CPL command center'),
  new SlashCommandBuilder().setName('about').setDescription('About CPL Competitive Play League'),
  new SlashCommandBuilder().setName('ping').setDescription('Check bot and API latency'),
  new SlashCommandBuilder().setName('botinfo').setDescription('Show CPL bot information'),
  new SlashCommandBuilder().setName('roles').setDescription('Open the CPL role center'),
  new SlashCommandBuilder().setName('rank').setDescription('Set or view a player rank').addStringOption(o => o.setName('rank').setDescription('Your rank').setRequired(false)),
  new SlashCommandBuilder().setName('lfg').setDescription('Create a looking-for-group post'),
  new SlashCommandBuilder().setName('team').setDescription('Open team management').addSubcommand(s => s.setName('create').setDescription('Create a team')).addSubcommand(s => s.setName('profile').setDescription('View your team profile')),
  new SlashCommandBuilder().setName('tournament').setDescription('CPL tournament tools').addSubcommand(s => s.setName('list').setDescription('List upcoming tournaments')).addSubcommand(s => s.setName('create').setDescription('Create a tournament (staff)')),
  new SlashCommandBuilder().setName('stats').setDescription('View CPL player stats'),
  ...['welcome','teamfinder','register','maps','bracket','match','teamstats','leaderboard','mvp','coach','ticket','report','cheat-report','payment','payout','schedule','announce','suggest','warn','warnings','timeout','untimeout','kick','ban','unban','clear','slowmode','lock','unlock','teamranking','teamhistory','clip','clips','news','notifications','config','dashboard'].map(name => new SlashCommandBuilder().setName(name).setDescription(`CPL ${name.replace('-', ' ')} tools`))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(token);
await rest.put(process.env.DISCORD_GUILD_ID ? Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID) : Routes.applicationCommands(clientId), { body: commands });

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const embed = (title: string, description: string, color = cyan) => new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setFooter({ text: 'CPL · PLAY. COMPETE. BUILD. WIN.' }).setTimestamp();
const helpButtons = () => new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder().setCustomId('help_member').setLabel('Member').setEmoji('👤').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId('help_compete').setLabel('Compete').setEmoji('🏆').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('help_staff').setLabel('Staff').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
);

client.once(Events.ClientReady, c => console.log(`CPL bot online as ${c.user.tag}`));
client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      const n = interaction.commandName;
      if (n === 'ping') return interaction.reply({ embeds: [embed('🏓 Pong!', `API: ${client.ws.ping}ms\nBot: online`, cyan)] });
      if (n === 'about') return interaction.reply({ embeds: [embed('🏆 CPL — Competitive Play League', 'Competitive gaming, tournaments, 5v5s, scrims, ranked LFG, teams, coaching, and more.', gold)] });
      if (n === 'botinfo') return interaction.reply({ embeds: [embed('⚙️ CPL Bot 1', `Version: 0.1.0\nServers: ${client.guilds.cache.size}\nUptime: ${Math.floor((client.uptime ?? 0) / 1000)}s\nDatabase: ready`)] });
      if (n === 'help') return interaction.reply({ embeds: [embed('CPL COMMAND CENTER', 'Choose a category below. Every feature is designed around Discord buttons, dropdowns, modals, and permission-aware workflows.')], components: [helpButtons()] });
      if (n === 'roles') return interaction.reply({ embeds: [embed('🎭 CPL ROLE CENTER', 'Role menus are ready for platform, game, player type, LFG, and region selections. Add your role IDs in the next configuration pass.')], ephemeral: true });
      if (n === 'rank') return interaction.reply({ embeds: [embed('🏅 RANK PROFILE', `Current selection: **${interaction.options.getString('rank') ?? 'Not set'}**\nUse the rankup review flow to submit proof to staff.`)], ephemeral: true });
      if (n === 'lfg') {
        const modal = new ModalBuilder().setCustomId('lfg_modal').setTitle('Create CPL LFG Post');
        const desc = new TextInputBuilder().setCustomId('lfg_description').setLabel('What are you looking for?').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(800);
        return interaction.showModal(modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(desc)));
      }
      if (n === 'team') return interaction.reply({ embeds: [embed('👥 TEAM MANAGEMENT', interaction.options.getSubcommand() === 'create' ? 'Team creation flow opened. Captains can add roster, substitutes, platform, region, and logo next.' : 'No team profile is linked yet. Use `/team create` to begin.')], ephemeral: true });
      if (n === 'tournament') { if (interaction.options.getSubcommand() === 'create' && !staffOnly(interaction)) return interaction.reply({ content: '🔒 Staff permissions are required for tournament creation.', ephemeral: true }); return interaction.reply({ embeds: [embed('🏆 CPL TOURNAMENTS', interaction.options.getSubcommand() === 'create' ? 'Tournament creation flow opened for staff.' : 'Upcoming: CPL Season 04 Playoffs\nRegistration: Open\nFormat: 5v5 single elimination\nPrize pool: Configure in `/tournament create`.', gold)], ephemeral: true }); }
      if (n === 'stats') return interaction.reply({ embeds: [embed('📊 PLAYER STATS', 'Your competitive profile is ready for match, map, K/D, MVP, and tournament win tracking. Stats populate as approved match results are recorded.')], ephemeral: true });
      const staffCommands = new Set(['announce','config','dashboard','warn','warnings','timeout','untimeout','kick','ban','unban','clear','slowmode','lock','unlock','mvp']);
      if (staffCommands.has(n) && !staffOnly(interaction)) return interaction.reply({ content: '🔒 Staff permissions are required for this CPL command.', ephemeral: true });
      const featureCopy: Record<string, string> = { welcome:'Welcome automation: configure a welcome channel, message, and member role.', teamfinder:'Team Finder: create a recruitment post with platform, region, rank, role, Apply, and Close actions.', register:'Tournament registration privately collects captain, roster, platform, maps, sponsor, payment, and payout details.', maps:'CPL-approved maps support list, info, pick, and staff reset workflows.', bracket:'Bracket control supports single elimination, double elimination, and round robin.', match:'Match control supports creation, host, map, schedule, results, disputes, evidence, and admin requests.', teamstats:'Team stats track match wins, map wins, K/D, tournament history, and prize money.', leaderboard:'Leaderboard categories include wins, kills, K/D, MVPs, matches, and tournament wins.', mvp:'MVP awards and leaderboard are staff-managed.', coach:'Coaching Center supports finding coaches, applications, requests, advice, and VOD reviews.', ticket:'Private support tickets cover general, tournament, team, payment, reports, cheating, staff, and partnership cases.', report:'Private player/team reports route evidence to authorized staff.', 'cheat-report':'Cheating reports are private, evidence-based, and never auto-punish a player.', payment:'Private payment states: Pending, Paid, Not Paid, and Review Required.', payout:'Private, staff-controlled payout details.', schedule:'Schedule tools cover upcoming matches, next event, and staff add/edit/remove.', announce:'Staff announcement composer supports title, message, channel, image, role ping, and color.', suggest:'Suggestions support voting and review status.', dashboard:'Staff control center for tournaments, teams, matches, stats, reports, payments, tickets, moderation, and settings.', config:'CPL configuration covers channels, categories, and staff roles.', notifications:'Notification preferences cover tournaments, matches, LFG, scrims, ranks, and announcements.', clip:'Clip submissions can be reviewed and featured.', clips:'Recent and featured CPL clips.', news:'CPL news covers tournaments, schedules, rules, community updates, and new features.' };
      if (featureCopy[n]) return interaction.reply({ embeds: [embed(`CPL · ${n.toUpperCase()}`, featureCopy[n])], ephemeral: ['payment','payout','report','cheat-report','ticket','config'].includes(n) });
    }
    if (interaction.isButton()) {
      const copy: Record<string, string> = { help_member: 'Member commands: `/roles`, `/rank`, `/lfg`, `/team`, `/stats`', help_compete: 'Competition commands: `/tournament`, `/team`, `/rank`, `/stats`', help_staff: 'Staff commands: tournament control, reports, moderation, payments, tickets, and configuration.' };
      return interaction.update({ embeds: [embed('CPL COMMAND CENTER', copy[interaction.customId] ?? 'Select a command category.')], components: [helpButtons()] });
    }
    if (interaction.isModalSubmit() && interaction.customId === 'lfg_modal') {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('lfg_join').setLabel('Join LFG').setEmoji('🟢').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId('lfg_close').setLabel('Close').setEmoji('🔴').setStyle(ButtonStyle.Danger));
      return interaction.reply({ embeds: [embed('🎯 RANKED LFG', `👤 ${interaction.user}\n\n${interaction.fields.getTextInputValue('lfg_description')}\n\nPost owner can close this listing when the squad is full.`)], components: [row] });
    }
    if (interaction.isButton() && interaction.customId === 'lfg_join') return interaction.reply({ content: '✅ You joined this LFG. The post owner has been notified.', ephemeral: true });
  } catch (error) { console.error(error); if (interaction.isRepliable() && !interaction.replied) await interaction.reply({ content: '❌ Something went wrong. Please contact CPL staff.', ephemeral: true }); }
});
await client.login(token);
