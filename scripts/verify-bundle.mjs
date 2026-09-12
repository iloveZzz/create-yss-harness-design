import {fileURLToPath} from 'node:url';
import {verifyCore} from '../vendor/cli-core/build.mjs';
import {loadBundle} from '../vendor/cli-core/bundle.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const core=verifyCore(root),bundle=loadBundle(root);
console.log(JSON.stringify({package:bundle.pkg.name,core:core.digest,template:bundle.snapshot.snapshotHash,files:bundle.files.size}));
