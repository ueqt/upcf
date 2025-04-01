import dynamicImportVariables from '@rollup/plugin-dynamic-import-vars';
import typescript from '@rollup/plugin-typescript';
import path from 'path';
import { defineConfig } from 'rollup';

const typescriptEsmOptions = {
  exclude: ["tests/**/*"],
  compilerOptions: { declarationDir: 'dist/esm/types', outDir: 'dist/esm' },
};

const typescriptCjsOptions = {
  exclude: ["tests/**/*"],
  compilerOptions: { declarationDir: 'dist/cjs/types', outDir: 'dist/cjs' },
};

const externals = ['chalk', 'clear', 'figlet', 'yargs-parser', '@azure/msal-node', 'dotenv', 'fs-extra', 'path'];

export default defineConfig([
  {
    external: externals,
    input: "src/cli/cli.ts",
    output: { file: "dist/esm/cli.js", format: "esm", inlineDynamicImports: true },
    plugins: [
      dynamicImportVariables({}),
      typescript(typescriptEsmOptions)
    ],
  },
  {
    external: externals,
    input: "src/cli/cli.ts",
    output: { file: "dist/cjs/cli.js", format: "cjs", inlineDynamicImports: true },
    plugins: [
      dynamicImportVariables({}),
      typescript(typescriptCjsOptions)
    ],
  },
]);
