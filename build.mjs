import * as esbuild from 'esbuild';
import { polyfillNode } from "esbuild-plugin-polyfill-node";

const args = process.argv.slice(2);

const context = await esbuild.context({
    platform: "browser",
    entryPoints: ['src/index.ts'],
    bundle: true,
    sourcemap: 'both',
    // sourceRoot: 'https://raw.githubusercontent.com/MineRender/MineRender/typescript/', //TODO: update this
    outfile: 'dist/bundle.js',
    resolveExtensions:['.tsc', '.ts','.js'],
    // external: ['THREE'],
    define: {
        'global': 'window',
    },
    loader: {
        ".node":"file"
    },
    globalName:"MineRender",
    plugins: [polyfillNode()]
});


if (args.includes("--watch")) {
    await context.watch();
// } else if (args.includes("--serve")) {
//     await context.serve({
//         servedir: ".",
//     })
} else {
    await context.rebuild();
    await context.dispose();
}