class CeiCrawlerError extends Error {
    constructor(type, message, status = null) {
        super(message);
        this.type = type;
        this.name = 'CeiCrawlerError';
        this.status = null;
    }
}

const CeiErrorTypes = Object.freeze({
    LOGIN_FAILED: 'LOGIN_FAILED',
    WRONG_PASSWORD: 'WRONG_PASSWORD',
    SUBMIT_ERROR: 'SUBMIT_ERROR',
    SESSION_HAS_EXPIRED: 'SESSION_HAS_EXPIRED',
    NAVIGATION_TIMEOUT: 'NAVIGATION_TIMEOUT',
    INVALID_LOGIN_STRATEGY: 'INVALID_LOGIN_STRATEGY',
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED' 
});

module.exports = {
    CeiCrawlerError: CeiCrawlerError,
    CeiErrorTypes: CeiErrorTypes
}
