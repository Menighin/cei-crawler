const CeiCrawler = require('./lib/CeiCrawler');

let wat = new CeiCrawler('01603772693', '#sddsC3i', {puppeteerLaunch: {headless: false}, capDates: true});
let vat = wat.getWallet(new Date(0));
vat.then(o => console.log(JSON.stringify(o)));

module.exports = CeiCrawler;