/* eslint-disable @typescript-eslint/no-var-requires */
const { build } = require("esbuild")
const { readFileSync } = require("fs")

const localPkgJson = JSON.parse(readFileSync("./package.json", "utf-8"))
const bundledDeps = ["shared", "aws-sdk-js-v3-rds-signer"]

const options = {
  entryPoints: ["./src/index.ts"],
  bundle: true,
  outdir: "./dist",
  target: "node16",
  platform: "node",
  sourcemap: true,
  external: Object.keys({
    ...(localPkgJson.dependencies || {}),
    ...(localPkgJson.devDependencies || {}),
    ...(localPkgJson.peerDependencies || {}),
  }).filter((dep) => !bundledDeps.includes(dep)),
}

build(options).catch((err) => {
  process.stderr.write(err.stderr)
  process.exit(1)
})
