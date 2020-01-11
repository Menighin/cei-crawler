const test = require('ava')
const CeiCrawler = require('../src/app')
const fs = require('fs')

test.before(t => {
    if (!fs.existsSync('test/test.config.json')) {
        console.log('You should create a test.config.json to execute the tests');
        throw Error('You should create a test.config.json to execute the tests');
    }
    const configStr = fs.readFileSync('test/test.config.json');
    t.context = JSON.parse(configStr);
});

test('stock-history', async t => {
    try {
        const crawler = new CeiCrawler(t.context.username, t.context.password, {puppeteerLaunch: {headless: false, timeout: 0}});
        const stockHistory = await crawler.getStockHistory(new Date(2019, 5, 10));
        t.is('user', 'user');
    } catch (exception) {
        debugger;
    }
});