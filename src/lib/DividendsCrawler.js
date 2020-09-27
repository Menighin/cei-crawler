const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const PuppeteerUtils = require('./PuppeteerUtils');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError')

const PAGE = {
    URL: 'https://cei.b3.com.br/CEI_Responsivo/ConsultarProventos.aspx',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    TABLE_CLASS: '.responsive tbody',
    DATE_MIN_VALUE: '#ctl00_ContentPlaceHolder1_lblPeriodoInicial',
    DATE_MAX_VALUE: '#ctl00_ContentPlaceHolder1_lblPeriodoFinal',
    DATE_INPUT: '#ctl00_ContentPlaceHolder1_txtData',
    SELECT_INSTITUTION: '#ctl00_ContentPlaceHolder1_ddlAgentes',
    SELECT_INSTITUTION_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlAgentes option',
    SELECT_ACCOUNT: '#ctl00_ContentPlaceHolder1_ddlContas',
    SELECT_ACCOUNT_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlContas option',
    PAGE_ALERT_ERROR: '.alert-box.alert',
    PAGE_ALERT_SUCCESS: '.alert-box.success',
    TABLE_TITLE_SELECTOR: 'p.title',
    PAST_EVENTS_TITLE: 'Eventos em Dinheiro Creditado',
    FUTURE_EVENTS_TITLE: 'Eventos em Dinheiro Provisionado'
}

const DIVIDENDS_TABLE_HEADERS = {
    stock: 'string',
    stockType: 'string',
    code: 'string',
    date: 'date',
    type: 'string',
    quantity: 'int',
    factor: 'int',
    grossValue: 'float',
    netValue: 'float'
};

class DividendsCrawler {

    /**
     * Gets dividends data available on CEI page.
     * @param {puppeteer.Page} page - Logged page to work with
     * @returns {typedefs.DividendData} - List of available Dividends information
     */
    static async getDividends(page, options = null, date = null) {

        // Navigate to dividends
        await page.goto(PAGE.URL);

        const traceOperations = (options && options.trace) || false;

        const result = [];

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
                await page.waitForSelector(PAGE.SUBMIT_BUTTON);

                // If this is not waited, a "Node is not visible" error is thrown from time 
                // to time, even though we are explicity waiting for the selector in the command before :/
                await page.waitFor(200); 
                
                await page.click(PAGE.SUBMIT_BUTTON);

                // Wait for table to load or give error / alert
                await PuppeteerUtils
                    .waitForAnySelector(page, [PAGE.TABLE_CLASS, PAGE.PAGE_ALERT_ERROR, PAGE.PAGE_ALERT_SUCCESS])
                    .then(async (selector) => {
                        if (selector === PAGE.PAGE_ALERT_ERROR) {
                            /* istanbul ignore next */
                            const message = await page.evaluate((s) => document.querySelector(s).textContent, selector);
                            throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, message);
                        }
                    });
                
                /* istanbul ignore next */
                const hasData = page.evaluate((s) => {
                    return document.querySelector(s) !== null;
                }, PAGE.TABLE_CLASS);

                // Process the page
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Processing dividends data`);

                const futureEvents = hasData ? await this._processEvents(page, PAGE.FUTURE_EVENTS_TITLE) : [];
                const pastEvents = hasData ? await this._processEvents(page, PAGE.PAST_EVENTS_TITLE) : [];

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    futureEvents: futureEvents,
                    pastEvents: pastEvents
                });
            }

            cachedAccount = accounts[0];
        }

        return result;
    }

    /**
     * Returns the available options to get Dividends data
     * @param {puppeteer.Page} page - Logged to page to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {typedefs.DividendsOptions} - Options to get data from dividends
     */
    static async getDividendsOptions(page, options = null) {

        // Navigate to stocks page
        await page.goto(PAGE.URL);

        /* istanbul ignore next */
        const minDateStr = await page.evaluate((selector) => document.querySelector(selector).textContent, PAGE.DATE_MIN_VALUE);
        /* istanbul ignore next */
        const maxDateStr = await page.evaluate((selector) => document.querySelector(selector).textContent, PAGE.DATE_MAX_VALUE);

        // Get all institutions to iterate
        /* istanbul ignore next */
        const institutionsHandle = await page.evaluateHandle((selector) => {
            return Array.from(document.querySelectorAll(selector))
                .map(o => ({ value: o.value, label: o.text }))
                .filter(v => v.value > 0);
        }, PAGE.SELECT_INSTITUTION_OPTIONS);
        const institutions = await institutionsHandle.jsonValue();

        let cachedAccount = ''; // Used to wait for page to load
        for (const institution of institutions) {

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
            institution.accounts = accounts;
            cachedAccount = accounts[0];
        }

        return {
            minDate: minDateStr,
            maxDate: maxDateStr,
            institutions: institutions
        }
    }


    /**
     * Process the events given the parameters
     * @param {puppeteer.Page} page Page with the loaded data
     * @param {String} tableTitle The title of the table to process the events
     */
    static async _processEvents(page, tableTitle) {

        /* istanbul ignore next */
        const dataPromise = await page.evaluateHandle((tableTitleSelector, tableTitleText, tbodySelector, headers) => {

            const containerDiv = [...document.querySelectorAll(tableTitleSelector)]
                .filter(s => s.innerText === tableTitleText)[0];

            if (typeof containerDiv === 'undefined') return [];

            const tBody = containerDiv.parentNode.querySelector(tbodySelector);
            if (tBody === null || tBody === undefined) return [];

            const rows = tBody.rows;

            return Array.from(rows)
                .map(tr => Array.from(tr.cells).reduce((p, c, i) => {
                    p[headers[i]] = c.innerText;
                    return p;
                }, {}));
        }, PAGE.TABLE_TITLE_SELECTOR, tableTitle, PAGE.TABLE_CLASS, Object.keys(DIVIDENDS_TABLE_HEADERS));

        const data = await dataPromise.jsonValue();
        return CeiUtils.parseTableTypes(data, DIVIDENDS_TABLE_HEADERS);
    }
}

module.exports = DividendsCrawler;