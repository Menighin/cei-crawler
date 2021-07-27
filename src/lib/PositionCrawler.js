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
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @param {Date} [date] - The date of the wallet. If none passed, the default of CEI will be used
     * @returns {Promise<typedefs.AccountWallet[]>} - List of Stock histories
     */
    static async getPosition(options = null, date = new Date()) {
        const traceOperations = (options && options.trace) || false;

        const dateStr = CeiUtils.getDateForQueryParam(date);
        try {
            const response = await AxiosWrapper.request(URLS.GET_DATA, {
                data: dateStr
            }, {
                page: 1
            });
            
            console.log(JSON.stringify(response.data));
        } catch(e) {
            console.log('ERROR ON AXIOS: ' + e.message);
            throw e;
        }
    }
}

module.exports = PositionCrawler;