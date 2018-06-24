import {join} from 'path';
import {readJsonSync} from 'fs-extra';
import {BuildContext, WebpackStats} from './interfaces';
import * as Constants from './constants';
import {Logger} from '../logger/logger';


let _context: BuildContext;
let cachedPackageJson: any;
export function getPackageJson() {
    if (!cachedPackageJson) {
        try {
            cachedPackageJson = readJsonSync(join(__dirname, '..', '..', 'package.json'));
        } catch (e) {
        }
    }
    return cachedPackageJson;
}

export function getVersion(): string {
    const packageJson = getPackageJson();
    return (packageJson && packageJson.version) ? packageJson.version : '';
}

export function setContext(context: BuildContext) {
    _context = context;
}

export function getContext() {
    return _context;
}

/**
 * 处理值，将字符串true和false转换成boolean类型的，如果为undefined则返回null
 * @param val
 * @returns {any}
 */
export function processValValue(val: any): any {
    if (val !== undefined) {
        if (val === 'true') {
            return true;
        }
        if (val === 'false') {
            return false;
        }
        return val;
    }
    return null;
}
/**
 * 深度拷贝
 * Object.assign 只是比浅拷贝多了一层，需要特别注意
 * 浅拷贝只是内存地址的引用
 */
export const objectAssign = (Object.assign) ? Object.assign : function (target: any, source: any) {
    const output = Object(target);

    for (let index = 1; index < arguments.length; index++) {
        source = arguments[index];
        if (source !== undefined && source !== null) {
            for (let key in source) {
                if (source.hasOwnProperty(key)) {
                    output[key] = source[key];
                }
            }
        }
    }

    return output;
};

export function getBooleanPropertyValue(propertyName: string): boolean {
    const result = process.env[propertyName];
    return result === 'true';
}

export function webpackStatsToDependencyMap(context: BuildContext, stats: any) {
    const statsObj = stats.toJson({
        source: false,
        timings: false,
        version: false,
        errorDetails: false,
        chunks: false,
        chunkModules: false
    });
    return processStatsImpl(statsObj);
}

export function processStatsImpl(webpackStats: WebpackStats) {
    const dependencyMap = new Map<string, Set<string>>();
    if (webpackStats && webpackStats.modules) {
        webpackStats.modules.forEach(webpackModule => {
            const moduleId = purgeWebpackPrefixFromPath(webpackModule.identifier);
            const dependencySet = new Set<string>();
            webpackModule.reasons.forEach(webpackDependency => {
                const depId = purgeWebpackPrefixFromPath(webpackDependency.moduleIdentifier);
                dependencySet.add(depId);
            });
            dependencyMap.set(moduleId, dependencySet);
        });
    }

    return dependencyMap;
}

export function purgeWebpackPrefixFromPath(filePath: string) {
    return filePath.replace(process.env[Constants.ENV_WEBPACK_LOADER], '').replace('!', '');
}

export function printDependencyMap(map: Map<string, Set<string>>) {
    map.forEach((dependencySet: Set<string>, filePath: string) => {
        Logger.unformattedDebug('\n\n');
        Logger.unformattedDebug(`该 ${filePath} 下的文件已经导入:`);
        dependencySet.forEach((importeePath: string) => {
            Logger.unformattedDebug(`   ${importeePath}`);
        });
    });
}
