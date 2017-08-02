exports.data = {
	name: 'Waking Titan Terminal Watcher',
	command: 'terminal'
};

const wterminal = require('../cmds/terminal.js').runCommand;
const jetpack = require('fs-jetpack');
const Discord = require('discord.js');
const moment = require('moment');
const Twit = require('twit');
const config = require('../config.json');
const log = require('../lib/log.js')(exports.data.name);

let repeat;

const T = new Twit(config.WTTwitter);

exports.watcher = (bot) => {
	this.disable();
	repeat = setInterval(async() => {
		checkCommands(bot);
	}, 30 * 1000);
	log.verbose(`${exports.data.name} has initialised successfully.`);
};

exports.start = async (msg, bot, args) => {
	const command = args.join(' ');
	if (args.length === 0) return msg.reply('You must provide at least 1 command for the bot to run.');
	let data = jetpack.read('watcherData.json', 'json');
	let channels = [];
	if (data.terminal.commands[command]) channels = data.terminal.commands[command].channels;
	if (channels.indexOf(msg.channel.id) >= 0) return msg.reply(`I am already watching the \`${command}\` command in this channel.`);
	channels.push(msg.channel.id);
	const resp = await wterminal(args[0], args.slice(1));
	const message = resp.data.redirect ? `[${resp.data.message.join('\n')}](${resp.data.redirect})` : `${resp.data.message.join('\n')}`;
	log.info(`Now outputting \`${command}\` command updates to #${msg.channel.name} in ${msg.guild.name}.`);
	msg.reply(`Now outputting \`${command}\` command updates to this channel.`);
	data.terminal.commands[command] = {channels: channels, message: message};
	jetpack.write('watcherData.json', data);
};

exports.stop = (msg, bot, args) => {
	let data = jetpack.read('watcherData.json', 'json');
	const command = args.join(' ');
	if (!data.terminal.commands[command]) return msg.reply(`This channel is not receiving updates on the \`${command}\` command.`);
	let index = data.terminal.commands[command].channels.indexOf(msg.channel.id);
	if (index >= 0) {
		data.terminal.commands[command].channels.splice(index, 1);
		if (data.terminal.commands[command].channels.length === 0) delete data.terminal.commands[command];
		log.info(`No longer outputting \`${command}\` command updates to #${msg.channel.name} in ${msg.guild.name}.`);
		msg.reply(`No longer outputting \`${command}\` command updates to this channel.`);
		jetpack.write('watcherData.json', data);
	} else {
		return msg.reply(`This channel is not receiving updates on the \`${command}\` command.`);
	}
};

exports.disable = () => {
	clearInterval(repeat);
};

const checkCommands = async (bot) => {
	let data = jetpack.read('watcherData.json', 'json');
	Object.keys(data.terminal.commands).forEach(async command => {
		try {
			const commandArr = command.split(' ');
			let resp = await wterminal(commandArr[0], commandArr.slice(1));
			let statMsg = resp.data.redirect ? `[${resp.data.message.join('\n')}](${resp.data.redirect})` : `${resp.data.message.join('\n')}`;
			if (statMsg !== data.terminal.commands[command].message) {
				let embed = new Discord.RichEmbed({
					author: {
						name: `The value of the ${command} command has updated.`,
						icon_url: 'http://i.imgur.com/Xm6m0fr.png',
						url: 'http://wakingtitan.com'
					},
					title: `**> \`${command}\`**`,
					description: `\`${statMsg}\``,
					color: resp.success ? 0x00fc5d : 0xf00404,
					footer: {
						text: 'Waking Titan Terminal'
					},
					timestamp: moment().toISOString()
				});
				await T.post('statuses/update', {status: statMsg.length <= (64 - command.length) ? `The wakingtitan.com ${command} command has been updated to say "${statMsg}" #WakingTitan` : `The wakingtitan.com ${command} command has been updated to say "${statMsg.slice(0, 63 - command.length)}…" #WakingTitan`});
				for (let channel of data.terminal.commands[command].channels) {
					await bot.channels.get(channel).send('', {
						embed: embed
					});
				}
				data.terminal.commands[command].message = statMsg;
				jetpack.write('watcherData.json', data);
			}
		} catch (e) {
			bot.error(exports.data.name, `Something went wrong: ${e}`);
		}
	});
};
