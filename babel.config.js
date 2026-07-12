module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Inlines Drizzle's .sql migration files as strings (expo-sqlite migrator).
      ['inline-import', { extensions: ['.sql'] }],
      'react-native-reanimated/plugin',
    ],
  };
};
