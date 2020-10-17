class CeiUtils {
    /**
     * Returns a date in the format dd/MM/yyyy for input at CEI
     * @param {Date} date - Date to be parsed
     */
    static getDateForInput(date) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}/${date.getFullYear()}`;
    }

    /**
     * Return a date object given a date string
     * @param {String} dateStr Date string in dd/MM/yyyy format
     */
    static getDateFromInput(dateStr) {
        const [day, month, year] = dateStr.split("/").map((o) => parseInt(o));
        return new Date(year, month - 1, day);
    }

    /**
     * Parse the table data to its type configuration
     * @param {Array} tableData - The data of the table, an array of objects
     * @param {Object} tableDefinition - Object defining the table types in format (column, type)
     */
    static parseTableTypes(tableData, tableDefinition) {
        // Helper function
        const parseValue = (value, type) => {
            if (type === "string") return value;
            if (type === "int") return parseInt(value.replace(".", ""));
            if (type === "float")
                return parseFloat(value.replace(".", "").replace(",", "."));
            if (type === "date")
                return value === "01/01/0001"
                    ? null
                    : new Date(value.split("/").reverse());
        };

        return tableData.map((row) =>
            Object.keys(tableDefinition).reduce((p, c) => {
                p[c] = parseValue(row[c], tableDefinition[c]);
                return p;
            }, {})
        );
    }

    /**
     * @param {Number} timestamp - Time to sleep in miliseconds
     * @returns {Promise} - Promise
     */
    static async sleep(timestamp) {
        return new Promise((resolve) => setTimeout(resolve, timestamp));
    }

    /**
     * This callback is displayed as part of the Requester class.
     * @callback CheckRetryCallback
     * @param {Error} e - Exception error
     * @returns {Boolean} True if need retry or False if not
     */

    /**
     * @param {Promise|Function} callback - Time to sleep in miliseconds
     * @param {CheckRetryCallback} [checkRetryCallback] - Filter when need attempt again on error
     * @param {Number} [attempts] - Number of attempts before throw exception
     * @returns {Promise<any>} - Result of callback
     */
    static async retry(callback, checkRetryCallback = () => true, attempts = 3) {
        let result = null;

        while (true) {
            try {
                result = await callback();
                break;
            } catch (e) {
                if (checkRetryCallback(e)) {
                    attempts--;
                    if (attempts === 0) throw e;
                    await CeiUtils.sleep(100);
                } else {
                    throw e;
                }
            }
        }

        return result;
    }

    /**
     * Returns FormData in string format from DOM
     * @param {cheerio.Root} dom - DOM of the page
     * @param {string[]} filterFields - List of fields to be selected
     * @param {Object} [extraFormValues] - Extra fields or overlapping values
     * @returns {string} - FormData in string format
     */
    static extractFormDataFromDOM(
        dom,
        filterFields,
        extraFormValues = {},
        debugg = false
    ) {
        const allFields = dom("input, select")
            .map((_, el) => ({
                name: el.attribs.name,
                value: el.attribs.value || "",
            }))
            .get()
            .reduce(
                (form, item) => {
                    form[item.name] = item.value;
                    return form;
                },
                { __ASYNCPOST: true, ...extraFormValues }
            );

        const form = filterFields.reduce((dict, field) => {
            if (field in allFields) {
                dict[field] = allFields[field];
            }
            return dict;
        }, {});

        if (debugg) console.log(form);

        return new URLSearchParams(form).toString();
    }

    /**
     * Update value fields of the DOM
     * @param {cheerio.Root} dom - DOM of the page
     * @param {object[]} fieldsValue - List of fields to be changed
     */
    static updateFieldsDOM(dom, fields) {
        fields.forEach((field) => {
            const i = dom(`#${field.id}`);
            if (i && field.value !== "0") {
                i.attr("value", field.value);
            }
        });
    }

    /**
     * Returns FormData in string format from DOM
     * @param {string} responseTxt - Response in text format
     * @returns {Array<Object>} - List of fields and their respective values
     */
    static extractUpdateForm(responseTxt) {
        return responseTxt
            .split("\n")
            .slice(-1)[0]
            .trim()
            .replace(/\|\|/g, "|")
            .split("|")
            .map((str, idx, array) => {
                if (str.includes("hiddenField")) {
                    return {
                        id: array[idx + 1],
                        value: array[idx + 2],
                    };
                }

                return null;
            })
            .filter((it) => it);
    }

    /**
     * Returns message post response
     * @param {String} responseTxt - Response in text format
     * @returns {Object} - Status: {type, message} - Type: 0: Info; 1: Warning; 2: Error
     */
    static extractMessagePostResponse(responseTxt) {
        try {
            const parameters = responseTxt
                .split("\n")
                .slice(-1)[0]
                .split("CEIWeb.IncluirMensagem")[1]
                .split(";")[0]
                .trim();
            const arrayStr = `[${parameters.slice(1).slice(0, -1)}]`
                .replace(/"/g, '\\"')
                .replace(/'/g, '"');
            const args = JSON.parse(arrayStr);
            return {
                type: args[0],
                message: args[1],
            };
        } catch {
            return {};
        }
    }
}

module.exports = CeiUtils;
