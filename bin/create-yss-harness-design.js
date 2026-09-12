#!/usr/bin/env node
import {fileURLToPath} from 'node:url';
import {main} from '../vendor/cli-core/cli.mjs';
await main(fileURLToPath(new URL('..',import.meta.url)));
