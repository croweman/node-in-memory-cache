# cache-memory

[![build status](https://travis-ci.org/croweman/node-in-memory-cache.svg)](https://travis-ci.org/croweman/node-in-memory-cache) [![npm version](https://badge.fury.io/js/cache-memory.svg)](https://www.npmjs.com/package/cache-memory)

Node module for in memory caching.

## Installation

With [npm](http://npmjs.org)


If using a node version that supports async/await do

```bash
$ npm install cache-memory --save
```

Otherwise do

```bash
$ npm install cache-memory@1.0.10 --save
```

## Example usage

```js
'use strict';

const cache = require('cache-memory')
  .ttl(60)
  .storeUndefinedObjects(false)
  .cleanup(60)
  .create({ id: 'snacks' });

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
```

Example console output of executed code:

```js
Result 1: {"value":{"snack":"crisps"},"expiry":"2017-04-18T08:15:19.087Z"}
Result 2: {"value":{"snack":"chocolate"},"expiry":"2017-04-18T08:15:19.091Z"}
```

## API

## Cache - cache-memory object

Object is used to create cacher instances, default configuration variables and scheduled object cleanup.

## create

```js
let cacher = require('cache-memory')
    .create([options]);
```

Creates a new cacher instance.

### options
 - `clone`: (default: `true`) Defines whether objects should be cloned when set in and retrieved from cache.
 - `id`: The id of the cacher (string value).
 - `storeUndefinedObjects`: (default: false) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: `0`) Defines in seconds how long an object should be stored in memory.
   `0` = Forever
 - `hit`: Function called §every time an object is retrieved from cache.
 - `miss`: Function called every time an object is not from cache.
 - `added`: Function called every time an object is added to cache.
 - `removed`: Function called every time an object is removed from cache.
 - `count`: Function called every time an object is added or removed from cache.

** hit, miss, added, removed functions are all called with the following object structure.

```js
{
  id: 'some-id',
  key: 'some-key'
}
```

** count function is called with the following object structure.

```js
{
  id: 'some-id',
  count: 123
}
```

## clone

```js
require('cache-memory')
    .clone(false);
```

Turns off object cloning (default `true`).

## storeUndefinedObjects

```js
require('cache-memory')
    .storeUndefinedItems(true);
```

Allows undefined objects to be stored in cache (default `false`).

## cleanup

```js
require('cache-memory')
    .cleanup(60);
```

Forces expired objects to be removed from cache every `60` seconds.  By default `no cleanup` is performed.

## clear

```js
require('cache-memory')
  .clear();
```

Clears the in memory cache of all active cache instances.

## cachers

```js
let cachers = require('cache-memory').cachers();
```

Gets all active cache instances.

## cacher

```js
let cacher = require('cache-memory').cacher('snacks');
```

Gets an active cacher by it's id.

## stats

```js
let stats = require('cache-memory').stats();
```

Gets an array of stats across all active cachers.

```js
[
  {
    id: '1',
    stats: {
      count: 5,
      hits: 17123,
      misses: 57,
      hitRate: 0.9966821885913854
    }
  }
]
```

## Cache - created cache-memory instance

It's functions are defined below.

## get

```js
let obj = cache.get(key, [options]);
```

Gets an object from cache, undefined will be returned if object does not exist.

### options
 - `clone`: (default: `true`) Defines whether objects should be cloned when set in and retrieved from cache.
 - `id`: The id of the cacher (string value).
 - `storeUndefinedObjects`: (default: `false`) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: `0`) Defines in seconds how long an object should be stored in memory.
   `0` = Forever
 - `hit`: Function called every time an object is retrieved from cache.
 - `miss`: Function called every time an object is not from cache.
 - `added`: Function called every time an object is added to cache.
 - `removed`: Function called every time an object is removed from cache.
 - `count`: Function called every time an object is added or removed from cache.

** hit, miss, added, removed functions are all called with the following object structure.

```js
{
  id: 'some-id',
  key: 'some-key'
}
```

** count function is called with the following object structure.

```js
{
  id: 'some-id',
  count: 123
}
```

## getExpiry

```js
let expiry = cache.getExpiry(key);
```

Gets the expiry DateTime of an object in cache, undefined is returned if object is not found.

## set

```js
cache.set(key, value, [options]);
```

Stores an object in cache.

## options
 - `storeUndefinedObjects`: (default: global or instance level definition) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: global or instance level definition) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

If 'storeUndefinedObjects' is false. undefined, null and objects with an IsNull function that returns true will not be stored.

## getAndSet v2.*

Version 2.* of the modules getAndSet function is an `async` function

### async getAndSet

```js
async function getter() {
  return 'hello-world-' + Math.random(0, 100);
}

await cache.getAndSet(key, getter, [options]);
```

Gets and sets an object in cache.  The getAndSet function is a `generator` function so should be yielded or Promisified etc.

### options
 - `storeUndefinedObjects`: (default: global or instance level definition) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: global or instance level definition) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

## getAndSet v1.*

Version 1.* of the modules getAndSet function is a `generator` function

### * getAndSet

```js
yield* cache.getAndSet(key, [options]);
```

Gets and sets an object in cache.  The getAndSet function is a `generator` function so should be yielded or Promisified etc.

### options
 - `generator`: A generator function that will be yielded to return the object value to store in cache.
 - `storeUndefinedObjects`: (default: global or instance level definition) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: global or instance level definition) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

## clear

```js
cache.clear();
```

Removes all objects from the cache instance.

## remove

```js
cache.remove(key);
```

Remove the object from cache.

## stats

```js
let stats = cache.stats();
```

Gets the stats for the cache instance.

Example return value:

```js
{
  count: 5,
  hits: 17123,
  misses: 57,
  hitRate: 0.9966821885913854
}
```

## keys

```js
let keys = cache.keys();
```

Gets all keys for objects stored in the cache instance.

## options

```js
let options = cache.options();
```

Gets all configured options for a cache instance.

Example return value:

```js
{
  ttl: 60,
  clone: true,
  storeUndefinedObjects: false
}
```

## License

(MIT)

Copyright (c) 2017 Lee Crowe

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
