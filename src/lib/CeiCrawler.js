const StockHistoryCrawler = require('./StockHistoryCrawler');
const DividendsCrawler = require('./DividendsCrawler');
const WalletCrawler = require('./WalletCrawler');
const TreasureCrawler = require('./TreasureCrawler');
const typedefs = require("./typedefs");
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const FetchCookieManager = require('./FetchCookieManager');
const cheerio = require('cheerio');
const CeiUtils = require('./CeiUtils');

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

        this._cookieManager = new FetchCookieManager({
            'Host': 'cei.b3.com.br',
            'Origin': 'https://cei.b3.com.br',
            'Referer': 'https://ceiapp.b3.com.br/CEI_Responsivo/login.aspx',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36'
        }, this.options.navigationTimeout);
    }

    _setDefaultOptions() {
        if (!this.options.trace) this.options.trace = false;
        if (!this.options.navigationTimeout) this.options.navigationTimeout = 30000;
        if (!this.options.loginTimeout) this.options.loginTimeout = 150000;
    }

    async login() {
        this._isLogged = false;
        await this._login();
    }

    async _login() {
        if (this._isLogged) return;

        /* istanbul ignore next */
        if ((this.options && this.options.trace) || false)
            console.log('Logging at CEI...');

        const getPageLogin = await this._cookieManager.fetch("https://ceiapp.b3.com.br/CEI_Responsivo/login.aspx");
        const doomLoginPage = cheerio.load(await getPageLogin.text());

        doomLoginPage('#ctl00_ContentPlaceHolder1_txtLogin').attr('value', this.username);
        doomLoginPage('#ctl00_ContentPlaceHolder1_txtSenha').attr('value', this.password);

        const formData = CeiUtils.extractFormDataFromDOM(doomLoginPage, [
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
        ], {
            ctl00$ContentPlaceHolder1$smLoad: 'ctl00$ContentPlaceHolder1$UpdatePanel1|ctl00$ContentPlaceHolder1$btnLogar',
            __EVENTTARGET: '',
            __EVENTARGUMENT: ''
        });

        await CeiUtils.retry(async () => {
            const postLogin = await this._cookieManager.fetch("https://ceiapp.b3.com.br/CEI_Responsivo/login.aspx", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                    "cache-control": "no-cache",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "x-microsoftajax": "Delta=true",
                    "x-requested-with": "XMLHttpRequest",
                    'Connection': 'keep-alive'
                },
                "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/login.aspx",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": formData,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            }, this._options.loginTimeout);

            const accessCookie = ((postLogin.headers.raw()['set-cookie'] || []).find(str => str.includes('Acesso=')) || '');

            if (accessCookie.includes('Acesso=0')) {
                /* istanbul ignore next */
                if ((this.options && this.options.trace) || false)
                    console.log('Login success');
                this._isLogged = true;
            } else if (accessCookie.includes('Acesso=1')) {
                throw new CeiCrawlerError(CeiErrorTypes.WRONG_PASSWORD, 'Senha inválida');
            } else {
                const loginText = await postLogin.text();
                const info = CeiUtils.extractMessagePostResponse(loginText);
                throw new CeiCrawlerError(CeiErrorTypes.LOGIN_FAILED, info.message || 'Login falhou');
            }
        }, e => e.type === CeiErrorTypes.LOGIN_FAILED && e.message.includes('could not be activated'));
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
     * @returns {Promise<typedefs.AccountWallet>} - List of available Dividends information
     */
    async getWallet(date) {
        await this._login();
        return await WalletCrawler.getWallet(this._cookieManager, this.options, date);
    }

    /**
     * Returns the options for the wallet
     * @returns {Promise<typedefs.WalletOptions>} - Options for wallet
     */
    async getWalletOptions() {
        await this._login();
        return await WalletCrawler.getWalletOptions(this._cookieManager, this._options);
    }

    /**
     * Returns the treasure for each account in CEI
     * @param {Date} [date] - The date to get the wallet
     * @returns {Promise<typedefs.TreasureItem[]>} - List of available Treasure information
     */
    async getTreasures(date) {
        await this._login();
        return await TreasureCrawler.getTreasure(this._cookieManager, this.options, date);
    }

    /**
     * Returns the options for the treasure
     * @returns {Promise<typedefs.TreasureOptions>} - Options for treasure
     */
    async getTreasureOptions() {
        await this._login();
        return await TreasureCrawler.getTreasureOptions(this._cookieManager, this._options);
    }

}

module.exports = CeiCrawler;
