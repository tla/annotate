const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.all('/api/*', (req, res) => {
  const baseurl = process.env.ENDPOINT + "/tradition/" + process.env.TRADITION + "/";
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
    params.method = 'GET';
    fetch(baseurl, params)
      .then(response => {
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
      .then(response => {
        console.log("Response: " + response.status);
        // Duplicate the status code and the response content
        res.status(response.status);
        // Pass through the appropriate content headers
        const headerObj = response.headers.raw();
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
      .catch(error => res.status(500).json({
        error: error.message
      }));
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));