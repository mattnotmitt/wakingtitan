// ================| Initialisation |================

exports.data = {
	name: 'Waking Titan',
	command: 'wakingTitan'
};

// Loads required modules
const config = require('../config.json');
const CSSselect = require('css-select');
const Discord = require('discord.js');
const htmlparser = require('htmlparser2');
const jetpack = require('fs-jetpack');
const moment = require('moment');
const request = require('request-promise-native');
const strftime = require('strftime');
const Twit = require('twit');
const log = require('../lib/log.js')(exports.data.name);
const chalk = require('chalk');
const exec = require('child-process-promise').exec;

const T = new Twit(config.WTTwitter);

// Makes repeats global

let hasUpdate = {'http://echo-64.com': false,
	'http://atlas-65.com': false,
	'http://myriad-70.com': false,
	'http://multiverse-75.com': false,
	'http://superlumina-6c.com': false};
let repeat;

// Starts intervals
exports.watcher = async(bot) => {
  // In case of restarting this watcher, kill all loops
	this.disable();
	log.verbose(chalk.green(`${exports.data.name} has initialised successfully.`));
	repeat = setInterval(async() => {
		checkGlyphs(bot);
		checkSites(bot);
	}, 0.5 * 60 * 1000); // Repeat every 30 seconds
};

exports.disable = () => {
	clearInterval(repeat);
};
// ================| Main Functions |================

// Checks status of glyphs on wakingtitan.com
const checkGlyphs = (bot) => {
	request({
		url: 'https://wakingtitan.com'
	}).then(async body => {
		let glyphs = [];
		let change = false;
		let data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
		const handler = new htmlparser.DomHandler((error, dom) => {
			if (error) bot.error(exports.data.name, error);
		});
		const parser = new htmlparser.Parser(handler);
		parser.write(body);
		parser.done();
		let disGlyph = CSSselect('a[class=glyph]', handler.dom);
		for (let element of disGlyph) {
			glyphs.push(element.attribs.style.split('(')[1].slice(0, -1));
		}
		for (let i = 0; i < glyphs.length; i++) {
			if (glyphs.sort()[i] !== data.wakingTitan.glyphs[i]) {
				bot.log(exports.data.name, 'New glyph at wakingtitan.com');
				const embed = new Discord.RichEmbed({
					color: 0x993E4D,
					timestamp: moment().toISOString(),
					description: 'That\'s good, innit!',
					footer: {
						icon_url: 'http://i.imgur.com/FYk8lDP.jpg',
						text: 'MattBot'
					},
					author: {
						name: 'New glyph has activated!',
						url: 'https://wakingtitan.com',
						icon_url: 'http://i.imgur.com/PFQODUN.png'
					},
					thumbnail: {
						url: `http://wakingtitan.com${glyphs.sort()[i]}`
					}
				});
				for (let channel of data.wakingTitan.channels) {
					await bot.channels.get(channel).send('', {
						embed: embed
					});
				}
				request({
					url: `http://wakingtitan.com${glyphs.sort()[i]}`,
					encoding: null
				}).then(resp => {
					const img = Buffer.from(resp, 'utf8');
					jetpack.write(`watcherData/glyphs/glyph${glyphs.sort()[i].split('/').slice(-1)[0]}`, img);
					T.post('media/upload', {media_data: img.toString('base64')}).then(result => {
						setTimeout(() => {
							T.post('media/metadata/create', {media_id: result.data.media_id_string, alt_text: {text: 'Glyph from wakingtitan.com.'}}).then(result => {
								T.post('statuses/update', {status: 'A new glyph has been activated at wakingtitan.com! #WakingTitan', media_ids: result.data.media_id_string}).catch(err => bot.error(exports.data.name, err));
							}).catch(err => bot.error(exports.data.name, err));
						}, 2000);
					}).catch(err => bot.error(exports.data.name, err));
				}).catch(err => bot.error(exports.data.name, err));
				change = true;
			}
		}
		if (change) {
			data.wakingTitan.glyphs = glyphs.sort();
			await request('https://web.archive.org/save/http://wakingtitan.com/');
			jetpack.write('/home/matt/mattBot/watcherData.json', data);
		}
	}).catch(err => bot.error(exports.data.name, err));
};

