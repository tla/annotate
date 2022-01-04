import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal';

// Utility functions
function anchoredToReading(annotation, rdgid) {
  const realid = parseInt(rdgid.replace('r', ''));
  const ourLink = annotation.links
    .find(x => x.type === 'BEGIN' && x.target === realid);
  return ourLink ? true : false;
}

function getAnnotationData(spec) {
    const annoData = {};
    const specName = spec.name.toLowerCase();
    Object.keys(spec.properties).forEach(p => {
        var htmlId = specName + '-' + p;
        var el = document.getElementById(htmlId);
        if (el != null) {
            annoData[p] = el.value;
        }
    });
    return annoData;
}

// The main class
// This is a class for creating the button / popup pane that handles flat
// annotations. A flat annotation is linked to a READING on either end, has
// a 'text' property, and may optionally have other properties (though at
// the moment, how these other properties are handled are special-cased and/or
// hardcoded.)

class FlatAnnoBox extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.updateAnnotation = this.updateAnnotation.bind(this);
    this.deleteOld = this.deleteOld.bind(this);
    this.deleteAnnotation = this.deleteAnnotation.bind(this);

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
      // Pick out whatever existing annotation there is, anchored to the
      // beginning of this selection
      oldAnnotation: this.props.annotations.find(
          x => x.label === this.props.spec.name
        && anchoredToReading(x, this.props.selection.start))
    };
    // Load the existing annotation and open the modal
    this.setState(newState);
  }

  updateAnnotation() {
    // Update the existing annotation if it exists, or create a new one
    const newAnnotation = getAnnotationData(this.props.spec);
    const existing = this.state.oldAnnotation;
    const anchorStart = parseInt(this.props.selection.start.replace('r', ''));
    const anchorEnd = parseInt(this.props.selection.end.replace('r', ''));
    let method;
    let annotationData;
    let url = '/api/tradition/' + this.props.tradition + '/annotation';
    // If the only difference between the old and the new annotation is the
    // text (and the comment, if any), we are just updating the old annotation.
    let textChangeOnly = false;
    if (existing &&
      existing.links.find(x => x.type === 'END' && x.target === anchorEnd)) {
        textChangeOnly = true;
        Object.keys(existing.properties).forEach(p => {
            if (p !== 'text' && p !== 'comment'
              && existing.properties[p] !== newAnnotation[p]) {
                textChangeOnly = false;
            }
        });
    }
    if (textChangeOnly) {
        method = 'PUT';
        annotationData = existing;
        annotationData.properties.text = newAnnotation.text;
        if ('comment' in annotationData.properties) {
            annotationData.properties.comment = newAnnotation.comment;
        }
        url += '/' + annotationData.id;
    // Otherwise we are adding a new annotation
    } else {
      method = 'POST';
      annotationData = {
        label: this.props.spec.name,
        properties: newAnnotation,
        links: [
          {type: 'BEGIN', target: anchorStart},
          {type: 'END', target: anchorEnd}
        ]
      };
    }
    // Now do whichever form of update was needed
    fetch(url, {
      method: method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(annotationData)
    }).then( response => response.json())
    .then( newAnno => {
      // Did we actually get an annotation posted?
      if (newAnno.hasOwnProperty('id')) {
        // Re-style the selection to show that it has an annotation
        this.props.annotationsAdded([newAnno], true);
        // If we POSTED a new annotation and an old one exists, delete the old one.
        if (existing && newAnno.id !== existing.id) {
          this.deleteOld(url + '/' + existing.id);
        }
      } else if (newAnno.hasOwnProperty('error')) {
        Promise.reject(new Error(newAnno.error))
      } else {
        Promise.reject(new Error(newAnno));
      }
    })
    .then( () => {
      // Close the modal
      this.setState({show: false, oldAnnotation: null});
    })
    .catch(error => alert(this.props.spec.name + " save error! " + error));
  }

  deleteOld(existingUrl) {
    let result = fetch(existingUrl, { method: 'DELETE' })
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.props.annotationsRemoved(data))
    .catch(error => alert("Error deleting old " + this.props.spec.name + "! " + error));
    return result;
  }

  deleteAnnotation() {
    // Double-check
    const sure = window.confirm("Do you really want to delete this "
        + this.props.spec.name.toLowerCase() + "?");
    if (sure) {
      // Call deleteOld just above
      const existing = this.state.oldAnnotation;
      let result = this.deleteOld('/api/tradition/' + this.props.tradition + '/annotation/' + existing.id);
      result.then( () => {
        // Close the modal
        this.setState({show: false, oldAnnotation: null});
      });
    }
  }

  render() {
    const selectedText = this.props.selection ? this.props.selection.text : '';
    const hasSpec = 'properties' in this.props.spec;
    const annoType = 'name' in this.props.spec ? this.props.spec.name.toLowerCase() : '';
    return (
      <>
        <Button className="controlpanel" variant="success" size="lg" onClick={this.handleShow}>
          Add/edit {annoType}
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Add a {annoType}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{selectedText}</p>
            <form name="addFlatAnnotation" action="#">
              {hasSpec && 'language' in this.props.spec.properties ?
              <>
                <label htmlFor={annoType + "-language"}>Language: </label>
                <select name="language" id={annoType + "-language"}
                  defaultValue={this.state.oldAnnotation ?
                    this.state.oldAnnotation.properties.language : 'en'}>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                </select>
              </> : ''}
              <textarea name="text" id={annoType + "-text"} rows="5" cols="40"
                defaultValue={this.state.oldAnnotation ? this.state.oldAnnotation.properties.text : ''}
              />
              {hasSpec && 'comment' in this.props.spec.properties ?
              <Accordion>
                <Card>
                  <Card.Header>
                    <Accordion.Toggle as={Button} variant="link" eventKey="0">
                      Add a comment
                    </Accordion.Toggle>
                  </Card.Header>
                  <Accordion.Collapse eventKey="0">
                    <Card.Body>
                      <textarea name="comment" id={annoType + "-comment"} rows="3" cols="40" defaultValue={this.state.oldAnnotation ? this.state.oldAnnotation.properties.comment : ''} />
                    </Card.Body>
                  </Accordion.Collapse>
                </Card>
              </Accordion>: ''}
              {hasSpec && 'by' in this.props.spec.properties ?
              <input type="hidden" name="by" id={annoType + "-by"}
                value={this.props.authority} /> : ''}
            </form>
          </Modal.Body>
          <Modal.Footer>
            {this.state.oldAnnotation ?
            <Button variant="danger" onClick={this.deleteAnnotation}>
              Delete
            </Button>
            : ''}
            <Button variant="secondary" onClick={this.handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.updateAnnotation}>
              Save {annoType}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default FlatAnnoBox;
