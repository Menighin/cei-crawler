const puppeteer = require('puppeteer');

/**
 * @namespace typedefs
 */

/**
 * @typedef CeiCrawlerOptions
 * @property {puppeteer.LaunchOptions} puppeteerLaunch - Puppeteer launch options
 * @property {boolean} trace - Indicates if it should print trace messages. Helpful for debugging.
 * @property {boolean} capEndDate - Prevent crawling with a date bigger than CEI allows, causing an error
 * @property {boolean} capStartDate - Prevent crawling with a date smaller than CEI allows, causing an error
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

exports.unused = {};