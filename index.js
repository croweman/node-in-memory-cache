'use strict'

const Cacher = require('./lib/cacher');
const logger = require('./lib/logger');

var cachers = [];
var defaultTtl = 0;
var defaultClone = true;
var defaultStoreUndefinedObjects = false;
var intervalId;

function getCachers() {
  cachers = cachers.filter((cacher) => { return cacher !== undefined && cacher !== null });
  return cachers;
}

function clearCachers() {
  getCachers().forEach((cacher) => {
    cacher.clear();
    logger.log(`cleared cacher - id: ${cacher.id}`);
  });
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

    if (options.storeUndefinedObjects === undefined || typeof options.storeUndefinedObjects !== 'boolean') {
      options.storeUndefinedObjects = defaultStoreUndefinedObjects;
    }

    let cacher = new Cacher(options);
    cachers.push(cacher);
    logger.log(`created new cacher - id: ${cacher.id}`);
    return cacher;
  },
  clear: () => {
    clearCachers();
    return cacherWrapper;
  },
  stats: () => {
    let stats = []

    getCachers().forEach((cacher) => {
      stats.push({
        id: cacher.id,
        stats: cacher.stats()
      });
    });

    logger.log(`Stats across all cachers - ${JSON.stringify(stats)}`);
    return stats;
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
  storeUndefinedObjects: (storeUndefinedObjects) => {
    if (storeUndefinedObjects !== undefined && typeof storeUndefinedObjects === 'boolean') {
      defaultStoreUndefinedObjects = storeUndefinedObjects;
    }
    return cacherWrapper;
  },
  cleanup: (seconds) => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
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
  },
  dispose: () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    clearCachers();
    cachers = [];
  },
  getCleanupIntervalId: () => {
    return intervalId;
  }
};

module.exports = cacherWrapper;