// Checks for updates on waking titan sites
const checkSites = async(bot) => {
	const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json');
	for (let site in data.wakingTitan.sites) {
		let cookJar = request.jar();
		if (site === 'https://wakingtitan.com') {
			cookJar.setCookie(request.cookie('archive=%5B%229b169d05-6b0b-49ea-96f7-957577793bef%22%2C%2267e3b625-39c0-4d4c-9241-e8ec0256b546%22%2C%224e153ce4-0fec-406f-aa90-6ea62e579369%22%2C%227b9bca5c-43ba-4854-b6b7-9fffcf9e2b45%22%2C%222f99ac82-fe56-43ab-baa6-0182fd0ed020%22%2C%22b4631d12-c218-4872-b414-9ac31b6c744e%22%2C%2283a383e2-f4fc-4d8d-905a-920057a562e7%22%5D'), site);
		}
		request({url: site, jar: cookJar}).then(async body => {
			const pageCont = clean(body);
			const oldCont = jetpack.read(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-latest.html`);
			if (pageCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/') !== oldCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/')) {
				bot.log(exports.data.name, `There's been a change on ${site}`);
				setTimeout(() => {
					request({url: site, jar: cookJar}).then(async body2 => {
						const pageCont2 = clean(body);
						if (pageCont2 === pageCont) {
							if (!hasUpdate[site]) {
								let embed = new Discord.RichEmbed({
									color: 0x993E4D,
									timestamp: moment().toISOString(),
									author: {
										name: `${site.split('/').splice(2).join('/')} has updated`,
										url: site,
										icon_url: 'http://i.imgur.com/PFQODUN.png'
									},
									footer: {
										icon_url: 'http://i.imgur.com/FYk8lDP.jpg',
										text: 'MattBot'
									}
								});
								jetpack.write(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-temp.html`, pageCont);
								exec(`diffchecker /home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-latest.html /home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-temp.html`).then(async res => {
									let status;
									if (res.stderr.length > 0) {
										bot.error(`Could not generate diff: ${res.stderr.slice(0, -1)}`);
										embed.setDescription('The diff could not be generated.');
										status = `${site} has updated! #WakingTitan`;
									} else {
										embed.setDescription(`View the change [here](${res.stdout.split(' ').pop().slice(0, -1)}).`);
										status = `${site} has updated! See what's changed here: ${res.stdout.split(' ').pop().slice(0, -1)} #WakingTitan`;
									}
									T.post('statuses/update', {status: status}).catch(err => bot.error(exports.data.name, err));
									for (let channel of data.wakingTitan.channels) {
										bot.channels.get(channel).send('', {
											embed: embed
										});
									}
									await request(`https://web.archive.org/save/${site}`);
									jetpack.remove(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-temp.html`);
									jetpack.write(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-latest.html`, pageCont);
									jetpack.write(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-logs/${strftime('%F - %H-%M-%S')}.html`, pageCont);
									hasUpdate[site] = true;
								});
							}
						} else {
							bot.log(exports.data.name, 'Update was only temporary. Rejected broadcast protocol.');
							hasUpdate[site] = true;
						}
					}).catch(err => bot.error(exports.data.name, err));
				}, 5000);
			} else {
				hasUpdate[site] = false;
			}
		}).catch(err => bot.error(exports.data.name, err));
	}
};

// ================| Helper Functions |================

const clean = (str) => {
	return str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<link\b[^>]*>|Email:.+>|data-token=".+?"|email-protection#.+"|<div class="vc_row wpb_row vc_row-fluid no-margin parallax.+>|data-cfemail=".+?"|<!--[\s\S]*?-->/ig, '');
};
