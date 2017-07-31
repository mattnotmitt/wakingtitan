/*
 * Name: YouTube Embeds
 * Author: Matt C [matt@artemisbot.uk]
 * Description: Creates embeds for YouTube Videos, Channels and Playlists.
 */

const request = require('request-promise-native'),
  moment = require('moment'),
  config = require('../config.json'),
  humanize = require('humanize-duration')

exports.data = {
  name: 'YouTube Embeds',
  nick: 'youtube',
  command: 'yt',
  description: 'Creates embeds for YouTube Videos from ID - NOT LINK YET.',
  group: 'embeds',
  author: 'Matt C: matt@artemisbot.uk',
  syntax: 'wt yt [id]',
  permissions: 1
}

exports.func = async (msg, args) => {
  const options = {
    url: 'https://www.googleapis.com/youtube/v3',
    key: config.youtubeKey
  }
  let searchResult = await request(`${options.url}/videos?key=${options.key}&id=${args}&part=statistics,snippet,contentDetails`)
  searchResult = JSON.parse(searchResult).items[0]
  if (!searchResult) return msg.reply('There was nothing found with that video ID.'); msg.channel.stopTyping()
  let channelInfo = await request(`${options.url}/channels?key=${options.key}&id=${searchResult.snippet.channelId}&part=statistics,snippet`)
  channelInfo = JSON.parse(channelInfo).items[0]
  console.log(searchResult.contentDetails.duration)
  const embed = {
    author: {
      name: searchResult.snippet.title,
      url: `https://youtube.com/watch?v=${searchResult.id}`,
      icon_url: channelInfo.snippet.thumbnails.default.url
    },
    color: 16655651,
    thumbnail: { url: searchResult.snippet.thumbnails.default.url },
    fields: [
      {
        name: 'Channel',
        value: `[${channelInfo.snippet.title}](https://www.youtube.com/channel/${searchResult.snippet.channelId})`,
        inline: true
      },
      {
        name: 'Duration',
        value: humanize(moment.duration(searchResult.contentDetails.duration)),
        inline: false
      },
      {
        name: 'Views',
        value: parseInt(searchResult.statistics.viewCount).toLocaleString(),
        inline: true
      },
      {
        name: 'Upload Date',
        value: moment(searchResult.snippet.publishedAt).format('Do MMMM YYYY, h:mm:ss a'),
        inline: true
      }
    ],
    footer: {
      text: `Powered by YouTube API. Took ${moment().diff(msg.createdAt)} ms.`,
      icon_url: 'https://artemisbot.uk/i/zrc5j.png'
    }
  }
  msg.channel.send('', {embed: embed})
        .catch(console.error)
}
