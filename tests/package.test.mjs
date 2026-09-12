import {fileURLToPath} from 'node:url';
import {packageContract} from '../vendor/cli-core/tests/package-contract.mjs';
packageContract(fileURLToPath(new URL('..',import.meta.url)));
