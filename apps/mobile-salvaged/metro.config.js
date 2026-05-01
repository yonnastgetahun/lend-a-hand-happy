const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Exclude test files from the bundle — Metro tries to resolve bun:test
// imports when test files live inside app/ (Expo Router route directory).
config.resolver.blockList = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /e2e\//,
  /test-support\//,
];

module.exports = config;
