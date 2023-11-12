import { AssetSource } from "../AssetSource";
import { ArchiveProxy } from "./ArchiveProxy";
import { ArchiveEntry } from "./ArchiveEntry";
import { MinecraftAsset } from "../../../MinecraftAsset";
import { AssetKey } from "../../AssetKey";
import { AssetParser } from "../parser";
import { Maybe } from "../../../util";
import { Requests } from "../../../request";

export class ArchiveAssetSource extends AssetSource implements ArchiveProxy {

    readonly _archiveProxy: ArchiveProxy;

    constructor(archiveProxy: ArchiveProxy) {
        super();
        this._archiveProxy = archiveProxy;
    }

    public async getEntries(): Promise<ArchiveEntry[]> {
        return this._archiveProxy.getEntries();
    }

    async get<T extends MinecraftAsset>(key: AssetKey, parser: AssetParser | string): Promise<Maybe<T>> {
        //TODO: implement
        let entries = (await this.getEntries());
        console.log(entries);
        let firstEntry = entries[0];
        let blob = await firstEntry.getData();
        return Requests.genericRequest({
            url: URL.createObjectURL(blob),
        }).then(response => {
            console.log(response)
            return response.data as T;
        })
    }


}