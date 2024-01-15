const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gpqrankings')
        .setDescription('Fetches the culvert scores of the guild.')
        .addStringOption(option =>
            option.setName('top')
                .setDescription('Gets the top x number rankings.')
                .setRequired(true))
    ,
    async execute(interaction) {
        const topNumber = interaction.options.getString('top');

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

        let rankingIndex = [];
        let rankingFields = [];

        for (let index = 1; index <= topNumber; index++) {
            const indexes = getRows.data.values[5].reduce(function(a, e, i) {
                if (e === `${index}`)
                    a.push(i);
                return a;
            }, []);

            rankingIndex = rankingIndex.concat(indexes);
        }

        for (let j = 0; j < rankingIndex.length; j++) {
            const ign = getRows.data.values[0][rankingIndex[j]];
            const className = getRows.data.values[1][rankingIndex[j]];
            const currentWeekScore = getRows.data.values[3][rankingIndex[j]];

            rankingFields.push({ name: 'Rank', value: `${getRows.data.values[5][rankingIndex[j]]}` });
            rankingFields.push({ name: 'Character Name', value: ign, inline: true });
            rankingFields.push({ name: 'Class Name', value: className, inline: true });
            rankingFields.push({ name: 'Current Week Score', value: currentWeekScore, inline: true });
            rankingFields.push({ name: '\u200B', value: '\u200B' });
        }

        let arrStart = 0;
        const embeds = [];

        for (let k = 1; k <= Math.ceil(rankingFields.length / 25); k++) {
            const subArray = rankingFields.slice(arrStart, (k * 25));
            const embedTitle = k === 1 ? `Top ${topNumber} Culvert Rankings` : ` `;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(embedTitle)
                .addFields(subArray)
                .setTimestamp()
            arrStart += 25;
            embeds.push(embed);
        }

        await interaction.reply({ embeds: embeds });
    },
};