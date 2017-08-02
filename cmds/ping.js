exports.data = {
	name: 'Ping',
	command: 'ping',
	description: 'Ping check.',
	group: 'system',
	syntax: 'wt ping',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3
};

const moment = require('moment');
const log = require('../lib/log.js')(exports.data.name);

exports.func = (msg, args, bot) => {
	log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has pinged the bot in #${msg.channel.name} on ${msg.guild.name}.`);
	msg.channel.send(`Pls wait.`)
    .then(m => m.edit(`🏓 Took ${moment().diff(m.createdAt)} ms.`));
};
