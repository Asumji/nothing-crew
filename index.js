const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');

const boltEmoji = "<:blitz:1084446091698778154>"
const arrowEmoji = "<:arrow:1084446088938917889>"
const goldArrowEmoji = "<:arrow2:1084873571416932372>"
const goldBoltEmoji = "<:blitz2:1084873573736398888>"

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildVoiceStates] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
let timeoutActive = false

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

function db(file) {
    var dbb = JSON.parse(fs.readFileSync("./databases/" + file, "utf8"));
    return dbb
}
const crewDB = db("crew.json")
const shopDB = db("shop.json")
const channelDB = db("channels.json")
const questDB = db("quests.json")
const msgDB = db("msgs.json")
module.exports = { crewDB, shopDB, client, channelDB, msgDB }

function getCrew(userID) {
	for (let crew in crewDB) {
		if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
			return crew
		}
	}
	return undefined
}

let is2ndSundayLet = false
function is2ndSunday() {
	const date = new Date(Date.now())
	if (date.getDay() == 0) {
		if (channelDB["quests"]) {
			if (channelDB["quests"].lastSunday == null) {
				channelDB["quests"].lastSunday = Math.floor(date / 86400000 - 7)

				fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
					console.log(err);
				});

				return false
			} else {
				if ((Math.floor(date / 86400000) - channelDB["quests"].lastSunday) == 14) {
					channelDB["quests"].lastSunday = Math.floor(date / 86400000)

					fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
						console.log(err);
					});

					return true 
				}
			}
		}
	}
}

function getRndInt(min,max) { return Math.floor(Math.random() * (max - min)) + min }

function generateQuests() {
	let msgs, invites, voice, pics
	if (is2ndSundayLet) {
		msgs = getRndInt(50,101)
		invites = getRndInt(1,4)
		voice = getRndInt(2,5)
		pics = getRndInt(1,6)
	} else {
		msgs = getRndInt(100,301)
		invites = getRndInt(2,6)
		voice = getRndInt(4,7)
		pics = getRndInt(5,11)
	}

	channelDB["quests"] = {
		lastSunday: channelDB["quests"].lastSunday,
		guildid: channelDB["quests"].guildid,
        id: channelDB["quests"].id,
        time: channelDB["quests"].time,
		mediaid: channelDB["quests"].mediaid,
		sent: channelDB["quests"].sent,
		msgs: msgs,
		inv: invites,
		voice: voice,
		pics: pics
	}

	fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
		console.log(err);
	});

	if (is2ndSundayLet) {
		is2ndSundayLet = false
		//return `${goldArrowEmoji} **Nachrichten:** ${msgs.toString()} | **Wert:** 30 Punkte\n\n${goldArrowEmoji} **Einladungen:** ${invites.toString()} | **Wert:** 30 Punkte\n\n${goldArrowEmoji} **Voice-Stunden:** ${voice.toString()} | **Wert:** 30 Punkte\n\n${goldArrowEmoji} **Bilder in Medien:** ${pics.toString()} | **Wert:** 30 Punkte`
		return `${goldArrowEmoji} **Nachrichten:** ${msgs.toString()} | **Wert:** 30 Punkte\n\n${goldArrowEmoji} **Voice-Stunden:** ${voice.toString()} | **Wert:** 30 Punkte\n\n${goldArrowEmoji} **Bilder in Medien:** ${pics.toString()} | **Wert:** 30 Punkte`
	} else {
		//return `${arrowEmoji} **Nachrichten:** ${msgs.toString()} | **Wert:** 15 Punkte\n\n${arrowEmoji} **Einladungen:** ${invites.toString()} | **Wert:** 15 Punkte\n\n${arrowEmoji} **Voice-Stunden:** ${voice.toString()} | **Wert:** 15 Punkte\n\n${arrowEmoji} **Bilder in Medien:** ${pics.toString()} | **Wert:** 15 Punkte`
		return `${arrowEmoji} **Nachrichten:** ${msgs.toString()} | **Wert:** 15 Punkte\n\n${arrowEmoji} **Voice-Stunden:** ${voice.toString()} | **Wert:** 15 Punkte\n\n${arrowEmoji} **Bilder in Medien:** ${pics.toString()} | **Wert:** 15 Punkte`
	}
}

