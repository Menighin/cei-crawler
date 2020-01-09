const puppeteer = require('puppeteer');

const PAGE = {
    URL: 'https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx',
    SELECT_INSTITUTION: '#ctl00_ContentPlaceHolder1_ddlAgentes',
    SELECT_INSTITUTION_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlAgentes option',
    SELECT_ACCOUNT: '#ctl00_ContentPlaceHolder1_ddlContas',
    SELECT_ACCOUNT_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlContas option',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    STOCKS_TABLE: '#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados'
}

class StockHistoryCrawler {

    /**
     * 
     * @param {puppeteer.Page} page 
     */
    static async getStockHistory(page) {
        await page.goto(PAGE.URL);
        
        // Get all institutions to iterate
        const institutionsHandle = await page.evaluateHandle((selector) => {
            return Array.from(document.querySelectorAll(selector))
                .map(o => ({ value: o.value, label: o.text }))
                .filter(v => v.value > 0);
        }, PAGE.SELECT_INSTITUTION_OPTIONS);
        const institutions = await institutionsHandle.jsonValue();

        // Iterate over institutions, accounts, processing the stocks
        let cachedAccount = ''; // Used to wait for page to load
        for (const institution of institutions) {

            console.log(`Selecting institution ${institution.label} (${institution.value})`)
            await page.select(PAGE.SELECT_INSTITUTION, institution.value);

            await page.waitForFunction((cachedAccount, select) => {
                const value = document.querySelector(select).value;
                return value != '0' && value != cachedAccount;
            }, {}, cachedAccount, PAGE.SELECT_ACCOUNT_OPTIONS);

            const accountsHandle = await page.evaluateHandle((select) => {
                return Array.from(document.querySelectorAll(select))
                    .map(o => o.value)
                    .filter(v => v > 0);
            }, PAGE.SELECT_ACCOUNT_OPTIONS);
            const accounts = await accountsHandle.jsonValue();
            
            for (const account of accounts) {
                console.log(`Selecting account ${account}`)
                await page.select(PAGE.SELECT_ACCOUNT, account);
                await page.click(PAGE.SUBMIT_BUTTON);

                // Wait for table to load
                await page.waitForFunction(`document.querySelector('${PAGE.STOCKS_TABLE}') !== null`);

                // Process the page
                console.log(`Processing stock history data`);
                await this._processStockHistory(page);

                // Click for a new query
                await page.click(PAGE.SUBMIT_BUTTON);

                // Await until the select for institution is enabled
                // it means the page is ready for a new query
                await page.waitForFunction(`!document.querySelector('${PAGE.SELECT_INSTITUTION}').disabled`);
            }

            cachedAccount = accounts[0];
            await page.waitFor(2000);
        }

        await page.waitFor(10000);
    }

    /**
     * Process the stock history to a DTO
     * @param {puppeteer.Page} page Page with the loaded data
     */
    static async _processStockHistory(page) {

    }

}

module.exports = StockHistoryCrawler;