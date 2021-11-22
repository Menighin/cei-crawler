const test = require('ava')
const CeiCrawler = require('../src/app')
const CeiUtils = require('./../src/lib/CeiUtils');

const dotenv = require('dotenv');

dotenv.config();

test.before(t => {
    if (!process.env.TOKEN || !process.env.GUID) {
        throw Error('You should set environment variables TOKEN and GUID in order to run tests');
    }

    t.context.ceiCrawler = new CeiCrawler('', '', { 
        debug: true,
        loginOptions: {
            strategy: 'raw-token'
        },
        auth: {
            "cache-guid": process.env.GUID,
            token: process.env.TOKEN
        }
    });
});

test.serial('consolidated-values', async t => {
    const consolidatedValues= await t.context.ceiCrawler.getConsolidatedValues();
    t.true(consolidatedValues.total > 0);
});

test.serial('get-position', async t => {
    const positions = await t.context.ceiCrawler.getPosition();
    t.true(positions.paginaAtual === 1);

    const position = {
        category: positions.itens[0].categoriaProduto,
        type: positions.itens[0].tipoProduto,
        id: positions.itens[0].posicoes[0].id
    };
    const positionDetail = await t.context.ceiCrawler.getPositionDetail(position.id, position.category, position.type);
    t.true(positionDetail.quantidade > 0);
});

test.serial('account-statement', async t => {
    const statement = await t.context.ceiCrawler.getAccountStatement();
    t.true(statement.paginaAtual === 1);
});

test.serial('ipo-and-ipo-detail', async t => {
    const ipo = await t.context.ceiCrawler.getIPOs();
    t.true(ipo.paginaAtual === 1);
    
    if (ipo.itens[0]) {
        const id = ipo.itens[0].ofertasPublicas[0].id;
        const ipoDetail = await t.context.ceiCrawler.getIPODetail(id);
        t.true(ipoDetail !== undefined);
    }
});

test.serial('get-stock-transactions', async t => {
    const stockTransactions = await t.context.ceiCrawler.getStockTransactions();
    t.true(stockTransactions.paginaAtual === 1);
});

test.serial('provisioned-events-detail', async t => {
    const provisionedEvents = await t.context.ceiCrawler.getProvisionedEvents();
    t.true(provisionedEvents.paginaAtual === 1);
    
    const id = provisionedEvents.itens[0].id;
    const eventDetail = await t.context.ceiCrawler.getProvisionedEventDetail(id);
    t.true(eventDetail !== undefined);
});

test.serial('invalid-strategy', async t => {
    await t.throwsAsync(async () => {
        const crawler = new CeiCrawler('', '', {
            loginOptions: {
                strategy: 'invalid-strategy'
            }
        });
        await crawler.login();
    });
});

test.serial('invalid-browser-path', async t => {
    await t.throwsAsync(async () => {
        const crawler = new CeiCrawler('', '', {
            loginOptions: {
                strategy: 'user-resolve',
                browserPath: 'C:/invalid/path'
            }
        });
        await crawler.login();
    });
});

test.serial('invalid-token', async t => {
    await t.throwsAsync(async () => {
        const crawler = new CeiCrawler('', '', {
            loginOptions: {
                strategy: 'raw-token',
            },
            auth: {
                "cache-guid": "invalid",
                "token": "invalid"
            }
        });
        await crawler.login();
    });
});

test.serial('invalid-position-call', async t => {
    await t.throwsAsync(async () => {
        const crawler = new CeiCrawler('', '', {
            loginOptions: {
                strategy: 'raw-token',
            },
            auth: {
                "cache-guid": "invalid",
                "token": "invalid"
            },
            debug: true
        });
        crawler._isLogged = true;
        await crawler.getPositionDetail('id-91', 'cat', 'type');
    });
});

test.serial('cei-utils', async t => {
    let n = 0;
    const callback = () => {
        if (n++ < 2)
            throw new Error('test');
    };

    await t.notThrowsAsync(async () => {
        await CeiUtils.retry(callback);
    });

    n = 0;

    await t.throwsAsync(async () => {
        await CeiUtils.retry(callback, 1);
    });

    t.true(CeiUtils.kebabize('WillKebabThis') === 'will-kebab-this');

    const date = new Date(2021, 7, 8);
    const dateLastMonth = CeiUtils.subtractMonth(date);
    t.true(dateLastMonth.getMonth() === date.getMonth() - 1 && dateLastMonth.getDate() === date.getDate());

    t.true(CeiUtils.getDateForQueryParam(date) === '2021-08-08');


});