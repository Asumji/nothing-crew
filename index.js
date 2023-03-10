const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

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

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	try {

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

		if (channelDB && interaction.guild.channels.cache.get(channelDB["allcrews"].id) != undefined) {
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
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);