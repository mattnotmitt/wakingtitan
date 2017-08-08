/*
  When - inevitably - there is an unexpected whitespace update, run this file to reset the offending file
*/
const request = require('request-promise-native');
const jetpack = require('fs-jetpack');
const strftime = require('strftime');

const data = jetpack.read('./watcherData.json', 'json');
let sites = data.wtSites.sites;
for (let site in sites) {
	let cookJar = request.jar();
	if (site === 'https://wakingtitan.com') {
		cookJar.setCookie(request.cookie('archive=%5B%229b169d05-6b0b-49ea-96f7-957577793bef%22%2C%2267e3b625-39c0-4d4c-9241-e8ec0256b546%22%2C%224e153ce4-0fec-406f-aa90-6ea62e579369%22%2C%227b9bca5c-43ba-4854-b6b7-9fffcf9e2b45%22%2C%222f99ac82-fe56-43ab-baa6-0182fd0ed020%22%2C%22b4631d12-c218-4872-b414-9ac31b6c744e%22%2C%2283a383e2-f4fc-4d8d-905a-920057a562e7%22%5D'), site);
	}
	request({url: site, jar: cookJar}).then(async body => {
		const pageCont = clean(body);
		const oldCont = jetpack.read(`./watcherData/${data.wakingTitan.sites[site]}-latest.html`);
		if (pageCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/') !== oldCont.replace(/\s/g, '').replace(/>[\s]+</g, '><').replace(/"\s+\//g, '"/')) {
			setTimeout(() => {
				request({url: site, jar: cookJar}).then(async body2 => {
					const pageCont2 = clean(body);
					if (pageCont2 === pageCont) {
						console.log('Change on ' + site);
						jetpack.write(`./watcherData/${data.wakingTitan.sites[site]}-latest.html`, pageCont);
						jetpack.write(`./watcherData/${data.wakingTitan.sites[site]}-logs/${strftime('%F - %H-%M-%S')}.html`, pageCont);
					}
				});
			}, 5000);
		}
	});
}

const clean = (str) => {
	return str.replace(/<script[\s\S]*?>[\s\S]*?<\/script>|<link\b[^>]*>|Email:.+>|data-token=".+?"|email-protection#.+"|<div class="vc_row wpb_row vc_row-fluid no-margin parallax.+>|data-cfemail=".+?"|<!--[\s\S]*?-->/ig, '');
};

process.on('unhandledRejection', r => console.log(r));
