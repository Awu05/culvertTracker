const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const QuickChart = require('quickchart-js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('gpqprog')
        .setDescription('Fetches the culvert score to date.')
    ,
    async execute(interaction) {
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
            range: "Guild Scores!!A:B",
        });

        const chartLablels = [];
        const chartData = [];

        for (let i = 1; i < getRows.data.values.length; i++) {
            if (getRows.data.values[i][1] !== '0') {
                try {
                    const score = parseInt(getRows.data.values[i][1].replace(/,/g, ''), 10);
                    if (score !== undefined || score !== 'undefined') {
                        chartLablels.push(getRows.data.values[i][0]);
                        console.log('score: ', getRows.data.values[i][1]);
                        chartData.push(score);
                    }
                } catch (e) {
                    console.log('error: ', e);
                    break;
                }
            }
        }

        const chart = new QuickChart();

        chart.setWidth(500)
        chart.setHeight(300);
        chart.setVersion('2.9.4');

        chart.setConfig({
            type: 'bar',
            data: {
                labels: chartLablels,
                datasets: [
                    {
                        label: 'Meditation Weekly GPQ Score',
                        data: chartData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1,
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

        const imgUrl = chart.getUrl();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Meditation Weekly GPQ Score')
            .setImage(imgUrl)
            .setTimestamp()

        await interaction.reply({ embeds: [embed] });
    },
};