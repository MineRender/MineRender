import test from "ava";
import { AssetKey } from "../src";

//TODO: figure out why three jsm example addons breaks this

test("AssetKey#new", t => {
    let k = new AssetKey("minecraft", "textures/block/stone.png");
    console.log(k);
    t.pass();
});
test("AssetKey#parse", t => {
    let k = AssetKey.parse("textures", "block/stone.png");
   console.log(k);
   t.pass();
})