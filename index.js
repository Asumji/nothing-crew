const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages] });

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
module.exports = { crewDB, shopDB, client, channelDB }

client.once('ready', () => {
	console.log('Ready!');
});

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
})

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