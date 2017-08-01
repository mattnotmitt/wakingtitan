exports.data = {
  name: 'Source',
  command: 'source',
  description: 'Provides a link to the bot\'s source code',
  group: 'system',
  syntax: 'wt source',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 0
}

const log = require('../lib/log.js')(exports.data.name)

exports.func = async (msg, args, bot) => {
  try {
    log.verbose(`${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has requested the bot's source in #${msg.channel.name} on ${msg.guild.name}.`)
    await msg.reply(`The bot's source can be found at https://github.com/artemisbot/wakingtitan`)
  } catch (e) {
    log.error(`Something went wrong: ${e}`)
  }
}
