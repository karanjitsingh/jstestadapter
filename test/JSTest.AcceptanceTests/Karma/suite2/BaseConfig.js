//!
//! Copyright (C) Microsoft Corporation.  All rights reserved.
//!

/*
 * This file includes some common functionality relevant to *.testsuite.js files, including:
 *    - a base configuration that's shared between all testsuites, including the basePath, and proxies for getting source maps
 *    - a few helper methods that ensure source map files are included for the specified compiled typescript projects
 */

const path = require("path");

const appMagicBin = path.resolve(__dirname, "../..");
const srcDir = path.resolve(__dirname, appMagicBin, "../../../src");
const appMagicSrc = path.resolve(srcDir, "AppMagic");

const isLab = !require("fs").existsSync(srcDir);

/**
 * Join the set of "files sets" specified, and make sure any sourcemaps/source files are included
 *
 * @param {(string | string[] | {pattern: string, included: boolean})[]} fileSets: a set of dependencies to load
 * @returns a flat list of file paths/patterns for karma to load
 */
function joinAndAddSources(/** @type {(string | string[] | {pattern: string, included: boolean})[]} */ ...fileSets) {
    const result = fileSets
        .reduce((/** @type {(string|{pattern: string, included: boolean}) []} */prev, fileSet, index) => {
            if (!fileSet) {
                throw new Error(`Invalid pattern '${fileSet}'. Expected string or object with 'pattern' property.
                    ${index === 0 ? "" : "Previous pattern was: " + fileSets[index - 1]}`);
            }

            function add(/** @type {(string | {pattern: string, included: boolean}) | Array<string | {pattern: string, included: boolean}>} */ jsPathOrPattern) {
                if (typeof jsPathOrPattern !== "string")
                    prev.push(jsPathOrPattern);
                else
                    prev.push(...getJsAndSources(jsPathOrPattern));
            }

            if (Array.isArray(fileSet))
                fileSet.forEach(file => add(file));
            else
                add(fileSet);

            return prev;
        }, []);

    return [path.join(__dirname, "GlobalTestSetup.js")].concat(result);
}

/**
 * Returns the @param jsPath along with any associated sourcemaps/source files
 *
 * @param {string} jsPath
 * @returns
 */
function getJsAndSources(/** @type {string} */ jsPath) {
    const sources = getSources(jsPath);
    sources.push(jsPath);
    return sources;
}

/**
 * Returns the @param jsPath along with any associated sourcemaps/source files
 *
 * @param {string} jsPath
 * @returns
 */
function getSources(/** @type {string} */ jsPath) {
    const tsPath = getTsPath(jsPath);
    if (!tsPath)
        return [];

    return [
        { pattern: `${jsPath}.map`, included: false },
        { pattern: tsPath, included: false }
    ];
}

const excludedFolders = /^(resources|TestUtils|TestSuites|openSource)\b/i;
const jsOrUTPath = /(?:^|\/)(js|unittest)\/(.*)\/(.+\.js)$/i;
function getTsPath(/** @type {string} */ jsPath) {
    if (!jsPath)
        throw new Error("Unknock path");

    if (typeof jsPath !== "string")
        throw new Error("Expecting string path");

    if (isLab)
        return;

    /** @type {string[]}*/ const [_, jsOrUT, folder, file] = jsOrUTPath.exec(jsPath.trim()) || [];
    if (!jsOrUT || excludedFolders.test(folder))
        return;

    return path.join(appMagicSrc, jsOrUT, folder, "/**/*.+(tsx|ts)");
}

/**
 * @type {{basePath: string, plugins: any[], preprocessors: {[key: string]: string[]}, proxies: {[key: string]: string}}}
 */
const baseConfig = {
    basePath: appMagicBin,
    plugins: [
        require("./SourceMapPathProcessor")
    ],
    preprocessors: {
        "**/*.js": ["sourcemappath", "sourcemap"]
    },
    proxies: {
        // The TestAssets folder is shared amongst all the test suites.
        "/TestAssets/": "/base/unittest/TestAssets/",
    },
    client: {
        qunit: {
            showUI: true,
            hidepassed: true
        }
    }
};

if (!isLab) {
    // This is needed for Source maps. Source files start with /src/, and need to be mapped to the actual file on disc using an absolute path
    baseConfig.proxies["/src/"] = `/absolute${srcDir}/`;

    // the Karma server is case sensitive, and it seems that some paths in the sourcemaps reference JS instead of js
    baseConfig.proxies["/src/AppMagic/JS/"] = "/src/AppMagic/js/";
}

const extend = function (
    /** @type {{frameworks: string[], files: string[], ScriptTestOrchestrator: {object}, browsers: string[], proxies: {[key: string]: string}}} */ config
) {
    var newConfig = Object.assign({}, baseConfig);
    for (var p in config) {
        var pval = newConfig[p];

        // merge the new values with the base values
        if (pval && Array.isArray(pval)) {
            pval = pval.concat(config[p]);
        } else if (pval && pval instanceof Object) {
            pval = Object.assign({}, pval, config[p]);
        } else {
            // Replace with the new property since we only support merging of object and arrays.
            pval = config[p];
        }

        newConfig[p] = pval;
    }

    return newConfig;
}

module.exports = {
    extend,
    baseConfig,
    isLab,
    joinAndAddSources,
    getJsAndSources,
    getTsPath,
    getSources,
    paths: {
        appMagicSrc,
        appMagicBin
    }
};