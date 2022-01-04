import React from 'react';
import Annotate from './Annotate';
import Login from './Login';
// import base64 from 'base-64';

class App extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.setLogin = this.setLogin.bind(this);

    // Set initial state
    this.state = {
      authority: null,
      tradition: null,
      loggedIn: false,
      loginFailed: false
    }
  }

  setLogin(user, trad) {
    // Test the login
    fetch('/api/test', {
      method: 'POST',
      body: JSON.stringify({})
    })
    .then(response => {
      if (response.ok) {
        this.setState({authority: user, tradition: trad, loggedIn: true});
      } else {
        this.setState({loginFailed: true});
      }
    })
    .catch(error => alert("Login test failed " + error.message));
  }

  render() {
    if (this.state.loggedIn) {
      return <Annotate
              authority={this.state.authority}
              tradition={this.state.tradition}
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