async function amountOfUsersInChannel(id) {
	let amount = 0
	if (channelDB["quests"]) {
		const guild = await client.guilds.fetch(channelDB["quests"].guildid)
		const voiceMembers = guild.members.cache.filter(member => member.voice.channel)
		voiceMembers.forEach(async member => {
			if (member.voice.channelId == id) {
				amount++
			}
		})
	}
	return amount
}

function floatingPointAddition(num) {
	if (!num.toString().includes(".")) {
		num = Number(num.toString() + ".1")
	} else {
		front = num.toString().split(".")[0]
		num = Number(num.toString().split(".")[1])
		if (num == 9) {
			front++
			num = Number(front.toString() + ".0")
		} else {
			num++
			num = Number(front + "." + num.toString())
		}
	}
	return num
}

setInterval(async () => {
	if (channelDB["quests"]) {
		const guild = await client.guilds.fetch(channelDB["quests"].guildid)
		const voiceMembers = guild.members.cache.filter(member => member.voice.channel)
		voiceMembers.forEach(async member => {
			if (member.voice.selfMute == false && member.voice.serverMute == false && getCrew(member.id) != undefined) {
				if (await amountOfUsersInChannel(member.voice.channelId) >= 2) {
					if (!questDB[member.id]) {
						questDB[member.id] = {
							msgs: 0,
							inv: 0,
							voice: 0.1,
							pics: 0
						}
					} else {
						questDB[member.id].voice = floatingPointAddition(questDB[member.id].voice)
					}

					fs.writeFileSync("./databases/quests.json", JSON.stringify(questDB, null, 4), err => {
						console.log(err);
					});
				}
			}
		})
	}
}, 360000);

client.once('ready', () => {
	console.log('Ready!');

	setInterval(() => {
		if (channelDB["quests"] && client.guilds.cache.get(channelDB["quests"].guildid).channels.cache.get(channelDB["quests"].id) != undefined) {
			const time = new Date(Date.now()).toLocaleTimeString("de-DE")
			if (time.toString().split(":")[0] == channelDB["quests"].time.toString() && channelDB["quests"].sent == false) {

				for (crew in crewDB) {
					if (crewDB[crew].members.length < 2) {
						delete crewDB[crew]

						fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
							console.log(err);
						});
					}
				}

				if (!is2ndSunday()) {
					for (user in questDB) {
						if (questDB[user].msgs >= channelDB["quests"].msgs && channelDB["quests"].msgs != 0) {
							crewDB[getCrew(user)].tokens += 15

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
						}
						if (questDB[user].voice >= channelDB["quests"].voice && channelDB["quests"].voice != 0) {
							crewDB[getCrew(user)].tokens += 15

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
						}
						if (questDB[user].pics >= channelDB["quests"].pics && channelDB["quests"].pics != 0) {
							crewDB[getCrew(user)].tokens += 15

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
						}

						questDB[user] = {
							msgs: 0,
							inv: 0,
							voice: 0,
							pics: 0
						}
	
						fs.writeFileSync("./databases/quests.json", JSON.stringify(questDB, null, 4), err => {
							console.log(err);
						});
					}
				} else {
					is2ndSundayLet = true
					for (user in questDB) {
						if (questDB[user].msgs >= channelDB["quests"].msgs && channelDB["quests"].msgs != 0) {
							crewDB[getCrew(user)].tokens += 30

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
						}
						if (questDB[user].voice >= channelDB["quests"].voice && channelDB["quests"].voice != 0) {
							crewDB[getCrew(user)].tokens += 30

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
						}
						if (questDB[user].pics >= channelDB["quests"].pics && channelDB["quests"].pics != 0) {
							crewDB[getCrew(user)].tokens += 30

							fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
								console.log(err);
							});
						}

						questDB[user] = {
							msgs: 0,
							inv: 0,
							voice: 0,
							pics: 0
						}
	
						fs.writeFileSync("./databases/quests.json", JSON.stringify(questDB, null, 4), err => {
							console.log(err);
						});
					}
				}

				if (is2ndSundayLet) {
					const embed = new EmbedBuilder()
					.setTitle(goldBoltEmoji + " Goldene-Aufgaben " + goldBoltEmoji)
					.setColor(0xd6a70f)
					.setDescription(generateQuests())
					.setFooter({text:"Die Aufgaben werden jeden Tag um " + channelDB["quests"].time.toString() + " Uhr resettet! Viel Glück! (Jeden 2. Sonntag gibt es Goldene Aufgaben)",iconURL:"https://i.imgur.com/o1CnNtX.png"})

					client.guilds.cache.get(channelDB["quests"].guildid).channels.cache.get(channelDB["quests"].id).send({embeds:[embed]})
				} else {
					const embed = new EmbedBuilder()
					.setTitle(boltEmoji + " Aufgaben " + boltEmoji)
					.setColor(0xef3d63)
					.setDescription(generateQuests())
					.setFooter({text:"Die Aufgaben werden jeden Tag um " + channelDB["quests"].time.toString() + " Uhr resettet! Viel Glück!",iconURL:"https://i.imgur.com/o1CnNtX.png"})

					client.guilds.cache.get(channelDB["quests"].guildid).channels.cache.get(channelDB["quests"].id).send({embeds:[embed]})
				}

				channelDB["quests"].sent = true

				fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
					console.log(err);
				});
			} else {
				if (time.toString().split(":")[0] != channelDB["quests"].time.toString()) {
					channelDB["quests"].sent = false

					fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
						console.log(err);
					});
				}
			}
		}
	}, 10000);
});

