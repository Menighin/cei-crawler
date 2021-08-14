const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    LIST_DATA: 'https://investidor.b3.com.br/api/extrato/v1/posicao/:page',
    DETAIL_1: 'https://investidor.b3.com.br/api/extrato/v1/posicao/detalhes/:category/:type/:id',
    DETAIL_2: 'https://investidor.b3.com.br/api/extrato/v1/posicao/detalhes/:category/:id'
};

class PositionCrawler {

    /**
     * Get data from the position screen
     * @param {Date} date - The date of the wallet. If none passed, the default of CEI will be used
     * @param {Number} page - The page of the data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.CeiListData<typedefs.PositionCategory>} - Wallet positions
     */
    static async getPosition(date, page, options = {}) {
        const dateStr = CeiUtils.getDateForQueryParam(date || options.lastExecutionInfo.generalDate);

        if (options.debug)
            console.log(`[PositionCrawler] Crawling wallet position on date ${dateStr}`);

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
     * Crawls the detail of an item on tab "Posição"
     * @param {String} id - The UUID of the position given by CEI
     * @param {String} category - The category of the position
     * @param {String} type - The type of the position
     * @param {typedefs.CeiCrawlerOptions} options - Options for the crawler
     * @returns {Any} 
     */
    static async getPositionDetail(id, category, type, options = {}) {
        
        if (options.debug)
            console.log(`[PositionCrawler] Crawling wallet position detail for ${id} (${category}, ${type})`);

        const pathParams = {
            id: id,
            category: CeiUtils.kebabize(category),
            type: CeiUtils.kebabize(type)
        };

        // Try to get the detail with type
        try {
            return await AxiosWrapper.request(URLS.DETAIL_1, {
                pathParams: pathParams
            });
        } catch (e) {
            if (e.type === CeiErrorTypes.TOO_MANY_REQUESTS)
                throw e;
            if (options.debug)
                console.log(`[PositionCrawler] Failed getting detail for type and category ${type}, ${category}`);
        }

        return await AxiosWrapper.request(URLS.DETAIL_2, {
            pathParams: pathParams
        });
    }
}

module.exports = PositionCrawler;