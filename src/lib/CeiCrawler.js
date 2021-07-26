const StockHistoryCrawler = require('./StockHistoryCrawler');
const DividendsCrawler = require('./DividendsCrawler');
const IPOCrawler = require('./IPOCrawler');
const WalletCrawler = require('./WalletCrawler');
const TreasureCrawler = require('./TreasureCrawler');
const typedefs = require("./typedefs");
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const FetchCookieManager = require('./FetchCookieManager');
const cheerio = require('cheerio');
const CeiUtils = require('./CeiUtils');
const CeiLoginService = require('./CeiLoginService');

class CeiCrawler {

    /** @type {boolean} */
    _isLogged = false;

    get username() { return this._username; }
    set username(username) { this._username = username; }

    get password() { return this._password; }
    set password(password) { this._password = password; }

    /** @type {typedefs.CeiCrawlerOptions} - Options for CEI Crawler and Fetch */
    get options() { return this._options; }
    set options(options) { this._options = options; }

    /** @type {CeiLoginService} */
    _ceiLoginService = null;

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

        this._ceiLoginService = new CeiLoginService(username, password, this.options.loginOptions);

    }

    _setDefaultOptions() {
        if (!this.options.trace) this.options.trace = false;
        if (!this.options.navigationTimeout) this.options.navigationTimeout = 30000;
        if (!this.options.loginOptions) this.options.loginOptions = {};
        if (!this.options.loginOptions.timeout) this.options.loginOptions.timeout = 150000;
        if (!this.options.loginOptions.strategy) this.options.loginOptions.strategy = 'user-input';
    }

    async login() {
        this._isLogged = false;
        await this._login();
    }

    async _login() {
        if (this._isLogged) return;

        /* istanbul ignore next */
        if ((this.options && this.options.trace) || false)
            console.log(`Logging at CEI using ${this.options.loginOptions.strategy}...`);

        await this._ceiLoginService.getToken();
        console.log('FOOOOOOOOOOOOOOOOOOOOOI');

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
     * Returns the dividends data for each account in CEI
     * @param {Date} [startDate] - The start date to get the IPO transactions
     * @param {Date} [endDate] - The end date to get the IPO transactions
     * @returns {Promise<typedefs.DividendData} - List of available Dividends information
     */
    async getIPOTransactions(startDate,endDate) {
        await this._login();
        return await IPOCrawler.getIPOTransactions(this._cookieManager, this.options, startDate, endDate);
    }

    /**
     * Returns the options for the dividends
     * @returns {Promise<typedefs.DividendsOptions>} - Options for dividends
     */
    async getIPOOptions() {
        await this._login();
        return await IPOCrawler.getIPOOptions(this._cookieManager, this._options);
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
