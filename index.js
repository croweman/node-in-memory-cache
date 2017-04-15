'use strict'

const Cacher = require('./lib/cacher');
const logger = require('./lib/logger');

var cachers = [];
var defaultTtl = 5 * 60;
var defaultClone = true;
var defaultStoreUndefinedItems = false;
var timeoutId;

function getCachers() {
  cachers = cachers.filter((cacher) => { return cacher !== undefined && cacher !== null });
  return cachers;
}

var cacherWrapper = {
  create: (options) => {
    options = options || {};

    if (options.ttl === undefined || typeof options.ttl !== 'number') {
      options.ttl = defaultTtl;
    }

    if (options.clone === undefined || typeof options.clone !== 'boolean') {
      options.clone = defaultClone;
    }

    if (options.storeUndefinedItems === undefined || typeof options.storeUndefinedItems !== 'boolean') {
      options.storeUndefinedItems = defaultStoreUndefinedItems;
    }

    let cacher = new Cacher(options);
    cachers.push(cacher);
    logger.log(`created new cacher - id: ${cacher.id}`);
    return cacher;
  },
  clear: () => {
    getCachers().forEach((cacher) => {
      cacher.clear();
      logger.log(`cleared cacher - id: ${cacher.id}`);
    });
    return cacherWrapper;
  },
  cachedItemsCount: () => {
    let count = 0;

    getCachers().forEach((cacher) => {
      count += Object.keys(cacher.cachedData).length;
    });

    logger.log(`Total cached items count across all cachers - ${count}`);
    return count;
  },
  cacher: (id) => {
    let cacher = undefined;
    let cachers = getCachers();
    for (var i = 0; i < cachers.length; i++) {
      let currentCacher = cachers[i];

      if (currentCacher.id === id) {
        cacher = currentCacher;
        break;
      }
    }

    logger.log(`getting cacher - id: ${id}, found: ${cacher !== undefined && cacher !== null }`);
    return cacher;
  },
  cachers: () => {
    let cachers = getCachers();
    let ids = cachers.map((cacher) => { return cacher.id; });
    logger.log(`getting cachers - ids: ${JSON.stringify(ids)} }`);
    return cachers;
  },
  ttl: (ttl) => {
    if (ttl !== undefined && typeof ttl === 'number') {
      defaultTtl = ttl;
      logger.log(`Default ttl set to - ${defaultTtl}`);
    }
    return cacherWrapper;
  },
  clone: (clone) => {
    if (clone !== undefined && typeof clone === 'boolean') {
      defaultClone = clone;
    }
    return cacherWrapper;
  },
  storeUndefinedItems: (storeUndefinedItems) => {
    if (storeUndefinedItems !== undefined && typeof storeUndefinedItems === 'boolean') {
      defaultStoreUndefinedItems = storeUndefinedItems;
    }
    return cacherWrapper;
  },
  cleanup: (seconds) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      logger.log(`cleaning up expired keys`);
      let count = 0;
      getCachers().forEach((cacher) => {
        cacher.keys().forEach((key) => {
          cacher.getExpiry(key);
        });
      });
      logger.log(`cleaning up expired keys complete - ${count} keys`);
    }, seconds * 1000);
    return cacherWrapper;
  }
};

module.exports = cacherWrapper;
