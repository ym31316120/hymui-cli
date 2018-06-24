import {BuildContext, TaskInfo} from './interfaces';
import {accessSync, readJSONSync, statSync} from 'fs-extra';
import {join, resolve} from 'path';
import {Logger} from '../logger/logger';
import * as Constants from './constants';
import {objectAssign, processValValue} from './helpers';
import {FileCache} from './file-cache';

// 定义一个用于保存当前命令行参数的数组对象
let processArgv: string[];
export function setProcessArgs(argv: string[]) {
    processArgv = argv;
}
setProcessArgs(process.argv);

export function addArgv(value: string) {
    processArgv.push(value);
}


export function generateContext(context: BuildContext): BuildContext {
    // 如果入参是空则自动生成一个空对象
    if (!context) {
        context = {};
    }

    if (!context.fileCache) {
        context.fileCache = new FileCache();
    }

    checkDebugMode();

    context.runAot = [
        context.runAot,
        context.isProd || hasArg('--aot'),
    ].find(val => typeof val === 'boolean');


    if (typeof context.isWatch !== 'boolean') {
        context.isWatch = hasArg('--watch');
    }


    context.rootDir = resolve(context.rootDir || getConfigValue(context, '--rootDir', null, Constants.ENV_VAR_ROOT_DIR,
            Constants.ENV_VAR_ROOT_DIR.toLowerCase(), processCwd));
    setProcessEnvVar(Constants.ENV_VAR_ROOT_DIR, context.rootDir);
    Logger.debug(`root文件夹目录为 ${context.rootDir}`);
    Logger.debug(`root文件夹目录为 ${context.rootDir}`);

    context.tmpDir = resolve(context.tmpDir || getConfigValue(context, '--tmpDir', null, Constants.ENV_VAR_TMP_DIR,
            Constants.ENV_VAR_TMP_DIR.toLowerCase(), join(context.rootDir, Constants.TMP_DIR)));
    setProcessEnvVar(Constants.ENV_VAR_TMP_DIR, context.tmpDir);
    Logger.debug(`temp临时目录为 ${context.tmpDir}`);

    context.srcDir = resolve(context.srcDir || getConfigValue(context, '--srcDir', null, Constants.ENV_VAR_SRC_DIR,
            Constants.ENV_VAR_SRC_DIR.toLowerCase(), join(context.rootDir, Constants.SRC_DIR)));
    setProcessEnvVar(Constants.ENV_VAR_SRC_DIR, context.srcDir);
    Logger.debug(`src源文件目录为 ${context.srcDir}`);


    context.wwwDir = resolve(context.wwwDir || getConfigValue(context, '--wwwDir', null, Constants.ENV_VAR_WWW_DIR,
            Constants.ENV_VAR_WWW_DIR.toLowerCase(), join(context.rootDir, Constants.WWW_DIR)));
    setProcessEnvVar(Constants.ENV_VAR_WWW_DIR, context.wwwDir);
    Logger.debug(`www文件夹目录为 ${context.wwwDir}`);

    context.buildDir = resolve(context.buildDir || getConfigValue(context, '--buildDir', null, Constants.ENV_VAR_BUILD_DIR,
            Constants.ENV_VAR_BUILD_DIR.toLowerCase(), join(context.wwwDir, Constants.BUILD_DIR)));
    setProcessEnvVar(Constants.ENV_VAR_BUILD_DIR, context.buildDir);
    Logger.debug(`build文件夹目录为 ${context.buildDir}`);

    return context;
}

export function getConfigValue(context: BuildContext, argsFullName: string, argShortName: string,
                               envVarName: string, packageProp: string, defaultValue: string) {
    if (!context) {
        context = generateContext(context);
    }

    // 首先看一下在命令行中是否指定了环境变量的参数值
    const argVal = getArgValue(argsFullName, argShortName);
    if (argVal !== null) {
        return argVal;
    }

    // 如果命令中没有，则到当前运行环境变量中查找
    const envVar = getProcessEnvVar(envVarName);
    if (envVar !== null) {
        return envVar;
    }
    // 如果还没没有，则到package.json中查找这个参数的值
    const packageConfig = getPackageJsonConfig(context, packageProp);
    if (packageConfig !== null) {
        return packageConfig;
    }
    // 如果都没有则返回默认参数值
    return defaultValue;
}

/**
 * 获取命令行中参数的值
 * 采用`参数 值 参数 值`的方式
 */
function getArgValue(fullName: string, shortName: string): string {
    for (let i = 2; i < processArgv.length; i++) {
        let arg = processArgv[i];
        if (arg === fullName || (shortName && arg === shortName)) {
            let val = processArgv[i + 1];
            if (val !== undefined && val !== '') {
                return val;
            }
        }
    }
    return null;
}


