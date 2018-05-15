require('newrelic');
const express = require('express');
// const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const cluster = require('cluster');
const os = require('os');

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


  app.use('/restaurants', express.static(path.join(__dirname, './public')));

  app.get('/restaurants/:id', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'));
  });

  app.use(express.static(path.join(__dirname, './public')));

  app.listen(port, () => {
    console.log(`server running at: http://localhost:${port}`);
  });
}
