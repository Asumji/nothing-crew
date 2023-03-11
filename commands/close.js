const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("node:fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("close")
		.setDescription("Schließt ein Item-Ticket! (Nur in Item-Tickets verfügbar)"),
    async execute(interaction) {
        const { channelDB, client } = require("../index.js");
        if (interaction.channel.type == 11) {
            if (interaction.channel.name.includes("Item Gekauft - ")) {
                if (channelDB.hasOwnProperty(interaction.channel.id)) {
                    await client.users.cache.get(channelDB[interaction.channel.id].ownerid).send("Das Item-Ticket wurde geschlossen.").catch(() => message.channel.send("Der User nimmt keine DMs an also konnte ich deine Nachricht nicht abschicken."))
                    delete channelDB[interaction.channel.id]

                    fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
                        console.log(err);
                    });
                    interaction.reply({content:"Das Item-Ticket wurde erfolgreich geschlossen!"})
                    interaction.channel.setArchived()
                } else {
                    interaction.reply({content:"Dieser Command kann hier nicht genutzt werden!",ephemeral:true})
                }
            } else {
                interaction.reply({content:"Dieser Command kann hier nicht genutzt werden!",ephemeral:true})
            }
        } else {
            interaction.reply({content:"Dieser Command kann hier nicht genutzt werden!",ephemeral:true})
        }
    }
}