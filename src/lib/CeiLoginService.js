const puppeteer = require('puppeteer-core');
const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils')
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');

class CeiLoginService {

    /** @type {String} - Username to fill in at CEI page */
    _username = null;

    /** @type {String} - Password to fill in at CEI page */
    _password = null;

    /** @type {typedefs.CeiCrawlerOptions} - Options for CEI Crawler and Fetch */
    _options = null;

    constructor(username, password, options) {
        this._username = username;
        this._password = password;
        this._options = options;
    }

    async getToken() {
        switch (this._options.loginOptions.strategy) {
            case 'user-resolve':
                return await this._getTokenByUserResolve();
            case 'raw-token':
                return this._options.auth; 
            default:
                throw CeiCrawlerError(CeiErrorTypes.INVALID_LOGIN_STRATEGY, `Invalid login strategy: ${this._options.strategy}`);
        }
    }

    /* istanbul ignore next */
    async _getTokenByUserResolve() {
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: this._options.loginOptions.browserPath,
            args: ['--start-maximized']
        });
        const homePage = await browser.newPage();
        let mainPage = null;
        await homePage.goto('https://www.investidor.b3.com.br/nova-area-logada');
        
        // All this controlling is done like this because CEI and Puppeteer do not go so well together.
        // If anything fails, the browser will hang and wait for the user to resolve the login himself
        do {
            try {
                await CeiUtils.retry(async () => { await homePage.waitForNavigation({ timeout: 1000 }); }, 2, 1000, true);
                await homePage.click('.cabecalho a');
            
                mainPage = await this._getMainPage(browser);
            } catch (e) {
                console.log('Failed to click login button. Will reload to try again.');
            }
            await homePage.reload();
        } while (mainPage === null);
        try {
            await mainPage.waitForTimeout(4000);
            await CeiUtils.retry(async () => { await mainPage.focus('#extension_DocInput'); }, 10, 1000, true);
            await mainPage.keyboard.type(this._username);
            await CeiUtils.retry(async () => { await mainPage.click('#continue'); }, 8, 301);
            await CeiUtils.retry(async () => { await mainPage.focus('#password'); }, 10, 1000, true);
            await mainPage.keyboard.type(this._password);
        } catch (e) {
            console.log('Failed trying to fill user info. Will wait for the user to resolve the login himself');
        }
        
        await mainPage.waitForFunction(() => {
            return document.querySelector('.saudacao') !== null;
        }, { timeout: 0 });
    
        const sessionStorage = await mainPage.evaluate(() => {
            const json = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                json[key] = sessionStorage.getItem(key);
            }
            return json;
        });

        await browser.close();
    
        return sessionStorage;
    }

    /**
     * Function to be sure we have a tab opened before moving on. See: https://github.com/puppeteer/puppeteer/issues/1992
     * @param {puppeteer.Browser} browser Puppeteer browser running
     * @returns {puppeteer.Page} The main page to keep crawling
    */
   /* istanbul ignore next */
    async _getMainPage(browser) {
        while (true) {
            for (const p of (await browser.pages())) {
                if (p.url().indexOf('b3investidor.b3.com.br/b3Investidor.onmicrosoft.com') !== -1)
                    return p;
            };
            await CeiUtils.sleep(200);
        }
    }

}

module.exports = CeiLoginService;