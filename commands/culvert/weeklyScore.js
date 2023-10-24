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
        const spreadsheetId = '10l__Q8YK5CIl256YaRVDYjDHvd08RJbdef52LxdnF7s';
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: "Guild Scores!!A:B",
        });

        const chartLablels = [];
        const chartData = [];

        for(let i = 1; i < getRows.data.values.length; i++){
            if(getRows.data.values[i][1] !== '0'){
                chartLablels.push(getRows.data.values[i][0]);
                chartData.push(parseInt(getRows.data.values[i][1].replace(/,/g, ''), 10));
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