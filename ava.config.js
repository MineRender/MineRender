module.exports = {
    typescript: {
        compile: false,
        rewritePaths: {
            "src/": "dist/cjs/"
        },
        extensions: ["ts"]
    },
    require: ['esbuild-runner/register']
}