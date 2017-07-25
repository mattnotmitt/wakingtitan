const wterminal = require('../cmds/terminal.js').runCommand,
  jetpack = require('fs-jetpack'),
  Discord = require('discord.js'),
  moment = require('moment'),
  Twit = require('twit'),
  config = require('../config.json')

let repeat

const T = new Twit(config.WTTwitter)

exports.data = {
  name: 'Waking Titan Terminal Calibration',
  command: 'wtCalibration'
}

exports.watcher = (bot) => {
  this.disable()
  repeat = setInterval(async() => {
    checkCalibration(bot)
  }, 0.5 * 60 * 1000)
  bot.log(exports.data.name, `${exports.data.name} has initialised successfully.`)
}

exports.start = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json'),
    index = data.wtCalibration.channels.indexOf(msg.channel.id)
  if (index < 0) {
    data.wtCalibration.channels.push(msg.channel.id)
    bot.log(exports.data.name, `Now outputting calibration updates to #${msg.channel.name} in ${msg.guild.name}.`)
    msg.reply('Now outputting calibration updates to this channel.')
    jetpack.write('watcherData.json', data)
  } else {
    return msg.reply('This channel is already receiving updates on the calibration command.')
  }
}

exports.stop = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json'),
    index = data.wtCalibration.channels.indexOf(msg.channel.id)
  if (index >= 0) {
    data.wtCalibration.channels.splice(index, 1)
    bot.log(exports.data.name, `No longer outputting calibration updates to #${msg.channel.name} in ${msg.guild.name}.`)
    jetpack.write('watcherData.json', data)
  } else {
    return msg.reply('This channel is not receiving updates on the calibration command.')
  }
}

exports.disable = () => {
  clearInterval(repeat)
}

const checkCalibration = async (bot) => {
  try {
    let resp = await wterminal('calibration'),
      data = jetpack.read('watcherData.json', 'json'),
      statMsg = resp.data.message.join('\n')
    if (statMsg !== data.wtCalibration.value) {
      let embed = new Discord.RichEmbed({
        author: {
          name: 'The value of the calibration command has updated.',
          icon_url: 'http://i.imgur.com/Xm6m0fr.png',
          url: 'http://wakingtitan.com'
        },
        title: `**> calibration**`,
        description: `**${statMsg}**`,
        color: resp.success ? 0x00fc5d : 0xf00404,
        footer: {
          text: 'Waking Titan Terminal'
        },
        timestamp: moment().toISOString()
      })
      await T.post('statuses/update', {status: statMsg.length <= 53 ? `The wakingtitan.com calibration command has been updated to say "${statMsg}" #WakingTitan` : `The wakingtitan.com calibration command has been updated to say "${statMsg.slice(0, 52)}…" #WakingTitan`})
      for (let channel of data.wtCalibration.channels) {
        await bot.channels.get(channel).send('', {
          embed: embed
        }).then(m => m.pin())
      }
      data.wtCalibration.value = statMsg
      jetpack.write('watcherData.json', data)
    }
  } catch (e) {
    bot.error(exports.data.name, `Something went wrong: ${e}`)
  }
}
