exports.data = {
  name: 'Source',
  command: 'source',
  description: 'Provides a link to the bot\'s source code',
  group: 'system',
  syntax: 'wt source',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 0
}

exports.func = (msg, args, bot) => {
  bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has requested the bot's source in #${msg.channel.name} on ${msg.guild.name}.`)
  msg.reply(`The bot's source can be found at https://github.com/artemisbot/wakingtitan`).catch(e => bot.error(exports.data.name, `Message failed to send: ${e}`))
}
