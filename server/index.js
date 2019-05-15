const express = require('express');
const bodyParser = require('body-parser');
const b64 = require('base-64');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/api/*', (req, res) => {
  const baseurl = 'https://api.editions.byzantini.st/ChronicleME/stemmarest/tradition/4aaf8973-7ac9-402a-8df9-19a2a050e364/';
  const auth = b64.encode(process.env.STEMMAREST_USER + ':' + process.env.STEMMAREST_PASS);
  const params = {
    method: req.method,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Basic ' + auth
    }
  };
  console.log(process.env.STEMMAREST_USER);
  console.log(req.body);
  if (req.method.startsWith('P')) {
    params.body = JSON.stringify(req.body);
  }

  fetch(baseurl + req.params[0], params)
  .then( response => response.json() )
  .then( data => res.json(data) )
  .catch(function(error) {
    res.status(500).json({error: error});
  })
});

app.listen(port, () => console.log(`Listening on port ${port}`));
