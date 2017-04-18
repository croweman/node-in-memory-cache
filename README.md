# mem-cache

[![build status](https://travis-ci.org/croweman/in-memory-cache.svg)](https://travis-ci.org/croweman/in-memory-cache) [![npm version](https://badge.fury.io/js/in-memory-cache.svg)](https://www.npmjs.com/package/cache-memory)

Node module for in memory caching.

## Installation

With [npm](http://npmjs.org) do

```bash
$ npm install mem-cache --save
```

## Example usage

```js
'use strict';
const cache = require('mem-cache')
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
```

Example console output of executed code:

```js
Result 1: {"value":{"snack":"crisps"},"expiry":"2017-04-18T08:15:19.087Z"}
Result 2: {"value":{"snack":"chocolate"},"expiry":"2017-04-18T08:15:19.091Z"}
```

##API

## Cache

# create

```js
let cacher = require('mem-cache')
    .clone(false );
```

Creates a new cacher instance.

# options
 - `clone`: (default: `true`) Defines whether objects should be cloned when set in and retrieved from cache.
 - `id`: The id of the cacher (string value).
 - `storeUndefinedObjects`: (default: false) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: `0`) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

# clone

```js
require('mem-cache')
    .clone(false );
```

Turns off object cloning (default `true`).

# storeUndefinedObjects

```js
require('mem-cache')
    .storeUndefinedItems(true);
```

Allows undefined objects to be stored in cache (default `false`).

# cleanup

```js
require('mem-cache')
    .cleanup(60);
```

Forces expired objects to be removed from cache every `60` seconds.  By default `no cleanup` is performed.

# clear

```js
require('mem-cache').clear();
```

Clears the in memory cache of all active cache instances.

# cachers

```js
let cachers = require('mem-cache').cachers();
```

Gets all active cache instances.

# cacher

```js
let cacher = require('mem-cache').cacher('snacks');
```

Gets an active cacher by it's id.

# cachedItemsCount

```js
let count = require('mem-cache').cachedItemsCount();
```

Gets the total count of cached objects across all active cachers.

## Cache instance

# get

```js
cache.get(key, [options]);
```

Gets an object from cache, undefined will be returned if object does not exist.

# options
 - `clone`: (default: `true`) Defines whether objects should be cloned when set in and retrieved from cache.
 - `id`: The id of the cacher (string value).
 - `storeUndefinedObjects`: (default: `false`) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: `0`) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

# getExpiry

```js
cache.getExpiry(key);
```

Gets the expiry DateTime of an object in cache, undefined is returned if object is not found.

# set

```js
cache.set(key, value, [options]);
```

Stores an object in cache.

# options
 - `storeUndefinedObjects`: (default: global or instance level definition) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: global or instance level definition) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

If 'storeUndefinedObjects' is false. undefined, null and objects with an IsNull function that returns true will not be stored.

# * getAndSet

```js
cache.getAndSet(key, [options]);
```

Gets and sets an object in cache.  The getAndSet function is a `generator` function so should be yielded or Promisied etc.

# options
 - `generator`: A generator function that will be yielded to return the object value to store in cache.
 - `storeUndefinedObjects`: (default: global or instance level definition) Defines whether undefined objects should be stored in memory.
 - `ttl`: (default: global or instance level definition) Defines in seconds how long an object should be stored in memory.
   `0` = Forever

# clear

```js
cache.clear();
```

Removes all objects from the cache instance.

# remove

```js
cache.remove(key);
```

Remove the object from cache.

# cachedItemsCount

```js
cache.cachedItemsCount();
```

Gets the number of objects stored in the cache instance.

# keys

```js
cache.keys();
```

Gets all keys for objects stored in the cache instance.

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
