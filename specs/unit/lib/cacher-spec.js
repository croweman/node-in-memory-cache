"use strict";
const Cacher = require('../../../index');
const Promise = require('bluebird');
const uuid = require('uuid').v4;

describe('cacher', () => {

  beforeEach(() => {
    Cacher.clear();
  });

  describe('create - new instance', () => {

    describe('get', () => {

      it('returns undefined if item does not exist in cache', () => {

        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get('key');
        (!value).should.equal(true);
      });

      it('returns an item if it exists in cache', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, 'cheese');
        value = cache.get(key);
        value.should.equal('cheese');
      });

      it('does not return an item if cache has expired', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 1 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, 'cheese');
        value = cache.get(key);
        value.should.equal('cheese');

        setTimeout(() => {
          let value = cache.get(key);
          (!value).should.equal(true);
        }, 1010);
      });

    });

    describe('set', () => {

      it('stores an object in cache', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, 'peas');
        value = cache.get(key);
        value.should.equal('peas');
        Cacher.cachedItemsCount().should.equal(1);
      });

      it('does not store an object in cache if "undefined"', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, undefined);
        value = cache.get(key);
        (!value).should.equal(true);
      });

      it('does not store an object in cache if "null"', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, null);
        value = cache.get(key);
        (!value).should.equal(true);
      });

      it('does not store an object in cache if it is defined and has an isNull function that returns true', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, { isNull: () => { return true }});
        value = cache.get(key);
        (!value).should.equal(true);
      });

      it('does store an object in cache if it is defined and has an isNull function that returns false', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, { isNull: () => { return false }});
        value = cache.get(key);
        (value !== undefined).should.equal(true);
        (typeof value.isNull).should.equal('function');
      });

    });

    describe('clear', () => {

      it('removes all items from cache', () => {

        const key1 = 'thekey';
        const key2 = 'thekey2';
        let cache = Cacher.create({ ttl: 10 });
        cache.set(key1, 'cheese');
        cache.set(key2, 'peas');
        cache.get(key1).should.equal('cheese');
        cache.get(key2).should.equal('peas');
        cache.clear();
        (!cache.get(key1)).should.equal(true);
        (!cache.get(key2)).should.equal(true);
      });

    });

    describe('invalidate', () => {

      it('removes an item from cache', () => {

        const key1 = 'thekey';
        const key2 = 'thekey2';
        let cache = Cacher.create({ ttl: 10 });
        cache.set(key1, 'cheese');
        cache.set(key2, 'peas');
        cache.get(key1).should.equal('cheese');
        cache.get(key2).should.equal('peas');
        cache.invalidate(key1);
        (!cache.get(key1)).should.equal(true);
        cache.get(key2).should.equal('peas');
      });

    });

    describe('getAndSet', () => {

      it('correctly retrieves and sets values in cache', (done) => {

        function * test() {
          function * getData() {
            return 'hello-world-' + uuid();
          }

          const key = 'thekey';
          let cache = Cacher.create({ttl: 10});
          let value = cache.get(key);
          (!value).should.equal(true);

          value = yield* cache.getAndSet(key, { generator: getData });
          value.startsWith('hello-world').should.equal(true);
          let value2 = yield* cache.getAndSet(key, { generator: getData });
          value2.should.equal(value);
        }

        Promise.coroutine(test)()
          .then(() => { done(); })
          .catch((err) => { done(err); });
      });

    });

    describe('cachedItemsCount', () => {

      it('returns the correct number of items in cache', () => {
        let cache = Cacher.create({ ttl: 10 });
        cache.cachedItemsCount().should.equal(0);
        cache.set('one', {});
        cache.cachedItemsCount().should.equal(1);
        cache.set('one', {});
        cache.cachedItemsCount().should.equal(1);
        cache.set('two', {});
        cache.cachedItemsCount().should.equal(2);
      });
    });

  });

  describe('clear', () => {

    it('clears the cache across all cacher instances in memory', () => {

      let cache1 = Cacher.create({ ttl: 1 });
      cache1.set('one', {});
      let cache2 = Cacher.create({ ttl: 1 });
      cache2.set('one', {});

      Cacher.cachedItemsCount().should.equal(2);
      Cacher.clear();
      Cacher.cachedItemsCount().should.equal(0);
    });

  });

  describe('cachedItemsCount', () => {

    it('returns the total cached items count across all cacher instances in memory', () => {

      let cache1 = Cacher.create({ ttl: 1 });
      cache1.set('one', {});
      let cache2 = Cacher.create({ ttl: 1 });
      cache2.set('one', {});
      cache2.set('two', {});
      let cache3 = Cacher.create({ ttl: 1 });
      cache3.set('one', {});
      cache3.set('two', {});
      cache3.set('three', {});

      Cacher.cachedItemsCount().should.equal(6);
    });

  });
  
});