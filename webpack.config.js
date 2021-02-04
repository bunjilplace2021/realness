const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const isProduction = process.env.NODE_ENV === "production" ? true : false;
module.exports = {
  mode: process.env.NODE_ENV,
  devtool: false,
  entry: __dirname + "/src/app/index.js", // webpack entry point. Module to start building dependency graph
  output: {
    path: path.resolve(__dirname, "sound/"),
    filename: "soundmain.js",
  },
  devServer: {
    before: (app, server) => {
      server._watch(path.join(__dirname, "./src"));
    },
    publicPath: "/sound",
    contentBase: path.resolve(__dirname, "."),
    compress: true,
    host: "0.0.0.0",
    port: 3000,
    hot: true,
    stats: "errors-only",
    watchOptions: {
      poll: false,
      ignored: ["node_modules"],
    },
  },

  plugins: [
    new webpack.ProgressPlugin(),
    new MiniCssExtractPlugin({ filename: "main.[chunkhash].css" }),
  ],
  resolve: {
    fallback: {
      util: require.resolve("util/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [path.resolve(__dirname, "src")],
        loader: "babel-loader",
      },
      {
        test: /\.(mp3|aac)$/,

        loader: "file-loader",
      },
      {
        test: /.css$/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",

            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],

    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/,
        },
      },

      chunks: "async",
      minChunks: 1,
      minSize: 30000,
      name: false,
    },
  },
};
