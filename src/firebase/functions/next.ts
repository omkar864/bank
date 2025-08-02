
import * as functions from 'firebase-functions';
import next from 'next';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

// The key change is here. We construct the path from the function's runtime
// directory (__dirname, which will be /workspace/lib/) up to the project root
// where the .next folder lives.
const nextjsServer = next({
  dev: isDev,
  conf: {
    distDir: path.join(path.dirname(__dirname), '.next'),
  },
});
const nextjsHandle = nextjsServer.getRequestHandler();

export const nextServer = functions.https.onRequest((req, res) => {
  return nextjsServer.prepare().then(() => nextjsHandle(req, res));
});
