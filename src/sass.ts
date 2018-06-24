import {BuildContext, TaskInfo} from './util/interfaces';
import {Logger} from './logger/logger';
import {fillConfigDefaults, getUserConfigFile} from './util/config';
import {bundle} from './bundle';

const taskInfo: TaskInfo = {
    fullArg: '--sass',
    shortArg: '-s',
    envVar: 'HYMUI_SASS',
    packageConfig: 'hymui_sass',
    defaultConfigFile: 'sass.config'
};

export function sass(context: BuildContext, configFile?: string) {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    const logger = new Logger('sass');

    return Promise;
}

export function sassWorker(context: BuildContext, configFile: string) {
    const sassConfig: SassConfig = getSassConfig(context, configFile);
    const bundlePromise: Promise<any>[] = [];

    if (!context.moduleFiles && !sassConfig.file) {
        bundlePromise.push(bundle(context));
    }
}


export function getSassConfig(context: BuildContext, configFile: string): SassConfig {
    configFile = getUserConfigFile(context, taskInfo, configFile);
    return fillConfigDefaults(configFile, taskInfo.defaultConfigFile);
}


export interface SassConfig {
    outputFilename?: string;
    outFile?: string;
    file?: string;
    data?: string;
    includePaths?: string[];
    excludeModules?: string[];
    includeFiles?: RegExp[];
    excludeFiles?: RegExp[];
    directoryMaps?: { [key: string]: string };
    sortComponentPathsFn?: (a: any, b: any) => number;
    sortComponentFilesFn?: (a: any, b: any) => number;
    variableSassFiles?: string[];
    autoprefixer?: any;
    sourceMap?: string;
    omitSourceMapUrl?: boolean;
    sourceMapContents?: boolean;
    postCssPlugins?: any[];
}

