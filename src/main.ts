import { app, BrowserWindow } from 'electron';
import path from 'path';
import * as isDev from 'electron-is-dev';

// セキュアな Electron の構成
// 参考: https://qiita.com/pochman/items/64b34e9827866664d436

const createWindow = (): void => {
    // レンダープロセスとなる、ウィンドウオブジェクトを作成する。
    const win = new BrowserWindow({
        width: 60,
        height: 1000,
        webPreferences: {
            nodeIntegration: false,
            nodeIntegrationInWorker: false,
            contextIsolation: true,
            preload: `${__dirname}/preload.js`,
        },
    });
    if (isDev) {
        win.loadURL('http://localhost:3000/index.html');
    } else {
        // 読み込む index.html。
        // tsc でコンパイルするので、出力先の dist の相対パスで指定する。
        win.loadFile('./index.html');
    }

    // Hot Reloading
    if (isDev) {
        // 'node_modules/.bin/electronPath'
        /* eslint @typescript-eslint/no-var-requires: 0 */
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
            forceHardReset: true,
            hardResetMethod: 'exit',
        });
    }

    // 開発者ツールを起動する
    win.webContents.openDevTools();
};

// Electronの起動準備が終わったら、ウィンドウを作成する。
app.whenReady().then(createWindow);

// すべての ウィンドウ が閉じたときの処理
app.on('window-all-closed', () => {
    // macOS 以外では、メインプロセスを停止する
    // macOS では、ウインドウが閉じてもメインプロセスは停止せず
    // ドックから再度ウインドウが表示されるようにする。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // macOS では、ウインドウが閉じてもメインプロセスは停止せず
    // ドックから再度ウインドウが表示されるようにする。
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
