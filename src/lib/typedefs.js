const puppeteer = require('puppeteer');

/**
 * @namespace typedefs
 */

/**
 * @typedef CeiCrawlerOptions
 * @property {puppeteer.LaunchOptions} puppeteerLaunch - Puppeteer launch options
 * @property {boolean} trace - Indicates if it should print trace messages. Helpful for debugging.
 * @property {boolean} capDates - Prevent crawling with an invalid date in CEI
 * @property {Number} navigationTimeout - Puppeteer navigation timeout
 * @memberof typdefs
 */

/**
 * @typedef StockOperation
 * @property {Date} date - Date of the operation
 * @property {String} operation - The operation C (buy) or V (sell)
 * @property {String} market - The market the operation happened
 * @property {String} expiration - The expiration of the operation
 * @property {String} code - The code of the stock
 * @property {String} name - Full name of the stock
 * @property {Number} quantity - Quantity of stock bought
 * @property {Number} price - Price payed for each stock
 * @property {Number} totalValue - The total value payed
 * @property {Number} quotationFactor - The quotation factor for the stock
 * @memberof typdefs
 */

 /**
  * @typedef StockHistory
  * @property {String} institution - Name of the institution
  * @property {String} account - The institution's account number
  * @property {StockOperation[]} stockHistory - List of operations for this institution and account
  * @memberof typdefs
  */

  /**
   * @typedef DividendData
   * @property {String} stockType - Type of Stock (ON, PN, CI)
   * @property {String} code - The code of the stock
   * @property {Date} date - Dividend payment date (can be a future date for scheduled payment)
   * @property {String} type - Dividend type (Rendimento, JPC, Dividendo)
   * @property {Number} quantity - Quantity of stock dividend is based
   * @property {Number} factor - Multiply factor for each stock unit
   * @property {Number} grossValue - Dividend value before taxes
   * @property {Number} netValue - Dividend value after taxes 
   * @memberof typdefs
   */

   /**
    * @typedef AccountWallet
    * @property {String} institution - Name of the institution
    * @property {String} account - The institution's account number
    * @property {StockWalletItem[]} stockWallet - List of stocks in the wallet in the given account and institution
    * @property {NationalTreasuryItem[]} nationalTreasuryWallet - List of stocks in the wallet in the given account and institution
    * @memberof typdefs
    */

    /**
    * @typedef StockWalletItem
    * @property {String} company - The name of the company for the given stock
    * @property {String} stockType - The type of the stock
    * @property {String} code - The code of the stock
    * @property {String} isin - The ISIN code of the stock
    * @property {Number} price - The last price reported for the stock in the last day
    * @property {String} quantity - The quantitu in the wallet for the stock
    * @property {Number} quotationFactor - The quotation factor for the stock
    * @property {Number} totalValue - The total value of that stock in your wallet, given the last price
    * @memberof typdefs
    */

   /**
    * @typedef NationalTreasuryItem
    * @property {String} code - The code of the national treasury
    * @property {String} expirationDate - The expiration date of that item
    * @property {String} investedValue - The value invested
    * @property {String} grossValue - The gross value now
    * @property {Number} netValue - The net value now
    * @property {Number} quantity - The quantity of that treasury
    * @property {Number} blocked - The quantity blocked of that treasury
    * @memberof typdefs
    */

exports.unused = {};