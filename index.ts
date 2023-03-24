const Cacher = require('./lib/cacher');
import {log} from "./lib/logger";
import {ICacher, ICacherInstance, ICacherOptions, IStats} from "./lib/model-types";

let cachers:ICacherInstance[] = [];
let defaultTtl:number = 0;
let defaultClone:boolean = true;
let defaultStoreUndefinedObjects:boolean = false;
let intervalId:NodeJS.Timer;

const getCachers = (): ICacherInstance[] => {
  cachers = cachers.filter(cacher => { return cacher !== undefined && cacher !== null });
  return cachers;
}

const clearCachers = (): void => {
  getCachers().forEach(cacher => {
    cacher.clear();
    log(`cleared cacher - id: ${cacher.id}`);
  });
}

const cacherWrapper: ICacher = {
  create: (options?: ICacherOptions) => {
    const cacherOptions: ICacherOptions = options || {} as ICacherOptions

    if (cacherOptions.ttl === undefined || typeof cacherOptions.ttl !== 'number') {
      cacherOptions.ttl = defaultTtl;
    }

    if (cacherOptions.clone === undefined || typeof cacherOptions.clone !== 'boolean') {
      cacherOptions.clone = defaultClone;
    }

    if (cacherOptions.storeUndefinedObjects === undefined || typeof cacherOptions.storeUndefinedObjects !== 'boolean') {
      cacherOptions.storeUndefinedObjects = defaultStoreUndefinedObjects;
    }

    const cacher: ICacherInstance = new Cacher.default(cacherOptions);
    cachers.push(cacher);
    log(`created new cacher - id: ${cacher.id}`);
    return cacher;
  },
  clear: () => {
    clearCachers();
    return cacherWrapper;
  },
  stats: (): IStats[] => {
    const stats:IStats[] = []

    getCachers().forEach(cacher => {
      stats.push({
        id: cacher.id,
        stats: cacher.stats()
      });
    });

    log('Stats across all cachers');
    return stats;
  },
  cacher: (id: string): ICacherInstance => {
    let cacher = undefined;
    let cachers = getCachers();
    for (var i = 0; i < cachers.length; i++) {
      let currentCacher = cachers[i];

      if (currentCacher.id === id) {
        cacher = currentCacher;
        break;
      }
    }

    log(`getting cacher - id: ${id}, found: ${cacher !== undefined && cacher !== null }`);
    return cacher;
  },
  cachers: (): ICacherInstance[] => {
    let cachers = getCachers();
    let ids = cachers.map((cacher) => { return cacher.id; });
    log('getting cachers - ids', { ids });
    return cachers;
  },
  ttl: (ttl: number): ICacher => {
    if (ttl !== undefined && typeof ttl === 'number') {
      defaultTtl = ttl;
      log(`Default ttl set to - ${defaultTtl}`);
    }
    return cacherWrapper;
  },
  clone: (clone: boolean): ICacher => {
    if (clone !== undefined && typeof clone === 'boolean') {
      defaultClone = clone;
    }
    return cacherWrapper;
  },
  storeUndefinedObjects: (storeUndefinedObjects: boolean): ICacher => {
    if (storeUndefinedObjects !== undefined && typeof storeUndefinedObjects === 'boolean') {
      defaultStoreUndefinedObjects = storeUndefinedObjects;
    }
    return cacherWrapper;
  },
  cleanup: (seconds: number): ICacher => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
      log(`cleaning up expired keys`);
      let count = 0;
      getCachers().forEach((cacher) => {
        cacher.keys().forEach((key) => {
          cacher.getExpiry(key);
        });
      });
      log(`cleaning up expired keys complete - ${count} keys`);
    }, seconds * 1000);
    return cacherWrapper;
  },
  dispose: (): void => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    clearCachers();
    cachers = [];
  },
  getCleanupIntervalId: (): NodeJS.Timer => {
    return intervalId;
  }
};

export = cacherWrapper
