const puppeteer = require('puppeteer');

class PuppeteerUtils {
    
    /**
     * Returns a promise resolved first with the selector found
     * @param {puppeteer.Page} page - Page to search for the selectors
     * @param {String[]} selectors - Selectors to be searched
     * @returns {Promise}
     */
    static waitForAnySelector(page, selectors) {

        const promisses = selectors.map(s => new Promise(async resolve => {
            await page.waitForSelector(s);
            resolve(s);
        }))

        return Promise.race(promisses);
    }
}

module.exports = PuppeteerUtils;