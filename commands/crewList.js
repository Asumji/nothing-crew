const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("list")
		.setDescription("Zeigt eine Liste aller Crews an!")
        .addChannelOption(option => option.setName("channel").setDescription("Setze den Channel für automatische Crew Anzeigen. (Manage Server Permissions)")),
    async execute(interaction) {
        const { crewDB, channelDB } = require("../index.js")
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
        
        if (interaction.options.getChannel("channel") == null) {
            const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("Alle Crews")
            .setDescription(getCrews())

            interaction.reply({embeds:[embed],ephemeral: true})
        } else {
            if (interaction.options.getChannel("channel").type == 0) {
                if (interaction.options.getChannel("channel").manageable) {
                    const embed = new EmbedBuilder()
                    .setColor("Random")
                    .setTitle("Alle Crews")
                    .setDescription(getCrews())
                    interaction.options.getChannel("channel").send({embeds:[embed]}).then(msg => {
                        msg.pin()
                        channelDB["allcrews"] = {
                            message: msg.id,
                            id: interaction.options.getChannel("channel").id,
                            interval: 10000
                        }

                        fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
                            console.log(err);
                        });
                    })
                } else {
                    interaction.reply({content:"Ich habe für diesen Kanal nicht ausreichend Rechte.",ephemeral: true})
                }
            } else {
                interaction.reply({content:"Der Kanal muss ein Textkanal sein.",ephemeral: true})
            }
        }
    }
}