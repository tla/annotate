import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

class TranslationBox extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.updateTranslation = this.updateTranslation.bind(this);

    this.state = {
      show: false,
    };
  }

  handleClose() {
    this.setState({ show: false });
  }

  handleShow() {
    // Fetch any existing translation that needs to go into our local state
    const newState = { show: true };
    fetch('/api/annotations?label=TRANSLATION')
    .then(response => response.json())
    .then(data => {
      let ours;
      for (let txl of data) {
        ours = txl.links.find(x => x.type === 'BEGIN' && x.target === this.props.selectionStart);
        if (ours) {
          newState.oldTranslation = txl;
          break;
        }
      }
      if (!ours) {
        newState.oldTranslation = null;
      }
      // Load the existing translation and open the modal
      this.setState(newState);
    })
  }

  updateTranslation() {
    // Update the existing annotation if it exists, or create a new one
    const newText = document.getElementById('translation-text').value;
    const newLang = document.getElementById('translation-lang').value;
    const existing = this.state.oldTranslation;
    let method;
    let transData;
    let url = '/api/annotation';
    if (existing && existing.properties.language === newLang &&
      existing.links.find(x => x.type === 'END' && x.target === this.props.selectionEnd)) {
        // We are just updating the old translation
        method = 'PUT';
        transData = existing;
        transData.properties.text = newText;
        url += '/' + transData.id;
    } else {
      method = 'POST';
      transData = {
        label: 'TRANSLATION',
        properties: {
          text: newText,
          language: newLang
        },
        links: [
          {type: 'BEGIN', target: this.props.selectionStart},
          {type: 'END', target: this.props.selectionEnd}
        ]
      };
    }
    // We are updating the existing translation
    // POST the new translation transData
    fetch(url, {
      method: method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(transData)
    }).then( response => response.json())
    .then( newTrans => {
      // Did we actually get a translation posted?
      if (newTrans.hasOwnProperty('id')) {
        // Re-style the selection to show that it has a translation
        this.props.annotationAdded('translated');
        // If we POSTED a new translation and an old one exists, delete the old one.
        if (existing && newTrans.id !== existing.id) {
          return fetch(url + '/' + existing.id, { method: 'DELETE'} );
        }
      } // else TODO error handling
    })
    .then( () => {
      // Close the modal
      this.setState({show: false})
    })
    .catch(error => alert("Translation save error! " + error));

    // LATER Re-style the selection to show that it has a translation
  }

  render() {
    return (
      <>
        <Button className="controlpanel" variant="success" size="lg" onClick={this.handleShow}>
          Add/edit translation
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Translate the text</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{this.props.selectedText}</p>
            <form name="translation" action="#">
              <label htmlFor="translation-lang">Language: </label>
              <select name="lang" id="translation-lang"
                  defaultValue={this.state.oldTranslation ?
                    this.state.oldTranslation.properties.language : 'en'}>
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
              <textarea name="text" id="translation-text" rows="5" cols="40"
                defaultValue={this.state.oldTranslation ? this.state.oldTranslation.properties.text : ''}
              />
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.updateTranslation}>
              Save Translation
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default TranslationBox;
