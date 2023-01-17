# Raphtalia Bot

The Gulag's manager

## Development setup

### Stuff

1. Add the /scripts directory to your PATH. e.g.

   ```sh
   export PATH="$PATH:~/Raphtalia/scripts"
   ```

2. Install Node

### Create your own Discord bot

1. Navigate to https://discord.com/developers/applications
2. New Application
3. Name it after your favorite waifu (important) and give it a matching PFP
4. Go to the "Bot" tab and convert it into a bot
5. Check the following privileged intents:
   1. Presence
   2. Server Members
   3. Message Content
6. Go to OAuth -> URL Generator
   1. For Scopes, select
      * bot
      * application.commands
   2. For Bot Permissions, select everything this bot can do. Right now, that's a lot of things and I don't want to write them all out.
7. Navigate to the generated OAuth URL and invite your bot to the SW Development server

### MySQL Server

1. Download and install MySQL Community Server ^8.0.0
2. Set up a local db admin account
3. Set up a database named "raphtaliaLocalDev"
4. Create a .env file at the base directory with the connection string to that account. Prisma will
   use this to connect to the database. Example `.env` file:

   ```conf
   DATABASE_URL="mysql://<user>:<password>@localhost:3306/raphtaliaLocalDev"
   ```

## Recommend Tools

* VSCode
* Tabby
* DBeaver
* Starship.rs

## Deployment steps

1. SSH into the server
2. Run the following commands

   ```sh
   cd /var/git/raphtalia
   git pull
   yarn build
   pm2 start raphtalia.pm2.json
   ```
