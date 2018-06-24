import {FileCache} from './file-cache';
export interface SemverVersion {
    major: number;
    minor: number;
    patch: number;
}
// 定义一个用于编译项目的应用环境接口类
export interface BuildContext {
    rootDir?: string;
    tmpDir?: string;
    srcDir?: string;
    pagesDir?: string;
    componentsDir?: string;
    directivesDir?: string;
    pipesDir?: string;
    providersDir?: string;
    wwwDir?: string;
    wwwIndex?: string;
    buildDir?: string;  // 编译后存放在的目录
    outputJsFileName?: string;
    outputCssFileName?: string;
    nodeModulesDir?: string;
    angularCoreDir?: string;
    typescriptDir?: string;
    ionicAngularDir?: string;
    coreCompilerFilePath?: string;
    coreDir?: string;
    bundledFilePaths?: string[];
    moduleFiles?: string[];
    appNgModulePath?: string;
    componentsNgModulePath?: string;
    pipesNgModulePath?: string;
    directivesNgModulePath?: string;
    isProd?: boolean;
    isWatch?: boolean;
    runAot?: boolean;
    runMinifyJs?: boolean;
    runMinifyCss?: boolean;
    optimizeJs?: boolean;
    bundler?: string;
    fileCache?: FileCache;
    inlineTemplates?: boolean;
    webpackWatch?: any;
    ionicGlobal?: any;
    sourcemapDir?: string;

    sassState?: BuildState;
    transpileState?: BuildState;
    templateState?: BuildState;
    bundleState?: BuildState;
    deepLinkState?: BuildState;

    // target examples: cordova, browser, electron
    target?: string;

    // platform examples: ios, android, windows
    platform?: string;

    angularVersion?: SemverVersion;
    ionicAngularVersion?: SemverVersion;
    typescriptVersion?: SemverVersion;
}


export enum BuildState {
    SuccessfulBuild,
    RequiresUpdate,
    RequiresBuild
}


export interface TaskInfo {
    fullArg: string;            // 参数全名
    shortArg: string;           // 参数简称
    envVar: string;             // 环境变量名
    packageConfig: string;      // package配置名
    defaultConfigFile: string;  // 默认配置文件名
}

export interface WebpackDependency {
    moduleIdentifier: string;
}

export interface WebpackModule {
    identifier: string;
    reasons: WebpackDependency[];
}

export interface WebpackStats {
    modules: WebpackModule[];
}


export interface File {
    path: string;
    content: string;
    timestamp?: number;
}
