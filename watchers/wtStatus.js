const wterminal = require('../cmds/terminal.js').runCommand,
  jetpack = require('fs-jetpack'),
  Discord = require('discord.js'),
  moment = require('moment'),
  Twit = require('twit'),
  config = require('../config.json')

let repeat

const T = new Twit(config.WTTwitter)

exports.data = {
  name: 'Waking Titan Terminal Status',
  command: 'wtStatus'
}

exports.watcher = (bot) => {
  this.disable()
  repeat = setInterval(async() => {
    checkStatus(bot)
  }, 0.5 * 60 * 1000)
  bot.log(exports.data.name, `${exports.data.name} has initialised successfully.`)
}

exports.start = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json'),
    index = data.wtStatus.channels.indexOf(msg.channel.id)
  if (index < 0) {
    data.wtStatus.channels.push(msg.channel.id)
    bot.log(exports.data.name, `Now outputting status updates to #${msg.channel.name} in ${msg.guild.name}.`)
    msg.reply('Now outputting status updates to this channel.')
    jetpack.write('watcherData.json', data)
  } else {
    return msg.reply('This channel is already receiving updates on the status command.')
  }
}

exports.stop = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json'),
    index = data.wtStatus.channels.indexOf(msg.channel.id)
  if (index >= 0) {
    data.wtStatus.channels.splice(index, 1)
    bot.log(exports.data.name, `No longer outputting status updates to #${msg.channel.name} in ${msg.guild.name}.`)
    jetpack.write('watcherData.json', data)
  } else {
    return msg.reply('This channel is not receiving updates on the status command.')
  }
}

exports.disable = () => {
  clearInterval(repeat)
}

const checkStatus = async (bot) => {
  try {
    let resp = await wterminal('status'),
      data = jetpack.read('watcherData.json', 'json'),
      statMsg = resp.data.message.join('\n')
    if (statMsg !== data.wtStatus.status) {
      let embed = new Discord.RichEmbed({
        author: {
          name: 'The value of the status command has updated.',
          icon_url: 'http://i.imgur.com/Xm6m0fr.png',
          url: 'http://wakingtitan.com'
        },
        title: `**> status**`,
        description: `**${statMsg}**`,
        color: resp.success ? 0x00fc5d : 0xf00404,
        footer: {
          text: 'Waking Titan Terminal'
        },
        timestamp: moment().toISOString()
      })
      await T.post('statuses/update', {status: statMsg.length <= 58 ? `The wakingtitan.com status command has been updated to say "${statMsg}" #WakingTitan` : `The wakingtitan.com status command has been updated to say "${statMsg.slice(0, 57)}…" #WakingTitan`})
      for (let channel of data.wtStatus.channels) {
        await bot.channels.get(channel).send('', {
          embed: embed
        }).then(m => m.pin())
      }
      data.wtStatus.status = statMsg
      jetpack.write('watcherData.json', data)
    }
  } catch (e) {
    bot.error(exports.data.name, `Something went wrong: ${e}`)
  }
}
