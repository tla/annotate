import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

class Login extends React.Component {

  recordUser = event => this.setState({user: event.target.value});
  recordPass = event => this.setState({pass: event.target.value});
  setLogin = () => {
    // Make sure they are both filled in
    if (this.state.user && this.state.pass) {
      this.props.setter(this.state.user, this.state.pass);
    }
  }

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
        <form name="login" action="#">
          <Container>
            <Row>
              <Col md={3}>
                <label htmlFor="login-username">User: </label>
              </Col>
              <Col>
                <input id="login-username" name="username" onChange={this.recordUser}/>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <label htmlFor="login-password">Passphrase: </label>
              </Col>
              <Col>
                <input id="login-password" name="password" type="password" onChange={this.recordPass}/>
              </Col>
            </Row>
            <Row>
              <Col offset={3}>
                <Button onClick={this.setLogin}>Start annotating</Button>
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
