import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }
  handleChange(e) {
    this.props.loadSection(e.target.value);
  }
  render() {
    return(
      <Navbar bg="light">
        <Navbar.Brand>Section annotator</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Form name="section-select" >
              <Form.Control as="select" onChange={this.handleChange}>
              <option key="0" value="">Select a section...</option>
              {this.props.sections.map(s => <option key={s.id} value={s.id} >{s.name}</option>)}
              </Form.Control>
            </Form>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default Navigation;
