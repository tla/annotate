import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

class Login extends React.Component {

  constructor(props, context) {
    super(props, context);

    // Set initial state
    this.state = {
      user: null,
      trad: null,
      tradList: []
    };
  }

  componentDidMount() {
    // Initialise the section list
    fetch('/api/traditions')
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.setState({tradList: data}))
    .catch(error => alert("Error loading traditions! " + error.message));
  }

  recordUser = event => this.setState({user: event.target.value});
  recordTrad = event => this.setState({trad: event.target.value});
  setLogin = (e) => {
    // Make sure they are both filled in
    if (this.state.user && this.state.trad) {
      this.props.setter(this.state.user, this.state.trad);
    }
    e.preventDefault();
  };

  // Render a login page and a button to send the state to the annotator
  render() {
    const failedLoginMessage = (
      <Row>
        <Col>
          <p className="failed">The login username and password are not valid.</p>
        </Col>
      </Row>
    );
    return(
      <>
        <Navbar bg="light">
          <Navbar.Brand>Section annotator - Login</Navbar.Brand>
        </Navbar>
        <form onSubmit={this.setLogin}>
          <Container>
            <Row>
              <Col md={3}>
                <label htmlFor="login-username">Your name: </label>
              </Col>
              <Col>
                <input id="login-username" name="username" onChange={this.recordUser}/>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <label htmlFor="login-tradition">Passphrase: </label>
              </Col>
              <Col>
                <select id="login-tradition" name="tradition" onChange={this.recordTrad}>
                  <option key="0" value="">Select a tradition...</option>
                  {this.state.tradList.map(s => <option key={s.id} value={s.id} >{s.name}</option>)}
                </select>
              </Col>
            </Row>
            <Row>
              <Col offset={3}>
                <Button type="submit">Start annotating</Button>
              </Col>
            </Row>
            {this.props.failedAttempt ? failedLoginMessage : ''}
          </Container>
        </form>
      </>
    );
  }
}

export default Login;
