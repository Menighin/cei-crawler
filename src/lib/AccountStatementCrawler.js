const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    LIST_DATA: 'https://investidor.b3.com.br/api/extrato/v1/movimentacao/:page',
};

class AccountStatementCrawler {

    /**
     * Crawls the tab "Movimentacao" at CEI
     * @param {Date} startDate - The start date of the range
     * @param {Date} endDate - The end date of the range
     * @param {Number} page - The page of the data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.CeiListData<typedefs.AccountStatement>} - The account statement
     */
    static async getAccountStatement(startDate, endDate, page, options = {}) {
        const lastExecution = options.lastExecutionInfo.generalDate;
        const startDateStr = CeiUtils.getDateForQueryParam(startDate || CeiUtils.subtractMonth(lastExecution));
        const endDateStr = CeiUtils.getDateForQueryParam(endDate || lastExecution);
        
        if (options.debug)
            console.log(`[AccountStatementCrawler] Crawling statement for period ${startDateStr} - ${endDateStr}`);

        const response = await AxiosWrapper.request(URLS.LIST_DATA, {
            queryParams: {
                dataInicio: startDateStr,
                dataFim: endDateStr,
            },
            pathParams: {
                page: page
            }
        });
        
        return response;
    }

}

module.exports = AccountStatementCrawler;