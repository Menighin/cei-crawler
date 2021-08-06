# cei-crawler 💸

![Travis badge](https://travis-ci.com/Menighin/cei-crawler.svg?branch=master) ![Coveralls badge](https://coveralls.io/repos/github/Menighin/cei-crawler/badge.svg?branch=master&kill-cache=3) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Crawler para ler dados do Canal Eletrônico do Investidor 

## __Importante__
Para versão antiga do CEI que não possui captcha obrigatório (por enquanto), utilize o [cei-crawler v2](https://github.com/Menighin/cei-crawler/tree/v2)

## Descrição
Essa versão do crawler varre a [Nova Area Logada do CEI](https://www.investidor.b3.com.br/nova-area-logada?utm_source=cei&utm_medium=banner&utm_campaign=lancamento).
Essa área logada possui um captcha para que seja feito o login e por isso existem algumas estratégias de implementação para fazer o bypass do mesmo.
Além disso, o CEI agora possui uma API. Tudo que o crawler faz basicamente é encapsular as chamadas dessas API's. 
Portanto, o formato dos dados vem direto do CEI, *não há* transformação feita por esse crawler.
Sendo assim, caso haja algo estranho ou errado nos dados retornados, provavelmente é o próprio CEI que está retornando.

O `cei-crawler` utiliza as seguintes dependências:
* [puppeteer-core](https://www.npmjs.com/package/puppeteer-core) para navegar com o browser e resolver o captcha.
* [axios](https://www.npmjs.com/package/axios) para fazer as requisições http.


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

## Login & Captcha
A nova área logada do CEI possui validação por captcha. Não há forma simples de resolver e por isso algumas estratégias de resolução são implementadas.
Essas estratégias são setadas na instanciação do crawler, com o objeto de `options`. As disponíveis são:

#### `raw-token`
Nessa estratégia de login, não é necessário informar usuário e senha porém deve-se informar o `token` e o `cache-guid` do usuário logado.
Essa estratégia é útil caso você possua algum serviço terceiro que faça o login no CEI e pegue o token pra você.

Exemplo:
```javascript
const ceiCrawler = new CeiCrawler(_, _, { 
    loginOptions: {
        strategy: 'raw-token'
    },
    auth: {
        "cache-guid": "cache-guid do usuário logado",
        token: "JWT do usuário logado"
    }
});

const values = await ceiCrawler.getConsolidatedValues();
```

#### `user-resolve`
Nessa estratégia de login, o usuário será promptado para fazer o login ele mesmo em uma janela de browser que será aberta.
O crawler tenta preencher usuário e senha para você de forma que o input manual é somente para resolução do Captcha.
Uma vez feito o login, o crawler trata de pegar as credencias e seguir adiante chamando os métodos.
Nas opções do login deve-se também ser informado um caminho do browser para que o puppeteer o controle.

Exemplo:
```javascript
const ceiCrawler = new CeiCrawler('user', 'password', { 
    loginOptions: {
        strategy: 'user-resolve',
        browserPath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    }
});

const values = await ceiCrawler.getConsolidatedValues();
```

## Métodos disponíveis
#### `getConsolidatedValues()`
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

#### `getPosition(date, page)`
Retorna as posições da tela "Posição" em todas as categorias de investimentos.

| Parâmetro  |  Tipo  | Default | Descrição                                                                                                    |
|------------|--------|---------|--------------------------------------------------------------------------------------------------------------|
| **date**|  Dte  |  _null_ | Data da posição. Caso seja passado _null_ ou nenhum valor, será usada a ultima data de processamento do CEI. |
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

#### `getPositionDetail(id, category, type)`
Retorna o detalhe de uma posição da lista anterior.

| Parâmetro      |  Tipo  | Default      | Descrição                                                                                                                                                    |
|----------------|--------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_id_**       | String |  _undefined_ | UUID da posição. Foi observado que o UUID de uma mesma posição pode mudar ao longo do tempo e essa requisição falhar após pegar a lista com o `getPosition()` |
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

#### `getAccountStatement(startDate, endDate, page)`
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

#### `getIpos(date, page)`
Retorna os IPOs da tela "Ofertas Públicas" no CEI.

| Parâmetro  |  Tipo  | Default | Descrição                                                                                                    |
|------------|--------|---------|--------------------------------------------------------------------------------------------------------------|
| **_date_** |  Date  |  _null_ | Data de consulta. Caso seja passado _null_ ou nenhum valor, será usada a ultima data de processamento do CEI.|
| **_page_** | Number |    1    | Paginação dos dados. Por default retorna a primeira página.                                                  |

```javascript
let ipos = await ceiCrawler.getIPOs();
```
Resultado:
```javascript
{
  "paginaAtual": 1,
  "totalPaginas": 1,
  "itens": [
    {
      "data": "2021-07-27T00:00:00",
      "ofertasPublicas": [
        {
          "id": "c80c8b8f-62d2-4b48-b242-b0f310cfa95a",
          "dataLiquidacao": "2021-07-27T00:00:00",
          "nomeEmpresa": "INVESTO ETF MSCI US TECHNOLOGY FDO INV IND INV EXT",
          "tipoOferta": "OUTRO",
          "oferta": "ETF INVESTO",
          "nomeInstituicao": "INTER DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA",
          "quantidade": 10,
          "preco": 10,
          "valor": 100
        }
      ],
      "totalItemsPagina": 1
    }
  ],
  "detalheStatusCode": 0,
  "excecoes": []
}
```

#### `getIPODetail(id)`
Retorna o detalhe de uma posição da lista anterior.

| Parâmetro      |  Tipo  | Default      | Descrição                                                                                                                                                    |
|----------------|--------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_id_**       | String |  _undefined_ | UUID do IPO. Foi observado que o UUID de um mesmo IPO pode mudar ao longo do tempo e essa requisição falhar após pegar a lista com o `getIPOs()`             |

```javascript
let ipoDetail = await ceiCrawler.getIPODetail('c80c8b8f-62d2-4b48-b242-b0f310cfa95a');
```
Resultado:
```javascript
{
  "nomeProduto": "OUTRO INVESTO ETF MSCI US TECHNOLOGY FDO INV IND INV EXT",
  "nomeInstituicao": "INTER DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA",
  "ativo": {
    "nomeEmpresa": "INVESTO ETF MSCI US TECHNOLOGY FDO INV IND INV EXT",
    "ticker": "USTK11L",
    "oferta": "ETF INVESTO",
    "codigoIsin": "BRUSTKCTF007"
  },
  "valores": {
    "preco": 10,
    "precoMaximo": 0,
    "valor": 100
  },
  "reserva": {
    "modalidade": "Compra/Integralização de cotas do ETF INVESTO",
    "quantidade": 10,
    "valor": 0
  },
  "quantidadeAlocada": 10,
  "dataLiquidacao": "2021-07-27T00:00:00"
}
```

#### `getStockTransactions(startDate, endDate, page)`
Retorna os dados da aba "Negociação" no CEI.

| Parâmetro       |  Tipo  | Default | Descrição                                                                                                                   |
|-----------------|--------|---------|-----------------------------------------------------------------------------------------------------------------------------|
| **_startDate_** | Date   |  _null_ | Data de inicio para trazer as negociações. Caso `null`, será utilizada a ultima data de processamento do CEI menos 1 mês.   |
| **_endDate_**   | Date   |  _null_ | Data fim para trazer as negociações. Caso `null`, será utilizada a ultima data de processamento do CEI.                     |
| **_page_**      | Number |    1    | Paginação dos dados. Por default retorna a primeira página.                                                                 |

```javascript
let stockTransactions = await ceiCrawler.getStockTransactions();
```
Resultado:
```javascript
{
  "paginaAtual": 1,
  "totalPaginas": 1,
  "itens": [
    {
      "data": "2021-07-20T00:00:00",
      "totalCompra": 1000,
      "totalVenda": 0,
      "negociacaoAtivos": [
        {
          "tipoMovimentacao": "Compra",
          "mercado": "Mercado à Vista",
          "nomeInstituicao": "RICO INVESTIMENTOS - GRUPO XP",
          "codigoNegociacao": "PNVL3",
          "quantidade": 100,
          "preco": 10.00,
          "valor": 1000.00
        }
      ],
      "totalItemsPagina": 1
    }
  ],
  "detalheStatusCode": 0,
  "excecoes": []
}
```

#### `getProvisionedEvents(date, page)`
Retorna os eventos da tela "Eventos Provisionados" no CEI.

| Parâmetro  |  Tipo  | Default | Descrição                                                                                                    |
|------------|--------|---------|--------------------------------------------------------------------------------------------------------------|
| **_date_** |  Date  |  _null_ | Data de consulta. Caso seja passado _null_ ou nenhum valor, será usada a ultima data de processamento do CEI.|
| **_page_** | Number |    1    | Paginação dos dados. Por default retorna a primeira página.                                                  |

```javascript
let events = await ceiCrawler.getProvisionedEvents();
```
Resultado:
```javascript
{
  "totalValorLiquido": 8.62,
  "paginaAtual": 1,
  "totalPaginas": 1,
  "itens": [
    {
      "id": "9cc87804-f9ae-143a-acfb-c953f38c72dd",
      "produto": "WEGE3        - WEG S/A",
      "tipo": "ON",
      "tipoEvento": "JUROS SOBRE CAPITAL PRÓPRIO",
      "previsaoPagamento": "2021-08-11T00:00:00",
      "instituicao": "INTER DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA",
      "quantidade": 300,
      "precoUnitario": 0.03,
      "valorLiquido": 8.62,
      "totalItemsPagina": 1
    }
  ],
  "detalheStatusCode": 0,
  "excecoes": []
}
```

#### `getProvisionedEventDetail(id)`
Retorna o detalhe de um evento provisionado da lista anterior.

| Parâmetro      |  Tipo  | Default      | Descrição                                                                                                                                                          |
|----------------|--------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **_id_**       | String |  _undefined_ | UUID do evento. Foi observado que o UUID de um mesmo evento pode mudar ao longo do tempo e essa requisição falhar após pegar a lista com o `getProvisionedEvents()`|

```javascript
let eventDetail = await ceiCrawler.getProvisionedEventDetail('9cc87804-f9ae-143a-acfb-c953f38c72dd');
```
Resultado:
```javascript
{
  "codigoNegociacao": "WEGE3",
  "codigoIsin": "BRWEGEACNOR0",
  "distribuicao": "202",
  "escriturador": "BANCO BRADESCO S/A",
  "empresa": "WEG S/A",
  "dataAprovacao": "2021-03-23T00:00:00",
  "dataAtualizacao": "2021-03-30T00:00:00",
  "dataEx": "2021-03-29T00:00:00",
  "impostoRenda": 15,
  "valorImpostoRenda": 1.52,
  "valorBruto": 10.14,
  "disponivel": 100,
  "indisponivel": 0,
  "produto": "WEGE3        - WEG S/A",
  "tipo": "ON",
  "tipoEvento": "JUROS SOBRE CAPITAL PRÓPRIO",
  "previsaoPagamento": "2021-08-11T00:00:00",
  "quantidade": 100,
  "precoUnitario": 0.03,
  "valorLiquido": 8.62
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
