#Matt's Self Bot
This is the selfbot that I use on Discord.

Many thanks to [eslachance](https://github.com/eslachance) for her excellent command loader/framework which you can find [here](https://github.com/eslachance/komada/tree/61cd70b3f210c4e0b68c1a3405a0e5612979b7ff).
##Requirements
Requires Node.JS v7.2.1 or greater.
```sh
$ git clone https://github.com/artemisbot/matt-self-bot.git
$ cd matt-self-bot
$ npm install
```
You will also want to set up your API keys in the file `config.json`:
```json
{
  "prefix": "self.",
  "token": "Insert Your Discord Token Here",
  "youtubeKey": "YouTube API Key",
  "steamKey": "Steam Web API Key"
}
```
You can now run the bot by executing this:
```sh
$ node main.js
```
