exports.data = {
	name: 'Enable Command',
	command: 'enable',
	description: 'Enables a new/disabled command.',
	syntax: 'wt enable [command]',
	group: 'system',
	author: 'Matt C: matt@artemisbot.uk',
	permissions: 3,
	anywhere: false
};

const log = require('../lib/log.js')(exports.data.name);

exports.func = async (msg, args, bot) => {
	try {
		const command = args[0];
		if (args.length !== 1) return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`);
		let m = await msg.channel.send(`Enabling: ${command}`);
		await bot.enable(command);
		await m.edit(`Successfully enabled: ${command}`);
		log.info(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has enabled ${args[0]} in #${msg.channel.name} on ${msg.guild.name}.`);
	} catch (e) {
		log.error(`Something went wrong: ${e}`);
	}
};
