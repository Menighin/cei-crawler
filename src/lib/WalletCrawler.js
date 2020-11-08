const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const FetchCookieManager = require('./FetchCookieManager');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError')
const cheerio = require('cheerio');
const normalizeWhitespace = require('normalize-html-whitespace');

const PAGE = {
    URL: 'https://ceiapp.b3.com.br/CEI_Responsivo/ConsultarCarteiraAtivos.aspx',
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
    STOCK_WALLET_TABLE_BODY_ROWS: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_rprCarteira_ctl00_grdCarteira tbody tr',    
    TREASURE_WALLET_TABLE: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_trBodyTesouroDireto',
    TREASURE_WALLET_TABLE_BODY: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_trBodyTesouroDireto tbody',
    TREASURE_WALLET_TABLE_BODY_ROWS: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_trBodyTesouroDireto tbody tr',
    RESULT_FOOTER_100: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl00_divTotalCarteira',
    RESULT_FOOTER_101: '#ctl00_ContentPlaceHolder1_rptAgenteContaMercado_ctl00_rptContaMercado_ctl01_divTotalCarteira',
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

const FETCH_OPTIONS = {
    WALLET_INSTITUTION: {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/ConsultarCarteiraAtivos.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    },
    WALLET_ACCOUNT:  {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/ConsultarCarteiraAtivos.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }
};

const FETCH_FORMS = {
    WALLET_INSTITUTION: [
        'ctl00$ContentPlaceHolder1$ToolkitScriptManager1',
        'ctl00_ContentPlaceHolder1_ToolkitScriptManager1_HiddenField',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$ddlContas',
        'ctl00$ContentPlaceHolder1$txtData',
        '__ASYNCPOST'
    ],
    WALLET_ACCOUNT: [
        'ctl00$ContentPlaceHolder1$ToolkitScriptManager1',
        'ctl00_ContentPlaceHolder1_ToolkitScriptManager1_HiddenField',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$ddlContas',
        'ctl00$ContentPlaceHolder1$txtData',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        '__ASYNCPOST',
        'ctl00$ContentPlaceHolder1$btnConsultar'
    ]
}

class WalletCrawler {

    /**
     * Get the wallet data from CEI
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @param {Date} [date] - The date of the wallet. If none passed, the default of CEI will be used
     * @returns {Promise<typedefs.AccountWallet[]>} - List of Stock histories
     */
    static async getWallet(cookieManager, options = null, date = null) {
        const traceOperations = (options && options.trace) || false;

        const result = [];

        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        // Set date
        if (date !== null) {
            /* istanbul ignore next */
            const minDateStr = domPage(PAGE.DATE_MIN_VALUE).text().trim();
            const minDate = CeiUtils.getDateFromInput(minDateStr);

            /* istanbul ignore next */
            const maxDateStr = domPage(PAGE.DATE_MAX_VALUE).text().trim();
            const maxDate = CeiUtils.getDateFromInput(maxDateStr);
            
            // Prevent date out of bound if parameter is set
            if (options.capDates && date < minDate) {
                date = minDate;
            }

            if (options.capDates && date > maxDate) {
                date = maxDate;
            }
            domPage(PAGE.DATE_INPUT).attr('value', CeiUtils.getDateForInput(date));
        }

        // Get all institutions to iterate
        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            })).get()
            .filter(institution => institution.value > 0);

        for (const institution of institutions) {

            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Selecting institution ${institution.label} (${institution.value})`)

            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);

            const formDataInstitution = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.WALLET_INSTITUTION, {
                ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$ddlAgentes',
                __EVENTTARGET: 'ctl00$ContentPlaceHolder1$ddlAgentes'
            });

            const req = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.WALLET_INSTITUTION,
                body: formDataInstitution
            });

            const reqInstitutionText = await req.text();
            const reqInstitutionDOM = cheerio.load(reqInstitutionText);

            const updtForm = CeiUtils.extractUpdateForm(reqInstitutionText);
            CeiUtils.updateFieldsDOM(domPage, updtForm);

            const accounts = reqInstitutionDOM(PAGE.SELECT_ACCOUNT_OPTIONS)
                .map((_, option) => option.attribs.value).get()
                .filter(account => account > 0);
            
            for (const account of accounts) {
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Selecting account ${account}`);

                domPage(PAGE.SELECT_ACCOUNT).attr('value', account);
        
                const { stockWallet, nationalTreasuryWallet } = await this._getDataPage(domPage, cookieManager, traceOperations);

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    stockWallet: stockWallet,
                    nationalTreasuryWallet: nationalTreasuryWallet
                });
            }
        }

        return result;
    }

    /**
     * Returns the available options to get Wallet data
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.WalletOptions}> - Options to get data from wallet
     */
    static async getWalletOptions(cookieManager, options = null) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());


        const minDateStr = domPage(PAGE.DATE_MIN_VALUE).text().trim();
        const maxDateStr = domPage(PAGE.DATE_MAX_VALUE).text().trim();

        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            }))
            .get()
            .filter(institution => institution.value > 0);

        for (const institution of institutions) {
            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);
            const formDataStr = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.WALLET_INSTITUTION);

            const getAcountsPage = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.WALLET_INSTITUTION,
                body: formDataStr
            });

            const getAcountsPageTxt = await getAcountsPage.text();

            const getAcountsPageDom = cheerio.load(getAcountsPageTxt);

            const accounts = getAcountsPageDom(PAGE.SELECT_ACCOUNT_OPTIONS)
                .map((_, option) => option.attribs.value).get()
                .filter(accountId => accountId > 0);

            institution.accounts = accounts;
        }

        return {
            minDate: minDateStr,
            maxDate: maxDateStr,
            institutions: institutions
        }
    }

    /**
     * Returns the data from the page after trying more than once
     * @param {cheerio.Root} dom DOM of page
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {Boolean} traceOperations - Whether to trace operations or not
     */
    static async _getDataPage(dom, cookieManager, traceOperations) {
        while(true) {
            const formDataWallet = CeiUtils.extractFormDataFromDOM(dom, FETCH_FORMS.WALLET_ACCOUNT, {
                ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$btnConsultar',
                __EVENTARGUMENT: '',
                __LASTFOCUS: ''
            });
            
            const walletRequest = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.WALLET_ACCOUNT,
                body: formDataWallet
            });

            const walletText = normalizeWhitespace(await walletRequest.text());
            const errorMessage = CeiUtils.extractMessagePostResponse(walletText);

            if (errorMessage && errorMessage.type === 2) {
                throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, errorMessage.message);
            }

            const walletDOM = cheerio.load(walletText);

            // Process the page
            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Processing wallet data`);

            const stockWallet = this._processStockWallet(walletDOM);
            const nationalTreasuryWallet = this._processNationalTreasuryWallet(walletDOM);

            if (errorMessage.type !== undefined || this._hasLoadedData(walletDOM)) {
                return {
                    stockWallet,
                    nationalTreasuryWallet
                };
            }
            
            const updtForm = CeiUtils.extractUpdateForm(walletText);
            CeiUtils.updateFieldsDOM(dom, updtForm);
        }
    }

    /**
     * Process the stock wallet to a DTO
     * @param {cheerio.Root} dom DOM table stock history
     */
    static _processStockWallet(dom) {
        const headers = Object.keys(STOCK_WALLET_TABLE_HEADER);

        const data = dom(PAGE.STOCK_WALLET_TABLE_BODY_ROWS)
            .map((_, tr) => dom('td', tr)
                .map((_, td) => dom(td).text().trim())
                .get()
                .reduce((dict, txt, idx) => {
                    dict[headers[idx]] = txt;
                    return dict;
                }, {})
            ).get();

        return CeiUtils.parseTableTypes(data, STOCK_WALLET_TABLE_HEADER);
    }

    /**
     * Process the stock wallet to a DTO
     * @param {cheerio.Root} dom DOM table stock history
     */
    static _processNationalTreasuryWallet(dom) {
        const headers = Object.keys(TREASURE_WALLET_TABLE_HEADER);

        const data = dom(PAGE.TREASURE_WALLET_TABLE_BODY_ROWS)
            .map((_, tr) => dom('td', tr)
                .map((_, td) => dom(td).text().trim())
                .get()
                .reduce((dict, txt, idx) => {
                    dict[headers[idx]] = txt;
                    return dict;
                }, {})
            ).get();

        return CeiUtils.parseTableTypes(data, TREASURE_WALLET_TABLE_HEADER);
    }

    /**
     * Check wheter the table was rendered on the screen to stop trying to get data
     * @param {cheerio.Root} dom DOM table stock history
     */
    static _hasLoadedData(dom) {
       const query = dom(`${PAGE.RESULT_FOOTER_100}, ${PAGE.RESULT_FOOTER_101}`);
       return query.length > 0;
    }

}

module.exports = WalletCrawler;