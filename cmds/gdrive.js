exports.data = {
	name: 'Google Drive Fetch',
	command: 'gdrive',
	description: 'Google Drive contents listing.',
	group: 'system',
	syntax: 'wt gdrive [folder id]',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 2
};

const google = require('googleapis');
const Discord = require('discord.js');
const auth = require('../config.json').gdrive_service_account;
const log = require('../lib/log.js')(exports.data.name);

const jwtClient = new google.auth.JWT(
  auth.client_email,
  null,
  auth.private_key,
  ['https://www.googleapis.com/auth/drive'],
  null
);

exports.func = async (msg, args, bot) => {
	try {
		let folder = await checkFolder(args[0]);
		let embed = new Discord.RichEmbed({
			author: {
				name: `Contents of ${folder.parentName}`,
				icon_url: 'http://i.imgur.com/Xm6m0fr.png',
				url: folder.parentLink
			},
			color: 0x993E4D,
			timestamp: folder.parentMod,
			footer: {
				text: 'Folder last modified on '
			}
		});
		folder.files.forEach(file => {
			embed.addField(`${file.name}`, `${file.mimeType.split('/').slice(-1)[0].split('.').slice(-1)[0].toUpperCase()} | [Link](${file.webViewLink})`, false);
		});
		log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has checked ${folder.parentName} (${args[0]}) in #${msg.channel.name} on ${msg.guild.name}.`);
		await msg.channel.send('', {embed: embed});
	} catch (e) {
		if (e.message === 'NotFolder') return msg.reply('The provided ID does not correspond to a folder.');
		if (e.message === 'EmptyFolder') return msg.reply('The provided ID is of an empty folder.');
		if (e.message === 'DoesNotExist') return msg.reply('The selected ID does not correspond to any known folder.');
		log.error(`Something went wrong: ${e}`);
		msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.');
	}
};

const checkFolder = (folderID) => {
	return new Promise((resolve, reject) => {
		google.drive('v3').files.get({
			auth: jwtClient,
			fileId: folderID,
			fields: 'id,modifiedTime,name,webViewLink,mimeType'
		}, (err, resp) => {
			try {
				if (!resp) return reject(new Error('DoesNotExist'));
				if (resp.mimeType !== 'application/vnd.google-apps.folder') return reject(new Error('NotFolder'));
				if (err) return reject(err);
			} catch (e) {
				reject(e);
			}
			google.drive('v3').files.list({
				auth: jwtClient,
				q: `'${folderID}' in parents`,
				fields: 'files(modifiedTime,mimeType,name,webViewLink)'
			}, (err, resp2) => {
				if (err) reject(err);
				if (resp2.files.length === 0) return reject(new Error('EmptyFolder'));
				resp2.parentName = resp.name;
				resp2.parentLink = resp.webViewLink;
				resp2.parentMod = resp.modifiedTime;
				resolve(resp2);
			});
		});
	});
};
