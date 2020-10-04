const StockHistoryCrawler = require('./StockHistoryCrawler');
const DividendsCrawler = require('./DividendsCrawler');
const WalletCrawler = require('./WalletCrawler');
const typedefs = require("./typedefs");
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError')
const FetchCookieManager = require('../utils/FetchCookieManager');
const cheerio = require('cheerio');
const { extractFormDataFromDOM } = require('../utils');

class CeiCrawler {

    /** @type {boolean} */
    _isLogged = false;

    /** @type {FetchCookieManager} */
    _cookieManager = null;

    get username() { return this._username; }
    set username(username) { this._username = username; }

    get password() { return this._password; }
    set password(password) { this._password = password; }

    /** @type {typedefs.CeiCrawlerOptions} - Options for CEI Crawler and Fetch */
    get options() { return this._options; }
    set options(options) { this._options = options; }

    /**
     * 
     * @param {String} username - Username to login at CEI
     * @param {String} password - Password to login at CEI
     * @param {typedefs.CeiCrawlerOptions} options - Options for CEI Crawler and Fetch
     */
    constructor(username, password, options = {}) {
        this.username = username;
        this.password = password;
        this.options = options;
        this._setDefaultOptions();
        this._cookieManager = new FetchCookieManager();
    }

    _setDefaultOptions() {
        if (!this.options.trace) this.options.trace = false;
        if (!this.options.navigationTimeout) this.options.navigationTimeout = 30000;
    }

    async _login() {
        if (this._isLogged) return;

        /* istanbul ignore next */
        if ((this.options && this.options.trace) || false)
            console.log('Logging at CEI...');
        
        const getPageLogin = await this._cookieManager.fetch("https://cei.b3.com.br/CEI_Responsivo/login.aspx");
        const doomLoginPage = cheerio.load(await getPageLogin.text());


        doomLoginPage('#ctl00_ContentPlaceHolder1_txtLogin').attr('value', this.username);
        doomLoginPage('#ctl00_ContentPlaceHolder1_txtSenha').attr('value', this.password);
        
        const formData = extractFormDataFromDOM(doomLoginPage, [
            'ctl00$ContentPlaceHolder1$smLoad',
            '__EVENTTARGET',
            '__EVENTARGUMENT',
            '__VIEWSTATE',
            '__VIEWSTATEGENERATOR',
            '__EVENTVALIDATION',
            'ctl00$ContentPlaceHolder1$txtLogin',
            'ctl00$ContentPlaceHolder1$txtSenha',
            '__ASYNCPOST',
            'ctl00$ContentPlaceHolder1$btnLogar'
        ]);

        const postLogin = await this._cookieManager.fetch("https://cei.b3.com.br/CEI_Responsivo/login.aspx", {
            "headers": {
                "accept": "*/*",
                "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "cache-control": "no-cache",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-microsoftajax": "Delta=true",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://cei.b3.com.br/CEI_Responsivo/login.aspx",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": formData,
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });

        const accessCookie = ((postLogin.headers.raw()['set-cookie'] || []).find(str => str.includes('Acesso=')) || '');

        if (accessCookie.includes('Acesso=0')) {
            /* istanbul ignore next */
            if ((this.options && this.options.trace) || false)
                console.log('Login success');
            this._isLogged = true;
        } else if (accessCookie.includes('Acesso=1')) {
            throw new CeiCrawlerError(CeiErrorTypes.WRONG_PASSWORD, 'Senha inválida');
        } else {
            throw new CeiCrawlerError(CeiErrorTypes.LOGIN_FAILED, 'Login falhou');
        }
    }

    /**
     * Returns the stock history
     * @param {Date} [startDate] - The start date of the history
     * @param {Date} [endDate]  - The end date of the history
     * @returns {Promise<typedefs.StockHistory[]>} - List of Stock histories
     */
    async getStockHistory(startDate, endDate) {
        await this._login();
        return await StockHistoryCrawler.getStockHistory(this._cookieManager, this.options, startDate, endDate);
    }

    /**
     * Returns the options for the stock history
     * @returns {Promise<typedefs.StockHistoryOptions>} - Options for stock history
     */
    async getStockHistoryOptions() {
        await this._login();
        return await StockHistoryCrawler.getStockHistoryOptions(this._cookieManager, this.options);
    }

    /**
     * Returns the dividends data for each account in CEI
     * @param {Date} [date] - The date to get the dividends
     * @returns {Promise<typedefs.DividendData} - List of available Dividends information
     */
    async getDividends(date) {
        await this._login();
        return await DividendsCrawler.getDividends(this._cookieManager, this.options, date);
    }

    /**
     * Returns the options for the dividends
     * @returns {Promise<typedefs.DividendsOptions>} - Options for dividends
     */
    async getDividendsOptions() {
        await this._login();
        return await DividendsCrawler.getDividendsOptions(this._cookieManager, this._options);
    }

    /**
     * Returns the wallets for each account in CEI
     * @param {Date} [date] - The date to get the wallet
     * @returns {Promise<typedefs.AccountWallet} - List of available Dividends information
     */
    async getWallet(date) {
        await this._login();
        return await WalletCrawler.getWallet(this._cookieManager, this.options, date);
    }

    /**
     * Returns the options for the wallet
     * @returns {Promise<typedefs.WalletOptions} - Options for wallet
     */
    async getWalletOptions() {
        await this._login();
        return await WalletCrawler.getWalletOptions(this._cookieManager, this._options);
    }

    async close() {
        this._isLogged = false;
    }

}

module.exports = CeiCrawler;