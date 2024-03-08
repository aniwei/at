module.exports = {
  parser: '@typescript-eslint/parser',
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'o2team',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    'new-cap': 0,
    'class-methods-use-this': 0,
    'no-undef': 1,
    'no-undefined': 0,
    'no-await-in-loop': 0,
    'no-mixed-operators': 0,
    'no-use-before-define': 0,
    'brace-style': 0,
    'no-unused-vars': 0,
    'arrow-body-style': 0,
    'no-nested-ternary': 0,
    'space-before-function-paren': 0,
    '@typescript-eslint/no-for-in-array': 0,
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-unused-vars': 1,
    '@typescript-eslint/triple-slash-reference': 0,
    '@typescript-eslint/no-misused-promises': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-unsafe-call': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/no-empty-function': 1,
    '@typescript-eslint/no-use-before-define': 0,
    '@typescript-eslint/no-unsafe-argument': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/member-delimiter-style': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/ban-ts-comment': 1,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Function: false
        }
      }
    ]
  }
}
