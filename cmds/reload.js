exports.data = {
  name: 'Reload Command',
  command: 'reload',
  description: 'Reloads a command.',
  group: 'system',
  syntax: 'matt reload [command]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 4,
  anywhere: true
}

exports.func = async(msg, args, bot) => {
  let command
  if (bot.commands.has(args[0])) command = args[0]
  bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has reloaded command ${command} in #${msg.channel.name}.`)
  if (!command) return msg.channel.send(`I cannot find the command: ${args[0]}`)
  msg.channel.send(`Enabling: ${command}`)
    .then((m) => {
      bot.reload(command)
        .then(() => {
          m.edit(`Successfully reloaded: ${command}`).then((m) => {
            msg.delete(5000)
            m.delete(5000)
          })
        })
        .catch(e => m.edit(`Command reload failed: ${command}\n\`\`\`${e.stack}\`\`\``))
    })
}
