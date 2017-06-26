const Twit = require('twit'),
  config = require('./config.json')

const T = new Twit(config.WTTwitter)
T.post('statuses/update', {status: 'Test tweet, please ignore.'}).catch(err => console.error(err))
