var path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env) => {
    const mode = env.NODE_ENV;
    const isDev = mode === 'development';
    return {
        mode,
        entry: {
            main: './src/main.js',
        },
        devtool: isDev ? 'inline-source-map' : false,
        plugins: [
            new CleanWebpackPlugin(),
            new HtmlWebpackPlugin({
                title: 'Placeholder title',
                scriptLoading: 'defer',
                hash: true,
            }),
        ],
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: env.PORT
        },
        output: {
            filename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'dist'),
        },
    };
};