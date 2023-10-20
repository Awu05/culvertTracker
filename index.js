const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const Tesseract = require('tesseract.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase().startsWith('!upload')) {
        // send the message and wait for it to be sent
        const confirmation = await message.channel.send(`Please upload , ${message.author}`);

        // console.log('message: ', message);

        message.attachments.forEach(a => {
            //   fs.writeFileSync(`./${a.name}`, a.file); // Write the file to the system synchronously.
            console.log('img attachments: ', a.attachment);

            Tesseract.recognize(
                // this first argument is for the location of an image it can be a //url like below or you can set a local path in your computer
                a.attachment,
                // this second argument is for the laguage 
                'eng+fra+dan',
                { logger: m => console.log(m) }
            ).then(({ data: { text } }) => {
                console.log(text);
            })
        });


        // filter checks if the response is from the author who typed the command
        //   const filter = (m) => m.author.id === message.author.id;
        //   // set up a message collector to check if there are any responses
        //   const collector = confirmation.channel.createMessageCollector(filter, {
        //     // set up the max wait time the collector runs (optional)
        //     time: 0,
        //   });

        //   // fires when a response is collected
        //   collector.on('collect', async (msg) => {
        //     // if (msg.content.toLowerCase().startsWith('what time is it')) {
        //     //   return message.channel.send(`The current time is ${new Date().toLocaleTimeString()}.`);
        //     // }

        //     // const index = questions.findIndex((q) =>
        //     //   msg.content.toLowerCase().startsWith(q),
        //     // );

        //     // if (index >= 0) {
        //     //   return message.channel.send(answers[index]);
        //     // }

        //     // return message.channel.send(`I don't have the answer for that...`);
        //     console.log('Writing images to disk!');
        //     msg.attachments.forEach(a => {
        //         fs.writeFileSync(`./${a.name}`, a.file); // Write the file to the system synchronously.
        //     });

        //   });

        //   // fires when the collector is finished collecting
        //   collector.on('end', (collected, reason) => {
        //     // only send a message when the "end" event fires because of timeout
        //     if (reason === 'time') {
        //       message.channel.send(
        //         `${message.author}, it's been a minute without any question, so I'm no longer interested... 🙄`,
        //       );
        //     }
        //   });
    }
});

client.login(process.env.TOKEN);