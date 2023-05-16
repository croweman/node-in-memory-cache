import Cacher from '../../../index';

describe('cacher', () => {

  describe('create - new instance', () => {

    describe('constructor', () => {

      it('correctly creates a new instance with no options (defaults)', () => {
        let cache = Cacher.create();
        expect(cache.id.length).toEqual(1);
        let options = cache.options();
        expect(options.ttl).toEqual(0);
        expect(options.clone).toEqual(true);
        expect(options.storeUndefinedObjects).toEqual(false);
        expect(cache.stats().count).toEqual(0);
      });

      it('correctly creates a new instance with defined options', () => {
        let cache = Cacher.create({
          id: 'Blah',
          ttl: 600,
          clone: false,
          storeUndefinedObjects: true
        });
        expect(cache.id).toEqual('Blah');
        let options = cache.options();
        expect(options.ttl).toEqual(600);
        expect(options.clone).toEqual(false);
        expect(options.storeUndefinedObjects).toEqual(true);
        expect(cache.stats().count).toEqual(0);
      });
    });

    describe('get', () => {

      it('returns undefined if item does not exist in cache', () => {
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get('key');
        expect((!value)).toEqual(true);
      });

      it('calls the miss callback if item does not exist in cache', () => {
        let missArg = undefined;
        function miss(arg) { missArg = arg; }
        let cache = Cacher.create({ ttl: 10, miss: miss });
        let value = cache.get('key');
        expect((!value)).toEqual(true);
        expect(missArg.id).toEqual('3');
        expect(missArg.key).toEqual('key');
      });

      it('returns an item if it exists in cache', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        expect(!value).toEqual(true);
        cache.set(key, 'cheese');
        value = cache.get(key);
        expect(value).toEqual('cheese');
      });

      it('calls the hit callback an item if it exists in cache', () => {
        let hitArg = undefined;
        function hit(arg) { hitArg = arg; }
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10, hit: hit });
        let value = cache.get(key);
        expect(!value).toEqual(true);
        cache.set(key, 'cheese');
        value = cache.get(key);
        expect(value).toEqual('cheese');
        expect(hitArg.id).toEqual('5');
        expect(hitArg.key).toEqual('thekey');
      });

      it('does not return an item if cache has expired', (done) => {

        const key = 'thekey';
        let cache = Cacher.create({ ttl: 1 });
        let value = cache.get(key);
        expect(!value).toEqual(true);
        cache.set(key, 'cheese');
        value = cache.get(key);
        expect(value).toEqual('cheese');

        setTimeout(() => {
          let value = cache.get(key);
          expect(!value).toEqual(true);
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
          expect(value.num).toEqual(1);
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
          expect(value.num).toEqual(2);
        });

      });

    });
    
    describe('getExpiry', () => {

      it('returns undefined if item does not exist in cache', () => {
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.getExpiry('key');
        expect(!value).toEqual(true);
      });

      it('returns the correct expiry if it exists in cache', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let d = new Date();
        cache.set(key, {});
        let expires = cache.getExpiry(key);
        let expiryTime = expires.getTime();
        let expectedExpiryTime = d.getTime() + (10 * 1000);
        expect(expectedExpiryTime >= expiryTime - 1 && expectedExpiryTime <= expiryTime + 1).toEqual(true);
      });

      it('returns the correct expiry if it exists in cache and ttl was set to 0 (infinite)', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 0 });
        cache.set(key, {});
        let expires = cache.getExpiry(key);
        expect(expires.getTime()).toEqual(8640000000000000);
      });

      it('returns undefined if item in cache has expired', (done) => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 1 });
        cache.set(key, 'cheese');
        let value = cache.get(key);
        expect(value).toEqual('cheese');

        setTimeout(() => {
          let expiry = cache.getExpiry(key);
          expect(!expiry).toEqual(true);
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
        expect(value).toEqual('cheese');

        setTimeout(() => {
          let expiry = cache.getExpiry(key);
          expect(!expiry).toEqual(true);

          expect(removedArg.id).toEqual('13');
          expect(removedArg.key).toEqual('thekey');
          expect(countArg.id).toEqual('13');
          expect(countArg.count).toEqual(0);
          done();
        }, 3000);
      });
    });

    describe('set', () => {

      it('stores an object in cache', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        expect(!value).toEqual(true);
        cache.set(key, 'peas');
        value = cache.get(key);
        expect(value).toEqual('peas');
        expect(cache.stats().count).toEqual(1);
      });

      it('calls the added and count callback', () => {
        let addedArg = undefined;
        let countArg = undefined;
        function added(arg) { addedArg = arg; }
        function count(arg) { countArg = arg; }
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10, added: added, count: count });
        let value = cache.get(key);
        expect(!value).toEqual(true);
        cache.set(key, 'peas');
        value = cache.get(key);
        expect(value).toEqual('peas');
        expect(cache.stats().count).toEqual(1);
        expect(addedArg.id).toEqual('15');
        expect(addedArg.key).toEqual('thekey');
        expect(countArg.id).toEqual('15');
        expect(countArg.count).toEqual(1);
      });

      it('removes an object from cache, if item is now be set to an undefined value', () => {
        const key = 'thekey';
        let cache = Cacher.create({ ttl: 10 });
        let value = cache.get(key);
        expect(!value).toEqual(true);
        cache.set(key, {});
        value = cache.get(key);
        expect(value !== undefined).toEqual(true);
        cache.set(key, undefined);
        value = cache.get(key);
        expect(!value).toEqual(true);
      })

      describe('storeUndefinedObjects option is false (default)', () => {

        it('does not store an object in cache if "undefined"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, undefined);
          value = cache.get(key);
          expect(!value).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry === undefined).toEqual(true);
        });

        it('does not store an object in cache if "null"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, null);
          value = cache.get(key);
          expect(!value).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry === undefined).toEqual(true);
        });

        it('does not store an object in cache if it is defined and has an isNull function that returns true', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, { isNull: () => { return true }});
          value = cache.get(key);
          expect(!value).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry === undefined).toEqual(true);
        });

        it('does store an object in cache if it is defined and has an isNull function that returns false', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10 });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, { isNull: () => { return false }});
          value = cache.get(key);
          expect(value !== undefined).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry !== undefined).toEqual(true);
        });
      });

      describe('storeUndefinedObjects option is true', () => {

        it('does store an object in cache if "undefined"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, undefined);
          value = cache.get(key);
          expect(!value).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry !== undefined).toEqual(true);
        });

        it('does store an object in cache if "null"', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, null);
          value = cache.get(key);
          expect(!value).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry !== undefined).toEqual(true);
        });

        it('does store an object in cache if it is defined and has an isNull function that returns true', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, { isNull: () => { return true }});
          value = cache.get(key);
          expect(value !== undefined).toEqual(true);
          let expiry = cache.getExpiry(key);
          expect(expiry !== undefined).toEqual(true);
        });

        it('does store an object in cache if it is defined and has an isNull function that returns false', () => {
          const key = 'thekey';
          let cache = Cacher.create({ ttl: 10, storeUndefinedObjects: true });
          let value = cache.get(key);
          expect(!value).toEqual(true);
          cache.set(key, { isNull: () => { return false }});
          let expiry = cache.getExpiry(key);
          expect(expiry !== undefined).toEqual(true);
          value = cache.get(key);
          expect(typeof value.isNull).toEqual('function');
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
        expect(cache.get(key1)).toEqual('cheese');
        expect(cache.get(key2)).toEqual('peas');
        cache.clear();
        expect(!cache.get(key1)).toEqual(true);
        expect(!cache.get(key2)).toEqual(true);
      });

    });

    describe('remove', () => {

      it('removes an item from cache', () => {
        const key1 = 'thekey';
        const key2 = 'thekey2';
        let cache = Cacher.create({ ttl: 10 });
        cache.set(key1, 'cheese');
        cache.set(key2, 'peas');
        expect(cache.get(key1)).toEqual('cheese');
        expect(cache.get(key2)).toEqual('peas');
        cache.remove(key1);
        expect(!cache.get(key1)).toEqual(true);
        expect(cache.get(key2)).toEqual('peas');
      });

    });

    describe('getAndSet', () => {

      it('correctly retrieves and sets values in cache when using async getter', (done) => {
        async function test() {
          async function getData() {
            // @ts-ignore
            return 'hello-world-' + Math.random(0, 100);
          }

          const key = 'thekey';
          let cache = Cacher.create({ttl: 10});
          let value = cache.get(key);
          expect(!value).toEqual(true);
          value = await cache.getAndSet(key, getData, {});
          expect(value.startsWith('hello-world')).toEqual(true);
          let value2 = await cache.getAndSet(key, getData, {});
          expect(value2).toEqual(value);
          done();
        }

        test();
      });

      it('correctly retrieves and sets values in cache when using async getter and refresh', async () => {
        let counter = 0;

        async function getData() {
          counter++;
          // @ts-ignore
          return 'hello-world-' + counter;
        }

        const key = 'thekey';
        let cache = Cacher.create({ttl: 10});
        let value = cache.get(key);
        expect(!value).toEqual(true);
        value = await cache.getAndSet(key, getData, {
          refreshIntervalInMilliseconds: 250
        });
        expect(value.startsWith('hello-world-')).toEqual(true);

        await waitForAssertions(() => {
          let value2 = cache.get(key);

          if (value2) {
            let lastPart = value2.substring(value2.lastIndexOf('-') + 1);
            if (parseInt(lastPart) <= 4) {
              throw new Error('Expectation not met');
            }
          }
        })
        console.log('got here')
        cache.remove(key)
      })

      it('correctly retrieves and sets values in cache when using async getter and refresh with refresh failure', async () => {
        let counter = 0;

        async function getData() {
          counter++;
          // @ts-ignore
          if (counter > 1 && counter < 5)
            throw new Error('failure')
          return 'hello-world-' + counter;
        }

        const key = 'thekey';
        let cache = Cacher.create({ttl: 10});
        let value = cache.get(key);
        expect(!value).toEqual(true);
        value = await cache.getAndSet(key, getData, {
          refreshIntervalInMilliseconds: 250,
          refreshIntervalWhenRefreshFailsInMilliseconds: 125
        });
        expect(value.startsWith('hello-world-')).toEqual(true);

        await waitForAssertions(() => {
          let value2 = cache.get(key);
          if (value2) {
            let lastPart = value2.substring(value2.lastIndexOf('-') + 1);
            if (parseInt(lastPart) <= 4) {
              throw new Error('Expectation not met');
            }
          }
        })
      })
    });

    describe('stats', () => {

      it('returns the correct count of items', () => {
        let cache = Cacher.create({ ttl: 10 });
        expect(cache.stats().count).toEqual(0);
        cache.set('one', {});
        expect(cache.stats().count).toEqual(1);
        cache.set('one', {});
        expect(cache.stats().count).toEqual(1);
        cache.set('two', {});
        expect(cache.stats().count).toEqual(2);
      });

      it('returns correct stats', () => {
        let cache = Cacher.create({ttl: 10});
        cache.get('a');
        cache.get('b');
        cache.get('c');

        cache.set('d', {});
        cache.get('d');

        let stats = cache.stats();
        expect(stats.count).toEqual(1);
        expect(stats.hits).toEqual(1);
        expect(stats.misses).toEqual(3);
        expect(stats.hitRate).toEqual(0.25);

        cache.clear();
        stats = cache.stats();
        expect(stats.count).toEqual(0);
        expect(stats.hits).toEqual(0);
        expect(stats.misses).toEqual(0);
        expect(stats.hitRate).toEqual(0);

        cache.get('a');
        cache.set('a', {});
        cache.get('a');
        cache.get('a');
        cache.get('a');

        stats = cache.stats();
        expect(stats.count).toEqual(1);
        expect(stats.hits).toEqual(3);
        expect(stats.misses).toEqual(1);
        expect(stats.hitRate).toEqual(0.75);
      });

    });
    
    describe('keys', () => {

      it('returns the correct keys in cache', () => {
        let cache = Cacher.create({ ttl: 10 });
        cache.set('one', {});
        cache.set('one', {});
        cache.set('two', {});

        let keys = cache.keys();
        expect(keys.length).toEqual(2);
        expect(keys[0]).toEqual('one');
        expect( keys[1]).toEqual('two');
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

      expect(count).toEqual(2);
      Cacher.clear();

      count = 0;
      Cacher.stats().forEach((cache) => {
        count += cache.stats.count;
      });
      expect(count).toEqual(0);
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
      expect(stats.length > 1).toEqual(true);
      expect(stats[0].stats.count).toEqual(1);
      expect(stats[0].stats.hits).toEqual(1);
      expect(stats[0].stats.misses).toEqual(1);
      expect(stats[0].stats.hitRate).toEqual(0.5);
    });

  });
  
  describe('cacher', () => {

    it('returns undefined if cacher could not be found by id and no cachers are defined', () => {
      let cacher = Cacher.cacher('blah');
      expect(!cacher).toEqual(true);
    });

    it('returns undefined if cacher could not be found by id and cachers are defined', () => {
      Cacher.create({ ttl: 1, id: 'peas' });
      let cacher = Cacher.cacher('blah');
      expect(!cacher).toEqual(true);
    });

    it('returns cacher if found by id', () => {
      Cacher.create({ ttl: 1, id: 'blah' });
      let cacher = Cacher.cacher('blah');
      expect(!cacher).toEqual(false);
    });

  });

  describe('cachers', () => {

    it('returns all cachers', () => {
      Cacher.create({ ttl: 1, id: 'one' });
      Cacher.create({ ttl: 1, id: 'two' });
      Cacher.create({ ttl: 1, id: 'three' });
      expect(Cacher.cachers().length).toEqual(40);
    });

  });

  describe('cleanup', () => {

    it('cleans up expired values', (done) => {
      let cache = Cacher.create({ ttl: 1 });
      cache.set('one', {});
      cache.set('two', {});
      expect(cache.keys().length).toEqual(2);

      Cacher.cleanup(1);

      setTimeout(() => {
        expect(cache.keys().length).toEqual(0);
        done();
      }, 3000);

    });
  });

  describe('overriding defaults and creating new instance', () => {

    it('instantiates the object correctly with defaults', () => {
      let cacher = Cacher
        .create({ id: 'test' });

      expect(cacher.id).toEqual('test');
      let options = cacher.options();
      expect(options.ttl).toEqual(0);
      expect(options.clone).toEqual(true);
      expect(options.storeUndefinedObjects).toEqual(false);
    });

    it('instantiates the object correctly with overriden defaults', () => {
      let cacher = Cacher
        .ttl(1234)
        .clone(false)
        .storeUndefinedObjects(true)
        .cleanup(5)
        .create({ id: 'test' });

      expect(cacher.id).toEqual('test');
      let options = cacher.options();
      expect(options.ttl).toEqual(1234);
      expect(options.clone).toEqual(false);
      expect(options.storeUndefinedObjects).toEqual(true);
    });

  });

  describe('dispose', () => {

    it('disposes of all cachers', () => {
      Cacher.create({ ttl: 1, id: 'one' });
      Cacher.create({ ttl: 1, id: 'two' });
      Cacher.create({ ttl: 1, id: 'three' });
      expect(Cacher.cachers().length).toEqual(46);

      let intervalId = Cacher.getCleanupIntervalId();
      expect(intervalId !== undefined).toEqual(true);

      Cacher.dispose();

      expect(Cacher.cachers().length).toEqual(0);
      intervalId = Cacher.getCleanupIntervalId();
      expect(intervalId === undefined).toEqual(true);
    });

  });

  const waitForAssertions = (assertionFunc: () => any, timeoutMilliseconds = 2000, failureMessage?:string) => new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      const message = failureMessage ?? `Assertion conditions were not met within ${timeoutMilliseconds} milliseconds`
      reject(new Error(message))
    }, timeoutMilliseconds)

    const intervalId = setInterval( () => {
      try {
        assertionFunc()
        clearTimeout(timeoutId)
        clearInterval(intervalId)
        return resolve({})
      } catch (err) {
        // do nothing
      }
    }, 10)
  })

});