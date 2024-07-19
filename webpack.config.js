const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');



module.exports = {

    mode: 'production',
    entry: {

        service_worker: './src/service_worker.js'

    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        sourceMapFilename: '[name].js.map',
        clean: true
    },
    cache: {
        type: 'filesystem', // Enable filesystem caching
        cacheDirectory: path.resolve(__dirname, '.webpack-cache') // Directory to store cache
    },
    devtool: 'source-map',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src'),
                    to: path.resolve(__dirname, 'dist'),
                    globOptions: {
                        ignore: ['**/service_worker.js']
                    },
                    force: false,
                }
            ]
        })
    ]

}