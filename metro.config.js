const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle ships migrations as .sql files imported at runtime; Metro must treat
// them as source so useMigrations() can bundle them into the dev/release build.
config.resolver.sourceExts.push('sql');

module.exports = config;
