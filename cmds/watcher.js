exports.data = {
  name: 'Watchers',
  command: 'watcher',
  description: 'Watcher functions',
  group: 'system',
  syntax: 'wt watcher [start|stop|enable|disable|list] [watcherName] [params]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 3,
  anywhere: true
}

const jetpack = require('fs-jetpack'),
  log = require('../lib/log.js')(exports.data.name)

exports.func = async (msg, args, bot) => {
  let watcherData = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
  try {
    if (args[0] === 'start') {
      if (bot.watchers.has(args[1])) {
        bot.watchers.get(args[1]).start(msg, bot, args.slice(2))
      } else {
        msg.reply('Selected watcher does not exist.')
      }
    } else if (args[0] === 'stop') {
      if (bot.watchers.has(args[1])) {
        bot.watchers.get(args[1]).stop(msg, bot, args.slice(2))
      } else {
        msg.reply('Selected watcher does not exist.')
      }
    } else if (args[0] === 'enable') {
      if (bot.watchers.has(args[1]) || jetpack.list('./watchers/').indexOf(`${args[1]}.js`) >= 0) {
        if (!watcherData[args[1]].enable) {
          bot.watcherEnable(args[1], watcherData)
          msg.reply('Enable successful.')
        } else {
          msg.reply('Enable failed: watcher already enabled.')
        }
      } else {
        msg.reply('Selected watcher does not exist.')
      }
    } else if (args[0] === 'disable') {
      if (bot.watchers.has(args[1])) {
        if (watcherData[args[1]].enable) {
          bot.watcherDisable(args[1], watcherData)
          msg.reply('Disable successful.')
        } else {
          msg.reply('Disable failed: watcher already disabled.')
        }
      } else {
        msg.reply('Selected watcher does not exist.')
      }
    } else if (args[0] === 'list') {
      msg.reply('Available watchers are `twitter, wakingTitan, pwtCities, gdrive, steamdb, terminal, twitch, wtCalibration, wtStatus and countdown`.')
    }
  } catch (e) {
    msg.reply('Something went wrong.')
    log.error(`Something went wrong: ${e}`)
  }
}
