import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

// Utility functions
function anchoredToReading(annotation, rdgid) {
  const realid = parseInt(rdgid.replace('r', ''));
  const ourLink = annotation.links
    .find(x => x.type === 'BEGIN' && x.target === realid);
  return ourLink ? true : false;
}

// The main class

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
    // If there is no selection, don't do anything
    if (!this.props.selection) { return; }
    const newState = {
      // We will want to show the modal
      show: true,
      // Pick out whatever existing translation there is, anchored to the
      // beginning of this selection
      oldTranslation: this.props.annotations.find(x => x.label === 'TRANSLATION'
        && anchoredToReading(x, this.props.selection.start))
    };
    // Load the existing translation and open the modal
    this.setState(newState);
  }

  updateTranslation() {
    // Update the existing annotation if it exists, or create a new one
    const newText = document.getElementById('translation-text').value;
    const newLang = document.getElementById('translation-lang').value;
    const existing = this.state.oldTranslation;
    const anchorStart = parseInt(this.props.selection.start.replace('r', ''));
    const anchorEnd = parseInt(this.props.selection.end.replace('r', ''));
    let method;
    let transData;
    let url = '/api/annotation';
    if (existing && existing.properties.language === newLang &&
      existing.links.find(x => x.type === 'END' && x.target === anchorEnd)) {
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
          {type: 'BEGIN', target: anchorStart},
          {type: 'END', target: anchorEnd}
        ]
      };
    }
    // We are updating the existing translation
    // POST the new translation transData
    var needToDelete = false;
    fetch(url, {
      method: method,
      headers: {'Content-Type': 'application/json', 
                'X-Authhash': this.props.authhash},
      body: JSON.stringify(transData)
    }).then( response => response.json())
    .then( newTrans => {
      // Did we actually get a translation posted?
      if (newTrans.hasOwnProperty('id')) {
        // Re-style the selection to show that it has a translation
        this.props.annotationsAdded([newTrans], true);
        // If we POSTED a new translation and an old one exists, delete the old one.
        if (existing && newTrans.id !== existing.id) {
          needToDelete = true;
        }
      } else if (newTrans.hasOwnProperty('error')) {
        Promise.reject(new Error(newTrans.error))
      } else {
        Promise.reject(new Error(newTrans));
      }
    })
    .then( () => {
      // Close the modal
      this.setState({show: false, oldTranslation: null});
    })
    .catch(error => alert("Translation save error! " + error));

    if (needToDelete) {
      fetch(url + '/' + existing.id, { method: 'DELETE'})
      .then(response => response.json())
      .then(data => data.hasOwnProperty('error')
        ? Promise.reject(new Error(data.error))
        : this.props.annotationRemoved(data))
      .catch(error => alert("Error deleting old translation!" + error));
    }
  }

  render() {
    const selectedText = this.props.selection ? this.props.selection.text : '';
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
            <p>{selectedText}</p>
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
