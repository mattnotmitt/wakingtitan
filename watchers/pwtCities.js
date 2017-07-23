const request = require('request-promise-native'),
  jetpack = require('fs-jetpack'),
  Discord = require('discord.js'),
  moment = require('moment')

let repeat

exports.data = {
  name: 'Project-WT Cities',
  command: 'pwtCities'
}

exports.watcher = bot => {
  this.disable()
  postCities(bot)
  repeat = setInterval(() => {
    postCities(bot)
  }, 5 * 60 * 1000)
}

exports.start = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json')
  if (!data.pwtCities.channels[msg.channel.id]) {
    msg.channel.send('This message will momentarily update with the latest status.').then(m => {
      data.pwtCities.channels[m.channel.id] = m.id
      bot.log(exports.data.name, `Now outputting city updates to #${msg.channel.name} in ${msg.guild.name}.`)
      msg.reply('Now outputting city updates to this channel.')
      jetpack.write('watcherData.json', data)
      postCities(bot)
    })
  } else {
    return msg.reply('This channel is already receiving updates on the cities.')
  }
}

exports.stop = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json')
  if (data.pwtCities.channels[msg.channel.id]) {
    delete data.pwtCities.channels[msg.channel.id]
    bot.log(exports.data.name, `No longer outputting city updates to #${msg.channel.name} in ${msg.guild.name}.`)
    jetpack.write('watcherData.json', data)
  } else {
    return msg.reply('This channel is not receiving updates on the cities.')
  }
}

exports.disable = () => {
  clearInterval(repeat)
}

const postCities = async (bot) => {
  try {
    let cities = await getCities(bot),
      data = jetpack.read('watcherData.json', 'json'),
      msg = ''
    Object.keys(cities).forEach(city => {
      msg += `${city}: ${typeof cities[city] === 'boolean' ? '☑️' : `${cities[city]}%`} | `
    })
    let embed = new Discord.RichEmbed({
      author: {
        name: 'Live updating list of cities from project-wt.com.',
        icon_url: 'http://i.imgur.com/Xm6m0fr.png',
        url: 'http://project-wt.com'
      },
      description: msg.slice(0, -3),
      color: 0x993E4D,
      footer: {
        text: 'Updated on'
      },
      timestamp: moment().toISOString()
    })
    for (let channel in data.pwtCities.channels) {
      (await bot.channels.get(channel).fetchMessage(data.pwtCities.channels[channel])).edit('', {
        embed: embed
      })
    }
  } catch (e) {
    bot.error(exports.data.name, `Something went wrong: ${e}`)
  }
}

const getCities = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let cityRaw = await request({url: 'https://project-wt.com/cities/1', json: true}),
        cities = {}
      cityRaw.forEach(city => {
        cities[city.name] = city.isReady ? city.isReady : city.progression
      })
      resolve(cities)
    } catch (e) {
      reject(e)
    }
  })
}
