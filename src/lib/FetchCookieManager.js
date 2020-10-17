const https = require('https');
const { readFileSync } = require('fs');
const nodeFetch = require('node-fetch');
const AbortController = require('abort-controller');
const tough = require('tough-cookie');
const CeiUtils = require('./CeiUtils');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');
const { time } = require('console');

const certs = [
    readFileSync(__dirname + '/certificate.crt')
];

const agent = new https.Agent({
    ca: certs,
    keepAlive: true,
    rejectUnauthorized: false
});


class FetchCookieManager {
    /** @type {tough.CookieJar} */
    _jar = false;
    _navigationTimeout = 30000;

    constructor(defaultHeaders = {}, navigationTimeout = 30000) {
        this._jar = new tough.CookieJar();
        this._navigationTimeout = navigationTimeout;
        this._defaultHeaders = defaultHeaders;
    }

    /**
     * 
     * @param {String} url - URL
     * @param {Object} opts - fetch options
     * @param {Number} fetchTimeout - fetch fetchTimeout
     * @returns {Promise<Response>} - Response
     */
    async fetch(url, opts = {}, fetchTimeout = null) {
        const cookie = await this._jar.getCookieString(url);

        const newOpts = {
            ...opts,
            headers: {
                ...this._defaultHeaders,
                ...(opts.headers || {}),
                cookie
            },
            agent
        }

        const response = await CeiUtils.retry(
            async () => {
                const controller = new AbortController();
                const timeout = setTimeout(() => {
                    controller.abort();
                }, fetchTimeout || this._navigationTimeout);

                let resp;
                try {
                    resp = await nodeFetch(url, {
                        ...newOpts,
                        signal: controller.signal
                    });
                } catch (error) {
                    clearTimeout(timeout);
                    if (error.name === 'AbortError')
                        throw new CeiCrawlerError(CeiErrorTypes.NAVIGATION_TIMEOUT, `Requisição estourou o tempo limite em: ${url}`);
                    throw error;
                } finally {
                    clearTimeout(timeout);
                }

                return resp;
            },
            e => e.type === 'system' && e.errno === 'ECONNRESET' && e.code === 'ECONNRESET'
        );

        const newCookies = response.headers.raw()['set-cookie'] || [];

        await Promise.all(
            newCookies.map(newCookie => this._jar.setCookie(newCookie, response.url, { ignoreError: true }))
        );

        if (response.status === 302) {
            throw new CeiCrawlerError(CeiErrorTypes.SESSION_HAS_EXPIRED, 'Sessão expirou, faça login novamente');
        }
    
        return response
    }
};

module.exports = FetchCookieManager;
