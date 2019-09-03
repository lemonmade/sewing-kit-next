import React from 'react';
import {renderToString} from 'react-dom/server';
import Koa from 'koa';
import App from '../../apps/example-one';

const app = new Koa();
app.use((ctx) => {
  ctx.body = `<html><body><div id="app">${renderToString(
    <App />,
  )}</div><script src="http://localhost:8081/assets/main.js"></script></body></html>`;
});

app.listen(8082, () => {
  // eslint-disable-next-line no-console
  console.log(`Service listening on localhost:8082`);
});
