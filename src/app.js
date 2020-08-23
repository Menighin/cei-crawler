const CeiCrawler = require('./lib/CeiCrawler');
const { CeiCrawlerError, CeiErrorTypes } = require('./lib/CeiCrawlerError')

const ceiCrawler = new CeiCrawler('01603772693', '#sddsCei1', { puppeteerLaunch: { headless: false }, trace: true });
ceiCrawler.getWallet().then(console.log);

module.exports = CeiCrawler;
module.exports.CeiCrawlerError = CeiCrawlerError;
module.exports.CeiErrorTypes = CeiErrorTypes;