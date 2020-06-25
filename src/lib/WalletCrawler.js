const puppeteer = require('puppeteer');
const PuppeteerUtils = require('./PuppeteerUtils');
const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');

const PAGE = {
    URL: 'https://cei.b3.com.br/CEI_Responsivo/ConsultarCarteiraAtivos.aspx',
    SELECT_INSTITUTION: '#ctl00_ContentPlaceHolder1_ddlAgentes',
    SELECT_INSTITUTION_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlAgentes option',
    SELECT_ACCOUNT: '#ctl00_ContentPlaceHolder1_ddlContas',
    SELECT_ACCOUNT_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlContas option',
    DATE_INPUT: '#ctl00_ContentPlaceHolder1_txtData',
    DATE_MIN_VALUE: '#ctl00_ContentPlaceHolder1_lblPeriodoInicial',
    DATE_MAX_VALUE: '#ctl00_ContentPlaceHolder1_lblPeriodoFinal',
    ALERT_BOX: '.alert-box',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    STOCK_WALLET_TABLE: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira',
    STOCK_WALLET_TABLE_BODY: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira tbody',
    TREASURE_WALLET_TABLE: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_trBodyTesouroDireto',
    TREASURE_WALLET_TABLE_BODY: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_trBodyTesouroDireto tbody',
    RESULT_FOOTER: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl01_divTotalCarteira',
    PAGE_ALERT_ERROR: '.alert-box.alert',
    PAGE_ALERT_SUCCESS: '.alert-box.success'
}

const STOCK_WALLET_TABLE_HEADER = {
    company: 'string',
    stockType: 'string',
    code: 'string',
    isin: 'string',
    price: 'float',
    quantity: 'int',
    quotationFactor: 'float',
    totalValue: 'float'
};

const TREASURE_WALLET_TABLE_HEADER = {
    code: 'string',
    expirationDate: 'date',
    investedValue: 'float',
    grossValue: 'float',
    netValue: 'float',
    quantity: 'float',
    blocked: 'float'
};

class WalletCrawler {

