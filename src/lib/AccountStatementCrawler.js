const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    LIST_DATA: 'https://investidor.b3.com.br/api/extrato/v1/movimentacao/:page',
};

class AccountStatementCrawler {

    /**
     * Get data from the position screen
     * @param {Date} startDate - The start date of the range
     * @param {Date} endDate - The end date of the range
     * @param {Number} page - The page of the data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.AccountWallet[]>} - List of Stock histories
     */
    static async getAccountStatement(startDate, endDate, page, options = {}) {
        const startDateStr = CeiUtils.getDateForQueryParam(startDate || new Date(options.lastExecutionInfo.generalDate.getTime() - 1000 * 60 * 60 * 24));
        const endDateStr = CeiUtils.getDateForQueryParam(endDate || options.lastExecutionInfo.generalDate);

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