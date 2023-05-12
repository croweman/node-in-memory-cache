export interface IStats {
    /** The id of the cache instance the statistics are associated with */
    id: string
    /** cache usage statistics */
    stats: IStat
}

export interface ICacher {
    /**
     * Creates a new cache instance
     * @param options ICacherOptions
     */
    create: (options?: ICacherOptions) => ICacherInstance
    /*
    Clears the in memory cache of all active cache instances
     */
    clear: () => ICacher
    stats: () => IStats[]
    cacher: (id: string) => ICacherInstance
    cachers: () => ICacherInstance[]
    ttl: (ttl: number) => ICacher
    clone: (clone: boolean) => ICacher
    storeUndefinedObjects: (storeUndefinedObjects: boolean) => ICacher
    cleanup: (seconds: number) => ICacher
    dispose: () => void
    getCleanupIntervalId: () => NodeJS.Timer
}

export type EventFunction = (eventData:IEventData) => void
export type CountEventFunction = (eventData:ICountEventData) => void

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

export interface IEventData {
    id: string
    key: string
}

export interface ICountEventData {
    id: string
    count: number
}

export interface ICacherOptions {
    id?: string
    ttl?: number
    storeUndefinedObjects?: boolean
    clone?: boolean
    hit?: EventFunction
    miss?: EventFunction
    added?: EventFunction
    removed?: EventFunction
    count?: CountEventFunction
}

export interface IGetAndSetCacherOptions extends ICacherOptions {
    refreshIntervalInMilliseconds?: number
    refreshIntervalWhenRefreshFailsInMilliseconds? :number
}

export interface ICacherInstanceOptions {
    ttl: number
    storeUndefinedObjects: boolean
    clone: boolean
}

export interface ICacherInstance {
    id: string
    get: (key: string, options?: ICacherOptions) => any
    getExpiry: (key: string) => Date
    getAndSet: (key: string, getter: (...args: any[]) => Promise<any>, options?: ICacherOptions) => Promise<any>
    set: (key: string, value: any, options?: ICacherOptions) => void
    clear: () => void,
    remove: (key: string, options?: ICacherOptions) => void
    stats: () => IStat,
    keys: () => string[],
    options: () => ICacherInstanceOptions
}