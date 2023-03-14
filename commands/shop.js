const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("node:fs")

const increaseMemberLimit = "+1 Crew-Mitglied"

module.exports = {
	data: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("Alles rund um den Crewshop!")
        .addSubcommand(sub => 
            sub.setName("show")
            .setDescription("Zeigt dir den Shop an!") 
        )
        .addSubcommand(sub => 
            sub.setName("inventory")
            .setDescription("Zeigt dir das Crew-Inventar an") 
        )
        .addSubcommand(sub => 
            sub.setName("buy")
            .setDescription("Kaufe Items aus dem Crewshop")
            .addStringOption(option => option.setName("item").setDescription("Das zu kaufende Item").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("sell")
            .setDescription("Verkaufe ungewollte Items")
            .addStringOption(option => option.setName("item").setDescription("Das zu verkaufende Item").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("additem")
            .setDescription("Füge Items zum Shop hinzu (Manage Server Permissions)")
            .addStringOption(option => option.setName("name").setDescription("Der Name des Items").setRequired(true))
            .addStringOption(option => option.setName("description").setDescription("Die Beschreibung des Items").setRequired(true))
            .addIntegerOption(option => option.setName("price").setDescription("Der Preis des Items").setRequired(true))
            .addBooleanOption(option => option.setName("repeatable").setDescription("Soll das Item mehrmals kaufbar sein oder nicht?").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("removeitem")
            .setDescription("Lösche Items aus dem Shop (Manage Server Permissions)!")
            .addStringOption(option => option.setName("item").setDescription("Das zu löschende Item").setRequired(true))
        )
        .addSubcommand(sub => 
            sub.setName("edititem")
            .setDescription("Editiere Item in dem Shop (Manage Server Permissions)!")
            .addStringOption(option => option.setName("item").setDescription("Das zu editierende Item").setRequired(true))
            .addStringOption(option => option.setName("property").setDescription("Den Teil den du editieren willst").setRequired(true).addChoices(
                {name:"name",value:"name"},
                {name:"beschreibung",value:"description"},
                {name:"preis",value:"price"}
            ))
            .addStringOption(option => option.setName("value").setDescription("Der neue Inhalt").setRequired(true))
        ),
    async execute(interaction) {
        const { shopDB, crewDB, channelDB } = require("../index.js")

        function getCrew(userID) {
			for (let crew in crewDB) {
				if (crewDB[crew].owner == userID || crewDB[crew].members.includes(userID)) {
					return crew
				}
			}
		}

        function hasRepeatables() {
            for (let item in shopDB) {
                if (shopDB[item].repeatable == true) {
                    return true
                }
            }
            return false
        }

        function getItems() {
            let string = ""
            if (Object.keys(shopDB).length > crewDB[getCrew(interaction.user.id)].items.length || hasRepeatables()) {
                for (let item in shopDB) {
                    if (!crewDB[getCrew(interaction.user.id)].items.includes(item) || shopDB[item].repeatable == true) {
                        if (shopDB[item].repeatable) {
                            string = string + "**" + item + "** (♻️)\n" + shopDB[item].description + "\nPreis: " + shopDB[item].price + " Punkte\n\n"
                        } else {
                            string = string + "**" + item + "**\n" + shopDB[item].description + "\nPreis: " + shopDB[item].price + " Punkte\n\n"
                        }
                    }
                }
            } else {
                string = "Es gibt keine Items im Shop!"
            }
            return string
        }

        function getInventory() {
            let string = ""
            string = "**Guthaben:** " + crewDB[getCrew(interaction.user.id)].tokens + " Punkte\n\n**Items:**\n"
            for (let item in crewDB[getCrew(interaction.user.id)].items) {
                string = string + crewDB[getCrew(interaction.user.id)].items[item] + " **|** Wert: " + shopDB[crewDB[getCrew(interaction.user.id)].items[item]].price + " Punkte\n"
            }
            return string
        }

        function openTicket() {
            for (let channel in channelDB) {
                if (channel != "allcrews" || channel != "redeemitem") {
                    if (channelDB[channel].ownerid == interaction.user.id) {
                        return true
                    }
                }
            }
            return false
        }

        function editItem(item,property,value) {
            if (property == "name") {
                for (let crew in crewDB) {
                    if (crewDB[crew].items.includes(item)) {
                        crewDB[crew].items[crewDB[crew].items.indexOf(item)] = value
                    }
                }
                fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                    console.log(err);
                });

                let json = shopDB[item]
                json.name = value
                delete shopDB[item]
                shopDB[value] = {
                    name: json.name,
                    description: json.description,
                    price: json.price
                }
                fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                    console.log(err);
                });

                interaction.reply({content:"Du hast den Namen von " + item + " zu \"" + value + "\" geändert!",ephemeral:true})
            } else if (property == "description") {
                shopDB[item].description = value

                fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                    console.log(err);
                });
                interaction.reply({content:"Du hast die Beschreibung von " + item + " zu \"" + value + "\" geändert!",ephemeral:true})
            } else {
                shopDB[item].price = Number(value)

                fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                    console.log(err);
                });
                interaction.reply({content:"Du hast den Preis von " + item + " zu \"" + value + "\" geäandert!",ephemeral:true})
            }
        }

        if (getCrew(interaction.user.id) != undefined) {
            if (interaction.options._subcommand == "show") {
                const embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Shop")
                .setDescription(getItems())
                .setFooter({text: "(♻️) => mehrmals kaufbar"})

                interaction.reply({embeds:[embed],ephemeral: true})
            } else if (interaction.options._subcommand == "inventory") {
                const embed = new EmbedBuilder()
                .setColor("Random")
                .setTitle("Inventar")
                .setDescription(getInventory())

                interaction.reply({embeds:[embed],ephemeral: true})
            } else if (interaction.options._subcommand == "buy") {
                if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
                    if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                        if (!crewDB[getCrew(interaction.user.id)].items.includes(interaction.options.getString("item")) || shopDB[interaction.options.getString("item")].repeatable == true) {
                            if (crewDB[getCrew(interaction.user.id)].tokens >= shopDB[interaction.options.getString("item")].price) {
                                if (!openTicket()) {
                                    crewDB[getCrew(interaction.user.id)].items.push(interaction.options.getString("item"))
                                    crewDB[getCrew(interaction.user.id)].tokens -= shopDB[interaction.options.getString("item")].price

                                    fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                                        console.log(err);
                                    });

                                    if (interaction.options.getString("item") != increaseMemberLimit) {
                                        interaction.reply({content:"Du hast " + interaction.options.getString("item") + " für " + shopDB[interaction.options.getString("item")].price + " Punkte gekauft!",ephemeral:true})
                                        if (channelDB["redeemitem"] && interaction.guild.channels.cache.get(channelDB["redeemitem"].id) != undefined) {
                                            await interaction.guild.channels.cache.get(channelDB["redeemitem"].id).threads.create({name:"Item Gekauft - " + interaction.options.getString("item"), message:{content:"Die Crew " + crewDB[getCrew(interaction.user.id)].name + " hat gerade " + interaction.options.getString("item") + " für " + shopDB[interaction.options.getString("item")].price + " Punkte gekauft!\nDiese hat jetzt noch ein Guthaben von " + crewDB[getCrew(interaction.user.id)].tokens + "!\nCrew Owner ID: " + interaction.user.id}}).then(thread => {
                                                channelDB[thread.id] = {
                                                    ownerid: interaction.user.id,
                                                    threadID: thread.id,
                                                    guildid: thread.guild.id
                                                }

                                                fs.writeFileSync("./databases/channels.json", JSON.stringify(channelDB, null, 4), err => {
                                                    console.log(err);
                                                });
                                            })
                                            await interaction.user.send("Du hast gerade das Item " + interaction.options.getString("item") + " gekauft, ein Teammiglied wird es für dich bald einlösen.").catch(() => "Die DMs von " + interaction.user.tag + " sind geschlossen also konnte ich kein Ticket öffnen.")
                                        }
                                    } else {
                                        crewDB[getCrew(interaction.user.id)].limit += 1

                                        fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                                            console.log(err);
                                        });
                                        interaction.reply({content:"Du hast " + interaction.options.getString("item") + " für " + shopDB[interaction.options.getString("item")].price + " Punkte gekauft!\nDas neue Limit für deine Crew ist " + crewDB[getCrew(interaction.user.id)].limit + " User!"  ,ephemeral:true})
                                    }
                                } else {
                                    interaction.reply({content:"Du hast bereits ein offenes Item-Ticket!",ephemeral:true})
                                }
                            } else {
                                interaction.reply({content:"Deine Crew hat nicht genug Punkte!",ephemeral:true})
                            }
                        } else {
                            interaction.reply({content:"Du besitzt bereits dieses Item!",ephemeral:true})
                        }
                    } else {
                        interaction.reply({content:"Diese Item existiert nicht!",ephemeral:true})
                    }
                } else {
                    interaction.reply({content:"Nur der Owner einer Crew kann Items kaufen!",ephemeral:true})
                }
            } else if (interaction.options._subcommand == "sell") {
                if (crewDB[getCrew(interaction.user.id)].owner == interaction.user.id) {
                    if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                        if (interaction.options.getString("item") != increaseMemberLimit) {
                            crewDB[getCrew(interaction.user.id)].items.splice(crewDB[getCrew(interaction.user.id)].items.indexOf(interaction.options.getString("item")), 1)
                            crewDB[getCrew(interaction.user.id)].tokens += shopDB[interaction.options.getString("item")].price

                            fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                                console.log(err);
                            });

                            if (channelDB["redeemitem"] && interaction.guild.channels.cache.get(channelDB["redeemitem"].id) != undefined) {
                                await interaction.guild.channels.cache.get(channelDB["redeemitem"].id).threads.create({name:"Item Verkauft - " + interaction.options.getString("item"), message:{content:"Die Crew " + crewDB[getCrew(interaction.user.id)].name + " hat gerade " + interaction.options.getString("item") + " für " + shopDB[interaction.options.getString("item")].price + " Punkte verkauft!\nDiese hat jetzt wieder ein Guthaben von " + crewDB[getCrew(interaction.user.id)].tokens + "!\nCrew Owner ID: " + interaction.user.id + "\n*Dies ist kein Ticket nur eine Erinnerung mögliche Vorteile des Items zu entfernen.*"}})
                            }

                            interaction.reply({content:"Du hast " + interaction.options.getString("item") + " für " + shopDB[interaction.options.getString("item")].price + " Punkte verkauft!",ephemeral:true})
                        } else {
                            if (crewDB[getCrew(interaction.user.id)].limit > crewDB[getCrew(interaction.user.id)].members.length+1) {
                                crewDB[getCrew(interaction.user.id)].items.splice(crewDB[getCrew(interaction.user.id)].items.indexOf(interaction.options.getString("item")), 1)
                                crewDB[getCrew(interaction.user.id)].tokens += shopDB[interaction.options.getString("item")].price
                                crewDB[getCrew(interaction.user.id)].limit -= 1
    
                                fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                                    console.log(err);
                                });

                                interaction.reply({content:"Du hast " + interaction.options.getString("item") + " für " + shopDB[interaction.options.getString("item")].price + " Punkte verkauft!",ephemeral:true})
                            } else {
                                interaction.reply({content:"Du kannst Mitglied-Limit Items nur verkaufen wenn ein Platz frei ist!",ephemeral:true})
                            }
                        }
                    } else {
                        interaction.reply({content:"Dieses Item ist nicht in dem Crew-Inventar!",ephemeral:true})
                    }
                } else {
                    interaction.reply({content:"Nur der Owner einer Crew kann Items verkaufen!",ephemeral:true})
                }
            }
        } else {
            if (interaction.options._subcommand != "additem" && interaction.options._subcommand != "removeitem" && interaction.options._subcommand != "edititem") {
                interaction.reply({content:"Du kannst diese Commands nur benutzen wenn du Teil einer Crew bist!",ephemeral:true})
            }
        }
        if (interaction.options._subcommand == "additem") {
            if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
                if (!shopDB.hasOwnProperty(interaction.options.getString("name"))) {
                    shopDB[interaction.options.getString("name")] = {
                        name: interaction.options.getString("name"),
                        description: interaction.options.getString("description"),
                        price: interaction.options.getInteger("price"),
                        repeatable: interaction.options.getBoolean("repeatable")
                    }
                    fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                        console.log(err);
                    });
                    interaction.reply({content:"Du hast " + interaction.options.getString("name") + " zum Shop hinzugefügt!",ephemeral:true})
                } else {
                    interaction.reply({content:"Dieses Item existiert bereits!",ephemeral:true})
                }
            } else {
                interaction.reply({content:"Du hast die Rechte zu diesen Command nicht!",ephemeral:true})
            }
        } else if (interaction.options._subcommand == "removeitem") {
            if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
                if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                    delete shopDB[interaction.options.getString("item")]

                    for (let crew in crewDB) {
                        if (crewDB[crew].items.includes(interaction.options.getString("item"))) {
                            crewDB[crew].items.splice(crewDB[crew].items.indexOf(interaction.options.getString("item")), 1)
                        }
                    }

                    fs.writeFileSync("./databases/shop.json", JSON.stringify(shopDB, null, 4), err => {
                        console.log(err);
                    });
                    fs.writeFileSync("./databases/crew.json", JSON.stringify(crewDB, null, 4), err => {
                        console.log(err);
                    });
                    interaction.reply({content:"Du hast " + interaction.options.getString("item") + " vom Shop entfernt!",ephemeral:true})
                } else {
                    interaction.reply({content:"Dieses Item existiert nicht.",ephemeral:true})
                }
            } else {
                interaction.reply({content:"Du hast die Rechte zu diesen Command nicht!",ephemeral:true})
            }
        } else if (interaction.options._subcommand == "edititem") {
            if (interaction.guild.members.cache.get(interaction.user.id).permissions.has(PermissionFlagsBits.ManageGuild)) {
                if (shopDB.hasOwnProperty(interaction.options.getString("item"))) {
                    if (interaction.options.getString("property") == "price" && Number(interaction.options.getString("value"))) {
                        editItem(interaction.options.getString("item"),interaction.options.getString("property"),interaction.options.getString("value"))
                    } else if (interaction.options.getString("property") == "price") {
                        interaction.reply({content:"Du wolltest den Preis änder aber keine Zahl eingegeben!",ephemeral:true})
                    } else {
                        editItem(interaction.options.getString("item"),interaction.options.getString("property"),interaction.options.getString("value"))
                    }
                } else {
                    interaction.reply({content:"Dieses Item existiert nicht!",ephemeral:true})
                }
            } else {
                interaction.reply({content:"Du hast die Rechte zu diesen Command nicht!",ephemeral:true})
            }
        }
    }
}