let onMsgCD = {}
let onPicCD = {}
client.on("messageCreate", async message => {
	if (message.guild != null && message.author.id != client.user.id) {
		if (channelDB["redeemitem"] && message.guild.channels.cache.get(channelDB["redeemitem"].id) != undefined) {
			if (message.channel.parentId == channelDB["redeemitem"].id) {
				if (message.channel.name.includes("Item Gekauft - ")) {
					if (message.author.id == client.user.id) {
						if (message.content.includes("Crew Owner ID:")) {
							let cOwnerID = message.content.split("Crew Owner ID: ")[1]
							channelDB[message.channel.id] = {
								ownerid: cOwnerID,
								threadID: message.channel.id,
								guild: message.guild.id
							}

							fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
								console.log(err);
							});
						}
					} else {
						const embed = new EmbedBuilder()
						.setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL()})
						.setColor(0xff0000)
						.setDescription(message.content)
						await client.users.cache.get(channelDB[message.channel.id].ownerid).send({embeds:[embed]}).catch(() => message.channel.send("Der User nimmt keine DMs an also konnte ich deine Nachricht nicht abschicken."))
					}
				}
			}
		}
	} else {
		if (message.channel.type == 1 && message.author.id != client.user.id) {
			for (let channel in channelDB) {
				if (channel != "allcrews" || channel != "redeemitem") {
					if (channelDB[channel].ownerid == message.author.id) {
						const embed = new EmbedBuilder()
						.setAuthor({ name: message.author.tag, iconURL: message.author.avatarURL()})
						.setColor(0x9CDFBD)
						.setDescription(message.content)
						client.guilds.cache.get(channelDB[channel].guildid).channels.cache.get(channelDB[channel].threadID).send({embeds:[embed]})
					}
				}
			}
		}
	}

	if (message.author.id != client.user.id && message.guild != null) {
		if(!onMsgCD[message.author.id]) {
			onMsgCD[message.author.id] = {
				cd: false,
				timeouted: false
			}
		}
		if (getCrew(message.author.id) != undefined) {
			if (onMsgCD[message.author.id].cd == true && onMsgCD[message.author.id].timeouted == false) {
				onMsgCD[message.author.id].timeouted = true
				setTimeout(() => {
					onMsgCD[message.author.id].cd = false
					onMsgCD[message.author.id].timeouted = false
				}, 5000);
			}
			if (channelDB["quests"] && message.guild.id == channelDB["quests"].guildid && channelDB["quests"].msgs != 0 && onMsgCD[message.author.id].cd == false) {
				if (!questDB[message.author.id]) {
					questDB[message.author.id] = {
						msgs: 1,
						inv: 0,
						voice: 0,
						pics: 0
					}
				} else {
					questDB[message.author.id].msgs += 1
				}
				fs.writeFileSync("./databases/quests.json", JSON.stringify(questDB, null, 4), err => {
					console.log(err);
				});
				onMsgCD[message.author.id].cd = true
			}
		}
	}
	if (message.author.id != client.user.id && message.guild != null) {
		if (message.channel.id == channelDB["quests"].mediaid) {
			if (message.attachments.size != 0) {
				if(!onPicCD[message.author.id]) {
					onPicCD[message.author.id] = {
						cd: false,
						timeouted: false
					}
				}
				if (getCrew(message.author.id) != undefined) {
					if (onPicCD[message.author.id].cd == true && onPicCD[message.author.id].timeouted == false) {
						onPicCD[message.author.id].timeouted = true
						setTimeout(() => {
							onPicCD[message.author.id].cd = false
							onPicCD[message.author.id].timeouted = false
						}, 5000);
					}
					if (channelDB["quests"] && message.guild.id == channelDB["quests"].guildid && channelDB["quests"].pics != 0 && onPicCD[message.author.id].cd == false) {
						if (!questDB[message.author.id]) {
							questDB[message.author.id] = {
								msgs: 0,
								inv: 0,
								voice: 0,
								pics: 1
							}
						} else {
							questDB[message.author.id].pics += 1
						}
						fs.writeFileSync("./databases/quests.json", JSON.stringify(questDB, null, 4), err => {
							console.log(err);
						});
						onPicCD[message.author.id].cd = true
					}
				}
			}
		}
	}

	if (message.guild != null && message.author.id != client.user.id) {
		if (!msgDB[message.author.id]) {
			msgDB[message.author.id] = {
				msgsDaily: 1,
				topMonth: 0
			}
		} else {
			msgDB[message.author.id].msgsDaily += 1
		}

		if (!msgDB["reset"]) {
			msgDB["reset"] = {
				sent: false,
				month: new Date(Date.now()).getMonth()
			}
		}

		fs.writeFileSync("./databases/msgs.json", JSON.stringify(msgDB, null, 4), err => {
			console.log(err);
		});
	}
})

