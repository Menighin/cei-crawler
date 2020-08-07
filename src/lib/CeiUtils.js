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

    /**
     * Parse the table data to its type configuration
     * @param {Array} tableData - The data of the table, an array of objects
     * @param {Object} tableDefinition - Object defining the table types in format (column, type)
     */
    static parseTableTypes(tableData, tableDefinition) {
        // Helper function
        const parseValue = (value, type) => {
            if (type === 'string') return value;
            if (type === 'int')    return parseInt(value.replace('.', ''));
            if (type === 'float')  return parseFloat(value.replace('.', '').replace(',', '.'));
            if (type === 'date')   return (value === '01/01/0001' ? null : new Date(value.split('/').reverse()));
        }

        return tableData.map(row => Object.keys(tableDefinition).reduce((p, c) => {
            p[c] = parseValue(row[c], tableDefinition[c]);
            return p;
        }, {}));
    }

    
    static async waitForLoadingShowAndHide(page, trace = false) {
        try {
            /* istanbul ignore next */
            await page.waitForSelector('#ctl00_ContentPlaceHolder1_UpdateProgress1', { visible: true, timeout: 1500 });
        } catch (e) {
            // Do nothing. Maybe the loading flicked so quickly we couldn't detect it
        }
        /* istanbul ignore next */
        if (trace) console.log('Waiting loading to hide');
        /* istanbul ignore next */
        await page.waitForSelector('#ctl00_ContentPlaceHolder1_UpdateProgress1', { hidden: true });
        /* istanbul ignore next */
        if (trace) console.log('Loading hidden');
    }

}

module.exports = CeiUtils;