// Modules & Initialisation
const google = require('googleapis');
const auth = require('../config.json').gdrive_service_account;

let repeat;

const jwtClient = new google.auth.JWT(
  auth.client_email,
  null,
  auth.private_key,
  ['https://www.googleapis.com/auth/drive'],
  null
);

exports.data = {
	name: 'Google Drive Watcher',
	command: 'gdrive',
	description: ''
};

exports.watcher = bot => {
  // Startup process for watcher
	this.disable();
	repeat = setInterval(() => {
		checkFolder();
	}, 0.5 * 60 * 1000); // x is number of minutes between repeats
	bot.log(exports.data.name, `${exports.data.name} has initialised successfully.`);
};

exports.start = (msg, bot, args) => {
  // Process for new channel/watched item
};

exports.stop = (msg, bot, args) => {
  // Process for removing channel/watched item
};

exports.disable = () => {
	clearInterval(repeat);
};

// Declare primary functions below here
const checkFolder = bot => {
	google.drive('v3').files.list({
		auth: jwtClient,
		q: '\'0By83Dy_H9wHoSWtjQ1Zjd2p2TTQ\' in parents'
	}, (err, resp) => {
		if (err) return bot.error(exports.data.name, `Something went wrong in authorisation: ${err}`);
		console.log(resp);
	});
};
