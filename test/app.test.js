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

test.serial('login', async t => {
    await t.context.ceiCrawler._login();
    t.is(t.context.ceiCrawler._isLogged, true);
});

test.serial('stock-history', async t => {
    const result = await t.context.ceiCrawler.getStockHistory();
    t.true(result.length > 0);

    let hasAnyStock = false;
    for (const r of result) {
        if (r.stockHistory.length > 0) {
            hasAnyStock = true;
            break;
        }
    }
    t.true(hasAnyStock);
});

test.serial('stock-history-empty', async t => {
    const saturday = new Date(2020, 0, 4);
    const sunday = new Date(2020, 0, 5);
    const result = await t.context.ceiCrawler.getStockHistory(saturday, sunday);
    t.true(result.length > 0);

    let hasAnyStock = false;
    for (const r of result) {
        if (r.stockHistory.length > 0) {
            hasAnyStock = true;
            break;
        }
    }
    t.false(hasAnyStock);
});

test.serial('stock-history-invalid-dates', async t => {
    await t.throwsAsync(async () => t.context.ceiCrawler.getStockHistory(new Date(0), new Date(10000)));
});