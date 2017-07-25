const request = require('request-promise-native'),
  jetpack = require('fs-jetpack'),
  Discord = require('discord.js'),
  moment = require('moment'),
  _ = require('lodash'),
  humanizeDuration = require('humanize-duration').humanizer({
    units: ['y', 'mo', 'w', 'd', 'h', 'm'],
    round: true
  })

let repeat,
  lastCities

exports.data = {
  name: 'Project-WT Cities',
  command: 'pwtCities'
}

exports.watcher = async bot => {
  this.disable()
  lastCities = await getCities(bot)
  postCities(bot)
  repeat = setInterval(() => {
    postCities(bot)
  }, 2 * 60 * 1000)
}

exports.start = (msg, bot, args) => {
  let data = jetpack.read('watcherData.json', 'json')
  if (!data.pwtCities.channels[msg.channel.id]) {
    msg.channel.send('This message will momentarily update with the latest status.').then(async m => {
      data.pwtCities.channels[m.channel.id] = m.id
      bot.log(exports.data.name, `Now outputting city updates to #${msg.channel.name} in ${msg.guild.name}.`)
      msg.reply('Now outputting city updates to this channel.')
      jetpack.write('watcherData.json', data)
      lastCities = await getCities(bot)
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
      liveMsg = '',
      compCount = 0
    if (!_.isEqual(cities, lastCities)) {
      // console.log(lastCities)
      let updateMsg = ''
      Object.keys(cities).sort().forEach(city => {
        if (typeof lastCities[city] === 'undefined') {
          // console.log(city)
          updateMsg += `${city}: New -> ${typeof cities[city] === 'boolean' ? '☑️' : `${cities[city]}%`} | `
        } else if (cities[city] !== lastCities[city]) {
          // console.log(city)
          updateMsg += `${city}: ${typeof lastCities[city] === 'boolean' ? '☑️' : `${lastCities[city]}%`} -> ${typeof cities[city] === 'boolean' ? '☑️' : `${cities[city]}%`} | `
        }
      })
      let updateEmbed = new Discord.RichEmbed({
        author: {
          name: 'Update to location list on project-wt.com',
          icon_url: 'http://i.imgur.com/Xm6m0fr.png',
          url: 'http://project-wt.com'
        },
        description: updateMsg.slice(0, -3),
        color: 0x993E4D,
        footer: {
          text: 'Sent on'
        },
        timestamp: moment().toISOString()
      })
      data.pwtCities.lastChange = moment().unix()
      jetpack.write('/home/matt/mattBot/watcherData.json', data)
      for (let channel in data.pwtCities.channels) {
        await bot.channels.get(channel).send('', {
          embed: updateEmbed
        })
      }
    }
    lastCities = cities
    Object.keys(cities).sort().forEach(city => {
      if (typeof cities[city] === 'boolean') compCount++
      liveMsg += `${city}: ${typeof cities[city] === 'boolean' ? '☑️' : `${cities[city]}%`} | `
    })
    let liveEmbed = new Discord.RichEmbed({
      author: {
        name: 'Live updating list of locations from project-wt.com.',
        icon_url: 'http://i.imgur.com/Xm6m0fr.png',
        url: 'http://project-wt.com'
      },
      description: `**${Object.keys(cities).length} Locations**\n**${compCount} Complete**\n${liveMsg.slice(0, -3)}`,
      color: 0x993E4D,
      footer: {
        text: `Last change ${humanizeDuration(moment().diff(moment.unix(data.pwtCities.lastChange)))} ago | Last checked on`
      },
      timestamp: moment().toISOString()
    })
    for (let channel in data.pwtCities.channels) {
      // console.log(await bot.channels.get(channel).name);
      (await bot.channels.get(channel).fetchMessage(data.pwtCities.channels[channel])).edit('', {
        embed: liveEmbed
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
      // console.log(cities)
      resolve(cities)
    } catch (e) {
      reject(e)
    }
  })
}
