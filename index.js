'use strict'

const Cacher = require('./lib/cacher');

var cachers = [];

function getCachers() {
  cachers = cachers.filter((cacher) => { return cacher !== undefined && cacher !== null });
  return cachers;
}

module.exports = {
  create: (options) => {
    let cacher = new Cacher(options);
    cachers.push(cacher);
    return cacher;
  },
  clear: () => {

    getCachers().forEach((cacher) => {
      cacher.clear();
    });
  },
  cachedItemsCount: () => {
    let counter = 0;

    getCachers().forEach((cacher) => {
      counter += Object.keys(cacher.cachedData).length;
    });

    return counter;
  }
};
