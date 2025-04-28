import { fileURLToPath, URL } from "node:url";

import { defineConfig, normalizePath } from "vite";
import { createRequire } from "node:module";
import path from "path";

import { viteStaticCopy } from "vite-plugin-static-copy";

function resolveNodeModulePath(moduleName) {
  const require = createRequire(import.meta.url);
  let modulePath = normalizePath(require.resolve(moduleName));
  while (!modulePath.endsWith(moduleName)) {
    const newPath = path.posix.dirname(modulePath);
    if (newPath === modulePath)
      throw new Error(`Could not resolve ${moduleName}`);
    modulePath = newPath;
  }
  return modulePath;
}

function resolvePath(...args) {
  return normalizePath(path.resolve(...args));
}

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: resolvePath(
            resolveNodeModulePath("itk-wasm"),
            "dist/pipeline/web-workers/bundles/itk-wasm-pipeline.min.worker.js",
          ),
          dest: "itk",
        },
        {
          src: resolvePath(
            resolveNodeModulePath("@itk-wasm/dicom"),
            "dist/pipelines/*{.wasm,.js,.zst}",
          ),
          dest: "itk/pipelines",
        },
        {
          src: resolvePath(
            resolveNodeModulePath("@itk-wasm/dicom"),
            "dist/pipelines/*{.wasm,.js,.zst}",
          ),
          dest: "itk/pipelines",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["itk-wasm"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
