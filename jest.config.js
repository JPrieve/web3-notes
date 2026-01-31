module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!(wagmi|@wagmi|viem|@tanstack)/)'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
