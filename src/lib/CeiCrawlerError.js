/* istanbul ignore next */
class CeiCrawlerError extends Error {
    constructor(type, message, status = null) {
        super(message);
        this.type = type;
        this.name = 'CeiCrawlerError';
        this.status = null;
    }
}

/* istanbul ignore next */
const CeiErrorTypes = Object.freeze({
    INVALID_LOGIN_STRATEGY: 'INVALID_LOGIN_STRATEGY',
    BAD_REQUEST: 'BAD_REQUEST',
    UNAUTHORIZED: 'UNAUTHORIZED',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS'
});

module.exports = {
    CeiCrawlerError: CeiCrawlerError,
    CeiErrorTypes: CeiErrorTypes
}
