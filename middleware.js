const response = require('./response.js');
const logger = require('./logger.js');

const config = require('./config.json');
const keys = config.keys;

module.exports.keyRequired = function (req, res, next) {
    var key = null;

    if (req.header("api_key")) {
        key = req.header("api_key");
    } else {
        response.emptyKey(res);
        return;
    }

    // Check if key is registered
    var key = req.header("api_key");
    if (keys.indexOf(key) == -1) {
        logger.auth('Failed authentication with key ' + key);
        response.invalidKey(res);
        return;
    }

    // Add short key ot request locals
    req.locals = {
        shortKey: key.substr(0, 5) + '...'
    };

    logger.auth('Authentication with key ' + req.locals.shortKey + ' succeeded');

    next();
}