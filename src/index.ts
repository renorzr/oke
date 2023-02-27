#!/usr/bin/env node

import { textSync, fontsSync } from 'figlet';
const chalk = require('chalk');
import { Command } from 'commander';
import { config } from 'dotenv';
import { up } from './compose';
import { existsSync } from 'fs';
import { exit } from 'process';


const program = new Command();

program
  .version('0.0.1')
  .description("Create One-Key Environment of Micro-services")
  .option('-f, --file <path>', 'Compose configuration file', './docker-compose.yml')
  .option('-e, --env <path>', 'environment variables file', '.env')
  .parse();

console.log(chalk.green(textSync('OneKeyEnv', { horizontalLayout: 'full', font: 'Slant' })));

const { file, env } = program.opts();

if (!existsSync(file)) {
  console.log(file, 'not exists');
  exit(1);
}

if (!existsSync(env)) {
  console.log(env, 'not exists');
  exit(1);
}

(async function () {
  config({ path: env });
  await up(file);
  console.log('Done.')
})();
