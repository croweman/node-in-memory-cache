"use strict";
const Cacher = require('../../../index');
const Promise = require('bluebird');

describe('cacher', () => {

  describe('create - new instance', () => {

    describe('constructor', () => {

      it('correctly creates a new instance with no options (defaults)', () => {
        let cache = Cacher.create();
        cache.id.length.should.equal(1);
        let options = cache.options();
        options.ttl.should.equal(0);
        options.clone.should.equal(true);
        options.storeUndefinedObjects.should.equal(false);
        cache.stats().count.should.equal(0);
      });

      it('correctly creates a new instance with defined options', () => {
        let cache = Cacher.create({
          id: 'Blah',
          ttl: 600,
          clone: false,
          storeUndefinedObjects: true
        });
        cache.id.should.equal('Blah');
        let options = cache.options();
        options.ttl.should.equal(600);
        options.clone.should.equal(false);
        options.storeUndefinedObjects.should.equal(true);
        cache.stats().count.should.equal(0);
      });
    });

    describe('get', () => {

      it('returns undefined if item does not exist in cache', () => {

        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get('key');
        (!value).should.equal(true);
      });

      it('calls the miss callback if item does not exist in cache', () => {

        let missArg = undefined;
        function miss(arg) { missArg = arg; }
        let cache = Cacher.create({ ttl: 10, miss: miss });
        let value = cache.get('key');
        (!value).should.equal(true);
        missArg.id.should.equal('3');
        missArg.key.should.equal('key');
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

      it('calls the hit callback an item if it exists in cache', () => {

        let hitArg = undefined;
        function hit(arg) { hitArg = arg; }
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10, hit: hit });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, 'cheese');
        value = cache.get(key);
        value.should.equal('cheese');
        hitArg.id.should.equal('5');
        hitArg.key.should.equal('thekey');
      });

      it('does not return an item if cache has expired', (done) => {

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
          done();
        }, 3000);
      });

      describe('clone enabled', () => {

        it('when updating an object it does not update the in memory cache', () => {
          const key = 'thekey';
          let cache = Cacher
            .create({ ttl: 60, clone: true });

          let obj = { num: 1 };
          cache.set(key, obj);
          obj.num = 2;
          let value = cache.get(key);
          value.num.should.equal(1);
        });
      });

      describe('clone disabled', () => {

        it('when updating an object it updates the in memory cache', () => {
          const key = 'thekey';
          let cache = Cacher
            .create({ ttl: 60, clone: false });

          let obj = { num: 1 };
          cache.set(key, obj);
          obj.num = 2;
          let value = cache.get(key);
          value.num.should.equal(2);
        });

      });

    });
    
    describe('getExpiry', () => {

      it('returns undefined if item does not exist in cache', () => {

        let cache = Cacher.create({ ttl: 10 });
        let value = cache.getExpiry('key');
        (!value).should.equal(true);
      });

      it('returns the correct expiry if it exists in cache', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let d = new Date();
        cache.set(key, {});
        let expires = cache.getExpiry(key);
        let expiryTime = expires.getTime();
        let expectedExpiryTime = d.getTime() + (10 * 1000);
        (expectedExpiryTime >= expiryTime - 1 && expectedExpiryTime <= expiryTime + 1).should.equal(true);
      });

      it('returns the correct expiry if it exists in cache and ttl was set to 0 (infinite)', () => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 0 });
        cache.set(key, {});
        let expires = cache.getExpiry(key);
        expires.getTime().should.equal(8640000000000000);
      });

      it('returns undefined if item in cache has expired', (done) => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 1 });
        cache.set(key, 'cheese');
        let value = cache.get(key);
        value.should.equal('cheese');

        setTimeout(() => {
          let expiry = cache.getExpiry(key);
          (!expiry).should.equal(true);
          done();
        }, 3000);
      });

      it('calls the removed and count callback if the items has expired', (done) => {

        let removedArg = undefined;
        let countArg = undefined;
        function removed(arg) { removedArg = arg; }
        function count(arg) { countArg = arg; }

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 1, removed: removed, count: count });
        cache.set(key, 'cheese');
        let value = cache.get(key);
        value.should.equal('cheese');

        setTimeout(() => {
          let expiry = cache.getExpiry(key);
          (!expiry).should.equal(true);
          
          removedArg.id.should.equal('13');
          removedArg.key.should.equal('thekey');
          countArg.id.should.equal('13');
          countArg.count.should.equal(0);
          done();
        }, 3000);
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
        cache.stats().count.should.equal(1);
      });

      it('calls the added and count callback', () => {

        let addedArg = undefined;
        let countArg = undefined;
        function added(arg) { addedArg = arg; }
        function count(arg) { countArg = arg; }
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10, added: added, count: count });
        let value = cache.get(key);
        (!value).should.equal(true);
        cache.set(key, 'peas');
        value = cache.get(key);
        value.should.equal('peas');
        cache.stats().count.should.equal(1);
        addedArg.id.should.equal('15');
        addedArg.key.should.equal('thekey');
        countArg.id.should.equal('15');
        countArg.count.should.equal(1);
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

      describe('storeUndefinedObjects option is false (default)', () => {

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

      describe('storeUndefinedObjects option is true', () => {

        it('does store an object in cache if "undefined"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
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
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
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
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
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
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
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

      it('correctly retrieves and sets values in cache when using generators', (done) => {

        function * test() {
          function * getData() {
            return 'hello-world-' + Math.random(0, 100);
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

    describe('stats', () => {

      it('returns the correct count of items', () => {
        let cache = Cacher.create({ ttl: 10 });
        cache.stats().count.should.equal(0);
        cache.set('one', {});
        cache.stats().count.should.equal(1);
        cache.set('one', {});
        cache.stats().count.should.equal(1);
        cache.set('two', {});
        cache.stats().count.should.equal(2);
      });

      it('returns correct stats', () => {
        let cache = Cacher.create({ttl: 10});
        cache.get('a');
        cache.get('b');
        cache.get('c');

        cache.set('d', {});
        cache.get('d');

        let stats = cache.stats();
        stats.count.should.equal(1);
        stats.hits.should.equal(1);
        stats.misses.should.equal(3);
        stats.hitRate.should.equal(0.25);

        cache.clear();
        stats = cache.stats();
        stats.count.should.equal(0);
        stats.hits.should.equal(0);
        stats.misses.should.equal(0);
        stats.hitRate.should.equal(0);

        cache.get('a');
        cache.set('a', {});
        cache.get('a');
        cache.get('a');
        cache.get('a');

        stats = cache.stats();
        stats.count.should.equal(1);
        stats.hits.should.equal(3);
        stats.misses.should.equal(1);
        stats.hitRate.should.equal(0.75);
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

      let count = 0;
      Cacher.stats().forEach((cache) => {
        count += cache.stats.count;
      });

      count.should.equal(2);
      Cacher.clear();

      count = 0;
      Cacher.stats().forEach((cache) => {
        count += cache.stats.count;
      });
      count.should.equal(0);
    });

  });

  describe('stats', () => {

    it('returns the total cached items count across all cacher instances in memory', () => {

      let cache = Cacher.cachers()[0];
      cache.clear();
      cache.set('one', {});
      cache.get('one');
      cache.get('two');

      let stats = Cacher.stats();
      (stats.length > 1).should.equal(true);
      stats[0].stats.count.should.equal(1);
      stats[0].stats.hits.should.equal(1);
      stats[0].stats.misses.should.equal(1);
      stats[0].stats.hitRate.should.equal(0.5);
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
      Cacher.cachers().length.should.equal(38);
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
      }, 3000);

    });
  });

  describe('overriding defaults and creating new instance', () => {

    it('instantiates the object correctly with defaults', () => {
      let cacher = Cacher
        .create({ id: 'test' });

      cacher.id.should.equal('test');
      let options = cacher.options();
      options.ttl.should.equal(0);
      options.clone.should.equal(true);
      options.storeUndefinedObjects.should.equal(false);
    });

    it('instantiates the object correctly with overriden defaults', () => {
      let cacher = Cacher
        .ttl(1234)
        .clone(false)
        .storeUndefinedObjects(true)
        .cleanup(5)
        .create({ id: 'test' });

      cacher.id.should.equal('test');
      let options = cacher.options();
      options.ttl.should.equal(1234);
      options.clone.should.equal(false);
      options.storeUndefinedObjects.should.equal(true);
    });

  });

  describe('dispose', () => {

    it('disposes of all cachers', () => {
      Cacher.create({ ttl: 1, id: 'one' });
      Cacher.create({ ttl: 1, id: 'two' });
      Cacher.create({ ttl: 1, id: 'three' });
      Cacher.cachers().length.should.equal(44);

      let intervalId = Cacher.getCleanupIntervalId();
      (intervalId !== undefined).should.be.true;

      Cacher.dispose();

      Cacher.cachers().length.should.equal(0);
      intervalId = Cacher.getCleanupIntervalId();
      (intervalId === undefined).should.be.true;
    });

  });

});