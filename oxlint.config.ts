import { defineConfig } from "oxlint";

export default defineConfig({
	plugins: ["typescript", "oxc"],
	categories: {
		correctness: "warn",
		suspicious: "warn",
	},
	rules: {
		"typescript/no-non-null-assertion": "off",
	},
	overrides: [
		{
			files: ["test/**"],
			rules: {
				"typescript/no-explicit-any": "off",
				"typescript/triple-slash-reference": "off",
			},
		},
	],
});
