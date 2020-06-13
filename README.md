# cei-crawler 💸

![Travis badge](https://travis-ci.com/Menighin/cei-crawler.svg?branch=master) ![Coveralls badge](https://coveralls.io/repos/github/Menighin/cei-crawler/badge.svg?branch=master&kill-cache=3) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Crawler para ler dados do Canal Eletrônico do Investidor 

## Descrição
O `cei-crawler` utiliza o [puppeteer](https://github.com/puppeteer/puppeteer) para fazer o scrapping das informações do usuário.
Para isso, basta criar uma instância do `CeiCrawler` e chamar os métodos necessários.

## Instalação
Basta instalar utilizando o NPM:
```
npm install --save cei-crawler
```

## Utilização
Crie uma instância do `CeiCrawler` passando os parametros necessários e invoque o método desejado:

```javascript
let ceiCrawler = new CeiCrawler('username', 'password', {/* options */});
```

### Métodos disponíveis
#### getWallet
Retorna os dados das carteiras no CEI. As carteiras contém as posições consolidades de ativos e tesouro direto.
O retorno será uma lista com cada item representando os dados de uma instituição e conta.
O método recebe uma data como parâmetro para pegar a foto das carteiras no dia escolhido. Se nenhuma data for passada, será utilizada a data padrao do CEI que é o dia corrente. O CEI disponibiliza datas somente em um range de 3 meses, aparentemente.

```javascript
let wallets = await ceiCrawler.getWallet(date);
```
Resultado:
```javascript
[
  {
    "institution": "1111 - INTER DTVM LTDA",
    "account": "111111",
    "stockWallet": [
      {
        "company": "BANCO INTER",
        "stockType": "PN N2",
        "code": "BIDI4",
        "isin": "BRBIDIACNPR0",
        "price": 11.43,
        "quantity": 100,
        "quotationFactor": 1,
        "totalValue": 1143
      },
      {
        "company": "CENTAURO",
        "stockType": "ON NM",
        "code": "CNTO3",
        "isin": "BRCNTOACNOR5",
        "price": 29,
        "quantity": 100,
        "quotationFactor": 1,
        "totalValue": 2900
      }
    ],
    "treasureWallet": []
  },
  {
    "institution": "222222 - RICO INVESTIMENTOS - GRUPO XP",
    "account": "2222222",
    "stockWallet": [
      {
        "company": "TENDA",
        "stockType": "ON NM",
        "code": "TEND3",
        "isin": "BRTENDACNOR4",
        "price": 25.14,
        "quantity": 100,
        "quotationFactor": 1,
        "totalValue": 2514
      }
    ],
    "treasureWallet": [
      {
        "code": "Tesouro IPCA+ 2024",
        "expirationDate": "2019-06-12T03:00:00.000Z",
        "investedValue": 1000.00,
        "grossValue": 1500.00,
        "netValue": 1400.00,
        "quantity": 0.25,
        "blocked": 0
      }
    ]
  }
]
```

#### getStockHistory
Método que processa o histórico de compra e venda de ações. O retorno será um uma lista com todas operações de compra ou venda efetuadas dentro do período informado, se nenhuma data for passada o método retornará todo o histórico disponível.
```javascript
let stockHistory = await ceiCrawler.getStockHistory(startDate, endDate);
```
Resultado:
```javascript
[
    {
        institution: 'Banco Inter',
        account: 12345,
        stockHistory: [
            {
                date: "2019-06-12T03:00:00.000Z",
                operation: "C", // C (Compra) ou V (Venda),
                market: "Mercado a Vista",
                expiration: "",
                code: "BTOW3",
                name: "B2W DIGITAL ON NM",
                quantity: 200,
                price: 32.2,
                totalValue: 6440,
                cotation: 1
            }
        ]
    }
]
```
#### getDividends
Método que processa todos os dados disponíveis sobre proventos recebidos em um período e retorna como uma lista. Usualmente os proventos disponíveis na página do CEI são os creditados no mês atual e os já anunciados pela empresas com e sem data definida. Registros com date igual a 2001-01-01 são de proventos anunciados mas sem data definida de pagamento.
```javascript
let dividends = await ceiCrawler.getDividends();
```
Resultado:
```javascript
[
    [
  {
    stockType: 'ON NM',
    code: 'EGIE3',
    date: 2001-01-01T02:00:00.000Z,     
    type: 'JUROS SOBRE CAPITAL PRÓPRIO',
    quantity: 70,
    factor: 1,
    grossValue: 30.03,
    netValue: 20.58
  },
  {
    stockType: 'PN EDJ N1',
    code: 'ITSA4',
    date: 2020-04-01T03:00:00.000Z,
    type: 'DIVIDENDO',
    quantity: 450,
    factor: 1,
    grossValue: 9.9,
    netValue: 9.9
  }
]
```

#### close
O método close deve ser chamado quando é terminado o processamento dos dados e a instancia do `CeiCrawler` não será reutilizada em um curto espaço de tempo. Esse método simplesmente fecha o browser do `puppeteer`, liberando memória.
Exemplos do comportamento:
```javascript
// Ambas as chamadas são executadas numa mesma janela do browser, somente um login é feito
let stockHistory = await ceiCrawler.getStockHistory(startDate, endDate);
let dividends = await ceiCrawler.getDividends();
await ceiCrawler.close();

// Se intercalarmos chamadas ao método close entre os métodos, o login é realizado duas vezes
let stockHistory = await ceiCrawler.getStockHistory(startDate, endDate); // Abre browser, faz login e pega o histórico
await ceiCrawler.close(); // Fecha o browser

let dividends = await ceiCrawler.getDividends(); // Abre novamente, faz login e pega os dividendos
await ceiCrawler.close(); // Fecha o browser
```

## Opções
Na criação de um `CeiCrawler` é possivel especificar alguns valores para o parâmetro `options` que modificam a forma que o crawler funciona. As opções são:

| Propriedade         | Tipo      | Default | Descrição                                                                                                                                                                        |
|---------------------|-----------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **puppeteerLaunch** | _Object_  | _{}_    | Esse objeto é passado ao método `launch` do `Puppeteer`. As opções estão listadas [aqui](https://github.com/puppeteer/puppeteer/blob/v2.1.1/docs/api.md#puppeteerlaunchoptions). |
| **capDates**      | _Boolean_ | _false_ | Se `true`, as datas utilizadas de input para buscas serão limitadas ao range de datas válidas do CEI, impedindo que ocorra um erro caso o usuário passe uma data maior ou menor.                             |
| **loginTimeout** | _Number_ | 35000 | Tempo, em ms, que o crawler espera o login concluir antes de considerar erro. Diversas vezes, como a noite e aos fins de semana, o sistema do CEI parece ficar muito instavél e causa diversos timeouts.
| **trace**           | _Boolean_ | _false_ | Printa mensagens de debug no log. Útil para desenvolvimento.                                                                                                                     |

Exemplo:

```javascript
const ceiCrawlerOptions = {
    puppeteerLaunch: {
        headless: false,
        timeout: 0
    },
    trace: false,
    capEndDate: true
};

let ceiCrawler = new CeiCrawler('username', 'password', ceiCrawlerOptions);
``` 

## Features
- [x] Histórico de ações
- [x] Dividendos
- [x] Carteira de ações
- [x] Tesouro Direto

## Licença
MIT
