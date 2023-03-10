const { SlashCommandBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("crew")
		.setDescription("Alle commands zu deiner Crew!")
		.addSubcommand(sub => 
			sub.setName("create")
			.setDescription("Erstellt eine Crew")
			.addStringOption(option => option.setName("name").setDescription("Name der Crew").setRequired(true))
			.addStringOption(option => option.setName("tag").setDescription("Tag der Crew, max. 3 Zeichen!").setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName("invite")
			.setDescription("Lade jemanden zu deiner Crew ein")
			.addUserOption(option => option.setName("user").setDescription("Der User den du Einladen willst.").setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName("leave")
			.setDescription("Verlasse deine Crew")
			.addUserOption(option => option.setName("user").setDescription("Diese Option benutzen wenn du der Owner der Crew bist um den Besitzer zu wechseln."))
		)
		.addSubcommand(sub => 
			sub.setName("transfer")
			.setDescription("Übertrage deine Crew zu einem anderen User")
			.addUserOption(option => option.setName("user").setDescription("Der User den du die Crew übertragen willst").setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName("delete")
			.setDescription("Löscht deine Crew.")
		)
		.addSubcommand(sub => 
			sub.setName("kick")
			.setDescription("Kicke jemanden aus deiner Crew")
			.addUserOption(option => option.setName("user").setDescription("Der User den du kicken möchtest").setRequired(true))	
		)
		.addSubcommand(sub => 
			sub.setName("fix")
			.setDescription("Sollte deine Crew-Kategorie oder der Hauptchannel weg sein benutze diesen Command!")
		),
	async execute(interaction) {
		function checkCrew(entry) {
			let returnee = true
			for (let i=0;i<entry.length;i++) {
				let value = entry[i]
				for (let crew in crewDB) {
					if (crew != undefined) {
						if (crewDB[crew].name == value) {
							returnee = "Dieser Name wird bereits verwendet!"
						} else if (crewDB[crew].tag == value) {
							returnee = "Diser Tag wird bereits verwendet!"
						} else if (crewDB[crew].members.includes(value)) {
							returnee = "Du bist bereits in einer Crew!"
						} else if (crewDB[crew].owner == value) {
							returnee = "Du besitzt bereits eine Crew!"
						}
					}
				}
			}
			return returnee
		}

		function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}
		
		async function resetMembers(memberArray) {
			for (let member in memberArray) {
				const memberObj = await interaction.guild.members.fetch(memberArray[member])
				if (memberObj.manageable) {
					memberObj.setNickname(memberObj.user.username)
				}
			}
		}

		const { crewDB } = require("../index.js")
		if (crewDB[getCrew(interaction.user.id)]) {
			if (interaction.options._subcommand == "invite") {
				const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
					.setCustomId("acceptInvite")
					.setLabel("Accept")
					.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
					.setCustomId("declineInvite")
					.setLabel("Decline")
					.setStyle(ButtonStyle.Danger),
				);
				if (interaction.options.getUser("user") != interaction.user) {
					if (interaction.options.getUser("user").id != interaction.applicationId)
					if (checkCrew([interaction.options.getUser("user").id]) == true) {
						if (interaction.options.getUser("user").id != interaction.applicationId) {
							if (checkCrew([interaction.user.id]) == "Du besitzt bereits eine Crew!") {
								interaction.options.getUser("user").send({content: interaction.user.username + " hat dich zu einer Crew eingeladen!", components: [row]}).then(ch=> {
									interaction.reply({content: "Du hast <@!" + interaction.options.getUser("user") + "> zu deiner Crew eingeladen!", ephemeral:true})
									const collector = ch.createMessageComponentCollector({ time: 15000 });
									collector.on("collect", async i => {
										if (i.customId == "acceptInvite") {
											crewDB[getCrew(interaction.user.id)].members.push(interaction.options.getUser("user").id)
											let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
											interaction.guild.channels.cache.get(crewChId).permissionOverwrites.edit(interaction.options.getUser("user"),
												{
													ViewChannel:true
												}
											)
											if (interaction.guild.ownerId != interaction.options.getUser("user").id) {
												if (interaction.guild.members.cache.get(interaction.options.getUser("user").id).displayName.length <= 26) {
													await i.update({ content: 'Du hast die Einladung akzeptiert!', components: [] });
													interaction.guild.members.cache.get(interaction.options.getUser("user").id).setNickname("[" + crewDB[getCrew(interaction.user.id)].tag + "] " + interaction.guild.members.cache.get(interaction.options.getUser("user").id).displayName)
												} else {
													await i.update({ content: 'Du hast die Einladung akzeptiert!\nDeine Name war zu lang also konnte ich den Crew-Tag nicht einfügen!', components: [] });
													interaction.guild.members.cache.get(interaction.options.getUser("user").id).setNickname("[" + crewDB[getCrew(interaction.user.id)].tag + "] " + "TooLong")
												}
											} else {
												await i.update({ content: 'Du hast die Einladung akzeptiert!\nMir fehlen die Rechte deinen Namen zu ändern.', components: [] });
											}

											fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
												console.log(err);
											});
										} else {
											await i.update({ content: 'Du hast die Einladung abgelehnt!', components: [] });
										}
									});
								}).catch(() => interaction.reply({content:"Dieser User nimmt keine DMs an!",ephemeral:true}))
							} else {
								interaction.reply({content:"Du besitzt diese Crew nicht!",ephemeral:true})
							}
						} else {
							interaction.reply({content:"Ich kann in keine Crew eingeladen werden!",ephemeral:true})
						}
					} else {
						interaction.reply({content: "<@!" + interaction.options.getUser("user") + "> ist bereits in einer Crew! Benutze /crew leave um diese zu verlassen!", ephemeral:true})
					}
				} else {
					interaction.reply({content: "Du kannst dich selbst nicht einladen!", ephemeral:true})
				}
			} else if (interaction.options._subcommand == "leave") {
				if (checkCrew([interaction.user.id]) != true) {
					if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
						if (interaction.options.getUser("user") != undefined) {
							if (getCrew(interaction.options.getUser("user").id) == getCrew(interaction.user.id)) {
								let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
								interaction.guild.channels.cache.get(crewChId).permissionOverwrites.delete(interaction.user)
								crewDB[getCrew(interaction.user.id)].owner = interaction.options.getUser("user").id
								crewDB[getCrew(interaction.options.getUser("user").id)].members.splice(crewDB[getCrew(interaction.options.getUser("user").id)].members.indexOf(interaction.options.getUser("user").id), 1)

								fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
									console.log(err);
								});
								if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
									interaction.guild.members.cache.get(interaction.user.id).setNickname(interaction.user.username)
									interaction.reply({content:"Du hast die Crew verlassen und jemand anderes ist jetzt Besitzer!",ephemeral:true})
								} else {
									interaction.reply({content:"Du hast die Crew verlassen und jemand anderes ist jetzt Besitzer!\nMir fehlen die Rechte deinen Namen zu ändern.!",ephemeral:true})
								}
							} else {
								interaction.reply({content:"Dieser User ist nicht in der Crew!",ephemeral:true})
							}
						} else {
							interaction.reply({content:"Du hast keinen User angegeben um diesen Besitzer zu machen!", ephemeral:true})
						}
					} else {
						let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
						interaction.guild.channels.cache.get(crewChId).permissionOverwrites.delete(interaction.user)
						crewDB[getCrew(interaction.user.id)].members.splice(crewDB[getCrew(interaction.user.id)].members.indexOf(interaction.user.id), 1)

						fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
							console.log(err);
						});
						if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
							interaction.reply({content:"Du hast die Crew verlassen!",ephemeral:true})
							interaction.guild.members.cache.get(interaction.user.id).setNickname(interaction.user.username)
						} else {
							interaction.reply({content:"Du hast die Crew verlassen!\nMir fehlen die Rechte deinen Namen zu ändern.",ephemeral:true})
						}
					}
				} else {
					interaction.reply({content:"Du bist in keiner Crew!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "transfer") {
				let user = interaction.options.getUser("user")
				if (interaction.user.id != user.id) {
					if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
						if (getCrew(user.id) == getCrew(interaction.user.id)) {
							crewDB[getCrew(interaction.user.id)].owner = interaction.options.getUser("user").id
							crewDB[getCrew(user.id)].members.splice(crewDB[getCrew(interaction.options.getUser("user").id)].members.indexOf(interaction.options.getUser("user").id), 1)
							crewDB[getCrew(user.id)].members.push(interaction.user.id)

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
							interaction.reply({content:"Du hast <@!" + interaction.options.getUser("user").id + "> zu einem Besitzer gemacht!", ephemeral:true})
						} else {
							interaction.reply({content:"Dieser User ist nicht in der Crew!",ephemeral:true})
						}
					} else {
						interaction.reply({content:"Du bist nicht der Besitzer der Crew!",ephemeral:true})
					}
				} else {
					interaction.reply({content:"Du kannst dich selbst nicht zum Besitzer machen!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "delete") {
				if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
					if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
						interaction.reply({content:"Deine Crew wurde erfolgreich gelöscht!",ephemeral:true})
						resetMembers(crewDB[getCrew(interaction.user.id)].members)
						interaction.guild.members.cache.get(interaction.user.id).setNickname(interaction.user.username)
					} else {
						resetMembers(crewDB[getCrew(interaction.user.id)].members)
						interaction.reply({content:"Deine Crew wurde erfolgreich gelöscht!\nMir fehlen die Rechte deinen Namen zu ändern.",ephemeral:true})
					}
					if (interaction.guild.channels.cache.find(ch => ch.id == crewDB[getCrew(interaction.user.id)].categoryID)) {
						if (interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.size > 0) {
							let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
							interaction.guild.channels.cache.get(crewChId).delete()
							interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).delete()
						} else {
							interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).delete()
						}
					}

					delete crewDB[getCrew(interaction.user.id)]
					
					fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
						console.log(err);
					});
				} else {
					interaction.reply({content:"Du bist nicht der Besitzer deiner Crew!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "kick") {
				let user = interaction.options.getUser("user")
				if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
					if (getCrew(user.id) == getCrew(interaction.user.id)) {
						let crewChId = interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.firstKey()
						interaction.guild.channels.cache.get(crewChId).permissionOverwrites.delete(interaction.options.getUser("user"))
						crewDB[getCrew(interaction.options.getUser("user").id)].members.splice(crewDB[getCrew(interaction.options.getUser("user").id)].members.indexOf(interaction.options.getUser("user").id), 1)

						fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
							console.log(err);
						});
						if (interaction.guild.ownerId != interaction.options.getUser("user").id) {
							interaction.reply({content:"Du hast <@!" + interaction.options.getUser("user").id + "> aus deiner Crew gekickt!",ephemeral:true})
							interaction.guild.members.cache.get(interaction.options.getUser("user").id).setNickname(interaction.options.getUser("user").username)
						} else {
							interaction.reply({content:"Du hast <@!" + interaction.options.getUser("user").id + "> aus deiner Crew gekickt!\nMir fehlen die Rechte den Namen zu ändern.!",ephemeral:true})
						}
					} else {
						interaction.reply({content:"Dieser User ist nicht in deiner Crew!",ephemeral:true})
					}
				} else {
					interaction.reply({content:"Du bist nicht der Besitzer dieser Crew!",ephemeral:true})
				}
			} else if (interaction.options._subcommand == "fix") {
				if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
					if (interaction.guild.channels.cache.find(ch => ch.id == crewDB[getCrew(interaction.user.id)].categoryID)) {
						if (interaction.guild.channels.cache.get(crewDB[getCrew(interaction.user.id)].categoryID).children.cache.size > 0) {
							interaction.reply({content:"Die Kategorie und der Channel sind innermoch vorhanden!",ephemeral:true})
						} else {
							interaction.guild.channels.create({name:"crew-chat",type:ChannelType.GuildText,parent:crewDB[getCrew(interaction.user.id)].categoryID}).then(chh => {
								chh.permissionOverwrites.set([
									{
										id: interaction.guild.roles.everyone,
										deny: [PermissionFlagsBits.ViewChannel]
									},
									{
										id: interaction.user.id,
										allow: [PermissionFlagsBits.ViewChannel]
									}
								])
								for (let member in crewDB[getCrew(interaction.user.id)].members) {
									chh.permissionOverwrites.edit(interaction.client.users.cache.get(crewDB[getCrew(interaction.user.id)].members[member]),
										{
											ViewChannel:true
										}
									)
								}
							})
							interaction.reply({content:"Ich habe die Kategorie gefixxt!",ephemeral:true})
						}
					} else {
						await interaction.guild.channels.create({name:getCrew(interaction.user.id),type:ChannelType.GuildCategory}).then(ch => {
							crewDB[getCrew(interaction.user.id)].categoryID = ch.id
							interaction.guild.channels.create({name:"crew-chat",type:ChannelType.GuildText,parent:ch.id}).then(chh => {
								chh.permissionOverwrites.set([
									{
										id: interaction.guild.roles.everyone,
										deny: [PermissionFlagsBits.ViewChannel]
									},
									{
										id: interaction.user.id,
										allow: [PermissionFlagsBits.ViewChannel]
									}
								])
								for (let member in crewDB[getCrew(interaction.user.id)].members) {
									chh.permissionOverwrites.edit(interaction.client.users.cache.get(crewDB[getCrew(interaction.user.id)].members[member]),
										{
											ViewChannel:true
										}
									)
								}
							})
						})
						fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
							console.log(err);
						});
						interaction.reply({content:"Ich habe die Kategorie gefixxt!",ephemeral:true})
					}
				} else {
					interaction.reply({content:"Du bist nicht der Owner deiner Crew!",ephemeral:true})
				}
			}
		} else {
			if (interaction.options._subcommand != "create") {
				interaction.reply({content:"Du kannst diese Commands nur benutzen wenn du in einer Crew bist!",ephemeral:true})
			}
		}
		if (interaction.options._subcommand == "create") {
			if (interaction.options.getString("tag").length <= 3) {
				if (checkCrew([interaction.options.getString("name"), interaction.options.getString("tag"), interaction.user.id]) == true ) {
					crewDB[interaction.options.getString("name")] = {
						name: interaction.options.getString("name"),
						tag: interaction.options.getString("tag").toUpperCase(),
						members: [],
						owner: interaction.user.id,
						categoryID: "",
						tokens: 0,
						items: []
					}
					await interaction.guild.channels.create({name:getCrew(interaction.user.id),type:ChannelType.GuildCategory}).then(ch => {
						crewDB[getCrew(interaction.user.id)].categoryID = ch.id
						interaction.guild.channels.create({name:"crew-chat",type:ChannelType.GuildText,parent:ch.id}).then(chh => {
							chh.permissionOverwrites.set([
								{
									id: interaction.guild.roles.everyone,
									deny: [PermissionFlagsBits.ViewChannel]
								},
								{
									id: interaction.user.id,
									allow: [PermissionFlagsBits.ViewChannel]
								}
							])
						})
					})
					fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
						console.log(err);
					});
					if (interaction.guild.members.cache.get(interaction.user.id).manageable) {
						if (interaction.guild.members.cache.get(interaction.user.id).displayName.length <= 26) {
							interaction.reply({ content: "Du hast eine neue Crew namens [" + crewDB[interaction.options.getString("name")].tag + "] " + crewDB[interaction.options.getString("name")].name + " erstellt!", ephemeral: true })
							interaction.guild.members.cache.get(interaction.user.id).setNickname("[" + crewDB[interaction.options.getString("name")].tag + "] " + interaction.guild.members.cache.get(interaction.user.id).displayName)
						} else {
							interaction.reply({ content: "Du hast eine neue Crew namens [" + crewDB[interaction.options.getString("name")].tag + "] " + crewDB[interaction.options.getString("name")].name + "erstellt!\nDeine Name war zu lang also konnte ich den Crew-Tag nicht einfügen.", ephemeral: true })
						}
					} else {
						interaction.reply({ content: "Du hast eine neue Crew namens [" + crewDB[interaction.options.getString("name")].tag + "] " + crewDB[interaction.options.getString("name")].name + "erstellt.\nMir fehlen die Rechte deinen Namen zu ändern.", ephemeral: true })
					}
				} else {
					interaction.reply({content: checkCrew([interaction.options.getString("name"), interaction.options.getString("tag"), interaction.user.id]), ephemeral: true})
				}
			} else {
				interaction.reply({ content: "Der Tag ist zu lang!", ephemeral: true })
			}
		}
	},
};
