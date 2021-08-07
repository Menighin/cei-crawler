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
 * @property {LoginOptions} loginOptions - The strategy the crawler will use to make the login. Options are: `user-input`
 * @property {CeiAuth} auth - Auth logged info
 * @property {LastExecutionInfo} lastExecutionInfo - CEI info about the last execution
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

/**
 * @typedef IPO
 * @property {String} id - The ID of the entry at CEI
 * @property {String} dataLiquidacao - The date which the operation was liquidated
 * @property {String} nomeEmpresa - Name of the company offer
 * @property {String} nomeInstituicao - Name of the broker
 * @property {String} oferta - Name of the company offering
 * @property {Number} preco - The unit price
 * @property {Number} quantitade - The quantity requested
 * @property {String} tipoOferta - The type of the offer
 * @property {Number} valor - The total amount of the operation
 */

/**
 * @typedef IPODaily
 * @property {String} data - The date of the transactions
 * @property {IPO[]} ofertasPublicas - The IPOs for that date
 * @property {Number} totalItemsPagina - The total quantity of items in the page
 */

/**
 * @typedef IPOAsset
 * @property {String} nomeEmpresa - The name of the company
 * @property {String} ticker
 * @property {String} oferta
 * @property {String} codigoIsin
 */

/**
 * @typedef IPOValues
 * @property {Number} price - The unit price for the asset
 * @property {Number} precoMaximo - The max price set
 * @property {Number} valor - The value of the operation
 */

/**
 * @typedef IPOReservation
 * @property {String} modalidade
 * @property {Number} quantidade
 * @property {Number} valor
 */

/**
 * @typedef IPODetail
 * @property {String} nomeProduto
 * @property {String} nomeInstituicao - The name of the broker used
 * @property {IPOAsset} ativo - Information regarding the IPO asset
 * @property {IPOValues} valores
 * @property {IPOReservation} reserva - Information regarding the reservation
 * @property {Number} quantidadeAlocada - The amount alocated
 * @property {String} dataLiquidacao
 */

/**
 * @typedef StockTransaction
 * @property {String} codigoNegociacao - The code of the stock
 * @property {String} mercado - The market where it was negotiated
 * @property {String} nomeInstituicao - The broker used in the negotiation
 * @property {Number} preco - The stock unit price
 * @property {Number} quantidade - The quantity negotiated
 * @property {String} tipoMovimentacao - The type of the transaction: "Compra" or "Venda"
 * @property {Number} valor - The total amount of the transaction
 */

/**
 * @typedef StockTransactionsDaily
 * @property {String} data - The date of the transactions
 * @property {StockTransaction[]} negociacaoAtivos - The transactions for that date
 * @property {Number} totalCompra - The total amount bought on that day
 * @property {Number} totalVenda - The total amount sold on that day
 * @property {Number} totalItemsPagina - The total quantity of items in the page
 */

/**
 * @typedef ProvisionedEvent
 * @property {String} id - The UUID of this event on CEI
 * @property {String} instituicao - Broker related to this event
 * @property {Number} precoUnitario
 * @property {String} previsaoPagamento - Date which the event should happen
 * @property {String} produto - Name of the asset related to the event
 * @property {Number} quantidade - Quantity related to this event
 * @property {String} tipo
 * @property {String} tipoEvento - Type of the event. E.g.: Dividendo, Rendimento, etc
 * @property {Number} valorLiquido - Value related to this event
 */

/**
 * @typedef ProvisionedEventDetail
 * @property {String} codigoIsin
 * @property {String} codigoNegociacao - The code of the asset
 * @property {String} dataAprovacao
 * @property {String} dataAtualizacao
 * @property {String} dataEx
 * @property {Number} disponivel
 * @property {String} distribuicao
 * @property {String} empresa
 * @property {String} escriturador
 * @property {Number} impostoRenda
 * @property {Number} indisponivel
 * @property {Number} precoUnitario
 * @property {String} previsaoPagamento
 * @property {String} produto
 * @property {Number} quantidade
 * @property {String} tipo
 * @property {String} tipoEvento
 * @property {Number} valorBruto
 * @property {Number} valorImpostoRenda
 * @property {Number} valorLiquido
 */

exports.unused = {};
