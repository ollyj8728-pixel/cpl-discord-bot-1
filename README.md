# CPL Discord Bot 1

Custom Discord bot foundation for **CPL — Competitive Play League**. This is a bot project, not a website.

## Included now
- Slash commands: `/help`, `/about`, `/ping`, `/botinfo`, `/roles`, `/rank`, `/lfg`, `/team`, `/tournament`, `/stats`
- Interactive help category buttons
- CPL dark navy / cyan / gold embed style
- Permission-aware staff commands
- LFG modal submission with a Join button
- Team and tournament starter workflows
- Environment-based secrets; no credentials committed

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and fill in the Discord Developer Portal values.
3. Run `npm install`.
4. Run `npm run dev`.

Invite the bot with the `bot` and `applications.commands` scopes and permissions for sending messages, embeds, managing roles, and managing channels as features are enabled.
