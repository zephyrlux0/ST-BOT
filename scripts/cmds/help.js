const fs = require('fs');
const path = require('path');

module.exports = {
	config: {
		name: "help",
		version: "2.4.74",
		role: 0,
		countDown: 0,
		author: "ST | Sheikh Tamim",
		description: "Displays all available commands and their categories.",
		category: "help"
	},

	ST: async ({ api, event, args }) => {
		const cmdsFolderPath = path.join(__dirname, '.');
		const files = fs.readdirSync(cmdsFolderPath).filter(file => file.endsWith('.js'));

		const sendMessage = async (message, threadID, messageID = null) => {
			try {
				return await api.sendMessage(message, threadID, messageID);
			} catch (error) {
				console.error('Error sending message:', error);
			}
		};

		const getCategories = () => {
			const categories = {};
			for (const file of files) {
				try {
					const command = require(path.join(cmdsFolderPath, file));
					const { category } = command.config;
					const categoryName = category || 'uncategorized';
					if (!categories[categoryName]) categories[categoryName] = [];
					categories[categoryName].push(command.config);
				} catch (error) {
					// Skip invalid command files
				}
			}
			return categories;
		};

		try {
			// If specific command requested directly
			if (args[0] && !args[0].match(/^\d+$/)) {
				const commandName = args[0].toLowerCase();
				const command = files.map(file => {
					try {
						return require(path.join(cmdsFolderPath, file));
					} catch {
						return null;
					}
				}).filter(cmd => cmd !== null)
				.find(cmd => cmd.config.name.toLowerCase() === commandName || (cmd.config.aliases && cmd.config.aliases.includes(commandName)));

				if (command) {
					// Display command details
					let commandDetails = `╭─────────────────────◊\n`;
					commandDetails += `│  🔹 COMMAND DETAILS\n`;
					commandDetails += `├─────────────────────◊\n`;
					commandDetails += `│ ⚡ Name: ${command.config.name}\n`;
					commandDetails += `│ 📝 Version: ${command.config.version || 'N/A'}\n`;
					commandDetails += `│ 👤 Author: ${command.config.author || 'Unknown'}\n`;
					commandDetails += `│ 🔐 Role: ${command.config.role !== undefined ? command.config.role : 'N/A'}\n`;
					commandDetails += `│ 📂 Category: ${command.config.category || 'uncategorized'}\n`;
					commandDetails += `│ 💎 Premium: ${command.config.premium == true ? '✅ Required' : '❌ Not Required'}\n`;
					commandDetails += `│ 🔧 Use Prefix: ${command.config.usePrefix !== undefined ? (command.config.usePrefix ? '✅ Required' : '❌ Not Required') : '⚙️ Global Setting'}\n`;

					if (command.config.aliases && command.config.aliases.length > 0) {
						commandDetails += `│ 🔄 Aliases: ${command.config.aliases.join(', ')}\n`;
					}

					if (command.config.countDown !== undefined) {
						commandDetails += `│ ⏱️ Cooldown: ${command.config.countDown}s\n`;
					}

					// Display unsend configuration if present
					if (command.config.unsend !== undefined && command.config.unsend !== null) {
						let unsendDisplay;
						if (typeof command.config.unsend === 'number') {
							unsendDisplay = `${command.config.unsend}s`;
						} else if (typeof command.config.unsend === 'string') {
							unsendDisplay = command.config.unsend;
						}
						commandDetails += `│ 🗑️ Auto-unsend: ${unsendDisplay}\n`;
					}

					commandDetails += `├─────────────────────◊\n`;

					// Description
					if (command.config.description) {
						const desc = typeof command.config.description === 'string' ? command.config.description : command.config.description.en || 'No description available';
						commandDetails += `│ 📋 Description:\n│ ${desc}\n├─────────────────────◊\n`;
					}

					// Guide/Usage
					const guideText = command.config.guide ? (typeof command.config.guide === 'string' ? command.config.guide : command.config.guide.en || 'No guide available') : 'No guide available';
					commandDetails += `│ 📚 Usage Guide:\n│ ${guideText.replace(/{pn}/g, `!${command.config.name}`)}\n`;

					commandDetails += `╰─────────────────────◊\n`;
					commandDetails += `     💫 ST_BOT Command Info`;

					await sendMessage(commandDetails, event.threadID);
				} else {
					await sendMessage(`❌ Command not found: ${commandName}`, event.threadID);
				}
			} else {
				const commands = [];
				for (const file of files) {
					try {
						const cmd = require(path.join(cmdsFolderPath, file));
						if (cmd.config && cmd.config.name) {
							commands.push(cmd.config.name);
						}
					} catch (e) {}
				}
				commands.sort();

				let helpMessage = '╭─────────────────────◊\n';
				helpMessage += '│     📋 COMMANDES\n';
				helpMessage += '├─────────────────────◊\n';
				
				commands.forEach(name => {
					helpMessage += `│ /${name}\n`;
				});

				helpMessage += '╰─────────────────────◊\n';
				helpMessage += `     Total: ${commands.length} commandes\n`;
				helpMessage += '        💫 ST_BOT Help Menu';

				await sendMessage(helpMessage, event.threadID);
			}
		} catch (error) {
			console.error('Error generating help message:', error);
			await sendMessage('An error occurred while generating the help message.', event.threadID);
		}
	},

	onReply: async ({ api, event, Reply }) => {
		if (Reply.author != event.senderID) {
			return api.sendMessage("❌ This is not for you!", event.threadID, event.messageID);
		}

		const choice = parseInt(event.body.trim());

		try {
			if (Reply.stage === 1) {
				// Stage 2: User selected a category - show commands with serial numbers
				if (isNaN(choice) || choice < 1 || choice > Reply.categories.length) {
					return api.sendMessage(`❌ Invalid choice. Please reply with a number between 1 and ${Reply.categories.length}.`, event.threadID, event.messageID);
				}

				const selectedCategory = Reply.categories[choice - 1];
				const commands = Reply.categoriesData[selectedCategory].sort((a, b) => a.name.localeCompare(b.name));

				let categoryMessage = `╭─────────────────────◊\n`;
				categoryMessage += `│  📂 ${selectedCategory.toUpperCase()} COMMANDS\n`;
				categoryMessage += `├─────────────────────◊\n`;

				commands.forEach((cmd, index) => {
					categoryMessage += `│ ${index + 1}. ${cmd.name}\n`;
				});

				categoryMessage += `├─────────────────────◊\n`;
				categoryMessage += `│ 💡 Reply with command number\n`;
				categoryMessage += `│    for detailed info\n`;
				categoryMessage += `│ 💡 Type 0 to go back\n`;
				categoryMessage += `╰─────────────────────◊\n`;
				categoryMessage += `   Total: ${commands.length} commands`;

				// Delete old onReply data and unsend previous message
				global.GoatBot.onReply.delete(Reply.messageID);
				try {
					await api.unsendMessage(Reply.messageID);
				} catch (error) {
					console.error('Error unsending message:', error);
				}

				const sentMessage = await api.sendMessage(categoryMessage, event.threadID);

				// Set up onReply for command selection (Stage 2)
				if (sentMessage) {
					global.GoatBot.onReply.set(sentMessage.messageID, {
						commandName: "help",
						messageID: sentMessage.messageID,
						author: event.senderID,
						stage: 2,
						commands: commands,
						selectedCategory: selectedCategory,
						parentCategories: Reply.categories,
						parentCategoriesData: Reply.categoriesData
					});
				}

			} else if (Reply.stage === 2) {
				// Check if user wants to go back to categories
				if (choice === 0) {
					const categoryNames = Reply.parentCategories;
					const categories = Reply.parentCategoriesData;
					
					let helpMessage = '╭─────────────────────◊\n';
					helpMessage += '│     📋 COMMAND CATEGORIES\n';
					helpMessage += '├─────────────────────◊\n';
					
					categoryNames.forEach((category, index) => {
						const commandCount = categories[category].length;
						helpMessage += `│ ${index + 1}. ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
						helpMessage += `│    └─ ${commandCount} commands\n`;
					});
					
					helpMessage += '├─────────────────────◊\n';
					helpMessage += '│ 💡 Reply with category number\n';
					helpMessage += '│    to see commands\n';
					helpMessage += '│ 💡 Type !help <cmdname>\n';
					helpMessage += '│    for direct command info\n';
					helpMessage += '╰─────────────────────◊\n';
					helpMessage += '        💫 ST_BOT Help Menu';

					// Delete old onReply data and unsend previous message
					global.GoatBot.onReply.delete(Reply.messageID);
					try {
						await api.unsendMessage(Reply.messageID);
					} catch (error) {
						console.error('Error unsending message:', error);
					}

					const sentMessage = await api.sendMessage(helpMessage, event.threadID);
					
					// Set up onReply for category selection (back to Stage 1)
					if (sentMessage) {
						global.GoatBot.onReply.set(sentMessage.messageID, {
							commandName: "help",
							messageID: sentMessage.messageID,
							author: event.senderID,
							stage: 1,
							categories: categoryNames,
							categoriesData: categories
						});
					}
					return;
				}

				// Stage 3: User selected a specific command - show full details
				if (isNaN(choice) || choice < 1 || choice > Reply.commands.length) {
					return api.sendMessage(`❌ Invalid choice. Please reply with a number between 1 and ${Reply.commands.length}, or 0 to go back.`, event.threadID, event.messageID);
				}

				const selectedCommand = Reply.commands[choice - 1];

				// Delete old onReply data and unsend previous message
				global.GoatBot.onReply.delete(Reply.messageID);
				try {
					await api.unsendMessage(Reply.messageID);
				} catch (error) {
					console.error('Error unsending message:', error);
				}

				try {
					// Load the actual command file to get complete details
					const cmdsFolderPath = path.join(__dirname, '.');
					const files = fs.readdirSync(cmdsFolderPath).filter(file => file.endsWith('.js'));
					
					let fullCommand = null;
					for (const file of files) {
						try {
							const command = require(path.join(cmdsFolderPath, file));
							if (command.config.name.toLowerCase() === selectedCommand.name.toLowerCase()) {
								fullCommand = command;
								break;
							}
						} catch (error) {
							// Skip invalid command files
						}
					}

					if (!fullCommand) {
						fullCommand = { config: selectedCommand };
					}

					let commandDetails = `╭─────────────────────◊\n`;
					commandDetails += `│  🔹 COMMAND DETAILS\n`;
					commandDetails += `├─────────────────────◊\n`;
					commandDetails += `│ ⚡ Name: ${fullCommand.config.name}\n`;
					commandDetails += `│ 📝 Version: ${fullCommand.config.version || 'N/A'}\n`;
					commandDetails += `│ 👤 Author: ${fullCommand.config.author || 'Unknown'}\n`;
					commandDetails += `│ 🔐 Role: ${fullCommand.config.role !== undefined ? fullCommand.config.role : 'N/A'}\n`;
					commandDetails += `│ 📂 Category: ${fullCommand.config.category || 'uncategorized'}\n`;
					commandDetails += `│ 💎 Premium: ${fullCommand.config.premium == true ? '✅ Required' : '❌ Not Required'}\n`;
					commandDetails += `│ 🔧 Use Prefix: ${fullCommand.config.usePrefix !== undefined ? (fullCommand.config.usePrefix ? '✅ Required' : '❌ Not Required') : '⚙️ Global Setting'}\n`;

					if (fullCommand.config.aliases && fullCommand.config.aliases.length > 0) {
						commandDetails += `│ 🔄 Aliases: ${fullCommand.config.aliases.join(', ')}\n`;
					}

					if (fullCommand.config.countDown !== undefined) {
						commandDetails += `│ ⏱️ Cooldown: ${fullCommand.config.countDown}s\n`;
					}

					// Display unsend configuration if present
					if (fullCommand.config.unsend !== undefined && fullCommand.config.unsend !== null) {
						let unsendDisplay;
						if (typeof fullCommand.config.unsend === 'number') {
							unsendDisplay = `${fullCommand.config.unsend}s`;
						} else if (typeof fullCommand.config.unsend === 'string') {
							unsendDisplay = fullCommand.config.unsend;
						}
						commandDetails += `│ 🗑️ Auto-unsend: ${unsendDisplay}\n`;
					}

					commandDetails += `├─────────────────────◊\n`;

					// Description
					if (fullCommand.config.description) {
						const desc = typeof fullCommand.config.description === 'string' ? fullCommand.config.description : fullCommand.config.description.en || 'No description available';
						commandDetails += `│ 📋 Description:\n│ ${desc}\n├─────────────────────◊\n`;
					}

					// Guide/Usage
					let guideText = 'No guide available';
					if (fullCommand.config.guide) {
						guideText = typeof fullCommand.config.guide === 'string' ? fullCommand.config.guide : fullCommand.config.guide.en || 'No guide available';
					}

					commandDetails += `│ 📚 Usage Guide:\n│ ${guideText.replace(/{pn}/g, `!${fullCommand.config.name}`)}\n`;

					commandDetails += `╰─────────────────────◊\n`;
					commandDetails += `     💫 ST_BOT Command Info`;

					// Send command details (final stage - no new onReply needed)
					await api.sendMessage(commandDetails, event.threadID);
					
				} catch (error) {
					console.error('Error sending command details:', error);
					await api.sendMessage('❌ An error occurred while displaying command details.', event.threadID, event.messageID);
				}
			}
		} catch (error) {
			console.error('Error in help onReply:', error);
			api.sendMessage('❌ An error occurred while processing your request.', event.threadID, event.messageID);
		}
	}
};