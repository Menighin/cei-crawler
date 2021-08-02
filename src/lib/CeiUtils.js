class CeiUtils {

    /**
     * Returns a date in the format yyyy-MM-dd for input at CEI
     * @param {Date} date - Date to be parsed
     */
    static getDateForQueryParam(date) {
        return date.toISOString().slice(0,10);
    }

    /**
     * @param {Number} ms - Time to sleep in miliseconds
     * @returns {Promise} - Promise
     */
    static async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * @param {Promise|Function} callback - Time to sleep in miliseconds
     * @param {Number} [attempts=5] - Number of attempts before throw exception
     * @param {Number} [delayBetween=100] - Delay in miliseconds before retrying
     * @param {Number} [failSilently=false] - If set to true and the callback still fails, only null will be returned and no error will be thrown
     * @param {CheckRetryCallback} [checkRetryCallback] - Filter when need attempt again on error
     * @returns {Promise<any>} - Result of callback
     */
    static async retry(callback, attempts = 5, delayBetween = 100, failSilently = false, checkRetryCallback = () => true) {
        let result = null;

        while (true) {
            try {
                result = await callback();
                break;
            } catch (e) {
                if (checkRetryCallback(e)) {
                    attempts--;
                    if (attempts === 0) throw e;
                    await CeiUtils.sleep(delayBetween);
                } else if (!failSilently) {
                    throw e;
                }
            }
        }

        return result;
    }

    /**
     * Convert the string to kebab-case
     * @param {String} str Text to be kebabize'd
     * @returns The @param str in kebab-case
     */
    static kebabize(str) {
        return str.split('').map((letter, idx) => {
            return letter.toUpperCase() === letter
            ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
            : letter;
        }).join('');
    }

    /**
     * Subtract months from a given date
     * @param {Date} date The date to subtract months from
     * @param {Number} [qtyMonth=1] The amount of months to be subtracted
     */
    static subtractMonth(date, qtyMonth = 1) {
        const newDate = new Date(date.getTime());
        newDate.setMonth(newDate.getMonth() - qtyMonth);
        return newDate;
    }
}

module.exports = CeiUtils;
