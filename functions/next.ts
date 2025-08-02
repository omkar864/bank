
import * as functions from 'firebase-functions';
import next from 'next';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

// This is the crucial fix. 
// When the function runs in the cloud, `__dirname` is `/workspace/lib/`.
// We need to go up two directories to the project root (`/workspace/`) to find the `.next` folder.
const nextjsServer = next({
  dev: isDev,
  conf: {
    distDir: path.join(__dirname, '..', '..', '.next'),
  },
});
const nextjsHandle = nextjsServer.getRequestHandler();

export const nextServer = functions.https.onRequest((req, res) => {
  return nextjsServer.prepare().then(() => nextjsHandle(req, res));
});
