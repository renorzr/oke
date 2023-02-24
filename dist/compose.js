"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = void 0;
const fs_1 = require("fs");
const js_yaml_1 = require("js-yaml");
const simple_git_1 = require("simple-git");
const path_1 = require("path");
const fs_2 = require("fs");
const child_process_1 = require("child_process");
const dockerode_1 = __importDefault(require("dockerode"));
const OKE_START = "{{oke{";
const OKE_END = "}oke}}";
const SOURCE_DIR = (0, path_1.resolve)("./source");
async function up(file) {
    const okeConfig = extractConfig(file);
    console.log('OKE config:');
    console.log((0, js_yaml_1.dump)(okeConfig));
    console.log('mkdir', SOURCE_DIR);
    (0, fs_2.mkdirSync)(SOURCE_DIR, { recursive: true });
    await pullSources(okeConfig.sources);
    await invalidateImages(okeConfig.sources);
    const proc = (0, child_process_1.spawn)('docker', ['compose', 'up', '-d'], { stdio: 'inherit' });
    await new Promise((resolve => {
        proc.on('close', code => {
            console.log('docker compose exited with code', code);
            resolve(code);
        });
    }));
}
exports.up = up;
function invalidateImages(sources) {
    return Promise.all(Object.entries(sources).map(async ([name, source]) => {
        const docker = new dockerode_1.default();
        const sourcePath = (0, path_1.join)(SOURCE_DIR, name);
        const imageDate = await getImageDate(docker, name);
        const sourceDate = await getSourceDate(sourcePath);
        if (imageDate && imageDate.getTime() < sourceDate.getTime()) {
            console.log("remove outdated image", name);
            await docker.getImage(name).remove({ force: true });
        }
    }));
}
async function getImageDate(docker, name) {
    try {
        const image = docker.getImage(name);
        const imageDetails = await image.inspect();
        return new Date(imageDetails.Created);
    }
    catch (e) {
        return undefined;
    }
}
async function getSourceDate(path) {
    const git = (0, simple_git_1.simpleGit)(path);
    const logs = await git.log({ maxCount: 1 });
    if (!logs.latest) {
        throw new Error('failed to fetch git log');
    }
    return new Date(logs.latest.date);
}
function pullSources(sources) {
    return Promise.all(Object.entries(sources).map(([name, source]) => pull(name, source)));
}
async function pull(name, source) {
    const sourcePath = (0, path_1.join)(SOURCE_DIR, name);
    console.log('sourcePath=', sourcePath);
    if ((0, fs_2.existsSync)(sourcePath)) {
        console.log('pull', name);
        const git = (0, simple_git_1.simpleGit)(sourcePath);
        await git.pull();
        console.log('checkout', name, source.branch);
        await git.checkout(source.branch);
        console.log('git pull');
        await git.pull();
    }
    else {
        console.log('clone', name);
        await (0, simple_git_1.simpleGit)(SOURCE_DIR).clone(source.repo, sourcePath);
        console.log('checkout', name, source.branch);
        await (0, simple_git_1.simpleGit)(sourcePath).checkout(source.branch);
    }
    console.log('done pull', name);
}
;
function extractConfig(file) {
    const content = (0, fs_1.readFileSync)(file, { encoding: 'utf-8' });
    const okeLines = [];
    let inOkeSection = false;
    const lines = content.split("\n");
    for (const i in lines) {
        const line = lines[i];
        if (line.indexOf(OKE_START) != -1) {
            inOkeSection = true;
        }
        else if (line.indexOf(OKE_END) != -1) {
            break;
        }
        else if (inOkeSection && line.startsWith('#')) {
            okeLines.push(line.replace(/^\#/, ''));
        }
    }
    ;
    return (0, js_yaml_1.load)(okeLines.join('\n'));
}
