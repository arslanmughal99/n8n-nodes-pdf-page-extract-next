import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		rules: {
			// Disable the external dependency check you already had
			'n8n-nodes-base/community-package-json-no-external-dependencies': 'off',

			// Allow imports like 'pdf-parse'
			'@n8n/community-nodes/no-restricted-imports': 'off',

			// Allow globals like 'setTimeout'
			'@n8n/community-nodes/no-restricted-globals': 'off',

			// (Optional) Disable naming convention if you don't want to rename the file
			'n8n-nodes-base/node-filename-against-convention': 'off',

			// (Optional) Allow 'any' types
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
];
