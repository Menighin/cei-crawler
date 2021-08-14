const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    LIST_DATA: 'https://investidor.b3.com.br/api/extrato/v1/eventos-provisionados/:page',
    DETAIL: 'https://investidor.b3.com.br/api/extrato/v1/eventos-provisionados/detalhes/:id',
};

class ProvisionedEventsCrawler {

    /**
     * Crawls the tab "Eventos provisionados"
     * @param {Date} [date] - The date for the provisioned events
     * @param {Number} [page=1] - The page of the data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.CeiListData<typedefs.ProvisionedEvent>} - List of provisioned events
     */
    static async getProvisionedEvents(date, page, options = {}) {
        const dateStr = CeiUtils.getDateForQueryParam(date || options.lastExecutionInfo.generalDate);

        if (options.debug)
            console.log(`[ProvisionedEventsCrawler] Crawling on date ${dateStr}`);

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
     * Crawls the detail of a line at the tab "Eventos provisionados"
     * @param {String} id - The UUID of the provisioned event
     * @param {typedefs.CeiCrawlerOptions} options - Options for the crawler
     * @returns {Provise<typedefs.ProvisionedEventDetail>} - The detailed information of the event
     */
    static async getProvisionedEventDetails(id, options = {}) {
        if (options.debug)
            console.log(`[ProvisionedEventsCrawler] Crawling detail for ${id}`);

        return await AxiosWrapper.request(URLS.DETAIL, {
            pathParams: {
                id: id
            }
        });
    }
}

module.exports = ProvisionedEventsCrawler;