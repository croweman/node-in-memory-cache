/**
 * IStats interface
 */
export interface IStats {
    /** The id of the cache instance the statistics are associated with */
    id: string
    /** cache usage statistics */
    stats: IStat
}

/**
 * ICache interface
 */
export interface ICacher {
    /**
     * Creates a new cache instance
     * @param options ICacherOptions
     */
    create: (options?: ICacherOptions) => ICacherInstance
    /**
     * Clears the in memory cache of all active cache instances
     */
    clear: () => ICacher
    /**
     * Gets an array of stats across all active cachers
     */
    stats: () => IStats[]
    /**
     * Gets an active cacher by it's id
     * @param id
     */
    cacher: (id: string) => ICacherInstance
    /**
     * Gets all active cache instances
     */
    cachers: () => ICacherInstance[]
    /**
     * Defines in seconds how long an object should be stored in memory
     * @param ttl
     */
    ttl: (ttl: number) => ICacher
    /**
     * Turns on/off object cloning. (default true)
     * @param clone
     */
    clone: (clone: boolean) => ICacher
    /**
     * Allows undefined objects to be stored in cache (default `false`)
     * @param storeUndefinedObjects
     */
    storeUndefinedObjects: (storeUndefinedObjects: boolean) => ICacher
    /**
     * Forces expired objects to be removed from cache every `seconds` seconds. By default `no cleanup` is performed.
     * @param seconds
     */
    cleanup: (seconds: number) => ICacher
    /**
     * Clears all in memory cacher instances and also clears the cleanup task if defined using the `cleanup` function.
     */
    dispose: () => void
    /**
     * Gets the cleanup internal id
     */
    getCleanupIntervalId: () => NodeJS.Timer
}

export type EventFunction = (eventData:IEventData) => void
export type CountEventFunction = (eventData:ICountEventData) => void

/**
 * IStat interface
 */
export interface IStat {
    /** number of retrievals from the cache */
    hits: number
    /** number of attempt to retrieve when the item did not exist in cache */
    misses: number
    /** the hit rate percentage in which an item is requested which exists in cache */
    hitRate: number
    /** number of items in cache for the cacher */
    count: number
}

/**
 * Argument used when an event function is fired
 */
export interface IEventData {
    /** Cache id */
    id: string
    /** Cached item key */
    key: string
}

/**
 * Argument used when an count event function is fired
 */
export interface ICountEventData {
    /** Cache id */
    id: string
    /** Number of items in the cacher */
    count: number
}

/**
 * ICacherOptions interface
 */
export interface ICacherOptions {
     /** (optional) The id of the cache instance are associated with */
    id?: string
    /** (optional, default 0) Defines in seconds how long an object should be stored in memory */
    ttl?: number
    /** (optional, default false) Defines whether undefined objects should be stored in memory */
    storeUndefinedObjects?: boolean
    /** (optional, default true) Defines whether objects should be cloned when set in and retrieved from cache */
    clone?: boolean
    /** (optional) Function called every time an object is retrieved from cache */
    hit?: EventFunction
    /** (optional) Function called every time an object is not from cache */
    miss?: EventFunction
    /** (optional) Function called every time an object is added to cache */
    added?: EventFunction
    /** (optional) Function called every time an object is removed from cache */
    removed?: EventFunction
    /** (optional) Function called every time an object is added or removed from cache*/
    count?: CountEventFunction
}

/**
 * IGetAndSetCacherOptions interface
 */
export interface IGetAndSetCacherOptions extends ICacherOptions {
    /** (optional) Defines whether the cache should be refreshed using the `getter` every so many milliseconds */
    refreshIntervalInMilliseconds?: number
    /** (optional) If `refreshIntervalInMilliseconds` is set and a failure occurs when refreshing the cache the refresh delay will change to `refreshIntervalWhenRefreshFailsInMilliseconds` if set otherwise `refreshIntervalInMilliseconds` */
    refreshIntervalWhenRefreshFailsInMilliseconds? :number
}

/**
 * ICacherInstanceOptions interface
 */
export interface ICacherInstanceOptions {
    /** (default 0) Defines in seconds how long an object should be stored in memory */
    ttl: number
    /** (default false) Defines whether undefined objects should be stored in memory */
    storeUndefinedObjects: boolean
    /** (default true) Defines whether objects should be cloned when set in and retrieved from cache */
    clone: boolean
}

/**
 * ICacherInstance interface
 */
export interface ICacherInstance {
    /** The id of the cacher */
    id: string
    /**
     * Gets an object from cache, undefined will be returned if object does not exist.
     * @param key
     * @param options
     */
    get: (key: string, options?: ICacherOptions) => any
    /**
     * Gets the expiry DateTime of an object in cache, undefined is returned if object is not found.
     * @param key
     */
    getExpiry: (key: string) => Date
    /**
     * Gets and sets an object in cache.  The getAndSet function is an `async` function so should be awaited.  It can also refresh its data in the background.
     * @param key
     * @param getter
     * @param options
     */
    getAndSet: (key: string, getter: (...args: any[]) => Promise<any>, options?: IGetAndSetCacherOptions) => Promise<any>
    /**
     * Stores an object in cache
     * @param key
     * @param value
     * @param options
     */
    set: (key: string, value: any, options?: ICacherOptions) => void
    /**
     * Removes all objects from the cache instance.
     */
    clear: () => void,
    /**
     * Remove the object from cache.
     * @param key
     * @param options
     */
    remove: (key: string, options?: ICacherOptions) => void
    /**
     * Gets the stats for the cache instance.
     */
    stats: () => IStat,
    /**
     * Gets all keys for objects stored in the cache instance.
     */
    keys: () => string[],
    /**
     * Gets all configured options for a cache instance.
     */
    options: () => ICacherInstanceOptions
}