'use strict';

const debug = require('debug')('cache-memory');

module.exports = {
  log: (message, loggingObj) => {
    if (!debug.enabled) return;

    if (loggingObj !== undefined && typeof loggingObj === 'object') {
      let toLog = message;

      Object.keys(loggingObj).forEach(key => {
        toLog += `, ${key}: ${JSON.stringify(loggingObj[key])}`
      })

      debug(toLog);
    } else {
      debug(message);
    }
  }
}