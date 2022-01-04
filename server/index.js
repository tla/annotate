const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, 'build')));
app.use(cookieParser());

app.get('/', function(req, res) {
  console.log('Cookies: ', req.cookies);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.all('/api/*', (req, res) => {
  const baseurl = process.env.ENDPOINT + "/";
  const params = {
    method: req.method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };
  const url = req.params[0];
  if (url === "test") {
    params.method = 'GET';
    fetch(baseurl + "user/" + process.env.STEMMAREST_USER, params)
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

    // HORRIBLE HACK - limit the traditions to the ones belonging to the user
    // in the environment
    let fetchurl = baseurl + url;
    if (url === "traditions") {
      fetchurl = baseurl + "user/" + process.env.STEMMAREST_USER + "/traditions";
    }
    console.log("Requesting " + fetchurl);

    fetch(fetchurl, params)
      .then(response => {
        // console.log("Response: " + response.status);
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
