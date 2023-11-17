import test from "ava";
import { AssetKey } from "../src";

test("AssetKey#parse", t => {
    let k = AssetKey.parse("textures", "block/stone.png");
    console.log(k);
    t.is(k.namespace, "minecraft");
    t.is(k.rootType, "assets");
    t.is(k.assetType, "textures");
    t.is(k.type, "block");
    t.is(k.path, "stone.png");
    console.log(k.toString());
})
test("AssetKey#new", t => {
    let k = new AssetKey("minecraft", "textures/block/stone.png");
    console.log(k);
    t.is(k.namespace, "minecraft");
    t.is(k.rootType, "assets");
    t.is(k.assetType, undefined);
    t.is(k.type, undefined);
    console.log(k.toString())
});