    /**
     * Get the wallet data from CEI
     * @param {puppeteer.Page} page - Logged page to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @param {Date} [date] - The date of the wallet. If none passed, the default of CEI will be used
     * @returns {typedefs.AccountWallet[]} - List of Stock histories
     */
    static async getWallet(page, options = null, date = null) {

        const traceOperations = (options && options.trace) || false;

        const result = [];

        // Navigate to wallet page
        await page.goto(PAGE.URL);

        // Set date
        if (date !== null) {
            /* istanbul ignore next */
            const minDateStr = await page.evaluate(selector => document.querySelector(selector).textContent, PAGE.DATE_MIN_VALUE);
            const minDate = CeiUtils.getDateFromInput(minDateStr);

            /* istanbul ignore next */
            const maxDateStr = await page.evaluate(selector => document.querySelector(selector).textContent, PAGE.DATE_MAX_VALUE);
            const maxDate = CeiUtils.getDateFromInput(maxDateStr);
            
            // Prevent date out of bound if parameter is set
            if (options.capDates && date < minDate)
                date = minDate;

            if (options.capDates && date > maxDate)
                date = maxDate;

            /* istanbul ignore next */
            await page.evaluate(selector => { document.querySelector(selector).value = '' }, PAGE.DATE_INPUT);
            await page.type(PAGE.DATE_INPUT, CeiUtils.getDateForInput(date));
        }

        // Get all institutions to iterate
        /* istanbul ignore next */
        const institutionsHandle = await page.evaluateHandle((selector) => {
            return Array.from(document.querySelectorAll(selector))
                .map(o => ({ value: o.value, label: o.text }))
                .filter(v => v.value > 0);
        }, PAGE.SELECT_INSTITUTION_OPTIONS);
        const institutions = await institutionsHandle.jsonValue();

        // Iterate over institutions, accounts, processing the stocks
        let cachedAccount = ''; // Used to wait for page to load
        for (const institution of institutions) {

            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Selecting institution ${institution.label} (${institution.value})`)

            await page.select(PAGE.SELECT_INSTITUTION, institution.value);

            /* istanbul ignore next */
            await page.waitForFunction((cachedAccount, select) => {
                const value = document.querySelector(select).value;
                return value != '0' && value != cachedAccount;
            }, {}, cachedAccount, PAGE.SELECT_ACCOUNT_OPTIONS);

            /* istanbul ignore next */
            const accountsHandle = await page.evaluateHandle((select) => {
                return Array.from(document.querySelectorAll(select))
                    .map(o => o.value)
                    .filter(v => v > 0);
            }, PAGE.SELECT_ACCOUNT_OPTIONS);
            const accounts = await accountsHandle.jsonValue();
            
            for (const account of accounts) {
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Selecting account ${account}`);

                await page.select(PAGE.SELECT_ACCOUNT, account);
                await page.click(PAGE.SUBMIT_BUTTON);

                // Wait for table to load or give error / alert
                await PuppeteerUtils
                    .waitForAnySelector(page, [PAGE.RESULT_FOOTER, PAGE.PAGE_ALERT_ERROR, PAGE.PAGE_ALERT_SUCCESS])
                    .then(async (selector) => {
                        if (selector === PAGE.PAGE_ALERT_ERROR) {
                            /* istanbul ignore next */
                            const message = await page.evaluate((s) => document.querySelector(s).textContent, selector);
                            throw new Error(message);
                        }
                    });
                
                /* istanbul ignore next */
                const hasData = page.evaluate((s1, s2) => {
                    return document.querySelector(s1) !== null || document.querySelector(s2) !== null;
                }, PAGE.STOCK_WALLET_TABLE, PAGE.TREASURE_WALLET_TABLE);

                // Process the page
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Processing wallet data`);

                const stockWallet = hasData ? await this._processStockWallet(page) : [];
                const nationalTreasuryWallet = hasData ? await this._processNationalTreasuryWallet(page) : [];

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    stockWallet: stockWallet,
                    nationalTreasuryWallet: nationalTreasuryWallet
                });
            }

            cachedAccount = accounts[0];
        }

        return result;
    }

    /**
     * Process the stock wallet to a DTO
     * @param {puppeteer.Page} page Page with the loaded data
     */
    static async _processStockWallet(page) {

        /* istanbul ignore next */
        const dataPromise = await page.evaluateHandle((select, headers) => {
            const tBody = document.querySelector(select);
            if (tBody === null || tBody === undefined) return [];

            const rows = tBody.rows;

            return Array.from(rows)
                .map(tr => Array.from(tr.cells).reduce((p, c, i) => {
                    p[headers[i]] = c.innerText;
                    return p;
                }, {}));
        }, PAGE.STOCK_WALLET_TABLE_BODY, Object.keys(STOCK_WALLET_TABLE_HEADER));

        const data = await dataPromise.jsonValue();
        return CeiUtils.parseTableTypes(data, STOCK_WALLET_TABLE_HEADER);
    }

    static async _processNationalTreasuryWallet(page) {

        /* istanbul ignore next */
        const dataPromise = await page.evaluateHandle((select, headers) => {
            const tBody = document.querySelector(select);
            if (tBody === null || tBody === undefined) return [];
            const rows = tBody.rows;

            return Array.from(rows)
                .map(tr => Array.from(tr.cells).reduce((p, c, i) => {
                    p[headers[i]] = c.innerText;
                    return p;
                }, {}));
        }, PAGE.TREASURE_WALLET_TABLE_BODY, Object.keys(TREASURE_WALLET_TABLE_HEADER));

        const data = await dataPromise.jsonValue();
        return CeiUtils.parseTableTypes(data, TREASURE_WALLET_TABLE_HEADER);
    }

}

module.exports = WalletCrawler;