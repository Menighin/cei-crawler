const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    LIST_DATA: 'https://investidor.b3.com.br/api/extrato/v1/ofertas-publicas/:page',
    DETAIL: 'https://investidor.b3.com.br/api/extrato/v1/ofertas-publicas/detalhes/:id',
};

class IpoCrawler {

    /**
     * Get data from the position screen
     * @param {Date} date - The date of the wallet. If none passed, the default of CEI will be used
     * @param {Number} page - The page of the data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Any} - List of Stock histories
     */
    static async getIPOs(date, page, options = {}) {
        const dateStr = CeiUtils.getDateForQueryParam(date || options.lastExecutionInfo.generalDate);

        if (options.debug)
            console.log(`[IpoCrawler] Crawling on date ${dateStr}`);

        const response = await AxiosWrapper.request(URLS.LIST_DATA, {
            queryParams: {
                data: dateStr
            },
            pathParams: {
                page: page
            }
        });
        
        return response;
    }

    /**
     * Returns the detail of the given position
     * @param {String} id - The UUID of the position given by CEI
     * @param {String} category - The category of the position
     * @param {String} type - The type of the position
     * @param {typedefs.CeiCrawlerOptions} options - Options for the crawler
     * @returns {Any}
     */
    static async getIPODetail(id, options = {}) {
        if (options.debug)
            console.log(`[IpoCrawler] Crawling detail for ${id}`);

        return await AxiosWrapper.request(URLS.DETAIL, {
            pathParams: {
                id: id
            }
        });
    }
}

module.exports = IpoCrawler;