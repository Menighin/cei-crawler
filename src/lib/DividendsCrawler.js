const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const FetchCookieManager = require('./FetchCookieManager');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError')
const cheerio = require('cheerio');
const normalizeWhitespace = require('normalize-html-whitespace');

const PAGE = {
    URL: 'https://ceiapp.b3.com.br/CEI_Responsivo/ConsultarProventos.aspx',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    TABLE_CLASS: '.responsive tbody',
    TABLE_CLASS_ROWS: '.responsive tbody tr',
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

const FETCH_OPTIONS = {
    DIVIDENDS_INSTITUTION: {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/ConsultarProventos.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      },
    DIVIDENDS_ACCOUNT:  {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/ConsultarProventos.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }
};

const FETCH_FORMS = {
    DIVIDENDS_INSTITUTION: [
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
    DIVIDENDS_ACCOUNT: [
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

class DividendsCrawler {

    /**
     * Gets dividends data available on CEI page.
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {Date} [date] - The date of the history. If none passed, the default of CEI will be used
     * @returns {Promise<typedefs.DividendData>} - List of available Dividends information
     */
    static async getDividends(cookieManager, options = null, date = null) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        const traceOperations = (options && options.trace) || false;

        const result = [];

        // Set date
        if (date !== null) {
            const minDateStr = domPage(PAGE.DATE_MIN_VALUE).text().trim();
            const minDate = CeiUtils.getDateFromInput(minDateStr);

            const maxDateStr = domPage(PAGE.DATE_MAX_VALUE).text().trim();
            const maxDate = CeiUtils.getDateFromInput(maxDateStr);
            
            // Prevent date out of bound if parameter is set
            if (options.capDates && date < minDate)
                date = minDate;

            if (options.capDates && date > maxDate)
                date = maxDate;

            domPage(PAGE.DATE_INPUT).attr('value', CeiUtils.getDateForInput(date));
        }

        // Get all institutions to iterate
        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            })).get()
            .filter(institution => institution.value > 0);

        // Iterate over institutions, accounts, processing the stocks
        for (const institution of institutions) {

            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Selecting institution ${institution.label} (${institution.value})`)

            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);

            const formDataInstitution = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.DIVIDENDS_INSTITUTION, {
                ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$ddlAgentes',
                __EVENTTARGET: 'ctl00$ContentPlaceHolder1$ddlAgentes'
            });

            const req = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.DIVIDENDS_INSTITUTION,
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

                const { futureEvents, pastEvents } = await this._getDataPage(domPage, cookieManager, traceOperations);

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    futureEvents: futureEvents,
                    pastEvents: pastEvents
                });
            }
        }

        return result;
    }

    /**
     * Returns the available options to get Dividends data
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.DividendsOptions>} - Options to get data from dividends
     */
    static async getDividendsOptions(cookieManager, options = null) {
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

        for (const institution of institutions) {
            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);
            const formDataStr = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.DIVIDENDS_INSTITUTION);

            const getAcountsPage = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.DIVIDENDS_INSTITUTION,
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
            const formDataHistory = CeiUtils.extractFormDataFromDOM(dom, FETCH_FORMS.DIVIDENDS_ACCOUNT, {
                ctl00$ContentPlaceHolder1$ToolkitScriptManager1: 'ctl00$ContentPlaceHolder1$updFiltro|ctl00$ContentPlaceHolder1$btnConsultar',
                __EVENTARGUMENT: '',
                __LASTFOCUS: ''
            });
            
            const dividendsRequest = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.DIVIDENDS_ACCOUNT,
                body: formDataHistory
            });

            const dividendsText = normalizeWhitespace(await dividendsRequest.text());
            const errorMessage = CeiUtils.extractMessagePostResponse(dividendsText);

            if (errorMessage && errorMessage.type === 2) {
                throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, errorMessage.message);
            }

            const dividendsDOM = cheerio.load(dividendsText);

            // Process the page
            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Processing dividends data`);

            const futureEvents = this._processEvents(dividendsDOM, PAGE.FUTURE_EVENTS_TITLE);
            const pastEvents = this._processEvents(dividendsDOM, PAGE.PAST_EVENTS_TITLE);

            if (errorMessage.type !== undefined || futureEvents.length > 0 || pastEvents.length > 0) {
                return {
                    futureEvents,
                    pastEvents
                };
            }
            
            const updtForm = CeiUtils.extractUpdateForm(dividendsText);
            CeiUtils.updateFieldsDOM(dom, updtForm);
        }
    }

    /**
     * Process the events given the parameters
     * @param {cheerio.Root} dom DOM table stock history
     * @param {String} tableTitle The title of the table to process the events
     */
    static _processEvents(dom, tableTitle) {
        const headers = Object.keys(DIVIDENDS_TABLE_HEADERS);

        const data = dom(PAGE.TABLE_TITLE_SELECTOR)
            .filter((_, el) => dom(el).text().includes(tableTitle))
            .first()
            .map((_, el) => dom(el).parent())
            .map((_, el) => dom(PAGE.TABLE_CLASS_ROWS, el).get())
            .map((_, tr) => dom('td', tr)
                .map((_, td) => dom(td).text().trim())
                .get()
                .reduce((dict, txt, idx) => {
                    dict[headers[idx]] = txt;
                    return dict;
                }, {})
            )
            .get();

        return CeiUtils.parseTableTypes(data, DIVIDENDS_TABLE_HEADERS);
    }
}

module.exports = DividendsCrawler;