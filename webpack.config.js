const path = require('path');
const nodeExternals = require('webpack-node-externals');

let config = {
  entry: './src/app.js',
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  output: {
    library: 'cei-crawler',
    libraryTarget: 'umd',
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist'),
  }
};
module.exports = config;