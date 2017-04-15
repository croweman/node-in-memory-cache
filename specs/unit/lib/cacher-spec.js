"use strict";
const Cacher = require('../../../index');
const Promise = require('bluebird');
const uuid = require('uuid').v4;

describe('cacher', () => {

  describe('create - new instance', () => {

    describe('constructor', () => {

      it('correctly creates a new instance with no options (defaults)', () => {
        let cache = Cacher.create();
        cache.id.length.should.equal(36);
        cache.ttl.should.equal(300);
        cache.clone.should.equal(true);
        cache.storeUndefinedItems.should.equal(false);
        Object.keys(cache.cachedData).length.should.equal(0);
      });

      it('correctly creates a new instance with defined options', () => {
        let cache = Cacher.create({
          id: 'Blah',
          ttl: 600,
          clone: false,
          storeUndefinedItems: true
        });
        cache.id.should.equal('Blah');
        cache.ttl.should.equal(600);
        cache.clone.should.equal(false);
        cache.storeUndefinedItems.should.equal(true);
        Object.keys(cache.cachedData).length.should.equal(0);
      });
    });

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
    
    describe('getExpiry', () => {

      it('returns undefined if item does not exist in cache', () => {

        let cache = Cacher.create({ ttl: 10 });
        let value = cache.getExpiry('key');
        (!value).should.equal(true);
      });

      it('returns the expiry if it exists in cache', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let d = new Date();
        cache.set(key, {});
        let expires = cache.getExpiry(key);
        let expiryTime = expires.getTime();
        let expectedExpiryTime = d.getTime() + (10 * 1000);
        (expectedExpiryTime >= expiryTime - 1 && expectedExpiryTime <= expiryTime + 1).should.equal(true);
      });

      it('returns undefined if item in cache has expired', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 1 });
        cache.set(key, 'cheese');
        let value = cache.get(key);
        value.should.equal('cheese');

        setTimeout(() => {
          let expiry = cache.getExpiry(key);
          (!expiry).should.equal(true);
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

      it('removes an object from cache, if item is now be set to an undefined value', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, {});
        value = cache.get(key);
        (value !== undefined).should.equal(true);
        cache.set(key, undefined);
        value = cache.get(key);
        (!value).should.equal(true);
      })

      describe('storeUndefinedItems option is false (default)', () => {

        it('does not store an object in cache if "undefined"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, undefined);
          value = cache.get(key);
          (!value).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry === undefined).should.equal(true);
        });

        it('does not store an object in cache if "null"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, null);
          value = cache.get(key);
          (!value).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry === undefined).should.equal(true);
        });

        it('does not store an object in cache if it is defined and has an isNull function that returns true', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, { isNull: () => { return true }});
          value = cache.get(key);
          (!value).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry === undefined).should.equal(true);
        });

        it('does store an object in cache if it is defined and has an isNull function that returns false', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, { isNull: () => { return false }});
          value = cache.get(key);
          (value !== undefined).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry !== undefined).should.equal(true);
        });

      });

      describe('storeUndefinedItems option is true', () => {

        it('does store an object in cache if "undefined"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedItems: true });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, undefined);
          value = cache.get(key);
          (!value).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry !== undefined).should.equal(true);
        });

        it('does store an object in cache if "null"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedItems: true });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, null);
          value = cache.get(key);
          (!value).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry !== undefined).should.equal(true);
        });

        it('does store an object in cache if it is defined and has an isNull function that returns true', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedItems: true });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, { isNull: () => { return true }});
          value = cache.get(key);
          (value !== undefined).should.equal(true);
          let expiry = cache.getExpiry(key);
          (expiry !== undefined).should.equal(true);
        });

        it('does store an object in cache if it is defined and has an isNull function that returns false', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedItems: true });
          let value = cache.get(key);
          (!value).should.equal(true);
          cache.set(key, { isNull: () => { return false }});
          let expiry = cache.getExpiry(key);
          (expiry !== undefined).should.equal(true);
          value = cache.get(key);
          (typeof value.isNull).should.equal('function');
        });

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

    describe('remove', () => {

      it('removes an item from cache', () => {

        const key1 = 'thekey';
        const key2 = 'thekey2';
        let cache = Cacher.create({ ttl: 10 });
        cache.set(key1, 'cheese');
        cache.set(key2, 'peas');
        cache.get(key1).should.equal('cheese');
        cache.get(key2).should.equal('peas');
        cache.remove(key1);
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
    
    describe('keys', () => {

      it('returns the correct keys in cache', () => {
        let cache = Cacher.create({ ttl: 10 });
        cache.set('one', {});
        cache.set('one', {});
        cache.set('two', {});

        let keys = cache.keys();
        keys.length.should.equal(2);
        keys[0].should.equal('one');
        keys[1].should.equal('two');
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
  
  describe('cacher', () => {

    it('returns undefined if cacher could not be found by id and no cachers are defined', () => {
      let cacher = Cacher.cacher('blah');
      (!cacher).should.equal(true);
    });

    it('returns undefined if cacher could not be found by id and cachers are defined', () => {
      Cacher.create({ ttl: 1, id: 'peas' });
      let cacher = Cacher.cacher('blah');
      (!cacher).should.equal(true);
    });

    it('returns cacher if found by id', () => {
      Cacher.create({ ttl: 1, id: 'blah' });
      let cacher = Cacher.cacher('blah');
      (!cacher).should.equal(false);
    });

  });

  describe('cachers', () => {

    it('returns all cachers', () => {
      Cacher.create({ ttl: 1, id: 'one' });
      Cacher.create({ ttl: 1, id: 'two' });
      Cacher.create({ ttl: 1, id: 'three' });
      Cacher.cachers().length.should.equal(33);
    });

  });

  describe('cleanup', () => {

    it('cleans up expired values', (done) => {
      let cache = Cacher.create({ ttl: 1 });
      cache.set('one', {});
      cache.set('two', {});
      cache.keys().length.should.equal(2);

      Cacher.cleanup(1);

      setTimeout(() => {
        cache.keys().length.should.equal(0);
        done();
      }, 1010);

    });
  });

  describe('overriding defaults and creating new instance', () => {

    it('instantiates the object correctly with defaults', () => {
      let cacher = Cacher
        .create({ id: 'test' });

      cacher.id.should.equal('test');
      cacher.ttl.should.equal(300);
      cacher.clone.should.equal(true);
      cacher.storeUndefinedItems.should.equal(false);
    });

    it('instantiates the object correctly with overriden defaults', () => {
      let cacher = Cacher
        .ttl(1234)
        .clone(false)
        .storeUndefinedItems(true)
        .cleanup(5)
        .create({ id: 'test' });

      cacher.id.should.equal('test');
      cacher.ttl.should.equal(1234);
      cacher.clone.should.equal(false);
      cacher.storeUndefinedItems.should.equal(true);
    });

  });

});