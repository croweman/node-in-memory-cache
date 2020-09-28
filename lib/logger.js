'use strict';

const debug = require('debug')('cache-memory');

let debuggingEnabled = false;

module.exports = {
  enableDebugging: () => { debuggingEnabled = true },
  log: (message, loggingObj) => {
    if (!debuggingEnabled) return;

    if (loggingObj !== undefined && typeof loggingObj === 'object') {
      let toLog = message;

      Object.keys(loggingObj).forEach(key => {
        toLog += `, ${key} : ${JSON.stringify(loggingObj[key])}`
      })

      debug(toLog);
    } else {
      debug(message);
    }
  }
}