"use strict";
const logger = require('./logger');
const clone = require('clone');

var globalId = 0;

module.exports = function(options) {

  options = options || {};
  var self = this;
  self.id = options.id;

  if (!self.id) {
    globalId++;
    self.id = globalId;
  }

  self.id = self.id.toString();
  self.ttl = options.ttl;
  self.cachedData = {};
  self.storeUndefinedObjects = (options.storeUndefinedObjects !== undefined && options.storeUndefinedObjects === true || false);
  self.clone = (options.clone !== undefined && options.clone === true);
  self.hits = 0;
  self.misses = 0;

  function cleanKey(key) {
    return key.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  function get(key, options) {
    options = options || {};
    if (!options.keyCleaned) {
      key = cleanKey(key);
    }
    let data = self.cachedData[key];

    if (data && data.expires < new Date()) {
      data = undefined;
      remove(key, { keyCleaned: true });
    }

    let value = undefined;

    if (data) {
      self.hits++;

      if (self.clone === true) {
        value = clone(data.value);
      }
      else {
        value = data.value;
      }
    }
    else {
      self.misses++;
    }

    logger.log(`get - cacher id: ${self.id}, key: ${key}, value: ${JSON.stringify(value)}`);
    return value;
  }

  function getExpiry(key) {
    key = cleanKey(key);

    let data = self.cachedData[key];

    if (data && data.expires < new Date()) {
      data = undefined;
      remove(key, { keyCleaned: true });
    }

    if (data) {
      logger.log(`getExpiry - cacher id: ${self.id}, key: ${key}, expiry: ${data.expires}`);
    }
    else {
      logger.log(`getExpiry - item does not exist - cacher id: ${self.id}, key: ${key}`);
    }

    return data ? data.expires : undefined;
  }

  function * getAndSet(key, options) {
    options = options || {};
    options.keyCleaned = true;
    let generator = options.generator;

    if (!generator) {
      logger.log(`getAndSet - no generator function is defined - cacher id: ${self.id}, key: ${key}, options: ${JSON.stringify(options)}`);
      return undefined;
    }

    key = cleanKey(key);
    let value = get(key, options);

    if (!value) {
      logger.log(`getAndSet - retrieving value from generator - cacher id: ${self.id}, key: ${key}, options: ${JSON.stringify(options)}`);
      value = yield* generator();

      set(key, value, options);
    }

    logger.log(`getAndSet - cacher id: ${self.id}, key: ${key}, value: ${JSON.stringify(value)}`);
    return value;
  }

  function set(key, value, options) {
    options = options || {};

    if (!self.storeUndefinedObjects && (value === undefined || value === null || (typeof value.isNull === "function" && value.isNull()))) {
      logger.log(`set - not storing value as it is not defined - cacher id: ${self.id}, key: ${key}, value: ${JSON.stringify(value)}, options: ${JSON.stringify(options)}`);
      remove(key, options);
      return;
    }

    if (!options.keyCleaned) {
      key = cleanKey(key);
    }

    let ttl = options.ttl || self.ttl;
    let expiryDate;

    if (ttl === 0) {
      expiryDate = new Date(8640000000000000);
    }
    else {
      expiryDate = new Date(new Date().getTime() + (ttl * 1000))
    }

    let valueToCache = self.clone === true ? clone(value) : value;
    let cacheValue = {
      value: valueToCache,
      expires: expiryDate
    };
    self.cachedData[key] = cacheValue;

    logger.log(`set - stored value - cacher id: ${self.id}, key: ${key}, cachedData: ${JSON.stringify(cacheValue)}`);
  }

  function clear() {
    logger.log(`clear - cacher id: ${self.id}`);
    self.hits = 0;
    self.misses = 0;
    self.cachedData = {};
  }

  function remove(key, options) {
    options = options || {};
    if (!options.keyCleaned) {
      key = cleanKey(key);
    }
    logger.log(`remove - key: ${key}, cacher id: ${self.id}`);
    delete self.cachedData[key];
  }

  function stats() {
    let hits = self.hits;
    let misses = self.misses;

    let stats = {
      count: Object.keys(self.cachedData).length,
      hits,
      misses,
      hitRate: hits / (hits + misses)
    };

    if (isNaN(stats.hitRate)) {
      stats.hitRate = 0;
    }

    logger.log(`stats - ${JSON.stringify(stats)}, cacher id: ${self.id}`);
    return stats;
  }

  function keys() {
    let keys = Object.keys(self.cachedData);
    logger.log(`keys - cacher id: ${self.id}, keys: ${JSON.stringify(keys)}`);
    return keys;
  }

  function getOptions() {
    return {
      ttl: self.ttl,
      clone: self.clone,
      storeUndefinedObjects: self.storeUndefinedObjects
    };
  }

  return {
    id: self.id,
    get,
    getExpiry,
    getAndSet,
    set,
    clear,
    remove,
    stats,
    keys,
    options: getOptions
  };
};