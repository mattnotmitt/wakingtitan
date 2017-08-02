exports.data = {
	name: 'Twitch Stream Checker',
	command: 'twitch',
	description: ''
};

const request = require('request-promise-native');
const jetpack = require('fs-jetpack');
const Discord = require('discord.js');
const log = require('../lib/log.js')(exports.data.name);
const moment = require('moment');
const humanize = require('humanize-duration');
const config = require('../config.json');
const Twit = require('twit');

const T = new Twit(config.WTTwitter);
let repeat;

const r = request.defaults({
	baseUrl: `https://api.twitch.tv/kraken/`,
	headers: {
		'Accept': 'application/vnd.twitchtv.v5+json',
		'Client-ID': config.twitch_clientid
	},
	json: true
});

exports.watcher = bot => {
  // Startup process for watcher
	this.disable();
	repeat = setInterval(() => {
		checkStream(bot);
	}, 20 * 1000); // x is number of minutes between repeats
	bot.log(exports.data.name, `${exports.data.name} has initialised successfully.`);
};

exports.start = async (msg, bot, args) => {
  // Process for new channel/watched item
	try {
		if (args.length < 0) return msg.reply('Please add the id/name of a Twitch stream.');
		let options = {
			user: args[0].split('/').slice(-1).pop()
		};
		const data = jetpack.read('watcherData.json', 'json');
		const id = options.user.match(/^[0-9]+$/) ? options.user : await getID(options.user);
		let channels = [];
		if (data.twitch.users[id]) channels = data.twitch.users[id].channels;
		if (channels.indexOf(msg.channel.id) >= 0) return msg.reply(`I am already watching ${options.user} on Twitch in this channel.`);
		let live = Boolean(await checkLive(id));
		channels.push(msg.channel.id);
		data.twitch.users[id] = {live: live, channels: channels};
		jetpack.write('/home/matt/mattBot/watcherData.json', data);
		log.info(`Now watching ${options.user} in ${msg.channel.name} on ${msg.guild.name}.`);
		await msg.reply(`Now watching ${options.user} on Twitch in this channel.`);
	} catch (e) {
		msg.reply('Couldn\'t watch this stream! Check the logs.');
		log.error(`Couldn't start watching a new stream: ${e}`);
	}
};

exports.stop = (msg, bot, args) => {
  // Process for removing channel/watched item
};

exports.disable = () => {
	clearInterval(repeat);
};

// Declare primary functions below here
const checkStream = bot => {
	const data = jetpack.read('watcherData.json', 'json');
	log.debug('Checking for channels going live.');
	Object.keys(data.twitch.users).forEach(async id => {
		try {
			const stream = await checkLive(id);
			if (!stream) {
				if (data.twitch.users[id].live) {
					data.twitch.users[id].live = false;
					return jetpack.write('/home/matt/mattBot/watcherData.json', data);
				} else return;
			}
			if (data.twitch.users[id].live) return;
			let embed = new Discord.RichEmbed({
				color: 6570405,
				author: {
					icon_url: stream.channel.logo,
					name: `${stream.channel.display_name} on Twitch.tv has just gone live!`,
					url: stream.channel.url
				},
				fields: [
					{
						name: 'Status',
						value: stream.channel.status || 'None',
						inline: false
					},
					{
						name: 'Game',
						value: stream.channel.game || 'None',
						inline: true
					},
					{
						name: 'Followers',
						value: stream.channel.followers,
						inline: true
					},
					{
						name: 'Viewers',
						value: stream.viewers,
						inline: true
					},
					{
						name: 'Uptime',
						value: humanize(moment().diff(moment(stream.created_at)), {round: true}),
						inline: true
					}
				],
				thumbnail: {url: stream.preview.medium},
				timestamp: moment().toISOString(),
				footer: {
					icon_url: 'http://www.newdesignfile.com/postpic/2014/02/twitch-logo_99113.png',
					text: `|`
				}
			});
			if (id === '163329949') {
				await T.post('statuses/update', {status: `${stream.channel.url} has gone live! #WakingTitan`});
			}
			for (let channel of data.twitch.users[id].channels) {
				bot.channels.get(channel).send('', {
					embed: embed
				});
			}
			data.twitch.users[id].live = true;
			jetpack.write('/home/matt/mattBot/watcherData.json', data);
		} catch (e) {
			log.error(`Something went wrong: ${e}`);
		}
	});
};

const getID = user => {
	return new Promise(async (resolve, reject) => {
		try {
			const userSearch = await r(`/users?login=${user}`);
			userSearch._total > 0 ? resolve(userSearch.users[0]['_id']) : reject(new Error('NotReal'));
		} catch (e) {
			reject(e);
		}
	});
};

const checkLive = id => {
	return new Promise(async (resolve, reject) => {
		try {
			let streams = (await r(`/streams/${id}`)).stream;
			resolve(streams ? resolve(streams) : resolve(false));
		} catch (e) {
			reject(e);
		}
	});
};
