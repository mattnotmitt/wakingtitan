exports.data = {
  name: 'Enable Command',
  command: 'enable',
  description: 'Enables a new/disabled command.',
  syntax: 'wt enable [command]',
  group: 'system',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 4,
  anywhere: false
}

exports.func = async(msg, args, bot) => {
  const command = args[0]
  if (args.length !== 1) return msg.reply(`You haven't provided enough arguments. The proper syntax for "${this.data.name}" is \`${this.data.syntax}\`.`)
  bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has enabled ${command} in #${msg.channel.name}.`)
  msg.channel.send(`Enabling: ${command}`)
    .then((m) => {
      bot.enable(command)
        .then(() => m.edit(`Successfully enabled: ${command}`).then((m) => {
          msg.delete(5000)
          m.delete(5000)
        }))
        .catch((e) => m.edit(`Command enable failed: ${command}\n\`\`\`${e.stack}\`\`\``))
    })
}
