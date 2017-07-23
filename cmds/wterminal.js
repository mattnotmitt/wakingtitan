const request = require('request-promise-native'),
  moment = require('moment')

exports.data = {
  name: 'Waking Titan Terminal Commands',
  command: 'wterminal',
  description: 'Checks value of a Waking Titan terminal commmand.',
  group: 'WakingTitan',
  syntax: 'matt wterminal [command]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 3
}

exports.func = async (msg, args, bot) => {
  try {
    if (args.length === 0) return msg.reply('You must provide at least 1 command for the bot to run.')
    bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has sent ${args.join(' ')} to Waking Titan in #${msg.channel.name}.`)
    msg.channel.startTyping()
    let resp = await this.runCommand(args[0], args.slice(1))
    msg.channel.stopTyping()
    msg.channel.send('', {embed: {
      title: `> ${args.join(' ').toUpperCase()}`,
      description: `**${resp.data.message.join('\n')}**`,
      color: resp.success ? 0x00fc5d : 0xf00404,
      footer: {
        icon_url: 'http://i.imgur.com/FYk8lDP.jpg',
        text: 'Waking Titan Terminal'
      },
      timestamp: moment().toISOString(),
      url: 'http://wakingtitan.com'
    }})
  } catch (e) {
    bot.error(exports.data.name, `Something went wrong: ${e}`)
    msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.')
  }
}

exports.runCommand = (command, params) => {
  return new Promise(async (resolve, reject) => {
    try {
      let cookJar = request.jar()
      cookJar.setCookie(request.cookie('terminal=%5B%22atlas%22%2C%22csd%22%2C%222fee0b5b-6312-492a-8308-e7eec4287495%22%2C%2205190fed-b606-4321-a52e-c1d1b39f2861%22%2C%22f7c05c4f-18a5-47a7-bd8e-804347a15f42%22%5D'), 'http://wakingtitan.com')
      resolve(await request.post({url: 'http://wakingtitan.com/terminal', json: true, jar: cookJar, form: {command: command, 'param[]': params}, qsStringifyOptions: {arrayFormat: 'repeat'}}))
    } catch (e) {
      reject(e)
    }
  })
}
