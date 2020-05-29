class CeiUtils {

    /**
     * Returns a date in the format dd/MM/yyyy for input at CEI
     * @param {Date} date - Date to be parsed
     */
    static getDateForInput(date) {
        return `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
    }

    /**
     * Parses a string to the destination format
     * @param {String} value - Value to be parsed
     * @param {String} type - Type of the value to be parsed (string, int, float or date)
     */
    static parseColumnValue(value, type) {
        if (type === 'string') return value;
        if (type === 'int')    return parseInt(value.replace('.', ''));
        if (type === 'float')  return parseFloat(value.replace('.', '').replace(',', '.'));
        if (type === 'date')   return new Date(value.split('/').reverse()).getTime();
        return null;
    }

}

module.exports = CeiUtils;