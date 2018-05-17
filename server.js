require('newrelic');
const express = require('express');
// const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const cluster = require('cluster');
const os = require('os');
const loader = require('./loader');
const React = require('react');
const ReactDom = require('react-dom/server');
const Layout = require('./templates/layout');
const App = require('./templates/app');
const Scripts = require('./templates/scripts');

if (cluster.isMaster) {
  const numWorkers = os.cpus().length;

  console.log(`Master cluster setting up ${numWorkers} workers...`);

  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code}, and signal ${signal}`);
  });
  console.log('starting new worker');
  cluster.fork();
} else {
  const app = express();
  const port = 3000;

  // app.use(morgan('dev'));

  app.use(bodyParser.urlencoded({ extended: false }));

  app.use(bodyParser.json());

  const clientBundles = './public/services';
  const serverBundles = './templates/services';
  const serviceConfig = require('./service-config.json');
  const services = loader(clientBundles, serverBundles, serviceConfig);

  const renderComponents = components => (
    Object.keys(components).map((item) => {
      const component = React.createElement(components[item]);
      return ReactDom.renderToString(component);
    })
  );

  app.use('/restaurants', express.static(path.join(__dirname, './public')));

  app.get('/restaurants/:id', (req, res) => {
    const components = renderComponents(services);
    res.send(Layout(
      'Zaget',
      App(...components),
      Scripts(Object.keys(services)),
    ));
  });

  app.use(express.static(path.join(__dirname, './public')));

  app.listen(port, () => {
    console.log(`server running at: http://localhost:${port}`);
  });
}
