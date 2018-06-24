import {Logger} from './logger/logger';
import {getVersion, setContext} from './util/helpers';
import {generateContext} from './util/config';

export function run(task: string) {
    try {
        Logger.info(`HyMui 版本号:${getVersion()}`, 'cyan');
    } catch (e) {
    }

    try {
        // 生成一个全局的上下应用内容对象
        const context = generateContext(null);
        setContext(context);
        require(`../dist/${task}`)[task](context).catch((err: any) => {
            errorLog(task, err);
        });
    } catch (e) {
        errorLog(task, e);
    }
}


function errorLog(task: string, e: any) {
    Logger.error(`HyMui 当前任务: "${task}"`);
    if (e && e.toString() !== 'Error') {
        Logger.error(`${e}`);
    }
    if (e.stack) {
        Logger.unformattedError(e.stack);
    }
    process.exit(1);
}
