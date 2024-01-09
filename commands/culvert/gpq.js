const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
// const { setTimeout } = require('node:timers/promises');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('gpq')
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
        const spreadsheetId = process.env.SHEET_ID;
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "GPQ Scores!1:10"
        });
        
        const nameIndex = getRows.data.values[0].findIndex(element => {
            return element.toLowerCase() === ign.toLowerCase();
        });
        
        // console.log('data row:', getRows.data.values);

        if (nameIndex === -1) {
            await interaction.reply({ content: 'Unable to find the character! Please make sure they are in the guild!', ephemeral: true });
        }

        const response = await fetch(`https://maplestory.nexon.net/api/ranking?id=world&id2=45&character_name=${ign}&page_index=1`);
        const data = await response.json();

        const imgUrl = data.length > 0 ? data[0]["CharacterImgUrl"] : null;
        const className = getRows.data.values[1][nameIndex];
        const lastWeekScore = getRows.data.values[2][nameIndex] ? getRows.data.values[2][nameIndex] : 'N/A';
        const currentWeekScore = getRows.data.values[3][nameIndex];
        const lastWeekChange = getRows.data.values[4][nameIndex];
        const weeklyRanking = getRows.data.values[5][nameIndex];
        const personalBest = getRows.data.values[6][nameIndex];
        const lastVsBest = getRows.data.values[7][nameIndex];
        const activeWeeks = getRows.data.values[8][nameIndex];
        const participation = getRows.data.values[9][nameIndex];

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(`${ign.toUpperCase()}`)
            .setThumbnail(imgUrl !== null? imgUrl.replace('https://', 'http://') : null)
            .setURL(`https://mapleranks.com/u/${ign}`)
            .setAuthor({ name: `${ign.toUpperCase()} Culvert Stats` })
            .setDescription(`Class: ${className} `)
            .addFields([
                { name: 'Weekly Rank', value: weeklyRanking},
                { name: '\u200B', value: '\u200B' },
            ])
            .addFields([
                { name: 'Last Week Score', value: lastWeekScore, inline: true },
                { name: 'Current Week Score', value: currentWeekScore, inline: true },
                { name: 'Change Compared To Last Week', value: lastWeekChange, inline: true },
            ])
            .addFields([
                { name: '\u200B', value: '\u200B' },
                { name: 'Personal Best', value: personalBest, inline: true },
                { name: 'Current vs Best', value: lastVsBest, inline: true },
            ])
            .addFields([
                { name: '\u200B', value: '\u200B' },
                { name: 'Active Weeks', value: activeWeeks, inline: true },
                { name: 'Participation Rate', value: participation, inline: true },
            ])
            .setTimestamp()
            
        // .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        await interaction.reply({ embeds: [embed] });
    },
};