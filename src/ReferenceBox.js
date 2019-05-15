import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

class ReferenceBox extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      show: false,
    };
  }

  handleClose() {
    this.setState({ show: false });
  }

  handleShow() {
    this.setState({ show: true });
  }

  render() {
    return (
      <>
        <Button className="controlpanel" variant="success" size="lg" onClick={this.handleShow}>
          Reference a {this.props.refclass}
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Reference a {this.props.refclass}</Modal.Title>
          </Modal.Header>
          <Modal.Body><p>{this.props.selectedText}</p></Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.handleClose}>
              Save Reference
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default ReferenceBox;
