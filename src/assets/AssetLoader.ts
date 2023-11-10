import { Model, TextureAsset } from "../model/Model";
import { Maybe } from "../util/util";
import { Requests } from "../request/Requests";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { MinecraftAsset } from "../MinecraftAsset";
import { ImageInfo, ImageLoader } from "../image/ImageLoader";
import { MinecraftTextureMeta } from "../MinecraftTextureMeta";
import { BlockState } from "../model/block/BlockState";
import { DEFAULT_NAMESPACE, DEFAULT_ROOT } from "./Assets";
import { ListAsset } from "../ListAsset";
import { AssetKey } from "./AssetKey";
import { NBTAsset, NBTHelper } from "../nbt/NBTHelper";
import { prefix } from "../util/log";
import { AssetSource } from "./source/AssetSource";
import { AssetParser } from "./source/parser/AssetParsers";

const p = prefix("AssetLoader");


export class AssetLoader {

    static ROOT: string = DEFAULT_ROOT;

    private static _SOURCES: AssetSourceReference[] = [];

    public static addSource(key: string, source: AssetSource) {
        this._SOURCES.push({key, source});
        console.log(p, "Added AssetSource", key);
    }

    static {
        this.addSource("mcassets", new HostedAssetSource(DEFAULT_ROOT));
    }

    public static async get<T extends MinecraftAsset>(key: AssetKey, parser: AssetParser | string): Promise<Maybe<T>> {
        for (const source of this._SOURCES) {
            const result = await source.source.get<T>(key, parser);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

}

interface AssetSourceReference {
    key: string;
    source: AssetSource;
}
