const moment = require('moment')

exports.data = {
  name: 'Ping',
  command: 'ping',
  description: 'Ping check.',
  group: 'system',
  syntax: 'wt ping',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 3
}

exports.func = (msg, args, bot) => {
  bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has pinged the bot in #${msg.channel.name}.`)
  msg.channel.send(`Pls wait.`)
    .then(m => m.edit(`🏓 Took ${moment().diff(m.createdAt)} ms.`))
}
