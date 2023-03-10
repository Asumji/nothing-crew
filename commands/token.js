const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("points")
		.setDescription("Verändere die Punkte einer Crew (Manage Server Permissions)")
        .addSubcommand(sub => 
            sub.setName("add")
            .setDescription("Füge Punkte zu einer Crew hinzu")
            .addStringOption(option => option.setName("crew").setDescription("Die Crew der du Punkte geben willst").setRequired(true))
            .addIntegerOption(option => option.setName("amount").setDescription("Die Anzahl an Punkten").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("remove")
            .setDescription("Nehme einer Crew Punkte weg")
            .addStringOption(option => option.setName("crew").setDescription("Die Crew der du Punkte wegnehmen willst").setRequired(true))
            .addIntegerOption(option => option.setName("amount").setDescription("Die Anzahl an Punkten").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("set")
            .setDescription("Setze die Punkte einer Crew")
            .addStringOption(option => option.setName("crew").setDescription("Die Crew der du Punkte manipulieren willst").setRequired(true))
            .addIntegerOption(option => option.setName("amount").setDescription("Die Anzahl an Punkten auf die, die Crew gesetzt wird").setRequired(true))
        ),
    async execute(interaction) {
        const { crewDB } = require("../index.js")
        if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
            if (crewDB.hasOwnProperty(interaction.options.getString("crew"))) {
                if (interaction.options._subcommand == "add") {
                    crewDB[interaction.options.getString("crew")].tokens += interaction.options.getInteger("amount")
                    interaction.reply({content:"Du hast " + interaction.options.getInteger("amount").toString() + " Punkte zu der Crew " + interaction.options.getString("crew") + " hinzugefügt.",ephemeral:true})
                } else if (interaction.options._subcommand == "remove") {
                    crewDB[interaction.options.getString("crew")].tokens -= interaction.options.getInteger("amount")
                    interaction.reply({content:"Du hast " + interaction.options.getInteger("amount").toString() + " Punkten von der Crew " + interaction.options.getString("crew") + " weggenommen!",ephemeral:true})
                } else if (interaction.options._subcommand == "set") {
                    crewDB[interaction.options.getString("crew")].tokens = interaction.options.getInteger("amount")
                    interaction.reply({content:"Du hast die Punkte von der Crew " + interaction.options.getString("crew") + " auf " + interaction.options.getInteger("amount").toString() + " Punkte gesetzt!",ephemeral:true})
                }
                fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
					console.log(err);
				});
            } else {
                interaction.reply({content:"Diese Crew existiert nicht!", ephemeral:true})
            }
        } else {
            interaction.reply({content:"Du hast die Rechte zu diesen Command nicht!", ephemeral:true})
        }
    }
}