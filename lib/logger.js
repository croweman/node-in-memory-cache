'use strict';

const debug = require('debug')('in-memory-cache');

module.exports = {
  log: (message) => {
    debug(message);
  }
}