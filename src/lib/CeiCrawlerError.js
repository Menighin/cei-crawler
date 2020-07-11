class CeiCrawlerError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
    }
}

const CeiErrorTypes = Object.freeze({
    LOGIN_FAILED: "LOGIN_FAILED",
    WRONG_PASSWORD: "WRONG_PASSWORD",
    NAVIGATION_TIMEOUT: "NAVIGATION_TIMEOUT"
});

module.exports = {
    CeiCrawlerError: CeiCrawlerError,
    CeiErrorTypes: CeiErrorTypes
}
