const Discord = require('discord.js'),
  moment = require('moment'),
  jetpack = require('fs-jetpack'),
  config = require('./config.json'),
  log = require('./lib/log.js')('Main Client'),
  chalk = require('chalk')

const bot = new Discord.Client()
bot.permitChan = config.activeChannels
bot.error = (source, msg) => {
  bot.channels.get('338712920466915329').send(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] - | ${source} | - ${msg}`)
  log.error(msg)
}
bot.log = (source, msg) => {
  if (!msg) msg = source
  log.info(msg)
}

bot.loadCmds = (bot) => {
  const cmds = new Discord.Collection(),
    cmdList = jetpack.list('./cmds/')
  let loadedList = []
  cmdList.forEach((f) => {
    const props = require(`./cmds/${f}`)
    log.verbose(`Loading Command: ${props.data.name}. 👌`)
    loadedList.push(props.data.name)
    cmds.set(props.data.command, props)
  })
  log.info(chalk.green(`Loaded ${loadedList.length} command(s) (${loadedList.join(', ')}).`))
  return cmds
}

bot.loadWatchers = (bot) => {
  const watchers = new Discord.Collection(),
    watcherList = jetpack.list('./watchers/')
  let watcherData = jetpack.read('/home/matt/mattBot/watcherData.json', 'json'),
    loadedList = [],
    skippedList = []
  watcherList.forEach((f) => {
    const props = require(`./watchers/${f}`)
    if (typeof watcherData[props.data.command] !== 'object') watcherData[props.data.command] = {enable: true}
    if (typeof watcherData[props.data.command].enable !== 'boolean') watcherData[props.data.command].enable = true
    jetpack.write('/home/matt/mattBot/watcherData.json', watcherData)
    if (watcherData[props.data.command].enable === true) {
      log.verbose(`Loading Watcher: ${props.data.name}. 👌`)
      loadedList.push(props.data.name)
      watchers.set(props.data.command, props)
      props.watcher(bot)
    } else {
      log.verbose(`Skipped loading ${props.data.name} as it is disabled. ❌`)
      skippedList.push(props.data.name)
    }
  })
  log.info(chalk.green(`Loaded ${loadedList.length} watcher(s) (${loadedList.join(', ')}) and skipped ${skippedList.length} (${skippedList.join(', ')}).`))
  return watchers
}

bot.on('ready', () => {
  log.info(chalk.green(`Connected to Discord gateway & ${bot.guilds.size} guilds.`))
  bot.commands = bot.loadCmds(bot)
  bot.watchers = bot.loadWatchers(bot)
})

bot.on('message', async msg => {
  try {
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
        await msg.reply(msg, ':newspaper2: You don\'t have permission to use this command.')
      }
    }
  } catch (e) {
    log.error(`Something went wrong when handling a message: ${e}`)
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

bot.watcherReload = function (watcher) {
  return new Promise((resolve, reject) => {
    try {
      bot.watchers.get(watcher).disable()
      delete require.cache[require.resolve(`./watchers/${watcher}.js`)]
      bot.watchers.delete(watcher)
      const watchProps = require(`./watchers/${watcher}.js`)
      bot.watchers.set(watcher, watchProps)
      bot.watchers.get(watcher).watcher(bot)
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

bot.elevation = function (msg) {
  if (msg.author.id === config.ownerID) return 4
  if (['129022124844253184', '146101654981312513'].indexOf(msg.guild.id) < 0) return 0
  let modRole = msg.guild.roles.find('name', 'Moderators') || msg.guild.roles.find('name', 'Discord Mods')
  if (modRole && msg.member.roles.has(modRole.id)) return 3
  let arcRole = msg.guild.roles.find('name', 'Wiki Editors') || msg.guild.roles.find('name', 'ARG Expert') || msg.guild.roles.find('name', 'GD Wiki Editor')
  if (arcRole && msg.member.roles.has(arcRole.id)) return 2
  let detRole = msg.guild.roles.find('name', 'Detective') || msg.guild.roles.find('name', 'Familiar')
  if (detRole && msg.member.roles.has(detRole.id)) return 1
  return 0
}
