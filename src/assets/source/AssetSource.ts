import { MinecraftAsset } from "../../MinecraftAsset";
import { AssetKey } from "../AssetKey";
import { Maybe } from "../../util";
import { AssetParser } from "./parser/AssetParsers";
import { HostedAssetSource } from "./HostedAssetSource";

export abstract class AssetSource {

    protected constructor() {
    }

    public abstract get<T extends MinecraftAsset>(key: AssetKey, parser: AssetParser | string): Promise<Maybe<T>>;

    public static hosted(baseUrl: string): AssetSource {
        return new HostedAssetSource(baseUrl);
    }

    public static archive(path: string): AssetSource {
        //TODO
        throw new Error();
    }

}