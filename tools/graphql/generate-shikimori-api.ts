import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'tools/graphql/schema.graphql',
  documents: 'src/**/*.{ts,tsx,graphql}',
  generates: {
    'src/shared/shikimori-api/index.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
    },
    './graphql.schema.json': {
      plugins: ['introspection'],
    },
  },
};

export default config;
