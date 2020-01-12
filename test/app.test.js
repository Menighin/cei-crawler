const test = require('ava')
const CeiCrawler = require('../src/app')
const fs = require('fs')

test.before(t => {
    if (!process.env.CEI_USERNAME || !process.env.CEI_PASSWORD) {
        throw Error('You should set environment variables CEI_USERNAME and CEI_PASSWORD in order to run tests');
    }

    const ceiCrawlerOptions = {
        puppeteerLaunch: {
            headless: true,
            timeout: 0
        }
    }

    t.context.ceiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, ceiCrawlerOptions);
});

test('cei-login', async t => {
    await t.context.ceiCrawler._login();
    t.is(t.context.ceiCrawler._isLogged, true);
});

test('stock-history', async t => {
    t.is(true, true);
});