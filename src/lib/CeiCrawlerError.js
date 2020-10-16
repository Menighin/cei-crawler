class CeiCrawlerError extends Error {
    constructor(type, message) {
        super(message);
        this.type = type;
        this.name = 'CeiCrawlerError';
    }
}

const CeiErrorTypes = Object.freeze({
    LOGIN_FAILED: 'LOGIN_FAILED',
    WRONG_PASSWORD: 'WRONG_PASSWORD',
    SUBMIT_ERROR: 'SUBMIT_ERROR',
    SESSION_HAS_EXPIRED: 'SESSION_HAS_EXPIRED',
    NAVIGATION_TIMEOUT: 'NAVIGATION_TIMEOUT'
});

module.exports = {
    CeiCrawlerError: CeiCrawlerError,
    CeiErrorTypes: CeiErrorTypes
}
