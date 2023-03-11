const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("list")
		.setDescription("Zeigt eine Liste aller Crews an!"),
    async execute(interaction) {
        const { crewDB } = require("../index.js")
        function getCrews() {
            let string = ""
            if (Object.keys(crewDB).length >= 1) {
                for (let crew in crewDB) {
                    string = string + "**[" + crewDB[crew].tag + "] " + crewDB[crew].name + "**\nOwner: <@!" + crewDB[crew].owner + ">" + "\nMitglieder: " 
                    for (let member in crewDB[crew].members) {
                        string = string + "<@!" + crewDB[crew].members[member] + "> "
                    }
                    string = string + "\nPunkte: " + crewDB[crew].tokens.toString() + "\n\n"
                }
            } else {
                string = "Es gibt derzeit keine Crews!"
            }
            return string
        }

        const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle("Alle Crews")
        .setDescription(getCrews())

        interaction.reply({embeds:[embed],ephemeral: true})
    }
}