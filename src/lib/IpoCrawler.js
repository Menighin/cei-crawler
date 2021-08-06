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
     * Crawls the detail of a line at the tab "Ofertas Públicas"
     * @param {String} id - The UUID of the IPO event
     * @param {typedefs.CeiCrawlerOptions} options - Options for the crawler
     * @returns {Promise<typedefs.IPODetail>} - The dailed information of the IPO
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