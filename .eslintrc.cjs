module.exports = {
  extends: ["next/core-web-vitals"],
  ignorePatterns: [".next/**", "out/**", "next-env.d.ts"],
  overrides: [
    {
      files: ["books/**/solutions/**/*.ts"],
      excludedFiles: ["books/**/solutions/index.ts"],
      rules: {
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-restricted-globals": [
          "error",
          "fetch",
          "XMLHttpRequest",
          "WebSocket",
          "EventSource",
          "eval",
          "Function",
          "process",
          "global",
          "globalThis",
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "navigator",
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "ImportDeclaration[source.value!='@scifunlab/solution-sdk']",
            message: 'Contributed solution files may only import from "@scifunlab/solution-sdk".',
          },
          {
            selector: "ExportNamedDeclaration[source], ExportAllDeclaration",
            message: "Re-exporting external modules is not allowed in contributed solution files.",
          },
          {
            selector: "ImportExpression",
            message: "Dynamic import() is not allowed in contributed solution files.",
          },
          {
            selector: "CallExpression[callee.name='require']",
            message: "require() is not allowed in contributed solution files.",
          },
        ],
      },
    },
    {
      files: ["books/*/*.ts"],
      rules: {
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-restricted-globals": [
          "error",
          "fetch",
          "XMLHttpRequest",
          "WebSocket",
          "EventSource",
          "eval",
          "Function",
          "process",
          "global",
          "globalThis",
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "navigator",
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "ImportDeclaration:not([source.value='@scifunlab/solution-sdk']):not([source.value=/^\\.\\/[^/]+$/])",
            message: 'Book metadata/chapter files may only import "@scifunlab/solution-sdk" or local "./<file>" helpers.',
          },
          {
            selector: "ExportNamedDeclaration[source], ExportAllDeclaration",
            message: "Re-exporting external modules is not allowed in contributed book files.",
          },
          {
            selector: "ImportExpression",
            message: "Dynamic import() is not allowed in contributed book files.",
          },
          {
            selector: "CallExpression[callee.name='require']",
            message: "require() is not allowed in contributed book files.",
          },
        ],
      },
    },
    {
      files: ["kits/*/model.ts"],
      rules: {
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "no-restricted-globals": [
          "error",
          "fetch",
          "XMLHttpRequest",
          "WebSocket",
          "EventSource",
          "eval",
          "Function",
          "process",
          "global",
          "globalThis",
          "window",
          "document",
          "localStorage",
          "sessionStorage",
          "navigator",
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "ImportDeclaration:not([source.value='@scifunlab/solution-sdk/kit']):not([source.value=/^\\.\\/[^/]+$/])",
            message: 'Kit model.ts files must stay pure and may only import "@scifunlab/solution-sdk/kit" or local "./<file>" helpers.',
          },
          {
            selector: "ExportNamedDeclaration[source], ExportAllDeclaration",
            message: "Re-exporting external modules is not allowed in kit model.ts files.",
          },
          {
            selector: "ImportExpression",
            message: "Dynamic import() is not allowed in contributed kit files.",
          },
          {
            selector: "CallExpression[callee.name='require']",
            message: "require() is not allowed in contributed kit files.",
          },
        ],
      },
    },
    {
      files: ["kits/*/*.{ts,tsx}"],
      excludedFiles: ["kits/*/model.ts"],
      rules: {
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
        "react/no-danger": "error",
        "no-restricted-globals": [
          "error",
          "fetch",
          "XMLHttpRequest",
          "WebSocket",
          "EventSource",
          "eval",
          "Function",
          "process",
          "global",
          "globalThis",
          "localStorage",
          "sessionStorage",
          "navigator",
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector:
              "ImportDeclaration:not([source.value='@scifunlab/solution-sdk/kit']):not([source.value='@scifunlab/solution-sdk/bench']):not([source.value='react']):not([source.value='framer-motion']):not([source.value='three']):not([source.value='@react-three/fiber']):not([source.value='@react-three/drei']):not([source.value=/^\\.\\/[^/]+$/])",
            message:
              'Contributed kit files may only import "@scifunlab/solution-sdk/kit", "@scifunlab/solution-sdk/bench", "react", "framer-motion", "three", "@react-three/fiber", "@react-three/drei", or local "./<file>" modules.',
          },
          {
            selector: "ExportNamedDeclaration[source], ExportAllDeclaration",
            message: "Re-exporting external modules is not allowed in contributed kit files.",
          },
          {
            selector: "ImportExpression",
            message: "Dynamic import() is not allowed in contributed kit files.",
          },
          {
            selector: "CallExpression[callee.name='require']",
            message: "require() is not allowed in contributed kit files.",
          },
        ],
      },
    },
  ],
};
