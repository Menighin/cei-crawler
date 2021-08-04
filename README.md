# cei-crawler 💸

![Travis badge](https://travis-ci.com/Menighin/cei-crawler.svg?branch=master) ![Coveralls badge](https://coveralls.io/repos/github/Menighin/cei-crawler/badge.svg?branch=master&kill-cache=3) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Crawler para ler dados do Canal Eletrônico do Investidor 

## Descrição
O `cei-crawler` utiliza as seguintes dependências:
* [cheerio](https://github.com/cheeriojs/cheerio) para fazer o parse do HTML.
* [node-fetch](https://github.com/node-fetch/node-fetch) para fazer as requisições
* [abort-controller](https://github.com/mysticatea/abort-controller) para controlar o timeout das requisições
* [tough-cookie](https://github.com/salesforce/tough-cookie) para auxiliar no gerenciamento dos cookies
* [normalize-html-whitespace](https://www.npmjs.com/package/normalize-html-whitespace) para fazer a limpeza do HTML do CEI

Cada instância do `CeiCrawler` roda em um contexto separado, portante é possível realizar operações em usuários diferentes de forma simultânea


## Sponsor
Caso o `cei-crawler` tenha te ajudado e você queira fazer alguma doação pra me ajudar a mantê-lo, utilize o QR code abaixo :)
Mande também seu nome e usuário do GitHub (caso tenha) que eu coloco aqui no README. Obrigado!

<p align="center">
  <img src="./sponsor/picpay.png" width="150">
</p>
<p align="center">
  <strong>PIX:</strong> joao.menighin@gmail.com
</p>

## Advertisement
Criei o `cei-crawler` para um projeto de acompanhamento de investimentos. Caso esteja procurando algo nesse sentido, confira o [Stoincs](https://www.stoincs.com.br)!

<p align="center">
  <a href="https://stoincs.com.br" target="_blank"><img src="./advertisement/snout.svg" width="50"></a>
</p>

## Instalação
Basta instalar utilizando o NPM:
```
npm install --save cei-crawler
```

## Utilização
Crie uma instância do `CeiCrawler` passando os parametros necessários e invoque o método desejado:

```javascript
let ceiCrawler = new CeiCrawler('username', 'password', {/* options */});
ceiCrawler.login(); // Login é opcional, pois antes de cada método o cei-crawler irá verificar se já esta logado.
                    // A vantagem em realizar o login em um passo diferente é para o tratamento de erros
```

### Métodos disponíveis
#### getConsolidatedValues()
Retorna os investimentos consolidados num valor total e divididos em subcategorias

```javascript
let consolidated = await ceiCrawler.getConsolidatedValues();
```
Resultado:
```javascript
{
  "total": 10000,
  "subTotais": [
    {
      "categoriaProduto": "Renda Variável",
      "totalPosicao": 5000,
      "percentual": 0.5
    },
    {
      "categoriaProduto": "Tesouro Direto",
      "totalPosicao": 5000,
      "percentual": 0.5
    }
  ]
}
```

#### getPosition(_date_, _page_)
Retorna as posições da tela "Posição" em todas as categorias de investimentos.

| Parâmetro  |  Tipo  | Default | Descrição                                                                                                    |
|------------|--------|---------|--------------------------------------------------------------------------------------------------------------|
| **_date_** |  Date  |  _null_ | Data da posição. Caso seja passado _null_ ou nenhum valor, será usada a ultima data de processamento do CEI. |
| **_page_** | Number |    1    | Paginação dos dados. Por default retorna a primeira página.                                                  |

```javascript
let position = await ceiCrawler.getPosition();
```
Resultado:
```javascript
{
  "paginaAtual": 1,
  "totalPaginas": 1,
  "itens": [
    {
      "categoriaProduto": "RendaVariavel",
      "tipoProduto": "Acao",
      "descricaoTipoProduto": "Ações",
      "posicoes": [
        {
          "id": "gfw2455-8a79-4127-990b-587sa37",
          "temBloqueio": false,
          "instituicao": "INTER DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA",
          "quantidade": 100,
          "valorAtualizado": 2377.00,
          "precoFechamento": 23.77,
          "produto": "BIDI4 - BANCO INTER S.A.",
          "tipo": "PN",
          "marcacoes": [],
          "codigoNegociacao": "BIDI4",
          "documentoInstituicao": "358743882",
          "existeLogotipo": false,
          "disponivel": 100,
          "documento": "48377283492",
          "razaoSocial": "BANCO INTER S.A.",
          "codigoIsin": "BRBRHEU2",
          "distribuicao": "114",
          "escriturador": "BANCO BRADESCO S/A",
          "valorBruto": 0
        }
      ],
      "totalPosicao": 2377.00,
      "totalItemsPagina": 1
    },
    {
      "categoriaProduto": "TesouroDireto",
      "tipoProduto": "TesouroDireto",
      "descricaoTipoProduto": "Tesouro Direto",
      "posicoes": [
        {
          "id": "hfd4564-e70a-4596-93fd-987654dvbhw",
          "temBloqueio": false,
          "instituicao": "XP INVESTIMENTOS CCTVM S/A",
          "quantidade": 1.01,
          "valorAtualizado": 2200,
          "vencimento": "2024-08-15T00:00:00",
          "valorAplicado": 2000,
          "produto": "Tesouro IPCA+ 2024",
          "marcacoes": [],
          "documentoInstituicao": "8573938583",
          "existeLogotipo": false,
          "indexador": "IPCA",
          "disponivel": 1.01,
          "documento": "7658493485",
          "codigoIsin": "VRSIYASU@",
          "valorBruto": 2038,
          "nomeTituloPublico": "Tesouro IPCA+ 2024",
          "valorLiquido": 29882,
          "percRentabilidadeContratada": 4.71
        }
      ],
      "totalPosicao": 22000,
      "totalItemsPagina": 5
    }
  ],
  "detalheStatusCode": 0,
  "excecoes": []
}
```

#### getPositionDetail(_id_, _category_, _type_)
Retorna o detalhe de uma posição da lista anterior.

| Parâmetro      |  Tipo  | Default      | Descrição                                                                                                                                                    |
|----------------|--------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_id_**       | String |  _undefined_ | UUID da posição. Foi observado que o UUID de uma mesma posição pode mudar ao longo do tempo e essa requisição falhar após pega a lista com o `getPosition()` |
| **_category_** | String |  _undefined_ | Categoria da posição informada no método `getPosition()`.                                                                                                    |
| **_type_**     | String |  _undefined_ | Tipo da posição informada no método `getPosition()`.                                                                                                         |

```javascript
let positionDetail = await ceiCrawler.getPositionDetail('gfw2455-8a79-4127-990b-587sa37', 'RendaVariavel', 'Acao');
```
Resultado:
```javascript
{
  "codigoIsin": "BRBIDIACNPR0",
  "distribuicao": "114",
  "empresa": "BANCO INTER S.A.",
  "escriturador": "BANCO BRADESCO S/A",
  "codigoNegociacao": "BIDI4",
  "disponivel": 100,
  "indisponivel": 0,
  "quantidade": 100,
  "marcacoes": [],
  "possuiMarcacoes": false,
  "existeLogotipo": false,
  "documentoInstituicao": "358743882"
}
```

#### getAccountStatement(_startDate_, _endDate_, _page_)
Retorna as movimentações da aba "Movimentação" no CEI.

| Parâmetro       |  Tipo  | Default | Descrição                                                                                                                   |
|-----------------|--------|---------|-----------------------------------------------------------------------------------------------------------------------------|
| **_startDate_** | Date   |  _null_ | Data de inicio para trazer as movimentações. Caso `null`, será utilizada a ultima data de processamento do CEI menos 1 mês. |
| **_endDate_**   | Date   |  _null_ | Data fim para trazer as movimentações. Caso `null`, será utilizada a ultima data de processamento do CEI.                   |
| **_page_**      | Number |    1    | Paginação dos dados. Por default retorna a primeira página.                                                                 |

```javascript
let accountStatement = await ceiCrawler.getAccountStatement();
```
Resultado:
```javascript
{
  "paginaAtual": 1,
  "totalPaginas": 2,
  "itens": [
    {
      "data": "2021-08-02T00:00:00",
      "movimentacoes": [
        {
          "tipoOperacao": "Credito",
          "tipoMovimentacao": "Juros Sobre Capital Próprio",
          "nomeProduto": "BIDI4 - BANCO INTER S.A.",
          "instituicao": "INTER DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA",
          "quantidade": 100,
          "valorOperacao": 1.49,
          "precoUnitario": 0.01
        }
      ],
      "totalItemsPagina": 1
    },
    {
      "data": "2021-07-30T00:00:00",
      "movimentacoes": [
        {
          "tipoOperacao": "Debito",
          "tipoMovimentacao": "Transferência",
          "nomeProduto": "ALZR11 - ALIANZA TRUST RENDA IMOBILIARIA FDO INV IMOB",
          "instituicao": "RICO INVESTIMENTOS - GRUPO XP",
          "quantidade": 5
        },
        {
          "tipoOperacao": "Credito",
          "tipoMovimentacao": "Transferência",
          "nomeProduto": "ALZR11 - ALIANZA TRUST RENDA IMOBILIARIA FDO INV IMOB",
          "instituicao": "XP INVESTIMENTOS CCTVM S/A",
          "quantidade": 5
        }
      ],
      "totalItemsPagina": 2
    }
  ],
  "detalheStatusCode": 0,
  "excecoes": []
}
```


## Opções
Na criação de um `CeiCrawler` é possivel especificar alguns valores para o parâmetro `options` que modificam a forma que o crawler funciona. As opções são:

| Propriedade           | Tipo      | Default | Descrição                                                                                                                                                                                               |
|-----------------------|-----------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **capDates**          | _Boolean_ | _false_ | Se `true`, as datas utilizadas de input para buscas serão limitadas ao range de datas válidas do CEI, impedindo que ocorra um erro caso o usuário passe uma data maior ou menor.                        |
| **navigationTimeout** | _Number_  | 30000   | Tempo, em ms, que o crawler espera por uma ação antes de considerar timeout. |
| **timeout** | _Number_  | 180000   | Tempo, em ms, que o crawler espera para realizar login antes de considerar timeout. Diversas vezes, como a noite e aos fins de semana, o sistema do CEI parece ficar muito instavél e causa diversos timeouts no login. |
| **trace**             | _Boolean_ | _false_ | Printa mensagens de debug no log. Útil para desenvolvimento.                                                                                                                                            |

Exemplo:

```javascript
const ceiCrawlerOptions = {
    trace: false,
    capEndDate: true,
    navigationTimeout: 60000,
    timeout: 240000,

};

let ceiCrawler = new CeiCrawler('username', 'password', ceiCrawlerOptions);
``` 

## Error Handling
O CEI Crawler possui um exceção própria, `CeiCrawlerError`, que é lançada em alguns cenários. Essa exceção possui um atributo `type` para te direcionar no tratamento:

| type           | Descrição                                                                                                                 |
|----------------|---------------------------------------------------------------------------------------------------------------------------|
| LOGIN_FAILED   | Lançada quando o login falha por timeout ou por CPF errado digitado                                                       |
| WRONG_PASSWORD | Lançada quando a senha passada está errada                                                                                |
| SUBMIT_ERROR   | Lançada quando acontece um erro ao submeter um formulario de pesquisa em alguma página do CEI. Por exemplo: data inválida |
| SESSION_HAS_EXPIRED   | Lançada quando a sessão do usuário expira, nesse caso é necessário realizar o login novamente `ceiCrawler.login()` |
| NAVIGATION_TIMEOUT   | Lançada quando a requisição estoura o tempo limite definida na opção `navigationTimeout` |


Exemplo de como fazer um bom tratamento de erros:

```javascript
const CeiCrawler = require('cei-crawler');
const { CeiErrorTypes } = require('cei-crawler')

const ceiCrawler = new CeiCrawler('usuario', 'senha', { navigationTimeout: 20000 });

try {
  const wallet = ceiCrawler.getWallet();
} catch (err) {
  if (err.name === 'CeiCrawlerError') {
    if (err.type === CeiErrorTypes.LOGIN_FAILED)
      // Handle login failed
    else if (err.type === CeiErrorTypes.WRONG_PASSWORD)
      // Handle wrong password
    else if (err.type === CeiErrorTypes.SUBMIT_ERROR)
      // Handle submit error
    else if (err.type === CeiErrorTypes.SESSION_HAS_EXPIRED)
      // Handle session expired
    else if (err.type === CeiErrorTypes.NAVIGATION_TIMEOUT)
      // Handle request timeout
  } else {
    // Handle generic errors
  }
}
```

## Features
- [x] Histórico de ações
- [x] Dividendos
- [x] Carteira de ações
- [x] Tesouro Direto (Resumido)
- [x] Tesouro Direto (Analítico)

## Licença
MIT
