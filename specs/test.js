'use strict';
//const cache = require('mem-cache').create();
const cache = require('../index')
  .create({ ttl: 60});

function * getData() {
  return { snack: 'chocolate' };
}

function standardGetAndSetExample() {
  const key = 'the_key1';
  let result = cache.get(key);

  if (!result) {
    cache.set(key, { snack: 'crisps'});
    result = cache.get(key);
  }

  return { value: result, expiry: cache.getExpiry(key) };
}

function * generatorGetAndSetExample() {
  const key = 'the_key2';

  let result = yield* cache.getAndSet(key, {
    generator: function * () {
      return yield* getData();
    }
  });

  return { value: result, expiry: cache.getExpiry(key) };
}

console.log(`Result 1: ${JSON.stringify(standardGetAndSetExample())}`);
console.log(`Result 2: ${JSON.stringify(generatorGetAndSetExample().next().value)}`);