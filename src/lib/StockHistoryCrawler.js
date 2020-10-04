const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const FetchCookieManager = require('../utils/FetchCookieManager');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError')
const cheerio = require('cheerio');
const { extractFormDataFromDOM, extractUpdateForm, updateFieldsDOM, extractMessagePostResponse } = require('../utils');

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
    STOCKS_TABLE_ROWS: '#ctl00_ContentPlaceHolder1_rptAgenteBolsa_ctl00_rptContaBolsa_ctl00_pnAtivosNegociados table tbody tr',
    PAGE_ALERT_ERROR: '.alert-box.alert',
    PAGE_ALERT_SUCCESS: '.alert-box.success'
}

const STOCK_TABLE_HEADERS = {
    date: 'date',
    operation: 'string',
    market: 'string',
    expiration: 'string',
    code: 'string',
    name: 'string',
    quantity: 'int',
    price: 'float',
    totalValue: 'float',
    quotationFactor: 'float'
};

const FETCH_OPTIONS = {
    STOCK_HISTORY_INSTITUTION: {
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
            "Connection": "keep-alive"
        },
        "referrer": "https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    },
    STOCK_HISTORY_ACCOUNT: {
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
        "referrer": "https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }
};

const FETCH_FORMS = {
    STOCK_HISTORY_INSTITUTION: [
        'ctl00$ContentPlaceHolder1$ToolkitScriptManager1',
        'ctl00_ContentPlaceHolder1_ToolkitScriptManager1_HiddenField',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        'ctl00$ContentPlaceHolder1$hdnPDF_EXCEL',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$ddlContas',
        'ctl00$ContentPlaceHolder1$txtDataDeBolsa',
        'ctl00$ContentPlaceHolder1$txtDataAteBolsa',
        '__ASYNCPOST'
    ],
    STOCK_HISTORY_ACCOUNT: [
        'ctl00$ContentPlaceHolder1$ToolkitScriptManager1',
        'ctl00_ContentPlaceHolder1_ToolkitScriptManager1_HiddenField',
        'ctl00$ContentPlaceHolder1$hdnPDF_EXCEL',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$ddlContas',
        'ctl00$ContentPlaceHolder1$txtDataDeBolsa',
        'ctl00$ContentPlaceHolder1$txtDataAteBolsa',
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

const ALERT_VALIDATION = {
    HISTORY_ACCOUNT: 'CEIWeb.IncluirMensagem'
}

class StockHistoryCrawler {

    /**
     * Get the stock history from CEI
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @param {Date} [startDate] - The start date of the history. If none passed, the default of CEI will be used
     * @param {Date} [endDate] - The end date of the history. If none passed, the default of CEI will be used
     * @returns {Promise<typedefs.StockHistory[]>} - List of Stock histories
     */
    static async getStockHistory(cookieManager, options = null, startDate = null, endDate = null) {
        const { institutions } = await this.getStockHistoryOptions(cookieManager, options);

        const traceOperations = (options && options.trace) || false;
        
        const result = [];

        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        if (startDate !== null) {
            const minDateStr = domPage(PAGE.START_DATE_INPUT).attr('value');
            const minDate = CeiUtils.getDateFromInput(minDateStr);
            
            // Prevent date out of bound if parameter is set
            if (options.capDates && startDate < minDate)
                startDate = minDate;

            domPage(PAGE.START_DATE_INPUT).attr('value', CeiUtils.getDateForInput(startDate));
        }

        if (endDate !== null) {
            const maxDateStr = domPage(PAGE.END_DATE_INPUT).attr('value');
            const maxDate = CeiUtils.getDateFromInput(maxDateStr);
            
            // Prevent date out of bound if parameter is set
            if (options.capDates && endDate < maxDate)
                endDate = minDate;

            domPage(PAGE.END_DATE_INPUT).attr('value', CeiUtils.getDateForInput(endDate));
        }

        // Iterate over institutions, accounts, processing the stocks
        for (const institution of institutions) {
            if (traceOperations)
                console.log(`Selecting institution ${institution.label} (${institution.value})`);

            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);
                
            const formDataInstitution = extractFormDataFromDOM(domPage, FETCH_FORMS.STOCK_HISTORY_INSTITUTION, {
                ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$ddlAgentes',
                __EVENTTARGET: 'ctl00$ContentPlaceHolder1$ddlAgentes'
            });

            const req = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.STOCK_HISTORY_INSTITUTION,
                body: formDataInstitution
            });

            const updtForm = extractUpdateForm(await req.text());
            updateFieldsDOM(domPage, updtForm);

            for (const account of institution.accounts) {
                /* istanbul ignore next */
                if (traceOperations)
                    console.log(`Selecting account ${account}`);

                domPage(PAGE.SELECT_ACCOUNT).attr('value', account);
                
                const formDataHistory = extractFormDataFromDOM(domPage, FETCH_FORMS.STOCK_HISTORY_ACCOUNT, {
                    ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$btnConsultar',
                    __EVENTARGUMENT: ''
                });
                
                const historyRequest = await cookieManager.fetch(PAGE.URL, {
                    ...FETCH_OPTIONS.STOCK_HISTORY_ACCOUNT,
                    body: formDataHistory
                });

                const historyText = await historyRequest.text();
                const lastLine = historyText.split('\n').slice(-1)[0];
                const errorMessage = extractMessagePostResponse(lastLine);
                
                if (errorMessage && errorMessage.status === 2) {
                    throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, errorMessage.message);
                }
                
                const historyDOM = cheerio.load(historyText);

                if (traceOperations)
                    console.log(`Processing stock history data`);

                const data = this._processStockHistory(historyDOM);

                /* istanbul ignore next */
                if (traceOperations)
                    console.log (`Found ${data.length} operations`);

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    stockHistory: data
                });
            }
        }

        return result;
    }

    /**
     * Returns the available options to get Stock History data
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.StockHistoryOptions>} - Options to get data from stock history
     */
    static async getStockHistoryOptions(cookieManager, options = null) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        const minDateStr = domPage(PAGE.START_DATE_INPUT).attr('value');
        const maxDateStr = domPage(PAGE.END_DATE_INPUT).attr('value');

        // Get all institutions to iterate
        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            })).get()
            .filter(institution => institution.value > 0);

        for (const institution of institutions) {
            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);
            const formDataStr = extractFormDataFromDOM(domPage, FETCH_FORMS.STOCK_HISTORY_INSTITUTION);

            const getAcountsPage = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.STOCK_HISTORY_INSTITUTION,
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
     * Process the stock history to a DTO
     * @param {cheerio.Root} dom DOM table stock history
     */
    static _processStockHistory(dom) {
        const headers = Object.keys(STOCK_TABLE_HEADERS);

        const data = dom(PAGE.STOCKS_TABLE_ROWS)
            .map((_, tr) => dom('td', tr)
                .map((_, td) => dom(td).text().trim())
                .get()
                .reduce((dict, txt, idx) => {
                    dict[headers[idx]] = txt;
                    return dict;
                }, {})
            ).get();

        return CeiUtils.parseTableTypes(data, STOCK_TABLE_HEADERS);
    }

}

module.exports = StockHistoryCrawler;