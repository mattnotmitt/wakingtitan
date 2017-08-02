exports.data = {
	name: 'Countdowns',
	nick: 'countdown',
	command: 'countdown'
};

const moment = require('moment');
const humanizeDuration = require('humanize-duration');
const jetpack = require('fs-jetpack');
const log = require('../lib/log.js')(exports.data.name);
const chalk = require('chalk');

let countdown;

exports.start = (msg, bot, args) => {
  // console.log(args)
	const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
	if (!data.countdown.data) data.countdown.data = [];
	let timeDiff = moment.unix(args[0]).diff();
  // console.log(timeDiff)
	if (timeDiff > 0) {
		msg.channel.send(`**Time until ${args.slice(1).join(' ')}:** ${humanizeDuration(timeDiff, {round: true})}`)
      .then(m => {
	data.countdown.data.push({
		'text': args.slice(1).join(' '),
		'message': m.id,
		'channel': m.channel.id,
		'unix': args[0]
	});
        // console.log(data.countdown.data)
	jetpack.write('/home/matt/mattBot/watcherData.json', data);
	m.pin().catch(err => bot.error(`Failed to pin message: ${err}`));
});
	}
};

exports.stop = async (msg, bot, args) => {
	const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
	if (!data.countdown.data) data.countdown.data = [];
	msg.reply(`Countdown with ID ${args[0]} has been cancelled.`);
	(await bot.channels.get(data.countdown.data[parseInt(args[0])].channel).fetchMessage(data.countdown.data[parseInt(args[0])].message)).edit(`**Countdown Cancelled.**`)
    .then(async () => {
	(await bot.channels.get(data.countdown.data[parseInt(args[0])].channel).fetchMessage(data.countdown.data[parseInt(args[0])].message)).delete(5000);
	data.countdown.data.splice(parseInt(args[0]), 1);
	jetpack.write('/home/matt/mattBot/watcherData.json', data);
});
};

exports.disable = () => {
	clearInterval(countdown);
};

exports.watcher = async (bot) => {
	this.disable();
	log.verbose(chalk.green(`${exports.data.name} has initialised successfully.`));
	countdown = setInterval(async () => {
		const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
		if (!data.countdown.data) data.countdown.data = [];
		if (data.countdown.data.length > 0) {
			for (let i = 0; i < data.countdown.data.length; i++) {
				let timeDiff = moment.unix(data.countdown.data[i].unix).diff();
				let channel = bot.channels.get(data.countdown.data[i].channel);
				if (timeDiff > 0) {
					(await channel.fetchMessage(data.countdown.data[i].message)).edit(`**Time until ${data.countdown.data[i].text}:** ${humanizeDuration(timeDiff, {round: true})}`);
				} else {
					(await channel.fetchMessage(data.countdown.data[i].message)).edit(`It's time for ${data.countdown.data[i].text}!`).then(m => m.delete(60000));
					channel.send(`It's time for ${data.countdown.data[i].text}!`);
					data.countdown.data.splice(i, 1);
					jetpack.write('/home/matt/mattBot/watcherData.json', data);
				}
			}
		}
	}, 5000);
};
