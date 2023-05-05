'use strict';

const cache = require('./dist/index')
//const cache = require('./index')
    .ttl(60)
    .storeUndefinedObjects(false)
    .cleanup(60)
    .create({ id: 'snacks' });

function standardGetAndSetExample() {
    const key = 'the_key1';
    let result = cache.get(key);

    if (!result) {
        cache.set(key, { snack: 'crisps'});
        result = cache.get(key);
    }

    return { value: result, expiry: cache.getExpiry(key) };
}

async function getData() {
    return { snack: 'chocolate' };
}

async function getAndSetWithDataRetrievalExample() {
    const key = 'the_key2';
    let result = await cache.getAndSet(key, getData);
    return { value: result, expiry: cache.getExpiry(key) };
}

async function testImplentation() {
    console.log(`Result 1: ${JSON.stringify(standardGetAndSetExample())}`);
    console.log(`Result 2: ${JSON.stringify(await getAndSetWithDataRetrievalExample())}`);
}

testImplentation()
    .then(() => process.exit(0))