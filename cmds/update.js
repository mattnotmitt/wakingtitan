const Canvas = require('canvas'),
  jetpack = require('fs-jetpack'),
  moment = require('moment')

exports.data = {
  name: 'Waking Titan Update Image',
  command: 'update',
  description: 'Updates an image message.',
  group: 'wakingTitan',
  syntax: 'wt update [message]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 2
}

exports.func = async (msg, args, bot) => {
  try {
    const data = jetpack.read('cmdData.json', 'json')
    bot.log(exports.data.name, `${msg.member.displayName} (${msg.author.username}#${msg.author.discriminator}) has updated the image with the text "${args.join(' ')}" in #${msg.channel.name} on ${msg.guild.name}.`)
    await genImage(args.join(' '), msg.channel.id)
    if (data.update[msg.channel.id]) {
      await (await msg.channel.fetchMessage(data.update[msg.channel.id])).edit('', {embed: {
        image: {url: `https://artemisbot.uk/i/${msg.channel.id}.png?${Math.random()}`},
        color: 0x993E4D
      }})
    } else {
      await msg.channel.send('', {embed: {
        image: {url: `https://artemisbot.uk/i/${msg.channel.id}.png?${Math.random()}`},
        color: 0x993E4D
      }}).then(m => {
        data.update[msg.channel.id] = m.id
        jetpack.write('cmdData.json', data)
      })
    }
  } catch (e) {
    bot.error(exports.data.name, `Something went wrong: ${e}`)
    msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.')
  }
}

const genImage = (text, file) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = new Canvas(500, 125)
      const ctx = canvas.getContext('2d')
      ctx.font = '35px GeosansLight'
      ctx.textAlign = 'center'
      canvas.width = ctx.measureText(text.toUpperCase()).width > ctx.measureText(`As of ${moment().utc().format('YYYY-MM-DD')}`.toUpperCase()).width ? ctx.measureText(text.toUpperCase()).width + 20 : ctx.measureText(`As of ${moment().utc().format('YYYY-MM-DD')}`.toUpperCase()).width + 20
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(text.toUpperCase(), canvas.width / 2, 35)
      ctx.fillText(`as of ${moment().utc().format('YYYY-MM-DD')}`.toUpperCase(), canvas.width / 2, 75)
      ctx.fillText(`at ${moment().utc().format('HH:mm:ss')} UTC`.toUpperCase(), canvas.width / 2, 115)
      let out = jetpack.createWriteStream(`/var/www/artemisbot.uk/i/${file}.png`),
        stream = canvas.pngStream()
      stream.on('data', chunk => {
        out.write(chunk)
      })
      stream.on('end', () => {
        resolve()
      })
      stream.on('err', err => {
        reject(err)
      })
    } catch (e) {
      reject(e)
    }
  })
}
