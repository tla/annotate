import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

class TranslationBox extends React.Component {
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
          Add a translation
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Translate the text</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{this.props.selectedText}</p>
            <form name="translation" action="#">
              <input type="hidden" name="start" value={this.props.selectionStart.substring(1)} />
              <input type="hidden" name="end" value={this.props.selectionEnd.substring(1)} />
              <label htmlFor="translation-lang">Language: </label>
              <select name="lang" id="translation-lang">
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
              <textarea name="text" id="translation-text" rows="5" cols="40" />
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.handleClose}>
              Save Translation
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default TranslationBox;
