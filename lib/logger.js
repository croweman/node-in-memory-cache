'use strict';

const debug = require('debug')('cache-memory');

module.exports = {
  log: (message) => {
    debug(message);
  }
}