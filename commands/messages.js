const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("message")
		.setDescription("Alles zu dem Nachrichten Counter.")
        .addSubcommand(sub =>
			sub.setName("leaderboard")
			.setDescription("Die tägliche/monatliche Nachrichten-Rangliste")
			.addStringOption(option => option.setName("type").setDescription("Die zu anzeigende Rangliste").setRequired(true).addChoices({name:"Monatlich", value:"monthly"},{name:"Täglich",value:"daily"}))
            .addIntegerOption(option => option.setName("amount").setDescription("Wie viele User sollen angezeigt werden?").setRequired(true))
		),
    async execute(interaction) {
        const { msgDB } = require("../index.js")
        
        const embed = new EmbedBuilder()
        if (interaction.options.getString("type") == "monthly") {
            let topString = ""

            let i = 0
            for (user in msgDB) {
                i++
                if (i <= interaction.options.getInteger("amount")) {
                    if (user != "reset") {
                        topString += `${i.toString()}. <@!${user}> (${msgDB[user].topMonth})\n`
                    }
                }
            }

            embed.setTitle(`Top ${interaction.options.getInteger("amount").toString()} monatliche Nachrichten`)
            .setColor("Random")
            .setDescription(topString)

            interaction.reply({embeds:[embed],ephemeral:true})
        } else if (interaction.options.getString("type") == "daily") {
            let topString = ""

            let i = 0
            for (user in msgDB) {
                i++
                if (i <= interaction.options.getInteger("amount")) {
                    if (user != "reset") {
                        topString += `${i.toString()}. <@!${user}> (${msgDB[user].msgsDaily})\n`
                    }
                }
            }

            embed.setTitle(`Top ${interaction.options.getInteger("amount").toString()} tägliche Nachrichten`)
            .setColor("Random")
            .setDescription(topString)

            interaction.reply({embeds:[embed],ephemeral:true})
        } else {
            interaction.reply({content:"Der Typ existiert nicht!\n(Das sollte eigentlich nicht passieren bei vermehrtem Auftreten bitte Asumji#2143 dmen.)", ephemeral:true})
        }
    }
}