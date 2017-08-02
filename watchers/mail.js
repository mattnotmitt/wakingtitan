// Modules & Initialisation
exports.data = {
	name: 'Mail Listener',
	command: 'mail',
	description: 'Listens to mail from specified address'
};

const MailListener = require('mail-listener2');
const log = require('../lib/log.js')(exports.data.name);
const config = require('../config.json');
const jetpack = require('fs-jetpack');
const Discord = require('discord.js');

const ml = new MailListener({
	username: config.mailUsername,
	password: config.mailPassword,
	host: config.mailHost,
	port: 993, // imap port
	tls: true,
	debug: log.debug, // Or your custom function with only one incoming argument. Default: null
	mailbox: 'INBOX', // mailbox to monitor
	searchFilter: ['UNSEEN'], // the search filter being used after an IDLE notification has been retrieved
	markSeen: true, // all fetched email willbe marked as seen and not fetched next time
	mailParserOptions: {
		streamAttachments: true
	}, // options to be passed to mailParser lib.
	attachments: false
});

exports.watcher = (bot) => {
	// Startup process for watcher
	this.disable();
	ml.start();
	ml.on('server:connected', () => {
		log.verbose(`${exports.data.name} has initialised successfully and connected to the IMAP server.`);
	});
	ml.on('server:disconnected', () => {
		log.error(`Bot has disconnected from IMAP server.`);
		ml.start();
	});
	ml.on('error', err => {
		log.error(`Issue with IMAP: ${err}`);
	});
	ml.on('mail', async mail => {
		try {
			const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
			log.debug(`New email received from "${mail.from[0].name}" with subject "${mail.subject}".`);
			if (Object.keys(data.mail.addresses).indexOf(mail.from[0].address) >= 0) {
				log.info(`New email received from "${mail.from[0].name}" with subject "${mail.subject}".`);
				const embed = new Discord.RichEmbed({
					author: {
						name: `A new email has been received from ${mail.from[0].name}`,
						icon_url: 'http://i.imgur.com/Xm6m0fr.png'
					},
					description: `**Subject:** ${mail.subject}`,
					color: 0x993E4D,
					footer: {
						text: 'Sent at',
						icon_url: 'http://www.iconsdb.com/icons/preview/white/email-12-xxl.png'
					},
					timestamp: mail.date
				});
				for (let channel of data.mail.addresses[mail.from[0].address]) {
					await bot.channels.get(channel).send('', {
						embed: embed
					});
				}
			}
		} catch (e) {
			log.error(`Something went wrong: ${e}`);
		}
	});
};

exports.start = async (msg, bot, args) => {
  // Process for new channel/watched item
	try {
		if (args.length < 0) return msg.reply('Please add an email address.');
		const data = jetpack.read('watcherData.json', 'json');
		let channels = [];
		if (data.mail.addresses[args[0]]) channels = data.mail.addresses[args[0]];
		if (channels.indexOf(msg.channel.id) >= 0) return msg.reply(`I am already watching for mail from "${args[0]}" in this channel.`);
		channels.push(msg.channel.id);
		data.mail.addresses[args[0]] = channels;
		jetpack.write('/home/matt/mattBot/watcherData.json', data);
		log.info(`Now watching for mail from "${args[0]}" in ${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`Now watching for mail from "${args[0]}" in this channel.`);
	} catch (e) {
		msg.reply('Couldn\'t watch this address! Check the logs.');
		log.error(`Couldn't start watching a new stream: ${e}`);
	}
};

exports.stop = (msg, bot, args) => {
	// Process for removing channel/watched item
};

exports.disable = () => {
	try {
		ml.stop();
	} catch (e) {
		log.error(`Failed to stop listener: ${e}`);
	}
};
