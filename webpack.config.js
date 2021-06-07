const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env) => {
    const MAIN = !!(env && env.main)
    const PRELOAD = !!(env && env.preload)
    const RENDER = (!MAIN && !PRELOAD) || !!(env && env.render)
    return {
        // Electronのレンダラプロセスで動作することを指定する
        target: MAIN || PRELOAD ? 'electron-main' : 'electron-renderer',
        // 起点となるファイル
        entry: MAIN ? './src/main.ts' : PRELOAD ? './src/preload.ts' : './src/renderer.tsx',
        // webpack watch したときに差分ビルドができる
        cache: true,
        // development は、 source map file を作成、再ビルド時間の短縮などの設定となる
        // production は、コードの圧縮やモジュールの最適化が行われる設定となる
        mode: 'development', // "production" | "development" | "none"
        // ソースマップのタイプ
        devtool: 'source-map',
        // 出力先設定 __dirname は node でのカレントディレクトリのパスが格納される変数
        output: {
            path: path.join(__dirname, 'dist'),
            filename: MAIN ? 'main.js' : PRELOAD ? 'preload.js' : 'renderer.js',
        },
        // ファイルタイプ毎の処理を記述する
        module: {
            rules: [
                {
                    // コンパイルの事前に eslint による
                    // 拡張子 .ts または .tsx の場合
                    test: /\.(ts|js)x?$/,
                    // 事前処理であることを示す
                    enforce: 'pre',
                    // TypeScript をコードチェックする
                    loader: 'eslint-loader',
                },
                {
                    test: /\.(ts|js)x?$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-typescript',
                                '@babel/preset-react',
                            ],
                            plugins: [
                                '@babel/proposal-class-properties',
                                '@babel/proposal-object-rest-spread',
                                'babel-plugin-styled-components',
                            ],
                        },
                    },
                },
                /*
                {
                    // 正規表現で指定する
                    // 拡張子 .ts または .tsx の場合
                    test: /\.tsx?$/,
                    // ローダーの指定
                    // TypeScript をコンパイルする
                    use: 'ts-loader',
                },
                */
            ],
        },
        // 処理対象のファイルを記載する
        resolve: {
            extensions: [
                '.ts',
                '.tsx',
                '.js', // node_modulesのライブラリ読み込みに必要
            ],
        },
        plugins: [
            // Webpack plugin を利用する
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './index.html',
            }),
        ],
    };
}