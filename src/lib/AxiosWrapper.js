const axios = require('axios').default;
const https = require('https');
const { CeiCrawlerError, CeiErrorTypes } = require('./CeiCrawlerError');

class AxiosWrapper {

    static setup(options) {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        });

        axios.interceptors.request.use(config => {
            config.headers = {
                'Authorization': `Bearer ${options.auth.token}`
            };
            config.params['cache-guid'] = options.auth['cache-guid'];
            config.httpsAgent = httpsAgent;

            if (options.debug)
                console.log(`[AxiosWrapper] ${config.method.toUpperCase()} ${config.url} ${JSON.stringify(config.params)}`);

            return config;
        });
    }

    static async request(url, opts = {}) {
        const pathParams = opts.pathParams || {};
        const queryParams = opts.queryParams || {};
        try {
            const urlWithParams = Object.keys(pathParams)
                .reduce((p, v) => {
                    return p.replace(`:${v}`, pathParams[v]);
                }, url);

            const response = await axios.get(urlWithParams, {
                params: {
                    ...queryParams
                }
            });
            return response.data;
        } catch (e) {
            const msgStr = e.response.data != null ? (e.response.data.message || e.response.data.trim()) : e.message;
            const msg = msgStr === '' ? e.message : msgStr;

            if (e.response.status === 401)
                throw new CeiCrawlerError(CeiErrorTypes.UNAUTHORIZED, msg, e.response.status);
            
            throw new CeiCrawlerError(CeiErrorTypes.BAD_REQUEST, msg, e.response.status);
        }
    }
}

module.exports = AxiosWrapper;