const Twit = require('twit'),
  Discord = require('discord.js'),
  jetpack = require('fs-jetpack'),
  he = require('he'),
  config = require('../config.json')

const T = new Twit(config.twitter)

let botStream

exports.data = {
  name: 'Twitter Watcher',
  nick: 'twitter',
  command: 'twitter',
  description: 'Creates a watcher for tweets.',
  author: 'Matt C: matt@artemisbot.uk'
}

// Handles adding and removing of followed Twitter accounts
exports.start = async (msg, bot, args) => {
  try {
    let name, userId
    if (args[0][0] === '@') args[0] = args[0].substr(1)
    try {
      if (!(args[0].match(/^[0-9]+$/))) {
        name = args[0]
        userId = (await T.get('users/show', {screen_name: args[0]})).data.id_str
      } else {
        userId = args[0]
        name = (await T.get('users/show', {user_id: args[0]})).data.screen_name
      }
    } catch (err) {
      bot.error(exports.data.name, `Initialisation of twitter stream failed: ${err}`)
    }
    let conf = await jetpack.read('/home/matt/mattBot/watcherData.json', 'json'),
      channels = {}
    if (conf.twitter[userId]) channels = conf.twitter[userId].channels
    channels[msg.channel.id] = JSON.parse(args[1])
    conf.twitter[userId] = {name: name, channels: channels}
    await jetpack.write('/home/matt/mattBot/watcherData.json', conf)
    await msg.reply(`I am now watching ${name} in this channel.`)
    this.watcher(bot)
  } catch (err) {
    msg.reply('Couldn\'t watch this user! Check the logs.')
    bot.error(exports.data.name, `Couldn't start watching a new user: ${err}`)
  }
}

// Watches the specified twitter accounts
exports.watcher = async (bot) => {
  const watch = (jetpack.read('/home/matt/mattBot/watcherData.json', 'json')).twitter
  try {
    botStream.stop()
    // log("oh good")
  } catch (e) {
    // console.error(e)
  }
  // console.log(getFollowList(watch))
  botStream = T.stream('statuses/filter', {
    follow: getFollowList(watch, bot)
  })
  // console.log(botStream)
  botStream.on('tweet', (tweet) => {
    // bot.log(`New tweet from ${tweet.user.name} at ${tweet.created_at}.`)
    const embed = new Discord.RichEmbed({
      color: 0x00ACED,
      author: {
        name: `${tweet.user.name} - @${tweet.user.screen_name}`,
        icon_url: tweet.user.profile_image_url,
        url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
      },
      description: he.decode(tweet.text),
      timestamp: (new Date(tweet.created_at)).toISOString(),
      footer: {
        text: `|`,
        icon_url: 'https://artemisbot.co.uk/i/nb7ko.png'
      }
    })
    // log(tweet.user.id_str)
    if (tweet.user.id_str in watch) {
      bot.log(exports.data.name, `User ${tweet.user.screen_name} has just tweeted at ${tweet.created_at}.`)
      for (let channel in watch[tweet.user.id_str].channels) {
        if (!tweet.in_reply_to_user_id || watch[tweet.user.id_str].channels[channel]) {
          bot.channels.get(channel).send('', {embed: embed})
        }
      }
    }
  })
  botStream.on('error', (err) => {
    bot.error(exports.data.name, `Twitter Stream has exited with error: ${err}`)
    this.watcher(bot)
  })
}
const getFollowList = (watch, bot) => {
  let follow = ''
  if (Object.keys(watch).length > 0) {
    for (let user in watch) {
      for (let channel in watch[user].channels) {
        bot.log(exports.data.name, `Channel ${channel} is watching user ${watch[user].name}.`)
      }
      follow += `${user}, `
    }
  }
  return follow.slice(0, -2)
}
