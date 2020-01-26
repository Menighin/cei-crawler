const puppeteer = require('puppeteer');
const StockHistoryCrawler = require('./StockHistoryCrawler');
const typedefs = require("./typedefs");
const PuppeteerUtils = require('./PuppeteerUtils');

class CeiCrawler {

    /** @type {boolean} */
    _isLogged = false;

    /** @type {puppeteer.Browser} */
    _browser = null;

    /** @type {puppeteer.Page} */
    _page = null;

    get username() { return this._username; }
    set username(username) { this._username = username; }

    get password() { return this._password; }
    set password(password) { this._password = password; }

    /** @type {{puppeteerLaunch: puppeteer.LaunchOptions}} options Options for CEI Crawler and Puppeteer */
    get options() { return this._options; }
    set options(options) { this._options = options; }

    /**
     * 
     * @param {String} username Username to login at CEI
     * @param {String} password Password to login at CEI
     * @param {{puppeteerLaunch: puppeteer.LaunchOptions, wat: typedefs.foo}} options Options for CEI Crawler and Puppeteer
     */
    constructor(username, password, options = {}) {
        this.username = username;
        this.password = password;
        this.options = options;
    }

    async _login() {
        if (this._isLogged) return;

        if (this._browser == null)
            this._browser = await puppeteer.launch(this.options.puppeteerLaunch);

        /* istanbul ignore next */
        if ((this.options && this.options.trace) || false)
            console.log('Logging at CEI...');
            
        this._page = await this._browser.newPage();
        await this._page.goto('https://cei.b3.com.br/CEI_Responsivo/');

        await this._page.type('#ctl00_ContentPlaceHolder1_txtLogin', this.username, { delay: 10 });
        await this._page.type('#ctl00_ContentPlaceHolder1_txtSenha', this.password, { delay: 10 });
        await this._page.click('#ctl00_ContentPlaceHolder1_btnLogar');

        // Wait for one of these things to happen first
        await PuppeteerUtils.waitForAny([
            {
                id: 'nav',
                pr: this._page.waitForNavigation({timeout: 40000})
            },
            {
                id: 'fail',
                pr: this._page.waitForSelector('.alert-box.alert')
            },
            {
                id: 'fail',
                pr: this._page.waitFor(35000) // After 20s, consider the login has failed
            }
        ]).then(async id => {
            if (id === 'fail')
                throw new Error('Login falhou');
        });

        this._isLogged = true;
    }

    /**
     * 
     * @param {Date} [startDate] - The start date of the history
     * @param {Date} [endDate]  - The end date of the history
     * @returns {typedefs.StockHistory[]} - List of Stock histories
     */
    async getStockHistory(startDate, endDate) {
        await this._login();
        return await StockHistoryCrawler.getStockHistory(this._page, this.options, startDate, endDate);
    }

}

module.exports = CeiCrawler;