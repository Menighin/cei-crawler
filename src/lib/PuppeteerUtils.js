const puppeteer = require('puppeteer');

class PuppeteerUtils {
    
    /**
     * Returns a promise resolved first with the selector found
     * @param {puppeteer.Page} page - Page to search for the selectors
     * @param {String[]} selectors - Selectors to be searched
     * @returns {Promise}
     */
    static waitForAnySelector(page, selectors) {

        const promises = selectors.map(s => new Promise(async resolve => {
            try {
                await page.waitForSelector(s);
            } catch(e) {
                // Silence for selectors not found
            }
            resolve(s);
        }));

        return Promise.race(promises);
    }

    /**
     * Race the promises passed. Returns a promise that resolves with the ID of the first one resolved
     * @param {{id: String, pr: Promise}[]} promises - List of promises with Ids
     * @returns {Promise} - Returns a promise that will be resolved with the ID of the one resolved first
     */
    static waitForAny(promises) {
        const newPromises = promises.map(p => new Promise(async resolve => {
            try {
                await p.pr;
            } catch(e) {
                // Silence for late resolves
            }
            resolve(p.id);
        }));

        return Promise.race(newPromises);
    }
}

module.exports = PuppeteerUtils;