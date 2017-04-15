"use strict";

class Cacher {

  constructor(options) {
    this.ttl = options.ttl || 5 * 60;
    this.cachedData = {};
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
      this.invalidate(key, {keyCleaned: true});
    }

    return data ? data.value : undefined;
  }

  * getAndSet(key, options) {
    options = options || {};
    options.keyCleaned = true;
    let generator = options.generator;

    if (!generator) {
      return undefined;
    }

    key = this.cleanKey(key);
    let value = this.get(key, options);

    if (!value) {
      value = yield* generator();
      this.set(key, value, options);
    }

    return value;
  }

  set(key, value, options) {
    options = options || {};

    if (value === undefined || value === null || (typeof value.isNull === "function" && value.isNull())) {
      this.invalidate(key, options);
      return;
    }

    if (!options.keyCleaned) {
      key = this.cleanKey(key);
    }

    let ttl = options.ttl || this.ttl;

    this.cachedData[key] = {
      value: value,
      expires: moment().add(ttl, 'seconds').toDate()
    };
  }

  clear() {
    this.cachedData = {};
  }

  invalidate(key, options) {
    options = options || {};
    if (!options.keyCleaned) {
      key = this.cleanKey(key);
    }
    delete this.cachedData[key];
  }

  cachedItemsCount() {
    return Object.keys(this.cachedData).length;
  }

}

module.exports = Cacher;