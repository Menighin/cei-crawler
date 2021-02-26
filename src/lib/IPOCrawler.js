const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const FetchCookieManager = require('./FetchCookieManager');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError')
const cheerio = require('cheerio');
const normalizeWhitespace = require('normalize-html-whitespace');

const PAGE = {
    URL: 'https://ceiapp.b3.com.br/CEI_Responsivo/ofertas-publicas.aspx',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    TABLE_CLASS: '.responsive tbody',
    TABLE_CLASS_ROWS: '.responsive tbody tr',
    DATE_MIN_VALUE: '#ctl00_ContentPlaceHolder1_lblPeriodoInicial',
    DATE_MAX_VALUE: '#ctl00_ContentPlaceHolder1_lblPeriodoFinal',
    DATE_INPUT: '.datepicker',
    SELECT_INSTITUTION: '#ctl00_ContentPlaceHolder1_ddlAgentes',
    SELECT_INSTITUTION_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlAgentes option',
}

const IPO_TABLE_HEADERS = {
    company: 'string',
    offerName: 'string',
    code: 'string',
    isin: 'string',
    type: 'string',
    buyMethod: 'string',
    reservedAmount: 'int',
    reservedValue: 'float',
    maxPrice: 'float',
    price: 'float',
    allocAmount: 'int',
    allocValue: 'float',
    date: 'date'
};

const FETCH_OPTIONS = {
    IPO_INSTITUTION: {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/ofertas-publicas.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      }
};

const FETCH_FORMS = {
    IPO_INSTITUTION: [
        'ctl00$ContentPlaceHolder1$ToolkitScriptManager1',
        'ctl00_ContentPlaceHolder1_ToolkitScriptManager1_HiddenField',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$txtDatePickerFiltro',
        '__ASYNCPOST',
        'ctl00$ContentPlaceHolder1$btnConsultar'
    ]
}

class IPOCrawler {

    /**
     * Gets ipo data available on CEI page.
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {Date} [startDate] - The start date of the history of ipo data. If none passed, the mininum available date will be used.
     * @param {Date} [endDate] - The end date of the history of ipo data. If none passed, the maximum available date will be used.
     * @returns {Promise<typedefs.IPOData>} - List of available ipo information
     */
    static async getIPOTransactions(cookieManager, options = null, startDate = null,  endDate = null) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        const traceOperations = (options && options.trace) || false;

        const result = [];

        // Set minimum and maximum date
        const minDateStr = domPage(PAGE.DATE_MIN_VALUE).text().trim();
        const maxDateStr = domPage(PAGE.DATE_MAX_VALUE).text().trim();
        const minDate = CeiUtils.getDateFromInput(minDateStr);
        const maxDate = CeiUtils.getDateFromInput(maxDateStr);

        if (startDate !== null) {
            // Prevent date out of bound if parameter is set
            if (startDate < minDate)
                startDate = minDate;
        }
        else
        // If parameter is not set, set min date
            startDate = minDate;

        if (endDate !== null) {
            // Prevent date out of bound if parameter is set
            if (endDate > maxDate)
                endDate = maxDate;
        }        
        else
            // If parameter is not set, set max date
            endDate = maxDate;

         // Iterate over the range of dates and fetch the IPO transactions
         for (var date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1))
         {
            var date_result = await this._getIPOTransactions(cookieManager, options, date);
            date_result.forEach( (el) => result.push(el) );
         }   

        return result;
    }

    /**
     * Gets ipo data available on CEI page.
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {Date} [date] - The date of the IPO transactions.
     * @returns {Promise<typedefs.IPOTransactions>} - List of available ipo transactions.
     */
    static async _getIPOTransactions(cookieManager, options, date) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        const traceOperations = (options && options.trace) || false;

        const result = [];

        // Set date
        domPage(PAGE.DATE_INPUT).attr('value', CeiUtils.getDateForInput(date));
        

        // Get all institutions to iterate
        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            })).get()
            .filter(institution => institution.value > 0);

        // Iterate over institutions, processing the transactions
        for (const institution of institutions) {

            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Selecting institution ${institution.label} (${institution.value})`)

            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);

            const formDataInstitution = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.IPO_INSTITUTION, {
                ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$ddlAgentes',
                __EVENTTARGET: 'ctl00$ContentPlaceHolder1$ddlAgentes',
                ctl00$ContentPlaceHolder1$btnConsultar: 'Consultar'
            });

            const req = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.IPO_INSTITUTION,
                body: formDataInstitution
            });
            
            const transactions = await this._getDataPage(req, cookieManager, traceOperations);
            transactions.forEach(element => 
                result.push(
                    {
                        institution : institution.label,
                        date : CeiUtils.getDateForInput(date),
                        transactions : transactions
                    }
                ))
            
        }

        return result;
    }

    /**
     * Returns the available options to get ipo data
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.IPOOptions>} - Options to get data from ipo
     */
    static async getIPOOptions(cookieManager, options = null) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        const minDateStr = domPage(PAGE.DATE_MIN_VALUE).text().trim();
        const maxDateStr = domPage(PAGE.DATE_MAX_VALUE).text().trim();

        // Get all institutions to iterate
        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            }))
            .get()
            .filter(institution => institution.value > 0);

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
     * @returns {typedef.IPOData} - The IPO transactions data.
     */
    static async _getDataPage(req, cookieManager, traceOperations) {
        while(true) {

            const domText = normalizeWhitespace(await req.text());
            const errorMessage = CeiUtils.extractMessagePostResponse(domText);

            if (errorMessage && errorMessage.type === 2) {
                throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, errorMessage.message);
            }

            if( errorMessage.message === 'Não foram encontrados resultados para esta pesquisa.')
            {
                return [];
            }

            const dom = cheerio.load(domText);

            // Process the page
            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Processing ipo transactions`);

            return this._processTable(dom);

        }
    }

    /**
     * Process the table given the parameters
     * @param {cheerio.Root} dom DOM table of ipo transactions
     * @returns {typedef.IPOTransactions} 
     */
    static _processTable(dom) {
        const headers = Object.keys(IPO_TABLE_HEADERS);

        const data = dom(PAGE.TABLE_CLASS_ROWS).get()
            .map((tr) => dom('td', tr).get()
                .map((td) => dom(td).text().trim())
                .reduce((dict, txt, idx) => {
                    dict[headers[idx]] = txt;
                    return dict;
                }, {})
            );

        return CeiUtils.parseTableTypes(data, IPO_TABLE_HEADERS);
    }
}

module.exports = IPOCrawler;