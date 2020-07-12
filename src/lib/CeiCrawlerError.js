class CeiCrawlerError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
        this.name = 'CeiCrawlerError';
    }
}

const CeiErrorTypes = Object.freeze({
    LOGIN_FAILED: "LOGIN_FAILED",
    WRONG_PASSWORD: "WRONG_PASSWORD"
});

module.exports = {
    CeiCrawlerError: CeiCrawlerError,
    CeiErrorTypes: CeiErrorTypes
}
