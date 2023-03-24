export interface IStats {
    id: string
    stats: IStat
}

export interface ICacher {
    create: (options?: ICacherOptions) => ICacherInstance
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
    hits: number
    misses: number
    hitRate: number
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