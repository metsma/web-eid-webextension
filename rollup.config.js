import resolve from "@rollup/plugin-node-resolve";

export default [
  ...["content", "background"].map((name) => ({
    input: `./dist/${name}/${name}.js`,

    output: [
      {
        file:      `dist/${name}.js`,
        format:    "iife",
        sourcemap: true,
      },
    ],
    plugins: [resolve()],
  })),
];
