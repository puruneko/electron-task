const fs = window.fs;

const logLevel = 'DEBUG';
const dd = num => {
    return ('0' + num).slice(-2);
};
const timestamp = () => {
    const d = new Date();
    return `${d.getFullYear()}/${dd(d.getMonth() + 1)}/${dd(d.getDay())} ${dd(d.getHours())}:${dd(
        d.getMinutes(),
    )}:${dd(d.getSeconds())}`;
};
const clientLogger = {
    trace: (...msg: unknown[]): void => console.log(`${timestamp()} [TRACE]`, ...msg),
    debug: (...msg: unknown[]): void => {
        if (logLevel == 'DEBUG') {
            console.log(`${timestamp()} [DEBUG]`, ...msg);
        }
    },
    info: (...msg: unknown[]): void => console.log(`${timestamp()} [INFO]`, ...msg),
    warn: (...msg: unknown[]): void => console.error(`${timestamp()} [WARN]`, ...msg),
    error: (...msg: unknown[]): void => console.error(`${timestamp()} [ERROR]`, ...msg),
};
let _logger = clientLogger;
if (typeof window === 'undefined') {
    //const fs = require('fs');
    // 標準出力をリダイレクト
    const out = fs.createWriteStream('web.log');
    // 標準エラー出力をリダイレクト
    const err = fs.createWriteStream('web.log');
    // カスタマイズされた独自コンソールオブジェクトを作成する。
    const fp = new console.Console(out, err);
    _logger = {
        trace: (...msg: unknown[]): void => fp.log(`${timestamp()} [TRACE]`, ...msg),
        debug: (...msg: unknown[]): void => {
            if (logLevel == 'DEBUG') {
                fp.log(`${timestamp()} [DEBUG]`, ...msg);
            }
        },
        info: (...msg: unknown[]): void => fp.log(`${timestamp()} [INFO]`, ...msg),
        warn: (...msg: unknown[]): void => fp.error(`${timestamp()} [WARN]`, ...msg),
        error: (...msg: unknown[]): void => fp.error(`${timestamp()} [ERROR]`, ...msg),
    };
}
export const logger = _logger;
