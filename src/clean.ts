import {BuildContext} from './util/interfaces';
import {emptyDirSync} from 'fs-extra';
import {BuildError} from './util/error';
import {Logger} from './logger/logger';

export function clean(context: BuildContext) {
    return new Promise((resolve, reject) => {
        const logger = new Logger('clean');
        try {
            Logger.debug(`[Clean] 清理: 正在清理目录 ${context.buildDir}`);
            // 清空编译后的目录
            emptyDirSync(context.buildDir);

            logger.finish();
        } catch (ex) {
            reject(logger.fail(new BuildError(`清空目录失败： ${context.buildDir} - ${ex.message}`)));
        }
        resolve();
    });
}
