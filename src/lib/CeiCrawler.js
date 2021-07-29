const PositionCrawler = require('./PositionCrawler');
const LastExecutionCrawler = require('./LastExecutionCrawler');
const typedefs = require("./typedefs");
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const CeiUtils = require('./CeiUtils');
const CeiLoginService = require('./CeiLoginService');
const AxiosWrapper = require('./AxiosWrapper');

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

        this._ceiLoginService = new CeiLoginService(username, password, this.options);
        AxiosWrapper.setup(this.options);

    }

    _setDefaultOptions() {
        if (!this.options.debug) this.options.debug = false;
        if (!this.options.navigationTimeout) this.options.navigationTimeout = 30000;
        if (!this.options.loginOptions) this.options.loginOptions = {};
        if (!this.options.loginOptions.timeout) this.options.loginOptions.timeout = 150000;
        if (!this.options.loginOptions.strategy) this.options.loginOptions.strategy = 'user-resolve';
    }

    async login() {
        this._isLogged = false;
        await this._login();
    }

    async _login() {
        if (this._isLogged) return;

        /* istanbul ignore next */
        if (this.options.debug)
            console.log(`Logging at CEI using ${this.options.loginOptions.strategy}...`);

        this.options.auth = await this._ceiLoginService.getToken();
        this.options.lastExecutionInfo = await LastExecutionCrawler.getLastExecutionInfo();
    }

    /**
     * Returns the stock history
     * @param {Date} [date] - The date of the position
     * @returns {Promise<typedefs.StockHistory[]>} - List of Stock histories
     */
    async getPosition(date = null) {
        await this._login();
        return await PositionCrawler.getPosition(date, this.options);
    }

}

module.exports = CeiCrawler;
