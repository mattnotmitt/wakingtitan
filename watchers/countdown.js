const moment = require('moment'),
  humanizeDuration = require('humanize-duration'),
  jetpack = require('fs-jetpack')

exports.data = {
  name: 'Countdowns',
  nick: 'countdown',
  command: 'countdown'
}

let countdown

exports.start = (msg, bot, args) => {
  // console.log(args)
  const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
  if (!data.countdown) data.countdown = []
  let timeDiff = moment.unix(args[0]).diff()
  // console.log(timeDiff)
  if (timeDiff > 0) {
    msg.channel.send(`**Time until ${args.slice(1).join(' ')}:** ${humanizeDuration(timeDiff, {round: true})}`)
      .then(m => {
        data.countdown.push({
          'text': args.slice(1).join(' '),
          'message': m.id,
          'channel': m.channel.id,
          'unix': args[0]
        })
        // console.log(data.countdown)
        jetpack.write('/home/matt/mattBot/watcherData.json', data)
        m.pin().catch(err => bot.error(`Failed to pin message: ${err}`))
      })
  }
}

exports.stop = async (msg, bot, args) => {
  const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
  if (!data.countdown) data.countdown = []
  msg.reply(`Countdown with ID ${args[0]} has been cancelled.`);
  (await bot.channels.get(data.countdown[parseInt(args[0])].channel).fetchMessage(data.countdown[parseInt(args[0])].message)).edit(`**Countdown Cancelled.**`)
    .then(async () => {
      (await bot.channels.get(data.countdown[parseInt(args[0])].channel).fetchMessage(data.countdown[parseInt(args[0])].message)).delete(5000)
      data.countdown.splice(parseInt(args[0]), 1)
      jetpack.write('/home/matt/mattBot/watcherData.json', data)
    })
}

exports.watcher = async (bot) => {
  clearInterval(countdown)
  countdown = setInterval(async () => {
    const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
    if (!data.countdown) data.countdown = []
    if (data.countdown.length > 0) {
      for (let i = 0; i < data.countdown.length; i++) {
        let timeDiff = moment.unix(data.countdown[i].unix).diff(),
          channel = bot.channels.get(data.countdown[i].channel)
        if (timeDiff > 0) {
          (await channel.fetchMessage(data.countdown[i].message)).edit(`**Time until ${data.countdown[i].text}:** ${humanizeDuration(timeDiff, {round: true})}`)
        } else {
          (await channel.fetchMessage(data.countdown[i].message)).edit(`It's time for ${data.countdown[i].text}!`).then(m => m.delete(60000))
          channel.send(`It's time for ${data.countdown[i].text}!`)
          data.countdown.splice(i, 1)
          jetpack.write('/home/matt/mattBot/watcherData.json', data)
        }
      }
    }
  }, 5000)
}
