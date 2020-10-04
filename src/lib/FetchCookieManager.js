const nodeFetch = require('node-fetch');
const tough = require('tough-cookie');
const CeiUtils = require('./CeiUtils');

class FetchCookieManager {

    /** @type {tough.CookieJar} */
    _jar = false;

    constructor(defaultHeaders = {}) {
        this._jar = new tough.CookieJar();
        this._defaultHeaders = defaultHeaders;
    }

    /**
     * 
     * @param {String} url - URL
     * @param {Object} opts - fetch options
     * @returns {Promise<Response>} - Response
     */
    async fetch(url, opts = {}) {
        const cookie = await this._jar.getCookieString(url);

        const newOpts = {
            ...opts,
            headers: {
                ...this._defaultHeaders,
                ...(opts.headers || {}),
                cookie
            }
        }

        const response = await CeiUtils.retry(
            async () => await nodeFetch(url, newOpts),
            e => e.type === 'system' && e.errno === 'ECONNRESET' && e.code === 'ECONNRESET'
        );
            
        const newCookies = response.headers.raw()['set-cookie'] || [];

        await Promise.all(
            newCookies.map(newCookie => this._jar.setCookie(newCookie, response.url, { ignoreError: true }))
        );
    
        return response
    }
};

module.exports = FetchCookieManager;