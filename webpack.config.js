const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
    entry: {
      app: './src/index.js',
    },
    devtool: 'inline-source-map',
    devServer: {
      contentBase: './dist',
    },
    plugins: [
      // new CleanWebpackPlugin(['dist/*']) for < v2 versions of CleanWebpackPlugin
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        title: 'Storms',
      }),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          include: path.resolve(__dirname, 'src'),
          loader: 'babel-loader',
        },
      ],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
  };
