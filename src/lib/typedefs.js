/**
 * @namespace typedefs
 */

/**
 * @typedef LastExecutionInfo
 * @property {Date} generalDate - new Date(data.dataGeral),
 * @property {Date} stockDate - new Date(data.dataRendaVariavel),
 * @property {Date} treasuryDirectDate - new Date(data.dataTesouroDireto)
 */

/**
 * @typedef LoginOptions
 * @property {String} strategy - The strategy the crawler will use to make the login. Options are: `user-resolve`, `raw-token`
 * @property {Number} timeout - Login timeout
 * @property {String} browserPath - Path of the browser to run puppeteer
 */

/**
 * @typedef CeiAuth
 * @property {String} token - Bearer token used in CEI
 * @property {String} cache-guid - Cache GUID for the requests
 */

/**
 * @typedef CeiCrawlerOptions
 * @property {boolean} debug - Indicates if it should print debug messages. Helpful for debugging.
 * @property {boolean} capDates - Prevent crawling with an invalid date in CEI
 * @property {Number} navigationTimeout - Fetch timeout
 * @property {LoginOptions} loginOptions - The strategy the crawler will use to make the login. Options are: `user-input`
 * @property {CeiAuth} auth - Auth logged info
 * @property {LastExecutionInfo} lastExecutionInfo - CEI info about the last execution
 * @memberof typdefs
 */

/**
 * @typedef ConsolidatedSubValues
 * @property {String} categoriaProduto - The category of the product
 * @property {Number} totalPosicao - The total amount allocated in that category
 * @property {Number} percentual - The percentage of that category over the total
 */

/**
 * @typedef ConsolidatedValues
 * @property {Number} total - The total amount allocated
 * @property {ConsolidatedSubValues[]} subTotais - The total drilled into categories
 */

/**
 * @template T
 * @typedef CeiListData<T>
 * @property {T[]} itens - The itens of the data
 * @property {Number} detalheStatusCode - The status code of details
 * @property {Any[]} excecoes - Exceptions
 * @property {Number} paginaAtual - The number of the actual page
 * @property {Number} totalPaginas - The total amount of pages to query
 */

/**
 * @typedef PositionCategory
 * @property {String} categoriaProduto - The category of the positions
 * @property {String} tipoProduto - The type of the positions
 * @property {String} descricaoTipoProduto - Positions description
 * @property {Number} totalItemsPagina - The total of items in this category
 * @property {Number} totalPosicao - The total amount of this category
 * @property {Any[]} posicoes - The positions in this category
 */

/**
 * @typedef AccountStatementEntry
 * @property {String} tipoOperacao - The type of operation: "Credito" or "Debito"
 * @property {String} tipoMovimentacao - The type of the transaction
 * @property {String} nomeProduto - The name of the product related to the entry
 * @property {String} instituicao - The broker where the entry happened
 * @property {Number} quantidade - The quantity related to the entry
 * @property {Number} valorOperacao - The value of the entry
 * @property {number} precoUnitario - The unit price for the entry
 */

/**
 * @typedef AccountStatement
 * @property {String} data - The date of the statement entries
 * @property {Number} totalItemsPagina - The number of items at the date
 * @property {AccountStatementEntry[]} movimentacoes - The entries for this date
 */

exports.unused = {};
