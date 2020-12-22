const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const FetchCookieManager = require('./FetchCookieManager');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const cheerio = require('cheerio');
const normalizeWhitespace = require('normalize-html-whitespace');

const PAGE = {
    URL: 'https://ceiapp.b3.com.br/CEI_Responsivo/extrato-tesouro-direto.aspx',
    SELECT_INSTITUTION: '#ctl00_ContentPlaceHolder1_ddlAgentes',
    SELECT_INSTITUTION_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlAgentes option',
    SELECT_ACCOUNT: '#ctl00_ContentPlaceHolder1_ddlContas',
    SELECT_ACCOUNT_OPTIONS: '#ctl00_ContentPlaceHolder1_ddlContas option',
    DATE_INPUT: '#ctl00_ContentPlaceHolder1_txtDatePickerFiltro',
    ALERT_BOX: '.alert-box',
    SUBMIT_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    AGENT_TITLE: '#ctl00_ContentPlaceHolder1_lblTituloAgente',
    TREASURE_TABLE: 'table',
    TREASURE_TABLE_BODY: 'table tbody',
    TREASURE_TABLE_BODY_ROWS: 'table tbody tr',
    TREASURE_DETAIL_TABLE: '.reveal-modal table',
    TREASURE_DETAIL_TABLE_BODY: '.reveal-modal table tbody',
    TREASURE_DETAIL_TABLE_BODY_ROWS: '.reveal-modal table tbody tr',
    RESULT_FOOTER_TREASURE: 'table tfoot',
    RESULT_FOOTER_TREASURE_DETAIL: '.reveal-modal table tfoot',
    PAGE_ALERT_ERROR: '.alert-box.alert',
    PAGE_ALERT_SUCCESS: '.alert-box.success'
};

const TREASURE_TABLE_HEADER = {
    code: 'string',
    expirationDate: 'date',
    investedValue: 'float',
    grossValue: 'float',
    netValue: 'float',
    quantity: 'float',
    blocked: 'float'
};

const TREASURE_DETAIL_TABLE_HEADER = {
    tradeDate: 'date',
    quantity: 'float',
    price: 'float',
    notional: 'float',
    profitability: 'string',
    grossProfitability: 'string',
    grossProfitabilityPercent: 'float',
    grossValue: 'float',
    investmentTerm: 'float',
    taxBracket: 'float',
    taxIrValue: 'float',
    taxIofValue: 'float',
    feeB3Value: 'float',
    feeInstitutionValue: 'float',
    netValue: 'float',
};

const FETCH_OPTIONS = {
    TREASURE_INSTITUTION: {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/extrato-tesouro-direto.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    },
    TREASURE_ACCOUNT:  {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/extrato-tesouro-direto.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    },
    TREASURE_DETAIL:  {
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
        "referrer": "https://ceiapp.b3.com.br/CEI_Responsivo/extrato-tesouro-direto.aspx",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    }
};

const FETCH_FORMS = {
    TREASURE_INSTITUTION: [
        'ctl00$ContentPlaceHolder1$smAlgumaCoisa',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$txtDatePickerFiltro',
        '__ASYNCPOST'
    ],
    TREASURE_ACCOUNT: [
        'ctl00$ContentPlaceHolder1$smAlgumaCoisa',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$ddlContas',
        'ctl00$ContentPlaceHolder1$txtDatePickerFiltro',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        '__ASYNCPOST',
        'ctl00$ContentPlaceHolder1$btnConsultar'
    ],
    TREASURE_DETAIL: [
        'ctl00$ContentPlaceHolder1$smAlgumaCoisa',
        'ctl00$ContentPlaceHolder1$ddlAgentes',
        'ctl00$ContentPlaceHolder1$ddlContas',
        'ctl00$ContentPlaceHolder1$txtDatePickerFiltro',
        '__EVENTTARGET',
        '__EVENTARGUMENT',
        '__LASTFOCUS',
        '__VIEWSTATE',
        '__VIEWSTATEGENERATOR',
        '__EVENTVALIDATION',
        '__ASYNCPOST'
    ]
};

class TreasureCrawler {

