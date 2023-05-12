import {log} from "./logger";
import {
  CountEventFunction,
  EventFunction,
  ICacherInstance,
  ICacherInstanceOptions,
  ICacherOptions, IGetAndSetCacherOptions,
  IStat
} from "./types";
const clone = require('clone');

let globalId: number = 0;

export default function (options: ICacherOptions): ICacherInstance {
  const cacherOptions: ICacherOptions = options || {} as ICacherOptions

  // @ts-ignore
  const self = this
  self.id = options.id

  if (!self.id) {
    globalId++
    self.id = globalId
  }

  self.id = self.id.toString()
  self.ttl = options.ttl || 0
  self.cachedData = {}
  self.storeUndefinedObjects = (cacherOptions.storeUndefinedObjects !== undefined && cacherOptions.storeUndefinedObjects === true)
  self.clone = (cacherOptions.clone !== undefined && cacherOptions.clone === true)
  self.hits = 0
  self.misses = 0
  self.hitCallback = undefined
  self.missCallback = undefined
  self.addedCallback = undefined
  self.removedCallback = undefined
  self.countCallback = undefined

  const isFunction = (argument:any) => argument && typeof argument === 'function'

  if (isFunction(cacherOptions.hit)) {
    self.hitCallback = cacherOptions.hit
  }

  if (isFunction(cacherOptions.miss)) {
    self.missCallback = cacherOptions.miss
  }

  if (isFunction(cacherOptions.added)) {
    self.addedCallback = cacherOptions.added
  }

  if (isFunction(cacherOptions.removed)) {
    self.removedCallback = cacherOptions.removed
  }

  if (isFunction(cacherOptions.count)) {
    self.countCallback = cacherOptions.count
  }

  const cleanKey = (key: string) => key.replace(/[^a-zA-Z0-9_]/g, '_')

  const get = (key: string, options?: ICacherOptions) => {
    const cacherOptions: ICacherOptions = options || {} as ICacherOptions

    // @ts-ignore
    if (!cacherOptions.keyCleaned) {
      key = cleanKey(key);
    }

    let data = self.cachedData[key];

    if (data && data.expires < new Date()) {
      data = undefined;
      // @ts-ignore
      remove(key, { keyCleaned: true });
      raiseEvent(self.removedCallback, key);
    }

    let value = undefined;

    if (data) {
      self.hits++;
      raiseEvent(self.hitCallback, key);

      if (self.clone === true) {
        value = clone(data.value);
      }
      else {
        value = data.value;
      }
    }
    else {
      self.misses++;
      raiseEvent(self.missCallback, key);
    }

    log(`get - cacher id: ${self.id}, key: ${key}`, { value });
    return value;
  }

  const getExpiry = (key: string): Date => {
    key = cleanKey(key);

    let data = self.cachedData[key];

    if (data && data.expires < new Date()) {
      data = undefined;
      // @ts-ignore
      remove(key, { keyCleaned: true });
      raiseEvent(self.removedCallback, key);
    }

    if (data) {
      log(`getExpiry - cacher id: ${self.id}, key: ${key}, expiry: ${data.expires}`);
    }
    else {
      log(`getExpiry - item does not exist - cacher id: ${self.id}, key: ${key}`);
    }

    return data ? data.expires : undefined;
  }

  const getAndSet = async (key: string, getter: (...args: any[]) => Promise<any>, options?: IGetAndSetCacherOptions): Promise<any> => {
    const cacherOptions: ICacherOptions = options || {} as ICacherOptions
    // @ts-ignore
    cacherOptions.keyCleaned = true;

    if (!isFunction(getter)) {
      log(`getAndSet - no getter function is defined - cacher id: ${self.id}, key: ${key}`, { cacherOptions });
      return undefined;
    }

    key = cleanKey(key);
    let value = get(key, cacherOptions);

    if (!value) {
      log(`getAndSet - retrieving value from getter - cacher id: ${self.id}, key: ${key}`, { cacherOptions });
      value = await getter();

      setWithRefresh(key, value, getter, options);
    }

    log(`getAndSet - cacher id: ${self.id}, key: ${key}`, { value });
    return value;
  }

  const setWithRefresh = (key: string, value:any, getter: (...args: any[]) => Promise<any>, options?: IGetAndSetCacherOptions) => {
    set(key, value, options)

    if (options.refreshIntervalInMilliseconds === undefined || options.refreshIntervalInMilliseconds === 0)
      return

    const data = self.cachedData[key];
    data.refreshIntervalInMilliseconds = options.refreshIntervalInMilliseconds
    data.refreshIntervalWhenRefreshFailsInMilliseconds = options.refreshIntervalWhenRefreshFailsInMilliseconds

    const timeoutFunc = (milliseconds: number) => {
      data.timeout = setTimeout(async () => {
        try {
          const value = await getter()
          set(key, value, options)
          timeoutFunc(milliseconds)
        } catch (error) {
          log(`getAndSet - refresh cacher id: ${self.id}, key: ${key}. Failed to update cache, error message was '${error.message}'`);
          console.log(`Failed to update cache for key '${key}', error message was '${error.message}'`)
          timeoutFunc(data.refreshIntervalWhenRefreshFailsInMilliseconds ?? milliseconds)
        }
      }, milliseconds)
    }
    timeoutFunc(data.refreshIntervalInMilliseconds)
  }

  const set = (key: string, value: any, options?: ICacherOptions) => {
    const cacherOptions: ICacherOptions = options || {} as ICacherOptions

    if (!self.storeUndefinedObjects && (value === undefined || value === null || (typeof value.isNull === "function" && value.isNull()))) {
      log(`set - not storing value as it is not defined - cacher id: ${self.id}, key: ${key}`, { value, cacherOptions });
      remove(key, cacherOptions);
      raiseEvent(self.removedCallback, key);
      return;
    }

    // @ts-ignore
    if (!cacherOptions.keyCleaned) {
      key = cleanKey(key);
    }

    let ttl = cacherOptions.ttl || self.ttl;
    let expiryDate;

    if (ttl === 0) {
      expiryDate = new Date(8640000000000000);
    }
    else {
      expiryDate = new Date(new Date().getTime() + (ttl * 1000))
    }

    let valueToCache = self.clone === true ? clone(value) : value;
    let cacheValue = {
      value: valueToCache,
      expires: expiryDate
    };
    self.cachedData[key] = cacheValue;
    log(`set - stored value - cacher id: ${self.id}, key: ${key}`, { cachedData: cacheValue });
    raiseEvent(self.addedCallback, key);
    raiseCountEvent(self.countCallback);
  }

  const clear = () => {
    log(`clear - cacher id: ${self.id}`);
    self.hits = 0;
    self.misses = 0;

    Object.keys(self.cachedData).forEach(key => {
      if (self.cachedData[key] !== undefined && self.cachedData[key].timeout) {
        clearTimeout(self.cachedData[key].timeout)
      }
    })

    self.cachedData = {};
  }

  const remove = (key: string, options?: ICacherOptions) => {
    const cacherOptions:ICacherOptions = options || {} as ICacherOptions
    // @ts-ignore
    if (!cacherOptions.keyCleaned) {
      key = cleanKey(key);
    }
    log(`remove - key: ${key}, cacher id: ${self.id}`);

    if (self.cachedData[key] && self.cachedData[key].timeout) {
      clearTimeout(self.cachedData[key].timeout)
    }

    delete self.cachedData[key];
    raiseEvent(self.removedCallback, key);
    raiseCountEvent(self.countCallback);
  }

  const stats = (): IStat => {
    let hits = self.hits;
    let misses = self.misses;

    let stats: IStat = {
      count: Object.keys(self.cachedData).length,
      hits,
      misses,
      hitRate: hits / (hits + misses)
    };

    if (isNaN(stats.hitRate)) {
      stats.hitRate = 0;
    }

    log(`stats - ${JSON.stringify(stats)}, cacher id: ${self.id}`);
    return stats;
  }

  const keys = (): string[] => {
    let keys = Object.keys(self.cachedData);
    log(`keys - cacher id: ${self.id}`, { keys });
    return keys;
  }

  const getOptions = (): ICacherInstanceOptions => {
    return {
      ttl: self.ttl,
      clone: self.clone,
      storeUndefinedObjects: self.storeUndefinedObjects
    };
  }

  const raiseEvent = (callback: EventFunction, key: string) => {
    if (!callback) return;
    callback({ id: self.id, key: key });
  }

  const raiseCountEvent = (callback: CountEventFunction) => {
    if (!callback) return;
    callback({ id: self.id, count: Object.keys(self.cachedData).length });
  }

  return {
    id: self.id,
    get,
    getExpiry,
    getAndSet,
    set,
    clear,
    remove,
    stats,
    keys,
    options: getOptions
  };
};