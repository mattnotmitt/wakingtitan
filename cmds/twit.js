const Twit = require('twit'),
  Discord = require('discord.js'),
  config = require('../config.json')

exports.data = {
  name: 'Twitter Embeds',
  nick: 'twit',
  command: 'twit',
  description: 'Creates embeds for tweets.',
  group: 'embeds',
  author: 'Matt C: matt@artemisbot.uk',
  syntax: 'wt twit [id/link]',
  permissions: 1
}

exports.func = async(msg, args) => {
  msg.channel.startTyping()
  try {
    const options = {
      id: args[0].split('/').slice(-1).pop() || args[0]
    }
    const T = new Twit(config.WTTwitter)
    let tweet = (await T.get('statuses/show/:id', {
      'id': options.id
    })).data
    if (!tweet.errors) {
      let embed = new Discord.RichEmbed({
        color: 0x00ACED,
        author: {
          name: `${tweet.user.name} - @${tweet.user.screen_name}`,
          icon_url: tweet.user.profile_image_url,
          url: `https://twitter.com/${tweet.user.screen_name}/status/${options.id}`
        },
        timestamp: (new Date(tweet.created_at)).toISOString(),
        description: tweet.text,
        fields: [
          {
            name: 'Retweets',
            value: tweet.retweet_count,
            inline: true
          },
          {
            name: 'Likes',
            value: tweet.favorite_count,
            inline: true
          }
        ],
        footer: {
          text: `Twitter`,
          icon_url: 'https://artemisbot.uk/i/nb7ko.png'
        }
      })
      msg.channel.send('', {embed: embed})
            .catch(console.error)
    } else {
      if (tweet.errors[0].code !== 179) {
        msg.reply('Tweet was made by a protected account.').then((m) => {
          m.delete(2000)
          msg.delete(2000)
        })
      }
    }
  } catch (e) {
    msg.reply(`Something went wrong with the Twitter API: ${e.stack}`)
  }
  msg.channel.stopTyping()
}
