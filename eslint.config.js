import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["dist/**"],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ["src/**/*.ts", "*.ts"],
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			"no-undef": "off",
		},
	},
	{
		files: ["scripts/**/*.mjs", "test/**/*.mjs"],
		languageOptions: {
			globals: globals.node,
		},
	},
	prettier,
);
