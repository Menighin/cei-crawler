const puppeteer = require('puppeteer');

class CeiCrawler {

    /** @type {boolean} */
    _isLogged = false;

    /** @type {puppeteer.Browser} */
    _browser = null;

    /** @type {puppeteer.Page} */
    _page = null;

    get username() { return this._username; }
    set username(username) { this._username = username; }

    get password() { return this._password; }
    set password(password) { this._password = password; }

    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async _login() {
        if (this._isLogged) return;

        if (this._browser == null)
            this._browser = await puppeteer.launch({ headless: false });

        this._page = await this._browser.newPage();
        await this._page.goto('https://cei.b3.com.br/CEI_Responsivo/');
        await this._page.type('#ctl00_ContentPlaceHolder1_txtLogin', this.username, { delay: 10 });
        await this._page.type('#ctl00_ContentPlaceHolder1_txtSenha', this.password, { delay: 10 });
        await this._page.click('#ctl00_ContentPlaceHolder1_btnLogar');
        await this._page.waitForNavigation();
        this._isLogged = true;
    }

    async getStockHistory() {
        await this._login();
        await this._page.goto('https://cei.b3.com.br/CEI_Responsivo/negociacao-de-ativos.aspx');

        const institutionsHandle = await this._page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_ddlAgentes option'))
                .map(o => o.value)
                .filter(v => v > 0);
        });
        const institutions = await institutionsHandle.jsonValue();

        for (const value of institutions) {
            await this._page.select('#ctl00_ContentPlaceHolder1_ddlAgentes', value);

            //await this._page.waitForNavigation({ waitUntil: 'networkidle0'});

            const accountsHandle = await this._page.evaluateHandle(() => {
                return Array.from(document.querySelectorAll('#ctl00_ContentPlaceHolder1_ddlContas option'))
                    .map(o => o.value)
                    .filter(v => v > 0);
            });
            const accounts = await accountsHandle.jsonValue();
            
            console.log(accounts);

            await this._page.waitFor(2000);
        }



        await this._page.waitFor(10000);

    }

}

module.exports = CeiCrawler;