const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("battle")
		.setDescription("Challanges a rival crew to a battle!")
        .addUserOption(option => option.setName("user").setDescription("The owner of the guild you want to battle!").setRequired(true))
        .addIntegerOption(option => option.setName("bet").setDescription("The amount you want to bet!").setRequired(true)),
    async execute(interaction) {
        const { crewDB } = require("../index.js")

        function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}

        function ownsCrew(userID) {
            let ownCrew = false
            for (let crew in crewDB) {
                if (crewDB[crew].owner == userID) {
                    ownCrew = true
                }
            }
            return ownCrew
        }

        if (ownsCrew(interaction.options.getUser("user").id)) {
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId("acceptBattle")
                .setLabel("Accept")
                .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                .setCustomId("declineBattle")
                .setLabel("Decline")
                .setStyle(ButtonStyle.Danger),
            );
            interaction.options.getUser("user").send(({content: getCrew(interaction.user.id) + " have challenged your crew to a battle for " + interaction.options.getInteger("bet").toString() + " tokens!", components: [row]})).then(ch => {
                collector.on("collect", async i => {
                    if (i.customId == "acceptBattle") {
                        await i.update({ content: 'You accepted the battle!', components: [] });
                        if (interaction.guild.channels.cache.find(ch => ch.id == crewDB[getCrew(interaction.user.id)].categoryID) && interaction.guild.channels.cache.find(ch => ch.id == crewDB[getCrew(interaction.options.getUser("user"))].categoryID)) {
                            if (interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.size > 0 && interaction.guild.channels.cache.get(crewDB[getCrew(interaction.options.getUser("user"))].categoryID).children.cache.size > 0) {
                            } else {
                                await i.update({ content: 'Your or the rival crew\'s crew category is missing! Fix this by using /crew fix', components: [] });
                            }
                        } else {
                            await i.update({ content: 'Your or the rival crew\'s crew channel is missing! Fix this by using /crew fix', components: [] });
                        }
                    } else {
                        await i.update({ content: 'You declined the battle!', components: [] });
                    }
                });
            }).catch(() => interaction.reply({content:"The owner of the crew you tried to battle does not accept DMs, tell them to enable DMs!",ephemeral:true}))
            interaction.reply({content:"You challenged " + getCrew(interaction.options.getUser("user").id) + " to a battle for " + interaction.options.getInteger("bet").toString() + " tokens!",ephemeral:true})
        } else {
            interaction.reply({content:"That user doesn't own a crew!", ephemeral:true})
        }
    }
}