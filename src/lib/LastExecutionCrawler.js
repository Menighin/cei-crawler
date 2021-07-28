const AxiosWrapper = require('./AxiosWrapper');

const URLS = {
    LAST_EXECUTION: 'https://investidor.b3.com.br/api/v1/sistema/carga/ultima-execucao'
};


class LastExecutionCrawler {

    static async getLastExecutionInfo() {
        const data = (await AxiosWrapper.request(URLS.LAST_EXECUTION)).data;
        return {
            generalDate: new Date(data.dataGeral),
            stockDate: new Date(data.dataRendaVariavel),
            treasuryDirectDate: new Date(data.dataTesouroDireto)
        }
    }

}

module.exports = LastExecutionCrawler;