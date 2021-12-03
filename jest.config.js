/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['src/tests/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)']
};