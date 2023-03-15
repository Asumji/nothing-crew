const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs")

module.exports = {
	data: new SlashCommandBuilder()
		.setName("trade")
		.setDescription("Handle mit einer anderen Crew")
		.addStringOption(option => option.setName("crew").setDescription("Die Crew mit der du handeln willst").setRequired(true))
		.addStringOption(option => option.setName("type").setDescription("Den Typ was du handeln willst").setRequired(true).addChoices({name:"Punkte", value:"token"},{name:"Item",value:"item"}))
		.addStringOption(option => option.setName("value").setDescription("Anzahl an Punkte oder den Name des Items").setRequired(true)),
    async execute(interaction) {
		const { crewDB } = require("../index.js")

        function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}

		if (getCrew(interaction.user.id) != undefined) {
			if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
				if (crewDB.hasOwnProperty(interaction.options.getString("crew"))) {
					if (interaction.options.getString("crew") != crewDB[getCrew(interaction.user.id)].name) {
						if (interaction.options.getString("type") == "token") {
							if (!isNaN(interaction.options.getString("value"))) {
								if (crewDB[getCrew(interaction.user.id)].tokens >= Number(interaction.options.getString("value"))) {
									crewDB[interaction.options.getString("crew")].tokens += Number(interaction.options.getString("value"))
									crewDB[getCrew(interaction.user.id)].tokens -= Number(interaction.options.getString("value"))
									fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
										console.log(err);
									});
									interaction.reply({content:"Du hast " + interaction.options.getString("value") + " " + interaction.options.getString("crew") + " Punkte gegeben!", ephemeral:true})
								} else {
									interaction.reply({content:"Deine Crew hat nicht genug Punkte!", ephemeral:true})
								}
							} else {
								interaction.reply({content:"Die Anzahl war keine Zahl!", ephemeral:true})
							}
						} else if (interaction.options.getString("type") == "item") {
							if (crewDB[getCrew(interaction.user.id)].items.includes(interaction.options.getString("value"))) {
								if (!crewDB[interaction.options.getString("crew")].items.includes(interaction.options.getString("value"))) {
									crewDB[getCrew(interaction.user.id)].items.splice(crewDB[getCrew(interaction.user.id)].items.indexOf(interaction.options.getString("value")), 1)
									crewDB[interaction.options.getString("crew")].items.push(interaction.options.getString("value"))
									fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
										console.log(err);
									});
									interaction.reply({content:"Du hast " + interaction.options.getString("value") + " das Item " + interaction.options.getString("crew") + " gegeben!", ephemeral:true})
								} else {
									interaction.reply({content:"Diese Crew hat dieses Item bereits!", ephemeral:true})
								}
							} else {
								interaction.reply({content:"Du besitzst dieses Item nicht!", ephemeral:true})
							}
						} else {
							interaction.reply({content:"Der Typ existiert nicht!\n(Das sollte eigentlich nicht passieren bei vermehrtem Auftreten bitte Asumji#2143 dmen.)", ephemeral:true})
						}
					} else {
						interaction.reply({content:"Du kansnt nicht mit deiner eigenen Crew handeln!", ephemeral:true})
					}
				} else {
					interaction.reply({content:"Diese Crew existiert nicht!", ephemeral:true})
				}
			} else {
				interaction.reply({content:"Du bist nicht der Besitzer deiner Crew!",ephemeral:true})
			}
		} else {
			interaction.reply({content:"Du kannst diese Commands nur benutzen wenn du in einer Crew bist!",ephemeral:true})
		}
    }
}
