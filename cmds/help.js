const Discord = require('discord.js')

exports.data = {
  name: 'Help',
  description: 'Lists available commands.',
  group: 'system',
  command: 'help',
  syntax: 'wt help [optional:command]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 0,
  anywhere: false
}

exports.func = async (msg, args, bot) => {
  let commands = bot.commands.keys(),
    spec = args[0] || null,
    help = new Discord.RichEmbed({
      color: 2212073
    }),
    hidden = 0,
    cmdData,
    dm
  try {
    if (!spec) {
      help.setTitle('__Commands on this bot.__')
      bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has listed the available commands in #${msg.channel.name}.`)
      for (let command of commands) {
        cmdData = bot.commands.get(command).data
        if (bot.elevation(msg) >= cmdData.permissions) {
          help.addField(cmdData['syntax'], cmdData['description'])
        } else if (!(command === 'quote' || command === 'emote')) hidden++
      }
      if (hidden > 0) help.setFooter(`${hidden} commands were not shown due to your permission level.`)
      dm = await msg.author.createDM().catch(err => bot.error(exports.data.name, err))
      dm.send('If you can\'t see any commands listed, make sure you have link previews enabled in **Settings** -> **Text & Images**.', {
        embed: help
      }).then(() => bot.delReply(msg, 'I have DMed you with the avaliable commands in this server.')).catch((err) => {
        bot.error(exports.data.name, `Could not DM user: ${err}.`)
        bot.delReply(msg, `I could not DM you, please check your settings.`)
      })
    } else {
      if (!bot.commands.has(spec)) return bot.delReply(msg, 'The specified command does not exist.')
      bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has requested additional info on !${spec} in #${msg.channel.name}.`)
      cmdData = bot.commands.get(spec).data
      if (bot.elevation(msg) < cmdData.permissions) return bot.delReply(msg, 'You do not have permissions to view this command.')
      help.setTitle(`__${cmdData['name']} Command__`)
      help.addField('Description', cmdData['description'], true)
      help.addField('Syntax', cmdData['syntax'], true)
      help.addField('Author', cmdData['author'], true)
      await msg.reply('', {embed: help})
    }
  } catch (err) {
    bot.error(exports.data.name, `Error: ${err}.`)
  }
}
