'use strict';
const Promise = require('bluebird');
//const cache = require('in-memory-cache').create();
const cache = require('./index').create();

function * getData() {
  return { handle: 'blah' };
}

function standardGetAndSetExample() {
  console.log('standardGetAndSetExample: start');
  const key = 'the_key1';
  let result = cache.get(key);
  console.log(`result 1: ${JSON.stringify(result)}`);
  cache.set(key, { fish: 'chips' });
  result = cache.get(key);
  console.log(`result 1: ${JSON.stringify(result)}`);
  console.log('standardGetAndSetExample: end');
}

function * generatorGetAndSetExample() {
  console.log('generatorGetAndSetExample: start');
  const key = 'the_key2';

  let result = yield* cache.getAndSet(key, {
    generator: function * () {
      return yield* getData();
    }
  });
  console.log(`result 1: ${JSON.stringify(result)}`);
  console.log(`result 2: ${JSON.stringify(cache.get(key))}`);
  console.log(`expiry: ${cache.getExpiry(key)}`)
  console.log('generatorGetAndSetExample: end');
}

standardGetAndSetExample();

Promise.coroutine(generatorGetAndSetExample)()
  .then(() => { console.log('done'); });