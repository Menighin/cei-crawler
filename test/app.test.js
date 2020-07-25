const test = require('ava')
const CeiCrawler = require('../src/app')
const fs = require('fs')
const typedefs = require("../src/lib/typedefs");

const dotenv = require('dotenv');

dotenv.config();

test.before(t => {
    if (!process.env.CEI_USERNAME || !process.env.CEI_PASSWORD) {
        throw Error('You should set environment variables CEI_USERNAME and CEI_PASSWORD in order to run tests');
    }

    /** @type {typedefs.CeiCrawlerOptions} */
    const ceiCrawlerOptions = {
        puppeteerLaunch: {
            headless: true,
            timeout: 0
        },
        trace: false
    }
    t.context.ceiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, ceiCrawlerOptions);
    t.context.ceiCrawlerCap = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, { capDates: true });
    t.context.emptyOptionsCeiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD);
    t.context.wrongPasswordCeiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD + 'wrong');
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

test.serial('invalid-dates', async t => {
    await t.throwsAsync(async () => t.context.ceiCrawler.getStockHistory(new Date(0), new Date(10000)));
    await t.throwsAsync(async () => t.context.ceiCrawler.getDividends(new Date(0)));
    await t.throwsAsync(async () => t.context.ceiCrawler.getWallet(new Date(0)));
});

test.serial('stock-history-invalid-dates-with-cap-on', async t => {
    const result = await t.context.ceiCrawlerCap.getStockHistory(new Date(0), new Date(10000));
    t.true(result.length > 0);
});

test.serial('dividends', async t => {
    const nextWeek = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7);
    const result = await t.context.ceiCrawlerCap.getDividends(nextWeek);
    t.true(result.length > 0);
});

test.serial('wallet', async t => {
    const nextWeek = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7);
    const result = await t.context.ceiCrawlerCap.getWallet(nextWeek);
    t.true(result.length > 0);
});

test.serial('login-fail', async t => {
    await t.throwsAsync(async () => {
        const wrongCeiCrawler = new CeiCrawler('1234', 'invalidPassword');
        await wrongCeiCrawler.getStockHistory();
    });
});

test.serial('wrong-password', async t => {
    await t.throwsAsync(async () => {
        await t.context.wrongPasswordCeiCrawler.getStockHistory();
    });
});

test.serial('close', async t => {
    t.true(t.context.ceiCrawler._browser != null);
    await t.context.ceiCrawler.close();
    t.true(t.context.ceiCrawler._browser == null);
});