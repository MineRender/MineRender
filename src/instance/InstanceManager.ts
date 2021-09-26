import { InstanceReference } from "./InstanceReference";
import { SceneObject } from "../renderer/SceneObject";
import { Maybe } from "../util/util";

export class InstanceManager {

    public readonly isInstanceManager: true = true;

    protected readonly instanceCache: { [key: string]: Promise<InstanceReference<SceneObject>>; } = {};

    constructor() {
    }

    public async get<T extends SceneObject>(key: string): Promise<Maybe<InstanceReference<T>>> {
        if (key in this.instanceCache) {
            console.log("key in cache", key)
            // create next instance of existing object
            return (await this.instanceCache[key]).nextInstance() as InstanceReference<T>;
        }
        return undefined;
    }

    public async getOrCreate<T extends SceneObject>(key: string, supplier: () => T | Promise<T>): Promise<InstanceReference<T>> {
        const cached = await this.get<T>(key);
        if (typeof cached !== "undefined") {
            return cached;
        }
        console.log("key not in cache", key)
        const promise = new Promise<InstanceReference<SceneObject>>(async (resolve) => {
            const obj = await supplier();
            const instance = obj.nextInstance();
            this.instanceCache[key] = Promise.resolve(instance);
            resolve(instance);
        })
        this.instanceCache[key] = promise;
        return await promise as InstanceReference<T>;
    }

    public reset() {
        for (let instanceCacheKey in this.instanceCache) {
            delete this.instanceCache[instanceCacheKey];
        }
    }


}

export function isInstanceManager(obj: any): obj is InstanceManager {
    return (<InstanceManager>obj).isInstanceManager;
}