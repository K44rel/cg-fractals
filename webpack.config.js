const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");

module.exports = {
  entry: "./src/app.js",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(glsl)$/,
        use: [
          'raw-loader',
        ],
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Three.js App',
      filename: 'index.html'
    })
  ]
};
