import {isDebugMode} from '../util/config';
import chalk from 'chalk';
import {IgnorableError,BuildError} from '../util/error';

/**
 * 日志类，用来进行日志输入
 * 并使用chalk模块，根据不同的日志类型显示不同颜色的日志信息
 */
export class Logger {
    private start: number;
    private scope: string;

    constructor(scope: string) {
        this.start = Date.now();
        this.scope = scope;
        let msg = `${scope} 任务开始 ...`;
        if (isDebugMode()) {
            msg += memoryUsage();
        }
    }

    // 用于处理日志开头的时间戳
    static INDENT = '           ';
    // 用于控制日志输入时，每行的最大字符长度
    static MAX_LEN = 120;

    /**
     * 换行方法
     */
    static newLine() {
        console.log('');
    }

    /**
     * 根据消息及颜色，打印普通的日志信息
     * @param msg 消息
     * @param color 颜色
     */
    static info(msg: string, color?: string) {
        const lines = Logger.wordWrap([msg]);
        if (lines.length) {
            let prefix = timePrefix();
            let lineOneMsg = lines[0].substr(prefix.length);
            if (color) {
                lineOneMsg = (<any>chalk)[color](lineOneMsg);
            }
            lines[0] = prefix + lineOneMsg;
        }
        lines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
                if (color) {
                    line = (<any>chalk)[color](line);
                }
            }
            console.log(line);
        });
    }


    /**
     * 打印错误的日志信息
     * @param msg 消息
     */
    static error(...msg: any[]) {
        const lines = Logger.wordWrap(msg);
        if (lines.length) {
            let prefix = timePrefix();
            lines[0] = prefix + lines[0].substr(prefix.length);
            if (isDebugMode()) {
                lines[0] += memoryUsage();
            }
        }
        lines.forEach(line => {
            console.log(chalk.red(line));
        });
    }

    /**
     * 只在Debug模式打印蓝色的信息
     */
    static debug(...msg: any[]) {
        if (isDebugMode()) {
            msg.push(memoryUsage());

            const lines = Logger.wordWrap(msg);
            if (lines.length) {
                let prefix = '[ DEBUG! ]';
                lines[0] = prefix + lines[0].substr(prefix.length);
            }
            lines.forEach(line => {
                console.log(chalk.cyan(line));
            });
        }
    }

    /**
     * 无格式处理的输入，直接输入错误消息
     * @param msg
     */
    static unformattedError(msg: string) {
        console.log(chalk.red(msg));
    }
    /**
     * 无格式处理的输入，直接输入调试消息
     * @param msg
     */
    static unformattedDebug(msg: string) {
        console.log(chalk.cyan(msg));
    }

    /**
     * 将输入的消息按照空格进行分割，并根据每行的最大长度进行换行处理
     * 并整理成字符串数组返回
     * @param msg 消息
     * @returns {string[]}
     */
    static wordWrap(msg: any[]) {
        const output: string[] = [];
        const words: any[] = [];
        msg.forEach(m => {
            if (m === null) {
                words.push('null');
            } else if (typeof m === 'undefined') {
                words.push('undefined');
            } else if (typeof m === 'string') {
                m.replace(/\s/gm, ' ')
                    .split(' ')
                    .forEach(strWord => {
                        if (strWord.trim().length) {
                            words.push(strWord.trim());
                        }
                    });
            } else if (typeof m == 'number' || typeof m == 'boolean') {
                words.push(() => {
                    return String(m);
                });
            } else if (typeof m == 'function') {
                words.push(m.toString());
            } else if (Array.isArray(m)) {
                words.push(() => {
                    return m.toString();
                });
            } else if (Object(m) === m) {
                words.push(() => {
                    return m.toString();
                });
            } else {
                words.push(m.toString());
            }
        });
        let line = Logger.INDENT;
        words.forEach(word => {
            if (typeof word == 'function') {
                if (line.trim().length) {
                    output.push(line);
                }
                output.push(word());
                line = Logger.INDENT;
            } else if (Logger.INDENT.length + word.length > Logger.MAX_LEN) {
                if (line.trim().length) {
                    output.push(line);
                }
                output.push(Logger.INDENT + word);
                line = Logger.INDENT;
            } else if ((word.length + line.length) > Logger.MAX_LEN) {
                output.push(line);
                line = Logger.INDENT + word + ' ';
            } else {
                line += word + ' ';
            }
        });
        if (line.trim().length) {
            output.push(line);
        }
        return output;
    }

    ready(color?: string, bold?: boolean) {
        this.completed('ready', color, bold);
    }

    finish(color?: string, bold?: boolean) {
        this.completed('finished', color, bold);
    }

    private completed(type: string, color: string, bold: boolean) {
        const duration = Date.now() - this.start;
        let time: string;

        if (duration > 1000) {
            time = ' 用时 ' + (duration / 1000).toFixed(2) + ' s';

        } else {
            let ms = parseFloat((duration).toFixed(3));
            if (ms > 0) {
                time = ' 用时 ' + duration + ' ms';
            } else {
                time = '用时小于1毫秒';
            }
        }

        let msg = `${this.scope} ${type}`;
        if (color) {
            msg = (<any>chalk)[color](msg);
        }
        if (bold) {
            msg = chalk.bold(msg);
        }

        msg += ' ' + chalk.dim(time);

        if (isDebugMode()) {
            msg += memoryUsage();
        }

        Logger.info(msg);
    }

    fail(err: Error) {
        if (err) {
            if (err instanceof IgnorableError) {
                return;
            }

            if (err instanceof BuildError) {
                let failedMsg = `${this.scope} 任务失败`;
                if (err.message) {
                    failedMsg += `: ${err.message}`;
                }

                if (!err.hasBeenLogged) {
                    Logger.error(`${failedMsg}`);

                    err.hasBeenLogged = true;

                    if (err.stack && isDebugMode()) {
                        Logger.debug(err.stack);
                    }

                } else if (isDebugMode()) {
                    Logger.debug(`${failedMsg}`);
                }
                return err;
            }
        }

        return err;
    }
}


function timePrefix() {
    const date = new Date();
    return '[' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' + ('0' + date.getSeconds()).slice(-2) + ']';
}


function memoryUsage() {
    return ` MEM: ${(process.memoryUsage().rss / 1000000).toFixed(1)}MB`;
}
