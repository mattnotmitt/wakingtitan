const Discord = require('discord.js'),
  moment = require('moment'),
  jetpack = require('fs-jetpack'),
  config = require('./config.json'),
  chalk = require('chalk')

const bot = new Discord.Client()
bot.permitChan = config.activeChannels
bot.error = (source, msg) => {
  bot.log(source, chalk.bold.red(msg))
}
bot.log = (source, msg) => {
  console.log(`${chalk.bold.magenta(`[${moment().format('YYYY-MM-DD HH:mm:ss')}]`)} - | ${source} | - ${msg}`)
}

bot.loadCmds = (bot) => {
  const cmds = new Discord.Collection(),
    cmdList = jetpack.list('./cmds/')
  cmdList.forEach((f) => {
    const props = require(`./cmds/${f}`)
    bot.log('Loader', chalk.green(`Loading Command: ${props.data.name}. 👌`))
    cmds.set(props.data.command, props)
  })
  return cmds
}

bot.loadWatchers = (bot) => {
  const watchers = new Discord.Collection(),
    watcherList = jetpack.list('./watchers/')
  watcherList.forEach((f) => {
    const props = require(`./watchers/${f}`)
    bot.log('Loader', chalk.green(`Loading Watcher: ${props.data.name}. 👌`))
    watchers.set(props.data.command, props)
    props.watcher(bot)
  })
  return watchers
}

bot.commands = bot.loadCmds(bot)
bot.watchers = bot.loadWatchers(bot)

bot.on('ready', () => {
  bot.log('Loader', `Connected to Discord gateway & ${bot.guilds.size} guilds.`)
})

bot.on('message', (msg) => {
  if (!(msg.content.startsWith(config.prefix)) || msg.author.id === bot.user.id || msg.author.bot) return
  let command = msg.content.split(' ')[1],
    args = msg.content.split(' ').slice(2),
    cmd
  if (bot.commands.has(command)) {
    cmd = bot.commands.get(command)
  }
  if (cmd && (cmd.data.anywhere || bot.elevation(msg) >= 3 || bot.permitChan.indexOf(msg.channel.id) >= 0)) {
    if (bot.elevation(msg) >= cmd.data.permissions) {
      cmd.func(msg, args, bot)
    } else {
      msg.reply(':newspaper2: You don\'t have permission to use this command.')
    }
  }
})

bot.on('error', console.error)
bot.on('warn', console.warn)

process.on('unhandledRejection', (err) => {
  console.error(`Uncaught Promise Error: \n${err.stack}`)
})

bot.login(config.token)

bot.reload = function (command) {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./cmds/${command}.js`)]
      const cmd = require(`./cmds/${command}.js`)
      bot.commands.delete(command)
      bot.commands.set(command, cmd)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.enable = function (command) {
  return new Promise((resolve, reject) => {
    try {
      const cmd = require(`./cmds/${command}.js`)
      bot.commands.set(command, cmd)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.disable = function (command) {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./cmds/${command}.js`)]
      bot.commands.delete(command)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.watcherReload = function (watcher) {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./watchers/${watcher}.js`)]
      const watchProps = require(`./watchers/${watcher}.js`)
      bot.commands.delete(watcher)
      bot.commands.set(watcher, watchProps)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.elevation = function (msg) {
  if (msg.author.id === config.ownerID) return 4
  if (msg.guild.id !== '129022124844253184') return 0
  let adminRole = msg.guild.roles.find('name', 'Admins')
  let modRole = msg.guild.roles.find('name', 'Moderators')
  if ((adminRole || modRole) && (msg.member.roles.has(modRole.id) || msg.member.roles.has(adminRole.id))) return 3
  let arcRole = msg.guild.roles.find('name', 'Wiki Editors')
  if (arcRole && msg.member.roles.has(arcRole.id)) return 2
  let detRole = msg.guild.roles.find('name', 'Detective')
  if (detRole && msg.member.roles.has(detRole.id)) return 1
  return 0
}

bot.delReply = function (msg, message, duration) {
  duration = duration || 5000
  msg.reply(message).then((m) => {
    msg.delete(duration)
    m.delete(duration)
  })
}
