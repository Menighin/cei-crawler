const nodeFetch = require('node-fetch');
const tough = require('tough-cookie')
const { retry } = require('./index');

class FetchCookieManager {


    /** @type {tough.CookieJar} */
    _jar = false;

    constructor() {
        this._jar = new tough.CookieJar();
    }

    /**
     * 
     * @param {String} url - URL
     * @param {Object} opts - fetch options
     * @returns {Promise<Response>} - Response
     */
    async fetch(url, opts = {}) {
        const cookie = await this._jar.getCookieString(url);

        const defaultHeaders = {
            "Origin": "https://cei.b3.com.br",
            "Host": "cei.b3.com.br",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
        };

        const newOpts = {
            ...opts,
            headers: {
                ...defaultHeaders,
                ...(opts.headers || {}),
                cookie
            }
        }

        const response = await retry(
            async () => await nodeFetch(url, newOpts),
            3,
            e => e.type === 'system' && e.errno === 'ECONNRESET' && e.code === 'ECONNRESET'
        );
            
        const newCookies = response.headers.raw()['set-cookie'] || [];

        console.log(newCookies, "\n");

        await Promise.all(
            newCookies.map(newCookie => this._jar.setCookie(newCookie, response.url, { ignoreError: true }))
        );
    
        return response
    }
};

module.exports = FetchCookieManager;