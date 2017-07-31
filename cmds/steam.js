const request = require('request-promise-native'),
  moment = require('moment'),
  humanize = require('humanize-duration'),
  config = require('../config.json')

exports.data = {
  name: 'Steam Embeds',
  nick: 'steam',
  command: 'steam',
  description: 'Creates embeds for Steam profiles',
  group: 'embeds',
  author: 'Matt C: matt@artemisbot.uk',
  syntax: 'wt steam [vanity/id]',
  permissions: 1
}
exports.func = async (msg, args) => {
  try {
    msg.channel.startTyping()
    const options = {
      url: 'https://api.steampowered.com',
      key: config.steamKey
    }
    let id = args[0]
    if (!(args[0].match(/^[0-9]+$/))) {
      id = await request(`${options.url}/ISteamUser/ResolveVanityURL/v1/?key=${options.key}&vanityurl=${args}`)
      id = JSON.parse(id).response.steamid
    }
    const profile = await request(`${options.url}/ISteamUser/GetPlayerSummaries/v2/?key=${options.key}&steamids=${id}`)
    const name = JSON.parse(profile).response.players[0].personaname
    const age = humanize(moment().diff(moment.unix(JSON.parse(profile).response.players[0].timecreated)), { // eslint-disable-line max-len
      largest: 2,
      round: true
    })
    const avatar = JSON.parse(profile).response.players[0].avatarmedium
    let friends = await request(`${options.url}/ISteamUser/GetFriendList/v1/?key=${options.key}&steamid=${id}`)
    friends = JSON.parse(friends).friendslist.friends.length
    let games = await request(`${options.url}/IPlayerService/GetOwnedGames/v1/?key=${options.key}&steamid=${id}&include_appinfo=false&include_played_free_games=false`)
    games = JSON.parse(games).response.game_count
    let level = await request(`${options.url}/IPlayerService/GetSteamLevel/v1/?key=${options.key}&steamid=${id}`)
    level = JSON.parse(level).response.player_level
    const embed = {
      author: {
        name: `${name} on Steam.`,
        url: `https://steamcommunity.com/profiles/${id}/`,
        icon_url: 'https://artemisbot.uk/i/kng7b.png'
      },
      color: 0x102753,
      thumbnail: {url: avatar},
      fields: [
        {
          name: 'Games',
          value: games,
          inline: true
        },
        {
          name: 'Account Age',
          value: age,
          inline: true
        },
        {
          name: 'Friends',
          value: friends,
          inline: true
        },
        {
          name: 'Level',
          value: level,
          inline: true
        }
      ],
      footer: {
        text: `Powered by Steam API. Took ${moment().diff(msg.createdAt)} ms.`
      }
    }
    msg.channel.stopTyping()
    msg.channel.send('', {embed: embed})
          .catch(console.error)
  } catch (e) {
    msg.channel.stopTyping()
    msg.reply('Fail. User probably has private profile/Steam API is down.').catch(console.error)
  }
}
