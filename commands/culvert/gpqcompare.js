const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const QuickChart = require('quickchart-js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('gpqcompare')
        .setDescription('Fetches the culvert stats of multiple character.')
        .addStringOption(option =>
            option.setName('igns')
                .setDescription('IGN of characters you want to get the GPQ stats of SEPARATED BY SPACES.')
                .setRequired(true))
    ,
    async execute(interaction) {
        const igns = interaction.options.getString('igns');

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

        const charIndexArray = [];
        const ignArray = igns.split(" ");

        for (let i = 0; i < getColumns.data.values.length; i++) {
            for (let j = 0; j < ignArray.length; j++) {
                if (getColumns.data.values[i][0].toLowerCase() === ignArray[j].toLowerCase()) {
                    charIndexArray.push(i);
                }
            }
        }

        if (charIndexArray.length <= 0) {
            await interaction.reply({ content: 'Unable to find the character! Please make sure they are in the guild!', ephemeral: true });
        } else {

            const chartData = [];

            for (let k = 0; k < charIndexArray.length; k++) {
                const charInfo = getColumns.data.values[charIndexArray[k]];
                const scoreArray = charInfo.slice(11, charInfo.length);
                
                scoreArray.forEach((el, index) => {
                    scoreArray[index] = parseInt(el.replace(/,/g, ''), 10);
                });

                chartData.push({
                    label: `${charInfo[0].toUpperCase()}`,
                    data: scoreArray,
                    fill: false,
                    borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                });
            }

            const chartDates = getColumns.data.values[0].slice(11, getColumns.data.values[charIndexArray[0]].length);

            const chart = new QuickChart();
            chart.setWidth(500)
            chart.setHeight(300);
            chart.setVersion('2.9.4');

            chart.setConfig({
                type: 'line',
                data: {
                    labels: chartDates,
                    datasets: chartData,
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

            const imgUrl = chart.getUrl();

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`GPQ Score Comparison`)
                .setImage(imgUrl)
                .setTimestamp()

            await interaction.reply({ embeds: [embed] });
        }
    },
};