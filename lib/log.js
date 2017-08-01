var winston = require('winston'),
  moment = require('moment'),
  chalk = require('chalk')
require('winston-daily-rotate-file')

var winstonLogger = new (winston.Logger)({
  transports: [
    new (winston.transports.DailyRotateFile)({
      filename: '/var/log/mattBot/',
      datePattern: '/yyyy-MM-dd.log',
      level: 'debug',
      timestamp: () => {
        return `${moment().format('YYYY-MM-DD HH:mm:ss')}`
      },
      formatter: (options) => {
        return `${chalk.bold.magenta(`[${options.timestamp()}]`)} - | ${capitaliseFirstLetter(options.level)} | ${options.message}`
      },
      json: false
    }),
    new (winston.transports.Console)({
      level: 'verbose',
      prettyPrint: true,
      colorize: true,
      timestamp: () => {
        return `${moment().format('YYYY-MM-DD HH:mm:ss')}`
      },
      formatter: (options) => {
        return `${chalk.bold.magenta(`[${options.timestamp()}]`)} - | ${capitaliseFirstLetter(options.level)} | ${options.message}`
      }
    })
  ]
})

module.exports = modName => {
  const myLogger = {
    error: text => {
      winstonLogger.error(`${modName} | ${chalk.bold.red(text)}`)
    },
    info: text => {
      winstonLogger.info(`${modName} | ${text}`)
    },
    verbose: text => {
      winstonLogger.verbose(`${modName} | ${text}`)
    },
    debug: text => {
      winstonLogger.debug(`${modName} | ${text}`)
    }
  }
  return myLogger
}

const capitaliseFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
