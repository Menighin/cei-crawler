const typedefs = require("./typedefs");
const CeiUtils = require('./CeiUtils');

const PAGE = {
    URL: 'https://cei.b3.com.br/CEI_Responsivo/ConsultarProventos.aspx',
    SEARCH_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    SEARCH_WAITFOR: "#ctl00_ContentPlaceHolder1_lblAtualizadoEm",
    TABLE_CLASS_NAME: 'responsive',
}

const DIVIDENDS_TABLE_HEADERS = {
    stock: 'string',
    stockType: 'string',
    code: 'string',
    date: 'date',
    type: 'string',
    quantity: 'int',
    factor: 'int',
    grossValue: 'float',
    netValue: 'float'
};

class DividendsCrawler {

    /**
     * Gets dividends data available on CEI page.
     * @param {puppeteer.Page} page - Logged page to work with
     * @returns {typedefs.DividendData} - List of available Dividends information
     */
    static async getDividends(page) {
        await page.goto(PAGE.URL);
        await page.click(PAGE.SEARCH_BUTTON);
        await page.waitFor(PAGE.SEARCH_WAITFOR);

         /* istanbul ignore next */
        const dataPromise = await page.evaluateHandle((selector, headers) => {
            let rows = [];
            const dividendsTables = Array.from(document.getElementsByClassName(selector));
            
            // If there are multiple institutions, there will be a table for each one. 
            for (const table of dividendsTables) {
                const data = Array.from(table.rows).slice(1, table.rows.length -1)
                    .map(row => Array.from(row.cells).reduce((p, c, i) => {
                        p[headers[i]] = c.innerText;
                        return p;
                    }));

                rows = rows.concat(data);
            }

            return rows;
        }, PAGE.TABLE_CLASS_NAME, Object.keys(DIVIDENDS_TABLE_HEADERS));

        const data = await dataPromise.jsonValue();
        return CeiUtils.parseTableTypes(data, DIVIDENDS_TABLE_HEADERS);
    }
}

module.exports = DividendsCrawler;