const typedefs = require("./typedefs");
const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    DATA: 'https://investidor.b3.com.br/api/investidor/v1/posicao/total-acumulado',
};

class ConsolidatedValueCrawler {

    /**
     * Get consolidated data
     * @param {typedefs.CeiCrawlerOptions} [options] - Options for the crawler
     * @returns {Promise<typedefs.ConsolidatedValues>} - The consolidated values
     */
    static async getConsolidatedValues(options = {}) {

        if (options.debug)
            console.log(`[ConsolidatedValueCrawler] Crawling the consolidated values`);

        const response = await AxiosWrapper.request(URLS.DATA);
        
        return response;
    }

}

module.exports = ConsolidatedValueCrawler;