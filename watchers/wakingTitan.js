// ================| Initialisation |================

// Loads required modules
const _ = require('lodash'),
  config = require('../config.json'),
  CSSselect = require('css-select'),
  Discord = require('discord.js'),
  he = require('he'),
  htmlparser = require('htmlparser2'),
  jetpack = require('fs-jetpack'),
  moment = require('moment'),
  request = require('request-promise-native'),
  strftime = require('strftime'),
  Twit = require('twit'),
  Wikibot = require('nodemw'),
  exec = require('child-process-promise').exec

// Initialisation of wiki bot
const OcelBot = new Wikibot({
  protocol: 'http',
  server: 'wiki.gamedetectives.net',
  path: '',
  debug: false,
  username: config.wiki_user,
  password: config.wiki_pass
})

const T = new Twit(config.WTTwitter)

// Makes repeats global
let repeat,
  hasUpdate = {'http://echo-64.com': false,
    'http://atlas-65.com': false,
    'http://myriad-70.com': false,
    'http://multiverse-75.com': false,
    'http://superlumina-6c.com': false}

// Data for bot framework
exports.data = {
  name: 'Waking Titan',
  command: 'wakingTitan'
}

// Starts intervals
exports.watcher = async(bot) => {
  // In case of restarting this watcher, kill all loops
  this.disable()
  bot.log(exports.data.name, 'Waking Titan has initialised successfully.')
  repeat = setInterval(async() => {
    checkStations(bot)
    checkGlyphs(bot)
    checkSites(bot)
  }, 0.5 * 60 * 1000) // Repeat every 30 seconds
}

exports.disable = () => {
  clearInterval(repeat)
}
// ================| Main Functions |================

// Checks stations on project-wt.com
const checkStations = async(bot) => {
  const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json'),
    stations = data.wakingTitan.stations,
    announced = await getAnnouncedStations()
  let change = false
  for (let city in announced) {
    let cityStat = stations[city]
    if (!_.isEqual(announced[city], cityStat)) {
      bot.log(exports.data.name, 'New Station online.')
      change = true
      let title = /<meta property="og:title" content="(.+)" \/>/g.exec(he.decode(await request(announced[city].stationLink)))[1]
      const embed = new Discord.RichEmbed({
        color: 0x993E4D,
        timestamp: moment().toISOString(),
        title: title,
        url: announced[city].stationLink,
        footer: {
          icon_url: 'http://i.imgur.com/FYk8lDP.jpg',
          text: 'MattBot'
        },
        author: {
          name: 'A new radio station has been revealed at Project Waking Titan',
          url: 'https://project-wt.com',
          icon_url: 'http://i.imgur.com/PFQODUN.png'
        },
        fields: [{
          name: 'Location',
          value: city,
          inline: true
        },
        {
          name: 'Latitude',
          value: announced[city].latitude,
          inline: true
        },
        {
          name: 'Longitude',
          value: announced[city].longitude,
          inline: true
        }]
      })
      for (let channel of data.wakingTitan.channels) {
        bot.channels.get(channel).send('', {
          embed: embed
        })
      }
    }
  }
  data.wakingTitan.stations = announced
  jetpack.write('/home/matt/mattBot/watcherData.json', data)
  if (change) {
    updateWiki(bot)
    await request('https://web.archive.org/save/http://www.project-wt.com/')
  }
}

