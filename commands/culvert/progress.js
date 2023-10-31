const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const QuickChart = require('quickchart-js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('gpqhistory')
        .setDescription('Fetches the culvert stats of a character.')
        .addStringOption(option =>
            option.setName('ign')
                .setDescription('IGN of character you want to get the GPQ stats of.')
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
        const getColumns = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            majorDimension: "COLUMNS",
            range: "GPQ Scores"
        });

        let charIndex = -1;

        for (let i = 0; i < getColumns.data.values.length; i++) {
            if (getColumns.data.values[i][0].toLowerCase() === ign.toLowerCase()) {
                charIndex = i;
            }
        }

        if (charIndex === -1) {
            await interaction.reply({ content: 'Unable to find the character! Please make sure they are in the guild!', ephemeral: true });
        } else {

            const charInfo = getColumns.data.values[charIndex];
            const scoreArray = charInfo.slice(11, charInfo.length);
            const chartDates = getColumns.data.values[0].slice(11, charInfo.length);

            scoreArray.forEach((el, index) => {
                scoreArray[index] = parseInt(el.replace(/,/g, ''), 10);
            });

            const chart = new QuickChart();

            chart.setWidth(500)
            chart.setHeight(300);
            chart.setVersion('2.9.4');

            chart.setConfig({
                type: 'line',
                data: {
                    labels: chartDates.slice(0, scoreArray.length),
                    datasets: [
                        {
                            label: `${ign.toUpperCase()} Weekly GPQ Scores`,
                            data: scoreArray,
                            fill: false,
                            borderColor: 'blue',
                        },
                    ],
                },
                options: {
                    plugins: {
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            color: '#fff',
                            backgroundColor: 'rgba(34, 139, 34, 0.6)',
                            borderColor: 'rgba(34, 139, 34, 1.0)',
                            borderWidth: 1,
                            borderRadius: 5,
                            formatter: (value) => {
                                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            },
                        },
                    },
                },
            });

            const imgUrl = chart.getUrl();

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${ign.toUpperCase()} Weekly GPQ Scores`)
                .setImage(imgUrl)
                .setTimestamp()

            await interaction.reply({ embeds: [embed] });
        }
    },
};