const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    GET_DATA: 'https://investidor.b3.com.br/api/extrato/v1/posicao/:page'
};

class PositionCrawler {

    /**
     * Get data from the position screen
     * @param {Date} date - The date of the wallet. If none passed, the default of CEI will be used
     * @param {Number} page - The page of the data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.AccountWallet[]>} - List of Stock histories
     */
    static async getPosition(date, page, options = {}) {
        const dateStr = CeiUtils.getDateForQueryParam(date || options.lastExecutionInfo.generalDate);

        if (options.debug)
            console.log(`[PositionCrawler] Crawling wallet position on date ${dateStr}`);

        const response = await AxiosWrapper.request(URLS.GET_DATA, {
            queryParams: {
                data: dateStr
            },
            pathParams: {
                page: page
            }
        });
        
        return response;
    }
}

module.exports = PositionCrawler;