// Checks status of glyphs on wakingtitan.com
const checkGlyphs = (bot) => {
  request({
    url: 'https://wakingtitan.com'
  }).then(async body => {
    let glyphs = [],
      change = false,
      data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
    const handler = new htmlparser.DomHandler((error, dom) => {
      if (error) bot.error(exports.data.name, error)
    })
    const parser = new htmlparser.Parser(handler)
    parser.write(body)
    parser.done()
    let disGlyph = CSSselect('a[class=glyph]', handler.dom)
    for (let element of disGlyph) {
      glyphs.push(element.attribs.style.split('(')[1].slice(0, -1))
    }
    for (let i = 0; i < glyphs.length; i++) {
      if (glyphs.sort()[i] !== data.wakingTitan.glyphs[i]) {
        bot.log(exports.data.name, 'New glyph at wakingtitan.com')
        const embed = new Discord.RichEmbed({
          color: 0x993E4D,
          timestamp: moment().toISOString(),
          description: 'That\'s good, innit!',
          footer: {
            icon_url: 'http://i.imgur.com/FYk8lDP.jpg',
            text: 'MattBot'
          },
          author: {
            name: 'New glyph has activated!',
            url: 'https://wakingtitan.com',
            icon_url: 'http://i.imgur.com/PFQODUN.png'
          },
          thumbnail: {
            url: `http://wakingtitan.com${glyphs.sort()[i]}`
          }
        })
        for (let channel of data.wakingTitan.channels) {
          await bot.channels.get(channel).send('', {
            embed: embed
          })
        }
        request({
          url: `http://wakingtitan.com${glyphs.sort()[i]}`,
          encoding: null
        }).then(resp => {
          const img = Buffer.from(resp, 'utf8')
          jetpack.write(`watcherData/glyphs/glyph${glyphs.sort()[i].split('/').slice(-1)[0]}`, img)
          T.post('media/upload', {media_data: img.toString('base64')}).then(result => {
            setTimeout(() => {
              T.post('media/metadata/create', {media_id: result.data.media_id_string, alt_text: {text: 'Glyph from wakingtitan.com.'}}).then(result => {
                T.post('statuses/update', {status: 'A new glyph has been activated at wakingtitan.com! #WakingTitan', media_ids: result.data.media_id_string}).catch(err => bot.error(exports.data.name, err))
              }).catch(err => bot.error(exports.data.name, err))
            }, 2000)
          }).catch(err => bot.error(exports.data.name, err))
        }).catch(err => bot.error(exports.data.name, err))
        change = true
      }
    }
    if (change) {
      data.wakingTitan.glyphs = glyphs.sort()
      await request('https://web.archive.org/save/http://wakingtitan.com/')
      jetpack.write('/home/matt/mattBot/watcherData.json', data)
    }
  }).catch(err => bot.error(exports.data.name, err))
}

// Checks for updates on echo-64.com
const checkSites = async(bot) => {
  const data = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
  for (let site in data.wakingTitan.sites) {
    let cookJar = request.jar()
    if (site === 'https://wakingtitan.com') {
      cookJar.setCookie(request.cookie('authorization=da0defec-21bd-41d9-b05b-310c00c71920'), site)
    }
    request({url: site, jar: cookJar}).then(async body => {
      // if (site === 'http://superlumina-6c.com') body = body.replace(/\([0-9]+%\)/g, '')
      const pageCont = body.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<link\b[^>]*>|Email:.+>|data-token=".+?"|email-protection#.+"|<div class="vc_row wpb_row vc_row-fluid no-margin parallax.+>|data-cfemail=".+?"/ig, '').replace(/>[\s]+</g, '><'),
        oldCont = jetpack.read(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-latest.html`)
      if (pageCont !== oldCont) {
        bot.log(exports.data.name, `There's been a change on ${site}`)
        request({url: site, jar: cookJar}).then(async body2 => {
          // if (site === 'http://superlumina-6c.com') body = body.replace(/\([0-9]+%\)/g, '')
          const pageCont2 = body.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<link\b[^>]*>|Email:.+>|data-token=".+?"|email-protection#.+"|<div class="vc_row wpb_row vc_row-fluid no-margin parallax.+>|data-cfemail=".+?"/ig, '').replace(/>[\s]+</g, '><')
          if (pageCont2 === pageCont) {
            if (!hasUpdate[site]) {
              let embed = new Discord.RichEmbed({
                color: 0x993E4D,
                timestamp: moment().toISOString(),
                author: {
                  name: `${site.split('/').splice(2).join('/')} has updated`,
                  url: site,
                  icon_url: 'http://i.imgur.com/PFQODUN.png'
                },
                footer: {
                  icon_url: 'http://i.imgur.com/FYk8lDP.jpg',
                  text: 'MattBot'
                }
              })
              jetpack.write(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-temp.html`, pageCont)
              exec(`diffchecker /home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-latest.html /home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-temp.html`).then(async res => {
                let status
                if (res.stderr.length > 0) {
                  bot.error(`Could not generate diff: ${res.stderr.slice(0, -1)}`)
                  embed.setDescription('The diff could not be generated.')
                  status = `${site} has updated! #WakingTitan`
                } else {
                  embed.setDescription(`View the change [here](${res.stdout.split(' ').pop().slice(0, -1)}).`)
                  status = `${site} has updated! See what's changed here: ${res.stdout.split(' ').pop().slice(0, -1)} #WakingTitan`
                }
                /*
                if (site === 'http://superlumina-6c.com' && /<p>(.+)<br\/>\n(.+)<br\/>\n(.+)<br\/>\n(.+)<br\/>\n(.+)<\/p>/g.test(pageCont)) {
                  embed.setDescription(`**Percentages have changed.**\n${/<p>(.+)<br\/>\n(.+)<br\/>\n(.+)<br\/>\n(.+)<br\/>\n(.+)<\/p>/g.exec(pageCont).slice(1, 6).join('\n')}`)
                } else {
                  T.post('statuses/update', {status: `${site} has updated! #WakingTitan`}).catch(err => bot.error(exports.data.name, err))
                } */
                T.post('statuses/update', {status: status}).catch(err => bot.error(exports.data.name, err))
                for (let channel of data.wakingTitan.channels) {
                  bot.channels.get(channel).send('', {
                    embed: embed
                  })
                }
                await request(`https://web.archive.org/save/${site}`)
                jetpack.remove(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-temp.html`)
                jetpack.write(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-latest.html`, pageCont)
                jetpack.write(`/home/matt/mattBot/watcherData/${data.wakingTitan.sites[site]}-logs/${strftime('%F - %H-%M-%S')}.html`, pageCont)
                hasUpdate[site] = true
              })
            }
          } else {
            bot.log(exports.data.name, 'Update was only temporary. Rejected broadcast protocol.')
            hasUpdate[site] = true
          }
        })
      } else {
        hasUpdate[site] = false
      }
    }).catch(err => bot.error(exports.data.name, err))
  }
}

