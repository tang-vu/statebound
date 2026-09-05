import {register} from 'tsx/esm/api';
import {parentPort,workerData} from 'node:worker_threads';
register();
const {verify}=await import('./evidence.ts');
parentPort.postMessage(verify(workerData));
