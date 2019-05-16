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
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + auth
    }
  };
  const url = req.params[0];
  console.log(req.method + " " + url);
  console.log(req.body);
  if (req.body && Object.keys(req.body).length) {
    params.body = JSON.stringify(req.body);
  }

  fetch(baseurl + url, params)
  .then( response => {
    console.log("Response: " + response.status);
    // Duplicate the status code and the response content
    res.status(response.status);
    return response.json();
  })
  .then( data => res.json(data) )
  .catch(function(error) {
    res.status(500).json({error: error});
  })
});

app.listen(port, () => console.log(`Listening on port ${port}`));
