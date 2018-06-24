import {EventEmitter} from 'events';
import {BuildContext, BuildState, TaskInfo} from './util/interfaces';
import {fillConfigDefaults, getUserConfigFile, replacePathVars} from './util/config';
import {Logger} from './logger/logger';
import {getBooleanPropertyValue, printDependencyMap, webpackStatsToDependencyMap} from './util/helpers';
import {BuildError, IgnorableError} from './util/error';

import * as webpackApi from 'webpack';
import * as Constants from './util/constants';
import {dirname} from 'path';

const taskInfo: TaskInfo = {
    fullArg: '--webpack',
    shortArg: '-w',
    envVar: 'HYMUI_WEBPACK',
    packageConfig: 'hymui_webpack',
    defaultConfigFile: 'webpack.config'
};

export interface WebpackOutputObject {
    path: string;
    filename: string;
}

export interface WebpackResolveObject {
    extensions: string[];
    modules: string[];
}

export interface WebpackConfig {
    devtool: string;
    entry: string | { [key: string]: any };
    output: WebpackOutputObject;
    resolve: WebpackResolveObject;
}

const eventEmitter = new EventEmitter();
const INCREMENTAL_BUILD_FAILED = 'incremental_build_failed';
const INCREMENTAL_BUILD_SUCCESS = 'incremental_build_success';

let pendingPromises: Promise<any>[] = [];

export function webpack(context: BuildContext, configFile: string) {
    configFile = getUserConfigFile(context, taskInfo, configFile);

    const logger = new Logger('webpack');

    return webpackWorker(context, configFile)
        .then(() => {
            context.bundleState = BuildState.SuccessfulBuild;
            logger.finish();
        })
        .catch(err => {
            context.bundleState = BuildState.RequiresBuild;
            throw logger.fail(err);
        });
}

export function webpackWorker(context: BuildContext, configFile: string): Promise<any> {
    const webpackConfig = getWebpackConfig(context, configFile);

    let promise: Promise<any> = null;
    if (context.isWatch) {
        // 增量编译
        promise = runWebpackIncrementalBuild(!context.webpackWatch, context, webpackConfig);
    } else {
        // 全量编译
        promise = runWebpackFullBuild(webpackConfig);
    }

    return promise
        .then((stats: any) => {
            return webpackBuildComplete(stats, context, webpackConfig);
        });
}


export function getWebpackConfig(context: BuildContext, configFile: string): WebpackConfig {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    const webpackConfigDictionary = fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
    const webpackConfig: WebpackConfig = getWebpackConfigFromDictionary(context, webpackConfigDictionary);
    webpackConfig.entry = replacePathVars(context, webpackConfig.entry);
    webpackConfig.output.path = replacePathVars(context, webpackConfig.output.path);

    return webpackConfig;
}

export function getWebpackConfigFromDictionary(context: BuildContext, webpackConfigDictionary: any): WebpackConfig {
    if (context.runAot) {
        return webpackConfigDictionary['prod'];
    }
    return webpackConfigDictionary['dev'];
}


export function runWebpackFullBuild(config: WebpackConfig) {
    return new Promise((resolve, reject) => {
        const callback = (err: Error, stats: any) => {
            if (err) {
                reject(new BuildError(err));
            } else {
                const info = stats.toJson();

                if (stats.hasErrors()) {
                    reject(new BuildError(info.errors));
                } else if (stats.hasWarnings()) {
                    Logger.debug(info.warnings);
                    resolve(stats);
                } else {
                    resolve(stats);
                }
            }
        };
        const compiler = webpackApi(config as any);
        compiler.run(callback);
    });
}

function runWebpackIncrementalBuild(initializeWatch: boolean, context: BuildContext, config: WebpackConfig) {
    const promise = new Promise((resolve, reject) => {
        // 开始监听，触发事件后移除监听
        eventEmitter.on(INCREMENTAL_BUILD_FAILED, (err: Error) => {
            Logger.debug('Webpack 捆绑失败');
            eventEmitter.removeAllListeners();
            handleWebpackBuildFailure(resolve, reject, err, promise, pendingPromises);
        });

        eventEmitter.on(INCREMENTAL_BUILD_SUCCESS, (stats: any) => {
            Logger.debug('Webpack 捆绑成功');
            eventEmitter.removeAllListeners();
            handleWebpackBuildSuccess(resolve, reject, stats, promise, pendingPromises);
        });

        if (initializeWatch) {
            startWebpackWatch(context, config);
        }
    });

    pendingPromises.push(promise);

    return promise;
}

function handleWebpackBuildFailure(resolve: Function, reject: Function, error: Error, promise: Promise<any>, pendingPromises: Promise<void>[]) {
    // 判断是最后一个Promise
    if (pendingPromises.length > 0 && pendingPromises[pendingPromises.length - 1] === promise) {
        // 执行拒绝方法
        reject(new BuildError(error));
        return;
    }
    // 如果是其他的，则执行一个屏蔽的错误
    reject(new IgnorableError());
}

function handleWebpackBuildSuccess(resolve: Function, reject: Function, stats: any, promise: Promise<any>, pendingPromises: Promise<void>[]) {
    if (pendingPromises.length > 0 && pendingPromises[pendingPromises.length - 1] === promise) {
        Logger.debug('handleWebpackBuildSuccess: 通过webpack处理数据成功');
        resolve(stats);
        return;
    }
    Logger.debug('handleWebpackBuildSuccess: 处理一个屏蔽的错误');
    reject(new IgnorableError());
}
/**
 * 开始webpack的监听
 * @param context
 * @param config
 */
function startWebpackWatch(context: BuildContext, config: WebpackConfig) {
    Logger.debug('开始webpack的监听...');
    const compiler = webpackApi(config as any);
    context.webpackWatch = compiler.watch({}, (err: Error, stats: any) => {
        if (err) {
            eventEmitter.emit(INCREMENTAL_BUILD_FAILED, err);
        } else {
            eventEmitter.emit(INCREMENTAL_BUILD_SUCCESS, stats);
        }
    });
}

function webpackBuildComplete(stats: any, context: BuildContext, webpackConfig: WebpackConfig) {
    if (getBooleanPropertyValue(Constants.ENV_PRINT_WEBPACK_DEPENDENCY_TREE)) {
        Logger.debug('Webpack 开始处理依赖关系图');
        const dependencyMap = webpackStatsToDependencyMap(context, stats);
        printDependencyMap(dependencyMap);
        Logger.debug('Webpack 完成依赖关系图处理');
    }

    // set the module files used in this bundle
    // this reference can be used elsewhere in the build (sass)
    const files: string[] = [];
    stats.compilation.modules.forEach((webpackModule: any) => {
        if (webpackModule.resource) {
            files.push(webpackModule.resource);
        } else if (webpackModule.context) {
            files.push(webpackModule.context);
        } else if (webpackModule.fileDependencies) {
            webpackModule.fileDependencies.forEach((filePath: string) => {
                files.push(filePath);
            });
        }
    });

    const trimmedFiles = files.filter(file => file && file.length > 0);

    context.moduleFiles = trimmedFiles;

    return setBundledFiles(context);
}

export function setBundledFiles(context: BuildContext) {
    const bundledFilesToWrite = context.fileCache.getAll().filter(file => {
        return dirname(file.path).indexOf(context.buildDir) >= 0 && (file.path.endsWith('.js') || file.path.endsWith('.js.map'));
    });
    context.bundledFilePaths = bundledFilesToWrite.map(bundledFile => bundledFile.path);
}

