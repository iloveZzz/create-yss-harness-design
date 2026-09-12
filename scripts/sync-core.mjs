import {fileURLToPath} from 'node:url';
import {syncCore} from '../vendor/cli-core/build.mjs';
const args=process.argv.slice(2),check=args.includes('--check'),values=args.filter(x=>x!=='--check');
if(values.length!==2)throw new Error('usage: pnpm sync-core <source-repo> <commit> [--check]');
console.log(JSON.stringify(syncCore(values[0],values[1],fileURLToPath(new URL('..',import.meta.url)),check),null,2));
