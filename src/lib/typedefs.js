/**
 * @namespace typedefs
 */

/**
 * @typedef CeiCrawlerOptions
 * @property {boolean} trace - Indicates if it should print trace messages. Helpful for debugging.
 * @property {boolean} capDates - Prevent crawling with an invalid date in CEI
 * @property {Number} navigationTimeout - Fetch timeout
 * @property {Number} loginTimeout - Login timeout
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
* @property {SummaryStockOperation[]} summaryStockHistory - List of operations for this institution and account
* @memberof typdefs
*/

/**
 * @typedef SummaryStockOperation
 * @property {String} code - The code of the summary stock
 * @property {String} period - The period of the summary stock
 * @property {Number} buyAmount - Purchase amount of the summary stock
 * @property {Number} saleAmount - Sale amount of the summary stock
 * @property {Number} averageBuyPrice - Average buy price of the summary stock
 * @property {Number} averageSalePrice - Average sale price of the summary stock
 * @property {Number} quantityNet - Quantity net of the summary stock
 * @property {String} position - The position of the summary stock
 * @memberof typdefs
 */

/**
 * @typedef StockHistoryOptions
 * @property {String} minDate - Minimum date which data is available
 * @property {String} maxDate - Maximum date which data is available
 * @property {InstitutionOption[]} institutions - Array of available institutions with its accounts
 */

/**
* @typedef InstitutionOption
* @property {String} label - Label for the institution option
* @property {String} value - Option value for institution
* @property {String[]} accounts - Accounts available for the given institution
*/

/**
 * @typedef DividendData
 * @property {String} institution - Name of the institution
 * @property {String} account - The institution's account number
 * @property {DividendEvent[]} futureEvents - List of future dividend events
 * @property {DividendEvent[]} pastEvents - List of past dividend events
 * @memberof typdefs
 */

/**
 * @typedef DividendEvent
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
* @typedef DividendsOptions
* @property {String} minDate - Minimum date which data is available
* @property {String} maxDate - Maximum date which data is available
* @property {InstitutionOption[]} institutions - Array of available institutions with its accounts
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

/**
 * @typedef WalletOptions
 * @property {String} minDate - Minimum date which data is available
 * @property {String} maxDate - Maximum date which data is available
 * @property {InstitutionOption[]} institutions - Array of available institutions with its accounts
 */

/**
 * @typedef TreasureTransactionItem
 * @property {String} tradeDate - The application date of that transaction
 * @property {String} quantity - The quantity date of that transaction
 * @property {String} price - The price of that transaction
 * @property {String} notional - The notional that transaction
 * @property {Number} profitability - The profitability that transaction
 * @property {Number} grossProfitability - The gross profitability that transaction
 * @property {Number} grossProfitabilityPercent - The gross profitability in percent that transaction
 * @property {Number} grossValue - The gross value that transaction
 * @property {Number} investmentTerm - The investment term that transaction
 * @property {Number} taxBracket - The tax bracket that transaction
 * @property {Number} taxIrValue - The tax IR value that transaction
 * @property {Number} taxIofValue - The tax IOF value that transaction
 * @property {Number} feeB3Value - The fee B3 value that transaction
 * @property {Number} feeInstitutionValue - The fee Finance Institution that transaction
 * @property {Number} netValue - The new value that transaction
 * @memberof typdefs
 */

/**
 * @typedef TreasureItem
 * @property {String} code - The code of the national treasury
 * @property {String} expirationDate - The expiration date of that item
 * @property {String} investedValue - The value invested
 * @property {String} grossValue - The gross value now
 * @property {Number} netValue - The net value now
 * @property {Number} quantity - The quantity of that treasury
 * @property {Number} blocked - The quantity blocked of that treasury
 * @property {TreasureTransactionItem[]} transactions - The transactions of that treasury
 * @memberof typdefs
 */

/**
 * @typedef TreasureOptions
 * @property {String} minDate - Minimum date which data is available
 * @property {String} maxDate - Maximum date which data is available
 * @property {InstitutionOption[]} institutions - Array of available institutions with its accounts
 */

exports.unused = {};
