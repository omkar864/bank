
import * as functions from 'firebase-functions';
import next from 'next';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

const nextjsServer = next({
  dev: isDev,
  conf: {
    // When the function is running, the current working directory is the `functions` directory.
    // The .next directory is at the root of the project, so we construct the path from there.
    distDir: path.join(path.dirname(__dirname), '.next'),
  },
});
const nextjsHandle = nextjsServer.getRequestHandler();

export const nextServer = functions.https.onRequest((req, res) => {
  return nextjsServer.prepare().then(() => nextjsHandle(req, res));
});
