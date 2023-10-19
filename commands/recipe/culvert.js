const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// const { setTimeout } = require('node:timers/promises');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('culvert')
        .setDescription('Fetches the culvert stats of someone in the guild.')
        .addStringOption(option =>
            option.setName('ign')
                .setDescription('Enter a guildmates name.')
                .setRequired(true))
    ,
    async execute(interaction) {
        const ign = interaction.options.getString('ign');

        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });

        const client = await auth.getClient();

        const googleSheets = google.sheets({ version: "v4", auth: client });
        const spreadsheetId = '10l__Q8YK5CIl256YaRVDYjDHvd08RJbdef52LxdnF7s';
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "GPQ Scores!1:6"
        });

        const nameIndex = getRows.data.values[0].findIndex(element => {
            return element.toLowerCase() === ign.toLowerCase();
        });

        if (nameIndex === -1) {
            await interaction.reply({ content: 'Unable to find the character! Please make sure they are in the guild!', ephemeral: true });
        }

        const response = await fetch(`https://maplestory.nexon.net/api/ranking?id=world&id2=45&character_name=${ign}&page_index=1`);
        const data = await response.json();

        const imgUrl = data[0]["CharacterImgUrl"];
        const className = getRows.data.values[1][nameIndex];
        const lastWeekScore = getRows.data.values[2][nameIndex];
        const currentWeekScore = getRows.data.values[3][nameIndex];
        const personalBest = getRows.data.values[4][nameIndex];
        const lastVsBest = getRows.data.values[5][nameIndex];

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${ign.toUpperCase()}`)
            .setURL(`https://mapleranks.com/u/${ign}`)
            .setAuthor({ name: `${ign.toUpperCase()} Culvert Stats`, iconURL: imgUrl })
            .setDescription(`Class: ${className} `)
            .addFields([
                { name: 'Last Week Score', value: lastWeekScore, inline: true },
                { name: 'Current Week Score', value: currentWeekScore, inline: true },
            ])
            .addFields([
                { name: '\u200B', value: '\u200B' },
                { name: 'Personal Best', value: personalBest, inline: true },
                { name: 'Last vs Best', value: lastVsBest, inline: true },
            ])
            .setTimestamp()
            // .setImage(imgUrl)
            // .setThumbnail(imgUrl)
        // .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        await interaction.reply({ embeds: [embed] });
    },
};