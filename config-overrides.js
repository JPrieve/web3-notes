const webpack = require('webpack');

module.exports = function override(config, env) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    url: require.resolve('url'),
    buffer: require.resolve('buffer'),
  });
  config.resolve.fallback = fallback;
  
  // Fix for ESM modules
  config.resolve.extensionAlias = {
    '.js': ['.js', '.ts', '.tsx'],
    '.mjs': ['.mjs', '.mts'],
  };
  
  // Add alias for openapi-fetch to use the correct entry point
  config.resolve.alias = {
    ...config.resolve.alias,
    'openapi-fetch': require.resolve('openapi-fetch'),
  };
  
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(
      /^openapi-fetch$/,
      require.resolve('openapi-fetch')
    ),
  ]);
  
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /Can't resolve '@react-native-async-storage\/async-storage'/,
  ];
  
  // Handle ESM modules properly
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: 'pre',
    loader: require.resolve('source-map-loader'),
    resolve: {
      fullySpecified: false,
    },
  });
  
  // Add rule to handle openapi-fetch specifically
  config.module.rules.unshift({
    test: /node_modules\/openapi-fetch/,
    resolve: {
      fullySpecified: false,
    },
  });
  
  // Use source-map instead of eval for development to avoid CSP issues
  if (env === 'development') {
    config.devtool = 'source-map';
  }
  
  return config;
};
