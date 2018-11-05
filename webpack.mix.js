let mix = require('laravel-mix');
const Dotenv = require('dotenv-webpack');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

extraConfig = {
    browserSync: {
        proxy: 'localhost'
    }
}

if (!mix.inProduction()) {
    mix.options({ processCssUrls: false });
    mix.browserSync({
        proxy: extraConfig.browserSync.proxy,
        // files: ['path/to/files/to/watch/**/*.js'] // defaults to Laravel-specific watchers
        port: 3000,
        watchOptions: {
            usePolling: true, // necessary to notice change from host os
            interval: 2500
        },
        // files: [
        //     'public/js/**/*.js',
        //     'public/css/**/*.css'
        // ]
    });
    mix.webpackConfig({
        output: {
            chunkFilename: 'js/chunk-[id].js'
        },
        watchOptions: {
            poll: 2500
        }, // below includes node_modules for foundation babel-izing
        module: {
            rules: [{
                test: /\.js?$/,
                exclude: /((node_modules\/(?!foundation))|bower_components)/,
                // exclude: /(node_modules\/vue-notification|bower_components)/,
                use: [{
                    loader: 'babel-loader',
                    options: mix.config.babel()
                }]
            }]
        },
        plugins: [
            new Dotenv()
        ]
    });

} else {
    mix.options({ processCssUrls: false });

    if (extraConfig && extraConfig.browserSync &&
        extraConfig.browserSync.proxy != 'localhost') {
        mix.options({ processCssUrls: false });
    }
    mix.webpackConfig({
        output: {
            chunkFilename: 'js/chunk-[id]-[chunkhash].js'
        }, // below includes node_modules for foundation babel-izing
        module: {
            rules: [{
                test: /\.js?$/,
                exclude: /((node_modules\/(?!foundation))|bower_components)/,
                // exclude: /(bower_components)/,
                use: [{
                    loader: 'babel-loader',
                    options: mix.config.babel()
                }]
            }]
        },
        plugins: [
            new Dotenv()
        ]
    });
}

mix.js('resources/js/app.js', 'public/js')
   .sass('resources/sass/app.scss', 'public/css');
mix.version();


