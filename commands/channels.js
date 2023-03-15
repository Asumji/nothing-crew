const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("channel")
		.setDescription("Setzt verschiedene Kanäle. (Manage Server Permissions)")
        .addSubcommand(sub => 
            sub.setName("crewdisplay")
            .setDescription("Setze den Kanal für eine automatische Crew Liste")
            .addChannelOption(option => option.setName("channel").setDescription("Der Kanal in dem die Anzeige geschickt wird.").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("redeemitem")
            .setDescription("Setze den Kanal für Item-Tickets")
            .addChannelOption(option => option.setName("channel").setDescription("Der Forumkanal in dem das Ticket geöffnet wird.").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("quests")
            .setDescription("Setze den Kanal für die täglichen Crew-Aufgaben.")
            .addChannelOption(option => option.setName("channel").setDescription("Der Kanal in dem die Aufgaben gesendet werden.").setRequired(true))
            .addIntegerOption(option => option.setName("time").setDescription("Die Uhrzeit wann die Aufgaben gesendet werden.").setRequired(true))
            .addChannelOption(option => option.setName("media").setDescription("Der Kanal in dem User Bilder senden.").setRequired(true))
        ),
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
        if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
            if (interaction.options._subcommand == "crewdisplay") {
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

                            interaction.reply({content:"Der Kanal <#" + interaction.options.getChannel("channel") + "> wurde als Anzeigekanal gesetzt!",ephemeral: true})
                        })
                    } else {
                        interaction.reply({content:"Ich habe für diesen Kanal nicht ausreichend Rechte.",ephemeral: true})
                    }
                } else {
                    interaction.reply({content:"Der Kanal muss ein Textkanal sein.",ephemeral: true})
                }
            } else if (interaction.options._subcommand == "redeemitem") {
                if (interaction.options.getChannel("channel").type == 15) {
                    if (interaction.options.getChannel("channel").manageable) {
                        channelDB["redeemitem"] = {
                            id: interaction.options.getChannel("channel").id
                        }

                        fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
                            console.log(err);
                        });
                        interaction.options.getChannel("channel").threads.create({name:"Item-Einlösung", message:{content:"In diesem Forumkanal werden alle Tickets geöffnet wenn Spieler Items kaufen."}})
                    } else {
                        interaction.reply({content:"Ich habe für diesen Kanal nicht ausreichend Rechte.",ephemeral: true})
                    }
                } else {
                    interaction.reply({content:"Der Kanal muss ein Forumkanal sein.",ephemeral: true})
                }
            } else if (interaction.options._subcommand == "quests") {
                if (interaction.options.getChannel("channel").type == 0) {
                    if (interaction.options.getChannel("channel").manageable) {
                        if (interaction.options.getInteger("time") > 0 && interaction.options.getInteger("time") < 25) {
                            channelDB["quests"] = {
                                lastSunday: null,
                                guildid: interaction.guild.id,
                                id: interaction.options.getChannel("channel").id,
                                time: interaction.options.getInteger("time"),
                                mediaid: interaction.options.getChannel("media").id,
                                sent: false,
                                msgs: 0,
                                inv: 0,
                                voice: 0,
                                pics: 0
                            }

                            fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
                                console.log(err);
                            });
                            interaction.reply({content:"Der Kanal <#" + interaction.options.getChannel("channel") + "> wurde als Aufgabenkanal gesetzt und User müssen Bilder in <#" + interaction.options.getChannel("media") + "> senden.",ephemeral:true})
                        } else {
                            interaction.reply({content:"Die Uhrzeit muss zwischen 1 und 24 liegen.",ephemeral: true})
                        }
                    } else {
                        interaction.reply({content:"Ich habe für diesen Kanal nicht ausreichend Rechte.",ephemeral: true})
                    }
                } else {
                    interaction.reply({content:"Der Kanal muss ein Textkanal sein.",ephemeral: true})
                }
            }
        } else {
            interaction.reply({content:"Du hast die Rechte zu diesen Command nicht!", ephemeral:true})
        }
    }
}