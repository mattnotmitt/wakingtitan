const Discord = require('discord.js'),
  moment = require('moment'),
  jetpack = require('fs-jetpack'),
  config = require('./config.json'),
  chalk = require('chalk')

const bot = new Discord.Client()
bot.permitChan = config.activeChannels
bot.error = (source, msg) => {
  bot.channels.get('338712920466915329').send(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] - | ${source} | - ${msg}`)
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
  let watcherData = jetpack.read('/home/matt/mattBot/watcherData.json', 'json')
  watcherList.forEach((f) => {
    const props = require(`./watchers/${f}`)
    if (typeof watcherData[props.data.command] !== 'object') watcherData[props.data.command] = {enable: true}
    if (typeof watcherData[props.data.command].enable !== 'boolean') watcherData[props.data.command].enable = true
    jetpack.write('/home/matt/mattBot/watcherData.json', watcherData)
    if (watcherData[props.data.command].enable === true) {
      bot.log('Loader', chalk.green(`Loading Watcher: ${props.data.name}. 👌`))
      watchers.set(props.data.command, props)
      props.watcher(bot)
    } else {
      bot.log('Loader', chalk.green(`Skipped loading ${props.data.name} as it is disabled. ❌`))
    }
  })
  return watchers
}

bot.on('ready', () => {
  bot.log('Loader', `Connected to Discord gateway & ${bot.guilds.size} guilds.`)
  bot.commands = bot.loadCmds(bot)
  bot.watchers = bot.loadWatchers(bot)
})

bot.on('message', (msg) => {
  if (!(msg.content.startsWith(config.prefix)) || msg.author.id === bot.user.id || msg.author.bot) return
  let command = msg.content.split(' ')[1],
    args = msg.content.split(' ').slice(2),
    cmd
  if (bot.commands.has(command)) {
    cmd = bot.commands.get(command)
  }
  // console.log(bot.elevation(msg))
  if (cmd && (cmd.data.anywhere || bot.elevation(msg) >= 3 || bot.permitChan.indexOf(msg.channel.id) >= 0)) {
    // console.log('passed test')
    if (bot.elevation(msg) >= cmd.data.permissions) {
      cmd.func(msg, args, bot)
    } else {
      bot.delReply(msg, ':newspaper2: You don\'t have permission to use this command.')
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

bot.watcherEnable = function (watcher, watcherData) {
  return new Promise((resolve, reject) => {
    try {
      const watchProps = require(`./watchers/${watcher}.js`)
      bot.watchers.set(watcher, watchProps)
      bot.watchers.get(watcher).watcher(bot)
      watcherData[watcher].enable = true
      jetpack.write('/home/matt/mattBot/watcherData.json', watcherData)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.watcherDisable = function (watcher, watcherData) {
  return new Promise((resolve, reject) => {
    try {
      bot.watchers.get(watcher).disable()
      watcherData[watcher].enable = false
      jetpack.write('/home/matt/mattBot/watcherData.json', watcherData)
      delete require.cache[require.resolve(`./watchers/${watcher}.js`)]
      bot.watchers.delete(watcher)
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
