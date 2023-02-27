#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const figlet_1 = require("figlet");
const chalk = require('chalk');
const commander_1 = require("commander");
const dotenv_1 = require("dotenv");
const compose_1 = require("./compose");
const fs_1 = require("fs");
const program = new commander_1.Command();
program
    .version('0.0.1')
    .description("Create One-Key Environment of Micro-services")
    .option('-f, --file <path>', 'Compose configuration file', './docker-compose.yml')
    .option('-e, --env <path>', 'environment variables file', '.env')
    .parse();
console.log(chalk.green((0, figlet_1.textSync)('OneKeyEnv', { horizontalLayout: 'full', font: 'Slant' })));
const { file, env } = program.opts();
if (!(0, fs_1.existsSync)(file)) {
    console.log(file, 'not exists');
}
if (!(0, fs_1.existsSync)(env)) {
    console.log(env, 'not exists');
}
(async function () {
    (0, dotenv_1.config)({ path: env });
    await (0, compose_1.up)(file);
    console.log('Done.');
})();
