/* eslint-disable */

process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function (config) {
	config.set({
		frameworks: ["mocha"],
		files: [{ pattern: "test/test.ts", watched: false }],
		preprocessors: { "**/*.ts": "rollup" },
		browsers: ["ChromeHeadless"],
		singleRun: true,
		rollupPreprocessor: {
			plugins: [
				require("@rollup/plugin-typescript")({ tsconfig: "test/tsconfig.json" }),
				require("@rollup/plugin-image")(),
				require("@rollup/plugin-node-resolve").nodeResolve(),
				require("@rollup/plugin-commonjs")()
			],
			output: { format: "iife" },
		}
	});
};
