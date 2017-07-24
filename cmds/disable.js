exports.data = {
  name: 'Disable Command',
  command: 'disable',
  description: 'Disables a command.',
  group: 'system',
  syntax: 'wt disable [command]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 4,
  anywhere: false
}

exports.func = (msg, args, bot) => {
  let command
  bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has disabled ${args[0]} in #${msg.channel.name}.`)
  if (bot.commands.has(args[0])) command = args[0]
  if (!command) return msg.channel.send(`I cannot find the command: ${args[0]}`)
  msg.channel.send(`Disabling: ${command}`)
    .then((m) => {
      bot.disable(command)
        .then(() => m.edit(`Successfully disabled: ${command}`).then((m) => {
          msg.delete(5000)
          m.delete(5000)
        }))
        .catch(e => m.edit(`Command disable failed: ${command}\n\`\`\`${e.stack}\`\`\``))
    })
}
