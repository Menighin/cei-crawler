# cei-crawler 💸

![Travis badge](https://travis-ci.com/Menighin/cei-crawler.svg?branch=master) ![Coveralls badge](https://coveralls.io/repos/github/Menighin/cei-crawler/badge.svg?branch=master&kill-cache=1) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

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

```
let ceiCrawler = new CeiCrawler('username', 'password', {/* options */});
let stockHistory = await ceiCrawler.getStockHistory(startDate, endDate); // Se nenhuma data for passada, irá trazer o histórico inteiro
```

Um exemplo de retorno do método acima é:

```
[
    {
        institution: 'Banco Inter',
        account: 12345,
        stockHistory: [
            {
                date: Date(2020, 01, 01),
                operation: 'C', // C (Compra) ou V (Venda),
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

## Features
- [x] Histórico de ações
- [ ] Tesouro Direto

## Licença
MIT