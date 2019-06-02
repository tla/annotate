import React from 'react';
import Annotate from './Annotate';
import Login from './Login';
import base64 from 'base-64';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.setLogin = this.setLogin.bind(this);

    // Set initial state
    this.state = {
      authority: null,
      authhash: null,
      loggedIn: false,
      loginFailed: false
    }
  }

  setLogin(user, pass) {
    // Calculate the basic auth hash
    const authhash = base64.encode(user + ':' + pass);
    // Test the login
    fetch('/api/test', {
      method: 'POST',
      headers: {'X-Authhash': authhash},
      body: JSON.stringify({})
    })
    .then(response => {
      debugger;
      if (response.ok) {
        this.setState({authority: user, authhash: authhash, loggedIn: true});
      } else {
        this.setState({loginFailed: true});
      }
    })
    .catch(error => alert("Login test failed " + error.message));
  }

  render() {
    if (this.state.loggedIn) {
      return <Annotate
              authhash={this.state.authhash}
              authority={this.state.authority}
             />;
    } else {
      return <Login
              setter={this.setLogin}
              failedAttempt={this.state.loginFailed}
             />
    }
  }
}

export default App;
