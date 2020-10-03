/**
 * @param {Number} timestamp - Time to sleep in miliseconds
 * @returns {Promise} - Promise
 */
async function sleep(timestamp) {
    return new Promise(resolve => setTimeout(resolve, timestamp));
}

/**
 * @param {Promise} callbal - Time to sleep in miliseconds
 * @param {Number} [attempts] - Number of attempts before throw exception
 * @param {Function} [checkRetryCallback] - Filter when attempt agaib
 * @returns {Promise<any>} - Result of callback
 */
async function retry(callback, attempts = 3, checkRetryCallback = () => true) {
    let result = null;

    while(true) {
        try {
            result = await callback();
            break;
        } catch (e) {
            if (checkRetryCallback(e)) {
                console.log('uai');
                attempts--;
                if (attempts === 0)
                    throw e;
                await sleep(100);
            } else {
                throw e;
            }
        }
    }

    return result;
}

/**
 * Returns FormData in string format from DOM
 * @param {cheerio.Root} dom - The start date of the history
 * @returns {String} - FormData in string format
 */
function extractFormDataFromDOM(dom, fields, extraFields = {}) {
    const allFields = dom('input, select').map((_, el) => ({
        name: el.attribs.name,
        value: el.attribs.value || ''
    }))
    .get()
    .reduce((form, item) => {
        form[item.name] = item.value;
        return form;
    }, { __ASYNCPOST: true });

    const form = fields.reduce((dict, field) => {
        if (field in allFields) {
            dict[field] = allFields[field];
        }
        return dict;
    }, {});

    return new URLSearchParams({
        ...form,
        ...extraFields
    }).toString();
}

function updateFieldsDOM(dom, fields) {
    fields.forEach(field => {
        const i = dom(`#${field.id}`);
        if (i && field.value !== '0') {
            i.attr('value', field.value);
        }
    });
}

/**
 * Returns FormData in string format from DOM
 * @param {string} responseTxt - The start date of the history
 * @returns {Array<Object>} - FormData in string format
 */
function extractUpdateForm(responseTxt) {
    return responseTxt.split('\n')
        .slice(-1)[0]
        .trim()
        .replace(/\|\|/g, "|")
        .split('|')
        .map((str, idx, array) => {
            if (str.includes('hiddenField')) {
                return {
                    id: array[idx+1],
                    value: array[idx+2]
                }
            }
            
            return null;
        })
        .filter(it => it);
}

/**
 * Returns message post response
 * @param {String} line - Last line of the response
 * @returns {Object} - Message
 */
function extractMessagePostResponse(line) {
    try {
        const parameters = line.split('CEIWeb.IncluirMensagem')[1].split(';')[0].trim();
        const arrayStr = `[${parameters.slice(1).slice(0, -1)}]`.replace(/'/g, '"');
        const args = JSON.parse(arrayStr)
        return {
            status: args[0],
            message: args[1]
        };
    } catch {
        return '';
    }
}

module.exports = {
    sleep,
    retry,
    extractFormDataFromDOM,
    extractUpdateForm,
    extractMessagePostResponse,
    updateFieldsDOM
}