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
    WALLET_TABLE: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira',
    WALLET_TABLE_BODY: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira tbody',
    PAGE_ALERT_ERROR: '.alert-box.alert',
    PAGE_ALERT_SUCCESS: '.alert-box.success'
}

const WALLET_TABLE_HEADER = [
    {prop: 'company', type: 'string'},
    {prop: 'stockType', type: 'string'},
    {prop: 'code', type: 'string'},
    {prop: 'isin', type: 'string'},
    {prop: 'price', type: 'float'},
    {prop: 'quantity', type: 'int'},
    {prop: 'quotationFactor', type: 'float'},
    {prop: 'totalValue', type: 'float'}
];

class WalletCrawler {

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
                let hasData = false;
                await PuppeteerUtils
                    .waitForAnySelector(page, [PAGE.WALLET_TABLE, PAGE.PAGE_ALERT_ERROR, PAGE.PAGE_ALERT_SUCCESS])
                    .then(async (selector) => {
                        if (selector === PAGE.PAGE_ALERT_ERROR) {
                            /* istanbul ignore next */
                            const message = await page.evaluate((s) => document.querySelector(s).textContent, selector);
                            throw new Error(message);
                        }
                        hasData = selector === PAGE.WALLET_TABLE;
                    });

                // Process the page
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Processing wallet data`);

                const data = hasData ? await this._processWallet(page) : [];

                /* istanbul ignore next */
                if (traceOperations)
                    console.log (`Found ${data.length} items`);

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    wallet: data
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
     * Process the wallet to a DTO
     * @param {puppeteer.Page} page Page with the loaded data
     */
    static async _processWallet(page) {

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
        }, PAGE.WALLET_TABLE_BODY, WALLET_TABLE_HEADER);

        // For some reason puppeteer does not return date from evaluateHandle
        return await data.jsonValue();
    }

}

module.exports = WalletCrawler;