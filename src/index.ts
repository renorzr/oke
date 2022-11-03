#!/usr/bin/env node

import { textSync, fontsSync } from 'figlet';
const chalk = require('chalk');
import { Command } from 'commander';
import { config } from 'dotenv';
import { up } from './compose';


const program = new Command();

program
  .version('0.0.1')
  .description("Create One-Key Environment of Micro-services")
  .option('-f, --file <path>', 'Compose configuration file', './docker-compose.yml')
  .option('-e, --env <path>', 'environment variables file', '.env')
  .parse();

console.log(chalk.green(textSync('OneKeyEnv', { horizontalLayout: 'full', font: 'Slant' })));

const { file, env } = program.opts();


(async function () {
  config({ path: env });
  await up(file);
  console.log('Done.')
})();