let processEnv: any;
export function setProcessEnv(env: any) {
    processEnv = env;
}
// 将node的环境变量赋值给当前进程的环境变量
setProcessEnv(process.env);

export function setProcessEnvVar(key: string, value: any) {
    if (key && value) {
        processEnv[key] = value;
    }
}

export function getProcessEnvVar(key: string): any {
    const val = processEnv[key];
    return processValValue(val);
}

let processCwd: string;
export function setCwd(cwd: string) {
    processCwd = cwd;
}
setCwd(process.cwd());

/**
 * 获取package.json中获取config属性中配置的参数信息
 * @param context
 * @param key
 * @returns {any}
 */
export function getPackageJsonConfig(context: BuildContext, key: string): any {
    const packageJsonData = getPackageJsonData(context);
    if (packageJsonData && packageJsonData.config) {
        const val = packageJsonData.config[key];
        return processValValue(val);
    }
    return null;
}

/**
 * 生成package.json的对象数据，并提供get和set方法
 */
let packageJsonData: any = null;
export function setPackageJsonData(data: any) {
    packageJsonData = data;
}
// 从应用的根目录获取package.json文件
function getPackageJsonData(context: BuildContext) {
    if (!packageJsonData) {
        try {
            packageJsonData = readJSONSync(join(context.rootDir, 'package.json'));
        } catch (e) {
        }
    }
    return packageJsonData;
}

// 设置应用的Debug模式标识
let checkedDebug = false;
function checkDebugMode() {
    if (!checkedDebug) {
        if (hasArg('--debug') || getProcessEnvVar('hymui_debug_mode') === 'true') {
            processEnv.debugMode = 'true';
        }
        checkedDebug = true;
    }
}

/**
 * 是否是Debug模式
 * @returns {boolean}
 */
export function isDebugMode() {
    return (!!processEnv.debugMode && processEnv.debugMode === 'true');
}

/**
 * 判断否参数是否在命令行中
 * @param fullName
 * @param shortName
 * @returns {boolean}
 */
export function hasArg(fullName: string, shortName: string = null): boolean {
    return !!(processArgv.some(a => a.toLowerCase() === fullName.toLowerCase()) ||
    (shortName !== null && processArgv.some(a => a.toLowerCase() === shortName.toLowerCase())));
}


export function getUserConfigFile(context: BuildContext, task: TaskInfo, userConfigFile: string) {
    if (!context) {
        context = generateContext(context);
    }

    if (userConfigFile) {
        return resolve(userConfigFile);
    }

    const defaultConfig = getConfigValue(context, task.fullArg, task.shortArg, task.envVar, task.packageConfig, null);
    if (defaultConfig) {
        return join(context.rootDir, defaultConfig);
    }

    return null;
}

/**
 * 填充默认配置信息到用户配置文件中
 * @param userConfigFile
 * @param defaultConfigFile
 * @returns {any}
 */
export function fillConfigDefaults(userConfigFile: string, defaultConfigFile: string): any {
    let userConfig: any = null;

    if (userConfigFile) {
        try {
            // 同步判断文件是否存在
            statSync(userConfigFile);
            userConfig = require(userConfigFile);
            if (typeof userConfig === 'function') {
                userConfig = userConfig();
            }
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.error(`配置文件 "${userConfigFile}" 不存在. 使用默认值.`);
            } else {
                console.error(`在 "${userConfigFile}" 配置文件中发现错误". 使用默认值.`);
                console.error(e);
            }
        }
    }

    const defaultConfig = require(join('..', '..', 'config', defaultConfigFile));

    // 每次都生成一个新的配置信息对象数据
    return objectAssign({}, defaultConfig, userConfig);
}

export function replacePathVars(context: BuildContext, filePath: string | string[] | { [key: string]: any }): any {
    if (Array.isArray(filePath)) {
        return filePath.map(f => replacePathVars(context, f));
    }

    if (typeof filePath === 'object') {
        const clonedFilePaths = Object.assign({}, filePath);
        for (let key in clonedFilePaths) {
            clonedFilePaths[key] = replacePathVars(context, clonedFilePaths[key]);
        }
        return clonedFilePaths;
    }

    return filePath.replace('{{SRC}}', context.srcDir)
        .replace('{{WWW}}', context.wwwDir)
        .replace('{{TMP}}', context.tmpDir)
        .replace('{{ROOT}}', context.rootDir)
        .replace('{{BUILD}}', context.buildDir);
}

