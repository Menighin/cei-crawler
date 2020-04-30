const puppeteer = require('puppeteer');
const PuppeteerUtils = require('./PuppeteerUtils');
const typedefs = require("./typedefs");

const PAGE = {
    URL: 'https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx',
    SELECT_INSTITUTION: '#ctl00_ContentPlaceHolder1_ddlAgentes',
    SELECT_INSTITUTION_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlAgentes option',
    SELECT_ACCOUNT: '#ctl00_ContentPlaceHolder1_ddlContas',
    SELECT_ACCOUNT_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlContas option',
    START_DATE_INPUT: '#ctl00_ContentPlaceHolder1_txtDataDeBolsa',
    END_DATE_INPUT: '#ctl00_ContentPlaceHolder1_txtDataAteBolsa',
    ALERT_BOX: '.alert-box',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    STOCKS_DIV: '#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados',
    STOCKS_TABLE: '#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados table tbody',
    PAGE_ALERT_ERROR: '.alert-box.alert',
    PAGE_ALERT_SUCCESS: '.alert-box.success'
}

const STOCK_TABLE_HEADERS = [
    {prop: 'date', type: 'date'},
    {prop: 'operation', type: 'string'},
    {prop: 'market', type: 'string'},
    {prop: 'expiration', type: 'string'},
    {prop: 'code', type: 'string'},
    {prop: 'name', type: 'string'},
    {prop: 'quantity', type: 'int'},
    {prop: 'price', type: 'float'},
    {prop: 'totalValue', type: 'float'},
    {prop: 'quotationFactor', type: 'float'}
];

class StockHistoryCrawler {

    /**
     * 
     * @param {puppeteer.Page} page - Logged page to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @param {Date} [startDate] - The start date of the history. If none passed, the default of CEI will be used
     * @param {Date} [endDate] - The end date of the history. If none passed, the default of CEI will be used
     * @returns {typedefs.StockHistory[]} - List of Stock histories
     */
    static async getStockHistory(page, options = null, startDate = null, endDate = null) {
        
        const traceOperations = (options && options.trace) || false;
        
        const result = [];

        // Navigate to stocks page
        await page.goto(PAGE.URL);

        const getDateForInput = (date) => 
            `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;

        // Set start and end date
        if (startDate !== null) {
            /* istanbul ignore next */
            const minDateStr = await page.evaluate((selector) => document.querySelector(selector).value, PAGE.START_DATE_INPUT);
            const [day, month, year] = minDateStr.split('/').map(s => parseInt(s));
            const minDate = new Date(year, month - 1, day);
            
            // Prevent date out of bound if parameter is set
            if (options.capStartDate && startDate < minDate)
                startDate = minDate;

            /* istanbul ignore next */
            await page.evaluate((selector) => { document.querySelector(selector).value = '' }, PAGE.START_DATE_INPUT);
            await page.type(PAGE.START_DATE_INPUT, getDateForInput(startDate));
        }
        
        if (endDate !== null) {
            /* istanbul ignore next */
            const maxDateStr = await page.evaluate((selector) => document.querySelector(selector).value, PAGE.END_DATE_INPUT);
            const [day, month, year] = maxDateStr.split('/').map(s => parseInt(s));
            const maxDate = new Date(year, month - 1, day);
            
            // Prevent date out of bound if parameter is set
            if (options.capEndDate && endDate > maxDate)
                endDate = maxDate;
            
            /* istanbul ignore next */
            await page.evaluate((selector) => { document.querySelector(selector).value = '' }, PAGE.END_DATE_INPUT);
            await page.type(PAGE.END_DATE_INPUT, getDateForInput(endDate));
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
                let hasData = false;
                await PuppeteerUtils
                    .waitForAnySelector(page, [PAGE.STOCKS_DIV, PAGE.PAGE_ALERT_ERROR, PAGE.PAGE_ALERT_SUCCESS])
                    .then(async (selector) => {
                        if (selector === PAGE.PAGE_ALERT_ERROR) {
                            /* istanbul ignore next */
                            const message = await page.evaluate((s) => document.querySelector(s).textContent, selector);
                            throw new Error(message);
                        }
                        hasData = selector === PAGE.STOCKS_DIV;
                    });

                // Process the page
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Processing stock history data`);

                const data = hasData ? await this._processStockHistory(page) : [];

                /* istanbul ignore next */
                if (traceOperations)
                    console.log (`Found ${data.length} operations`);

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    stockHistory: data
                });

                // Click for a new query
                await page.click(PAGE.SUBMIT_BUTTON);

                // Await until the select for institution is enabled
                // it means the page is ready for a new query
                await page.waitForFunction(`!document.querySelector('${PAGE.SELECT_INSTITUTION}').disabled`);
            }

            cachedAccount = accounts[0];
        }

        return result;
    }

    /**
     * Process the stock history to a DTO
     * @param {puppeteer.Page} page Page with the loaded data
     */
    static async _processStockHistory(page) {

        /* istanbul ignore next */
        const data = await page.evaluateHandle((select, headers) => {
            const rows = document.querySelector(select).rows;
            
            // Helper function
            const parseValue = (value, type) => {
                if (type === 'string') return value;
                if (type === 'int')    return parseInt(value.replace('.', ''));
                if (type === 'float')  return parseFloat(value.replace('.', '').replace(',', '.'));
                if (type === 'date')   return new Date(value.split('/').reverse()).getTime();
            }

            return Array.from(rows)
                .map(tr => Array.from(tr.cells).reduce((p, c, i) => {
                    p[headers[i].prop] = parseValue(c.innerText, headers[i].type);
                    return p;
                }, {}));
        }, PAGE.STOCKS_TABLE, STOCK_TABLE_HEADERS);

        // For some reason puppeteer does not return date from evaluateHandle
        return (await data.jsonValue()).map(d => ({...d, date: new Date(d.date)}));
    }

}

module.exports = StockHistoryCrawler;