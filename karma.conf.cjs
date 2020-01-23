/* eslint-env node */

process.env.CHROME_BIN = require("puppeteer").executablePath();

module.exports = function (config) {
	config.set({
		frameworks: ["mocha"],
		files: [
			"test/test.ts"
		],
		preprocessors: {
			"test/test.ts": ["webpack"]
		},
		webpack: {
			mode: "development",
			module: {
				rules: [
					{
						test: /\.png$/i,
						loader: "url-loader"
					},
					{
						test: /\.ts$/,
						loader: "ts-loader",
						options: {
							transpileOnly: true
						}
					}
				]
			},
			resolve: {
				extensions: [".ts", ".js", ".json"]
			}
		},
		webpackMiddleware: {
			stats: "errors-only"
		},
		mime: {
			"text/x-typescript": ["ts"]
		},
		browsers: ["ChromeHeadlessNoSandbox"],
		customLaunchers: {
			ChromeHeadlessNoSandbox: {
				base: "ChromeHeadless",
				flags: ["--no-sandbox"]
			}
		},
		singleRun: true
	});
};
