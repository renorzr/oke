import { readFileSync, writeFileSync } from 'fs';
import { dump, load } from 'js-yaml';
import { simpleGit } from 'simple-git';
import { join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import Docker from 'dockerode';
import { pack } from 'tar-fs';
import { OkeConfig, Source } from './types';

const OKE_START = "{{oke{";
const OKE_END = "}oke}}";
const SOURCE_DIR = resolve("./source");

export async function up(file: string) {
  const okeConfig = extractConfig(file);
  mkdirSync(SOURCE_DIR, { recursive: true });
  await pullSources(okeConfig.sources);
  await invalidateImages(okeConfig.sources);
  if (existsSync('before.js')) {
    console.log('start before handler: before.js');
    const code = await new Promise(resolve => {
      spawn('node', ['before.js'], { stdio: 'inherit' }).on('close', code => resolve(code));
    });

    if (code) {
      console.log('before handler exited with code', code);
      return;
    }
  }

  const proc = spawn('docker', ['compose', 'up', '-d'], { stdio: 'inherit' });

  await new Promise((resolve => {
    proc.on('close', code => {
      console.log('docker compose exited with code', code);
      resolve(code);
    });
  }))
}

function invalidateImages(sources: { [key: string]: Source }) {
  return Promise.all(Object.entries(sources).map(async ([name, source]) => {
    const docker = new Docker();
    const sourcePath = join(SOURCE_DIR, name);
    const imageDate = await getImageDate(docker, name);
    const sourceDate = await getSourceDate(sourcePath);
    if (imageDate && imageDate.getTime() < sourceDate.getTime()) {
      console.log("remove outdated image", name);
      await docker.getImage(name).remove({ force: true });
    }
  }));
}

async function getImageDate(docker: Docker, name: string) {
  try {
    const image = docker.getImage(name);
    const imageDetails = await image.inspect();
    return new Date(imageDetails.Created);
  } catch (e) {
    return undefined;
  }
}

async function getSourceDate(path: string) {
  const git = simpleGit(path);
  const logs = await git.log({ maxCount: 1 });
  if (!logs.latest) {
    throw new Error('failed to fetch git log');
  }
  return new Date(logs.latest.date);
}

function pullSources(sources: { [key: string]: Source }) {
  return Promise.all(Object.entries(sources).map(([name, source]) => pull(name, source)));
}

async function pull(name: string, source: Source) {
  const sourcePath = join(SOURCE_DIR, name);
  console.log('sourcePath=', sourcePath);
  if (existsSync(sourcePath)) {
    console.log('pull', name);
    const git = simpleGit(sourcePath);
    await git.pull();
    console.log('checkout', name, source.branch);
    await git.checkout(source.branch);
    console.log('git pull');
    await git.pull();
  } else {
    console.log('clone', name);
    await simpleGit(SOURCE_DIR).clone(source.repo, sourcePath);
    console.log('checkout', name, source.branch);
    await simpleGit(sourcePath).checkout(source.branch);
  }
  console.log('done pull', name);
};

function extractConfig(file: string) {
  const content = readFileSync(file, { encoding: 'utf-8' });
  const okeLines = [];
  let inOkeSection = false;
  const lines = content.split("\n");
  for (const i in lines) {
    const line = lines[i];
    if (line.indexOf(OKE_START) != -1) {
      inOkeSection = true;
    } else if (line.indexOf(OKE_END) != -1) {
      break;
    } else if (inOkeSection && line.startsWith('#')) {
      okeLines.push(line.replace(/^\#/, ''));
    }
  };

  return load(okeLines.join('\n')) as OkeConfig;
}
