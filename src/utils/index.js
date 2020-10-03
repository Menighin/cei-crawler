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
function extractFormDataFromDOM(dom) {
    const fields = dom('input, select').map((_, el) => ({
        name: el.attribs.name,
        value: el.attribs.value || ''
    }))
    .get()
    .reduce((form, item) => {
        form[item.name] = item.value;
        return form;
    }, {});

    // console.log(fields);

    return new URLSearchParams(fields).toString();
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
        .split('||')
        .filter(it => it.includes('|hiddenField|'))
        .map(it => it.split('|hiddenField|')[1].split('|'))
        .map(it => ({
            id: it[0],
            value: it[1] || ''
        }));
}

module.exports = {
    sleep,
    retry,
    extractFormDataFromDOM,
    extractUpdateForm
}