    /**
     * Get the treasure data from CEI
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @param {Date} [date] - The date of the treasure. If none passed, the default of CEI will be used
     * @returns {Promise<typedefs.TreasureItem[]>} - List of treasures
     */
    static async getTreasure(cookieManager, options = null, date = null) {
        const traceOperations = (options && options.trace) || false;

        const result = [];

        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        // Set date
        if (date !== null) {
            /* istanbul ignore next */
            const maxDate = new Date();
            maxDate.setDate(maxDate.getDate() - 1);

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

            const formDataInstitution = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.TREASURE_INSTITUTION, {
                ctl00$ContentPlaceHolder1$smAlgumaCoisa: 'ctl00$ContentPlaceHolder1$pnlPanel|ctl00$ContentPlaceHolder1$ddlAgentes',
                __EVENTTARGET: 'ctl00$ContentPlaceHolder1$ddlAgentes'
            });

            const req = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.TREASURE_INSTITUTION,
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

                const treasures = await this._getDataPage(domPage, cookieManager, traceOperations);

                const updtForm = CeiUtils.extractUpdateForm(reqInstitutionText);
                CeiUtils.updateFieldsDOM(domPage, updtForm);

                // Save the result
                result.push({
                    institution: institution.label,
                    account: account,
                    treasures,
                });
            }
        }

        return result;
    }

    /**
     * Returns the available options to get Treasure data
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.TreasureOptions}> - Options to get data from treasure
     */
    static async getTreasureOptions(cookieManager, options = null) {
        const getPage = await cookieManager.fetch(PAGE.URL);
        const domPage = cheerio.load(await getPage.text());

        const institutions = domPage(PAGE.SELECT_INSTITUTION_OPTIONS)
            .map((_, option) => ({
                value: option.attribs.value,
                label: domPage(option).text()
            }))
            .get()
            .filter(institution => institution.value > 0);

        for (const institution of institutions) {
            domPage(PAGE.SELECT_INSTITUTION).attr('value', institution.value);
            const formDataStr = CeiUtils.extractFormDataFromDOM(domPage, FETCH_FORMS.TREASURE_INSTITUTION);

            const getAcountsPage = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.TREASURE_INSTITUTION,
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
            const formDataWallet = CeiUtils.extractFormDataFromDOM(dom, FETCH_FORMS.TREASURE_ACCOUNT, {
                ctl00$ContentPlaceHolder1$smAlgumaCoisa: 'ctl00$ContentPlaceHolder1$pnlPanel|ctl00$ContentPlaceHolder1$btnConsultar',
                __EVENTARGUMENT: ''
            });

            const treasureRequest = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.TREASURE_ACCOUNT,
                body: formDataWallet
            });

            const treasureText = normalizeWhitespace(await treasureRequest.text());
            const errorMessage = CeiUtils.extractMessagePostResponse(treasureText);

            if (errorMessage && errorMessage.type === 2) {
                throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, errorMessage.message);
            }

            const treasureDOM = cheerio.load(treasureText);

            const updtForm = CeiUtils.extractUpdateForm(treasureText);
            CeiUtils.updateFieldsDOM(dom, updtForm);

            // Process the page
            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Processing treasure data`);

            if (errorMessage.type !== undefined || this._hasLoadedData(treasureDOM, PAGE.RESULT_FOOTER_TREASURE)) {
                const treasures = this._processTableData(treasureDOM, TREASURE_TABLE_HEADER, PAGE.TREASURE_TABLE_BODY_ROWS);
                return await this._getDataPageDetail(dom, cookieManager, traceOperations, treasures);
            }

            if(this._hasEmptyData(treasureDOM)) {
                return [];
            }
        }
    }

    /**
     * Returns the data from the modal page after trying more than once
     * @param {cheerio.Root} dom DOM of page
     * @param {FetchCookieManager} cookieManager - FetchCookieManager to work with
     * @param {Boolean} traceOperations - Whether to trace operations or not
     * @param {TreasureTransactionItem[]} treasures - List of treasures
     */
    static async _getDataPageDetail(dom, cookieManager, traceOperations, treasures) {
        for(const row in treasures) {
            const treasure = treasures[row];
            const key = String(+row + 1).padStart(2, '0');

            /* istanbul ignore next */
            if (traceOperations)
                console.log(`Process treasure detail data for ${treasure.code}`);

            dom('#__EVENTTARGET')
                .attr('value', `ctl00$ContentPlaceHolder1$repTabela$ctl${key}$LinkButton2`);

            dom('#__EVENTARGUMENT')
                .attr('value', '');

            dom('#__LASTFOCUS')
                .attr('value', '');

            const formDataTreasureDetail = CeiUtils.extractFormDataFromDOM(dom, FETCH_FORMS.TREASURE_DETAIL, {
                ctl00$ContentPlaceHolder1$smAlgumaCoisa: `ctl00$ContentPlaceHolder1$pnlPanel|ctl00$ContentPlaceHolder1$repTabela$ctl${key}$LinkButton2`,
            });

            const treasureDetailRequest = await cookieManager.fetch(PAGE.URL, {
                ...FETCH_OPTIONS.TREASURE_DETAIL,
                body: formDataTreasureDetail
            });

            const treasureDetailText = await treasureDetailRequest.text();
            const errorMessage = CeiUtils.extractMessagePostResponse(treasureDetailText);

            if (errorMessage && errorMessage.type === 2) {
                throw new CeiCrawlerError(CeiErrorTypes.SUBMIT_ERROR, errorMessage.message);
            }

            const treasureDetailDOM = cheerio.load(treasureDetailText);

            treasures[row].transactions = [];
            if (errorMessage.type !== undefined || this._hasLoadedData(treasureDetailDOM, PAGE.RESULT_FOOTER_TREASURE_DETAIL)) {
                treasures[row].transactions = this._processTableData(treasureDetailDOM, TREASURE_DETAIL_TABLE_HEADER, PAGE.TREASURE_DETAIL_TABLE_BODY_ROWS);
            }
        }

        return treasures;
    }

    /**
     * Process the treasure table to a DTO
     * @param {cheerio.Root} dom DOM table stock history
     * @param {Array} header List of fields in table header
     * @param {String} rows Name of element for table rows
     */
    static _processTableData(dom, header, rows) {
        const headers = Object.keys(header);

        const data = dom(rows)
            .map((_, tr) => dom('td', tr)
                .map((_, td) => dom(td).text().trim())
                .get()
                .reduce((dict, txt, idx) => {
                    dict[headers[idx]] = txt;
                    return dict;
                }, {})
            ).get();

        return CeiUtils.parseTableTypes(data, header);
    }

    /**
     * Check wheter the table was rendered on the screen to stop trying to get data
     * @param {cheerio.Root} dom DOM table treasure
     * @param {String} field Name of element for check if the result is rendered
     */
    static _hasLoadedData(dom, field) {
       const query = dom(field);
       return query.length > 0;
    }

    /**
     * Check if the result is empty
     * @param {cheerio.Root} dom DOM table treasure
     */
    static _hasEmptyData(dom) {
       const query = dom(PAGE.AGENT_TITLE).text().trim();
       return query === '';
    }

}

module.exports = TreasureCrawler;