// ================| Helper Functions |================

// Gets a list of announced stations from project-wt.com
const getAnnouncedStations = async() => {
  let regex = /setMarker\(\s+'(.+)',\s+(.+),\s+(.+),\s+(\w+),\s+'(.*)'.+\);/g,
    doneData = jetpack.read('/home/matt/mattBot/watcherData.json', 'json').wakingTitan.stations,
    data = he.decode(await request('https://project-wt.com')),
    max = data.match(regex).length,
    announced = {},
    i = 0
  while (i < max) {
    let match = (regex.exec(data)).slice(1, 6)
    if (match[3] === 'true') {
      let date = moment().toISOString()
      let est = false
      if (_.has(doneData, match[0])) {
        date = doneData[match[0]].date
        est = doneData[match[0]].est
      }
      announced[match[0]] = {
        latitude: match[1],
        longitude: match[2],
        stationLink: match[4],
        date: date,
        est: est
      }
    }
    i++
  }
  return announced
}

// Updates stations wiki page
const updateWiki = async(bot) => {
  let data = he.decode(await request('https://project-wt.com')),
    storedData = jetpack.read('/home/matt/mattBot/watcherData.json', 'json').wakingTitan.stations,
    regex = /setMarker\(\s+'(.+)',\s+(.+),\s+(.+),\s+(\w+),\s+'(.*)'.+\);/g,
    announced = {},
    waiting = {},
    table = '',
    i = 0
  // console.log(data)
  let num = data.match(regex).length
  // console.log(num)
  while (i < num) {
    let match = (regex.exec(data)).slice(1, 6)
    // console.log(match)
    if (match[3] === 'true') {
      let title = /<meta property="og:title" content="(.+)" \/>/g.exec(he.decode(await request(match[4])))[1]
      announced[match[0]] = {
        latitude: match[1],
        longitude: match[2],
        stationName: title,
        stationLink: match[4]
      }
    } else {
      waiting[match[0]] = {
        latitude: match[1],
        longitude: match[2]
      }
    }
    i++
  }
  Object.keys(announced).sort().reverse().forEach((val) => {
    let station = announced[val]
    if (storedData[val].est) {
      table = `|- style="background-color: #E0EFE5
| ${val} || ${station.latitude} || ${station.longitude} || data-sort-value="0"|[${station.stationLink} ${station.stationName}] || ${moment(storedData[val].date).utc().format('YYYY-MM-DD HH:mm [UTC]')} <ref name="first">Due to the bot not watching the site at this point, we have no accurate times for these stations. These times are estimated.</ref>
${table}`
    } else {
      table = `|- style="background-color: #E0EFE5
| ${val} || ${station.latitude} || ${station.longitude} || data-sort-value="0"|[${station.stationLink} ${station.stationName}] || ${moment(storedData[val].date).utc().format('YYYY-MM-DD HH:mm [UTC]')}
${table}`
    }
  })
  Object.keys(waiting).sort().forEach((val) => {
    let station = waiting[val]
    table += `|-
| ${val} || ${station.latitude} || ${station.longitude} || data-sort-value="1"|Not Announced || N/A
`
  })
  table = `<!-- Wiki Eds, please don't edit this page - all changes will be overwritten by the bot. -->
[[Main Page]] > [[List of Investigations]] > [[Waking Titan]] > '''Cassettes'''

This page contains an auto-updating table of all stations listed on https://project-wt.com:
{| class="wikitable sortable"
! Location !! class="unsortable"|Longitude !! class="unsortable"|Latitude !! Station !! Datetime
${table}|}

[[Category: Waking Titan]]`
  OcelBot.logIn(() => {
    OcelBot.edit('Waking_Titan/Stations', table, 'Adding new station(s).', (err) => {
      bot.log(exports.data.name, 'Wiki edit complete.')
      if (err) {
        bot.error(exports.data.name, err)
      }
    })
  })
  return table
}
