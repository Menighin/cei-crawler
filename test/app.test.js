const test = require('ava')
const CeiCrawler = require('../src/app')
const { CeiErrorTypes } = require('../src/lib/CeiCrawlerError');

const dotenv = require('dotenv');

dotenv.config();

test.before(t => {
    if (!process.env.CEI_USERNAME || !process.env.CEI_PASSWORD) {
        throw Error('You should set environment variables CEI_USERNAME and CEI_PASSWORD in order to run tests');
    }

    t.context.ceiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, { navigationTimeout: 60000 });
    t.context.ceiCrawlerCap = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, { capDates: true, navigationTimeout: 60000 });
    t.context.emptyOptionsCeiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, { navigationTimeout: 60000 });
    t.context.wrongPasswordCeiCrawler = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD + 'wrong', { navigationTimeout: 60000 });
    t.context.ceiCrawlerTimeout = new CeiCrawler(process.env.CEI_USERNAME, process.env.CEI_PASSWORD, { navigationTimeout: 1 });
});

test.serial('login', async t => {
    await t.context.ceiCrawler.login();
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
    const errorGetStockHistory = await t.throwsAsync(async () => t.context.ceiCrawler.getStockHistory(new Date(0), new Date(10000)));
    const errorGetDividends = await t.throwsAsync(async () => t.context.ceiCrawler.getDividends(new Date(0)));
    const errorGetWallet = await t.throwsAsync(async () => t.context.ceiCrawler.getWallet(new Date(0)));
    const errorGetTreasure = await t.throwsAsync(async () => t.context.ceiCrawler.getTreasures(new Date(0)));

    t.true(errorGetStockHistory.type === CeiErrorTypes.SUBMIT_ERROR);
    t.true(errorGetDividends.type === CeiErrorTypes.SUBMIT_ERROR);
    t.true(errorGetWallet.type === CeiErrorTypes.SUBMIT_ERROR);
    t.true(errorGetTreasure.type === CeiErrorTypes.SUBMIT_ERROR);
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

test.serial('treasure', async t => {
    const nextWeek = new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7);
    const result = await t.context.ceiCrawlerCap.getTreasures(nextWeek);
    t.true(result.length > 0);
});

test.serial('stockHistoryOptions', async t => {
    const result = await t.context.ceiCrawlerCap.getStockHistoryOptions();
    t.true(result.minDate.length > 0);
});

test.serial('walletOptions', async t => {
    const result = await t.context.ceiCrawlerCap.getWalletOptions();
    t.true(result.minDate.length > 0);
});

test.serial('dividendsOptions', async t => {
    const result = await t.context.ceiCrawlerCap.getDividendsOptions();
    t.true(result.minDate.length > 0);
});

test.serial('treasureOptions', async t => {
    const result = await t.context.ceiCrawlerCap.getTreasureOptions();
    t.true(result.institutions.length > 0);
});

test.serial('login-fail', async t => {
    const error = await t.throwsAsync(async () => {
        const wrongCeiCrawler = new CeiCrawler('1234', 'invalidPassword');
        await wrongCeiCrawler.login();
    });
    t.true(error.type === CeiErrorTypes.LOGIN_FAILED);
});

test.serial('wrong-password', async t => {
    const error = await t.throwsAsync(async () => {
        await t.context.wrongPasswordCeiCrawler.login();
    });
    t.true(error.type === CeiErrorTypes.WRONG_PASSWORD);
});

test.serial('request-timeout', async t => {
    const error = await t.throwsAsync(async () => {
        await t.context.ceiCrawlerTimeout.login();
    });
    t.true(error.type === CeiErrorTypes.NAVIGATION_TIMEOUT);
});
