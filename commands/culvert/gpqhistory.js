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
        .addStringOption(option =>
            option.setName('fullhistory')
                .setDescription('View full history.')
                .addChoices(
                    { name: 'True', value: 'true' },
                    { name: 'False', value: 'false' },
                )
                .setRequired(false))
    ,
    async execute(interaction) {
        const ign = interaction.options.getString('ign');
        const fullHistory = interaction.options.getString('fullhistory') ? true : false;

        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        });

        const client = await auth.getClient();

        const googleSheets = google.sheets({ version: "v4", auth: client });
        const spreadsheetId = process.env.SHEET_ID;
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

            //Get the Sunday of each week
            var curr = new Date; // get current date
            var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
            var firstday = new Date(curr.setDate(first)).toISOString();
            const date = new Date(firstday);
            const dateFormat = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

            //Finds the index of the sunday
            const dateInex = getColumns.data.values[0].indexOf(dateFormat);
            const chartDates = getColumns.data.values[0].slice(11, dateInex);

            scoreArray.forEach((el, index) => {
                scoreArray[index] = parseInt(el.replace(/,/g, ''), 10);
            });

            const chart = new QuickChart();

            chart.setWidth(500)
            chart.setHeight(300);
            chart.setVersion('2.9.4');

            let last5Dates;
            let last5Scores;

            if (fullHistory) {
                last5Dates = chartDates.slice(0, scoreArray.length);
                last5Scores = scoreArray;
            } else {
                last5Dates = scoreArray.length > 5 ? chartDates.slice(scoreArray.length - 5, scoreArray.length) : chartDates.slice(0, scoreArray.length);
                last5Scores = scoreArray.length > 5 ? scoreArray.slice(scoreArray.length - 5, scoreArray.length) : scoreArray;
            }

            chart.setConfig({
                type: 'line',
                data: {
                    labels: last5Dates,
                    datasets: [
                        {
                            label: `${ign.toUpperCase()} Weekly GPQ Scores`,
                            data: last5Scores,
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
                    layout: {
                        padding: {
                            left: 0,
                            right: 40,
                            top: 0,
                            bottom: 0
                        }
                    }
                },
            });
            chart.setWidth(600);

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