setInterval(() => {
	if (msgDB["reset"]) {
		//console.log(new Date(Date.now() + 60000 * 60 * 8).toLocaleTimeString("de-DE"))
		if (new Date(Date.now()).toLocaleTimeString("de-DE").split(":")[0] == "00") {
			if (msgDB["reset"].sent == false) {	
				msgDB["reset"].sent = true

				for (user in msgDB) {
					if (user != "reset") {
						if (msgDB[user].msgsDaily > msgDB[user].topMonth) {
							msgDB[user].topMonth = msgDB[user].msgsDaily
						}
						msgDB[user].msgsDaily = 0

						fs.writeFileSync("./databases/msgs.json", JSON.stringify(msgDB, null, 4), err => {
							console.log(err);
						});
					}
				}
			}
		} else {
			if (msgDB["reset"].sent == true) {
				msgDB["reset"].sent = false

				fs.writeFileSync("./databases/msgs.json", JSON.stringify(msgDB, null, 4), err => {
					console.log(err);
				});
			}
		}

		if (new Date(Date.now()).getMonth() != msgDB["reset"].month) {
			for (user in msgDB) {
				if (user != "reset") {
					msgDB[user].topMonth = 0
					msgDB["reset"].month = new Date(Date.now()).getMonth()

					fs.writeFileSync("./databases/msgs.json", JSON.stringify(msgDB, null, 4), err => {
						console.log(err);
					});
				}
			}
		}
	}
}, 1000);

client.on('interactionCreate', async interaction => {
	if (interaction.guild == null && interaction.isChatInputCommand()) {
		interaction.reply({content:"Diese Commands sind nur innerhalb eines Servers verfügbar.",ephemeral:true})
	} else {
		if (!interaction.isChatInputCommand()) return;
		const command = client.commands.get(interaction.commandName);
		if (!command) return;
		try {
			if (timeoutActive == false) timeoutActive = true
			setTimeout(async () => {
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

				if (channelDB["allcrews"] && interaction.guild.channels.cache.get(channelDB["allcrews"].id) != undefined) {
					try {
						if (await interaction.guild.channels.cache.get(channelDB["allcrews"].id).messages.fetch(channelDB["allcrews"].message) != undefined) {
							const embed = new EmbedBuilder()
							.setColor("Random")
							.setTitle("Alle Crews")
							.setDescription(getCrews())

							await interaction.guild.channels.cache.get(channelDB["allcrews"].id).messages.fetch(channelDB["allcrews"].message).then(msg => {
								msg.edit({embeds:[embed]})
							})
						}
					} catch (error) {
						const embed = new EmbedBuilder()
						.setColor("Random")
						.setTitle("Alle Crews")
						.setDescription(getCrews())
						await interaction.guild.channels.cache.get(channelDB["allcrews"].id).send({embeds:[embed]}).then(msg => {
							msg.pin()
							channelDB["allcrews"] = {
								message: msg.id,
								id: interaction.guild.channels.cache.get(channelDB["allcrews"].id),
								interval: 10000
							}

							fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
								console.log(err);
							});
						})
					}
				}
				timeoutActive = false
			}, 30000);

			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);