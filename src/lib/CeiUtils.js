class CeiUtils {

    /**
     * Returns a date in the format dd/MM/yyyy for input at CEI
     * @param {Date} date - Date to be parsed
     */
    static getDateForInput(date) {
        return `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
    }

    /**
     * Return a date object given a date string
     * @param {String} dateStr Date string in dd/MM/yyyy format
     */
    static getDateFromInput(dateStr) {
        const [day, month, year] = dateStr.split('/').map(o => parseInt(o));
        return new Date(year, month - 1, day);
    }

}

module.exports = CeiUtils;