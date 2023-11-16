const {AssetKey} = require('../dist/cjs');

test("test", t => {
})

test("AssetKey#new", t => {
    let k = new AssetKey("minecraft", "textures/block/stone.png");
    console.log(k);
});
test("AssetKey#parse", t => {
    let k = AssetKey.parse("textures", "block/stone.png");
    console.log(k);
})