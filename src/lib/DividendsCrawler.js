const typedefs = require("./typedefs");

const PAGE = {
    URL: 'https://cei.b3.com.br/CEI_Responsivo/ConsultarProventos.aspx',
    SEARCH_BUTTON: '#ctl00_ContentPlaceHolder1_btnConsultar',
    SEARCH_WAITFOR: "#ctl00_ContentPlaceHolder1_lblAtualizadoEm",
    TABLE_CLASS_NAME: 'responsive',
}

const DIVIDENDS_TABLE_HEADERS = [
    {prop: 'stock', type: 'string'},
    {prop: 'stockType', type: 'string'},
    {prop: 'code', type: 'string'},
    {prop: 'date', type: 'date'},
    {prop: 'type', type: 'string'},
    {prop: 'quantity', type: 'int'},
    {prop: 'factor', type: 'int'},
    {prop: 'grossValue', type: 'float'},
    {prop: 'netValue', type: 'float'}
];

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
        const dividendsData = await page.evaluate((selector, headers) => {
            let rows = [];
            const dividendsTables = Array.from(document.getElementsByClassName(selector));

            // Helper function
            const parseValue = (value, type) => {
                if (type === 'string') return value;
                if (type === 'int')    return parseInt(value.replace('.', ''));
                if (type === 'float')  return parseFloat(value.replace('.', '').replace(',', '.'));
                if (type === 'date')   return new Date(value.split('/').reverse()).getTime();
            }
            
            // If there are multiple institutions, there will be a table for each one. 
            for (const table of dividendsTables) {
                const data = Array.from(table.rows).slice(1, table.rows.length -1)
                                    .map(row => Array.from(row.cells).reduce((p, c, i) => {
                                        p[headers[i].prop] = parseValue(c.innerText, headers[i].type)
                                        return p;
                                    }));

                rows = rows.concat(data);
            }

            return rows;
        }, PAGE.TABLE_CLASS_NAME, DIVIDENDS_TABLE_HEADERS);

        return dividendsData.map(d => ({...d, date: new Date(d.date)}));
    }
}

module.exports = DividendsCrawler;