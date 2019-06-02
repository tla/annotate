const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/api/*', (req, res) => {
  const baseurl = 'https://api.editions.byzantini.st/ChronicleME/stemmarest/tradition/4aaf8973-7ac9-402a-8df9-19a2a050e364/';
  const auth = req.get('X-Authhash');
  const params = {
    method: req.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };
  if (auth) {
    params.headers['Authorization'] = 'Basic ' + auth;
  }
  const url = req.params[0];
  if (url === "test") {
    console.log(req.headers);
    params.method = 'GET';
    fetch(baseurl, params)
    .then( response => {
      if (response.ok) {
        console.log("Test login OK");
        res.send("ok");
      } else {
        console.log("Test login failed");
        res.status(response.status);
        res.send("Login failed");
      }
    })
    .catch(error => res.status(500).send(error.message));
  } else {
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
      // TODO set the appropriate headers
      // TODO This is a horrible hack that badly needs a debugger!
      const headerObj = response.headers._headers
      for (let h of Object.keys(headerObj)) {
        console.log("Header " + h + ": " + headerObj[h]);
        if (h.startsWith('content')) {
          const parts = headerObj[h];
          console.log(parts);
          res.append(h, parts[0]);
        }
      }
      // Pass through the response body
      return response.text();
    })
    .then(body => res.send(body))
    .catch(error => res.status(500).json({error: error.message}));
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
