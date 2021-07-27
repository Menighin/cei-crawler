const axios = require('axios').default;
const https = require('https');

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
            return config;
        });
    }

    static async request(url, queryParams = {}, pathParams = {}) {
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
            return response;
        } catch(e) {
            console.log('ERROR ON AXIOS: ' + e.message);
            throw e;
        }
    }
}

module.exports = AxiosWrapper;