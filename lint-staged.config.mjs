export default {
  '**/*.{js,cts,ts,tsx,json,md,yml}': 'prettier --write',
  '**/*.{js,cts,ts,tsx}': 'eslint',
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
};
