const moment = require('moment'),
  request = require('request-promise-native'),
  humanize = require('humanize-duration'),
  Discord = require('discord.js'),
  config = require('../config.json')

exports.data = {
  name: 'Twitch Embeds',
  nick: 'twitch',
  command: 'twitch',
  description: 'Creates embeds for twitch channels.',
  group: 'embeds',
  author: 'Matt C: matt@artemisbot.uk',
  syntax: 'wt twitch [channel link/name/id]',
  permissions: 1
}

exports.func = async (msg, args) => {
  msg.channel.startTyping()
  let channel
  let options = {
    id: args[0].split('/').slice(-1).pop() || args[0]
  }
  const r = request.defaults({
    baseUrl: `https://api.twitch.tv/kraken/`,
    headers: {
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Client-ID': config.twitch_clientid
    },
    json: true
  })
  if (!(options.id.match(/^[0-9]+$/))) {
    const userSearch = await r(`/users?login=${options.id}`)
    if (userSearch._total > 0) {
      options.id = userSearch.users[0]['_id']
    } else return msg.reply('Not a real twitch user.'); msg.channel.stopTyping()
  }
  const stream = (await r(`/streams/${options.id}`)).stream
  if (!stream) {
    channel = await r(`/channels/${options.id}`)
  } else channel = stream.channel
  let embed = new Discord.RichEmbed({
    color: 6570405,
    author: {
      icon_url: channel.logo,
      name: `${channel.display_name} on Twitch.tv`,
      url: channel.url
    },
    fields: [
      {
        name: 'Status',
        value: channel.status || 'None',
        inline: false
      },
      {
        name: 'Game',
        value: channel.game || 'None',
        inline: true
      },
      {
        name: 'Followers',
        value: channel.followers,
        inline: true
      }
    ],
    footer: {
      icon_url: 'http://www.newdesignfile.com/postpic/2014/02/twitch-logo_99113.png',
      text: `Powered by the Twitch API. Took ${moment().diff(msg.createdAt)} ms.`
    }
  })
  if (stream) {
    embed.setThumbnail(stream.preview.medium)
    embed.addField('Uptime', humanize(moment().diff(moment(stream.created_at)), {
      round: true
    }), true)
    embed.addField('Viewers', stream.viewers, true)
  }
  msg.channel.stopTyping()
  msg.channel.send('', {embed: embed})
        .catch(console.error)
}
