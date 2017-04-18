"use strict";
const logger = require('./logger');
const clone = require('clone');

var id = 0;

class Cacher {

  constructor(options) {
    options = options || {};
    this.id = options.id;

    if (!this.id) {
      id++;
      this.id = id;
    }

    this.id = this.id.toString();
    this.ttl = options.ttl;
    this.cachedData = {};
    this.storeUndefinedObjects = (options.storeUndefinedObjects !== undefined && options.storeUndefinedObjects === true || false);
    this.clone = (options.clone !== undefined && options.clone === true);
  }

  cleanKey(key) {
    return key.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  get(key, options) {
    options = options || {};
    if (!options.keyCleaned) {
      key = this.cleanKey(key);
    }
    let data = this.cachedData[key];

    if (data && data.expires < new Date()) {
      data = undefined;
      this.remove(key, {keyCleaned: true});
    }

    let value = undefined;

    if (data) {
      if (this.clone === true) {
        value = clone(data.value);
      }
      else {
        value = data.value;
      }
    }

    logger.log(`get - cacher id: ${this.id}, key: ${key}, value: ${JSON.stringify(value)}`);
    return value;
  }

  getExpiry(key) {
    key = this.cleanKey(key);

    let data = this.cachedData[key];

    if (data && data.expires < new Date()) {
      data = undefined;
      this.remove(key, {keyCleaned: true});
    }

    if (data) {
      logger.log(`getExpiry - cacher id: ${this.id}, key: ${key}, expiry: ${data.expires}`);
    }
    else {
      logger.log(`getExpiry - item does not exist - cacher id: ${this.id}, key: ${key}`);
    }

    return data ? data.expires : undefined;
  }

  * getAndSet(key, options) {
    options = options || {};
    options.keyCleaned = true;
    let generator = options.generator;

    if (!generator) {
      logger.log(`getAndSet - no generator function is defined - cacher id: ${this.id}, key: ${key}, options: ${JSON.stringify(options)}`);
      return undefined;
    }

    key = this.cleanKey(key);
    let value = this.get(key, options);

    if (!value) {
      logger.log(`getAndSet - retrieving value from generator - cacher id: ${this.id}, key: ${key}, options: ${JSON.stringify(options)}`);
      value = yield* generator();

      this.set(key, value, options);
    }

    logger.log(`getAndSet - cacher id: ${this.id}, key: ${key}, value: ${JSON.stringify(value)}`);
    return value;
  }

  set(key, value, options) {
    options = options || {};

    if (!this.storeUndefinedObjects && (value === undefined || value === null || (typeof value.isNull === "function" && value.isNull()))) {
      logger.log(`set - not storing value as it is not defined - cacher id: ${this.id}, key: ${key}, value: ${JSON.stringify(value)}, options: ${JSON.stringify(options)}`);
      this.remove(key, options);
      return;
    }

    if (!options.keyCleaned) {
      key = this.cleanKey(key);
    }

    let ttl = options.ttl || this.ttl;
    let expiryDate;

    if (ttl === 0) {
      expiryDate = new Date(8640000000000000);
    }
    else {
      expiryDate = new Date(new Date().getTime() + (ttl * 1000))
    }

    let valueToCache = this.clone === true ? clone(value) : value;
    let cacheValue = {
      value: valueToCache,
      expires: expiryDate
    };
    this.cachedData[key] = cacheValue;

    logger.log(`set - stored value - cacher id: ${this.id}, key: ${key}, cachedData: ${JSON.stringify(cacheValue)}`);
  }

  clear() {
    logger.log(`clear - cacher id: ${this.id}`);
    this.cachedData = {};
  }

  remove(key, options) {
    options = options || {};
    if (!options.keyCleaned) {
      key = this.cleanKey(key);
    }
    logger.log(`remove - key: ${key}, cacher id: ${this.id}`);
    delete this.cachedData[key];
  }

  cachedItemsCount() {
    let count = Object.keys(this.cachedData).length;
    logger.log(`cachedItemsCount - ${count}, cacher id: ${this.id}`);
    return count;
  }

  keys() {
    let keys = Object.keys(this.cachedData);
    logger.log(`keys - cacher id: ${this.id}, keys: ${JSON.stringify(keys)}`);
    return keys;
  }

}

module.exports = Cacher;