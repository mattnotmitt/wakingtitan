exports.data = {
  name: 'Watchers',
  command: 'watcher',
  description: 'Watcher functions',
  group: 'system',
  syntax: 'matt watcher [start|stop|list] [watcherName] [params]',
  author: 'Matt C: matt@artemisbot.uk',
  permissions: 3,
  anywhere: true
}

exports.func = async (msg, args, bot) => {
  if (args[0] === 'start') {
    if (bot.watchers.has(args[1])) {
      bot.watchers.get(args[1]).start(msg, bot, args.slice(2))
    }
  } else if (args[0] === 'stop') {
    if (bot.watchers.has(args[1])) {
      bot.watchers.get(args[1]).stop(msg, bot, args.slice(2))
    }
  }
}
