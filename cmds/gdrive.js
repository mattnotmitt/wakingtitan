const google = require('googleapis'),
  Discord = require('discord.js'),
  auth = require('../config.json').gdrive_service_account

exports.data = {
  name: 'Google Drive Test',
  command: 'gdrive',
  description: 'Ping check.',
  group: 'system',
  syntax: 'wt gdrive [folder]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 4
}

const jwtClient = new google.auth.JWT(
  auth.client_email,
  null,
  auth.private_key,
  ['https://www.googleapis.com/auth/drive'],
  null
)

exports.func = async (msg, args, bot) => {
  try {
    let folder = await checkFolder(args[0]),
      embed = new Discord.RichEmbed({
        author: {
          name: `Contents of ${folder.parentName}`,
          icon_url: 'http://i.imgur.com/Xm6m0fr.png',
          url: folder.parentLink
        },
        color: 0x993E4D,
        timestamp: folder.parentMod,
        footer: {
          text: 'Folder last modified on '
        }
      })
    folder.files.forEach(file => {
      embed.addField(`${file.name}`, `${file.mimeType.split('/').slice(-1)[0].split('.').slice(-1)[0].toUpperCase()} | [Link](${file.webViewLink})`, false)
    })
    msg.channel.send('', {embed: embed})
  } catch (e) {
    if (e === 'NotFolder') return msg.reply('The provided ID does not correspond to a folder.')
    if (e === 'EmptyFolder') return msg.reply('The provided ID is of an empty folder.')
    if (e === 'DoesNotExist') return msg.reply('The selected ID does not correspond to any known folder.')
    bot.error(exports.data.name, `Something went wrong: ${e}`)
    msg.reply('Something\'s gone wrong. <@132479572569620480> check the logs mate.')
  }
}

const checkFolder = (folderID) => {
  return new Promise((resolve, reject) => {
    google.drive('v3').files.get({
      auth: jwtClient,
      fileId: folderID,
      fields: 'id,modifiedTime,name,webViewLink,mimeType'
    }, (err, resp) => {
      try {
        if (!resp) return reject('DoesNotExist')
        if (resp.mimeType !== 'application/vnd.google-apps.folder') return reject('NotFolder')
        if (err) return reject(err)
      } catch (e) {
        reject(e)
      }
      google.drive('v3').files.list({
        auth: jwtClient,
        q: `'${folderID}' in parents`,
        fields: 'files(modifiedTime,mimeType,name,webViewLink)'
      }, (err, resp2) => {
        if (err) reject(err)
        // console.log(resp2.files.length)
        if (resp2.files.length === 0) return reject('EmptyFolder')
        resp2.parentName = resp.name
        resp2.parentLink = resp.webViewLink
        resp2.parentMod = resp.modifiedTime
        resolve(resp2)
      })
    })
  })
}
