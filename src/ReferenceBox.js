import React from 'react';
import Autosuggest from 'react-autosuggest';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropertyForm from './PropertyForm';

// Utility functions
function anchoredToReadingSpan(annotation, rdgstart, rdgend) {
  const beginLink = annotation.links
    .find(x => x.type === 'BEGIN' && x.target === parseInt(rdgstart));
  const endLink = annotation.links
    .find(x => x.type === 'END' && x.target === parseInt(rdgend));
  return beginLink && endLink;
}

class ReferenceBox extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.getSuggestions = this.getSuggestions.bind(this);
    this.updateAnnotation = this.updateAnnotation.bind(this);
    this.referenceAnnotation = this.referenceAnnotation.bind(this);
    this.linkEntityToRef = this.linkEntityToRef.bind(this);

    // Set some instance constants
    this.entitylabel = props.refclass === 'dating'
      ? 'DATE' : props.refclass.toUpperCase();
    this.referencelabel = props.refclass === 'dating'
      ? 'DATING' : this.entitylabel + 'REF';

    this.state = {
      show: false,
      suggestions: [],
      newOrExisting: 'existing'
    };
  }

  handleClose() {
    this.setState({
      show: false,
      oldAnnotation: null,
      oldReference: null,
      inputValue: '',
      suggestions: [],
    });
  }

  anchoredToReference = (annotation, refid, linktype) => {
    const ourLink = annotation.links.find(x =>
      x.type === linktype && x.target === refid);
    return ourLink && annotation.label === this.props.refclass.toUpperCase();
  }

  handleShow() {
    // Only react if there is a selection
    if (this.props.selection) {
      // We will show the dialog box
      const label = this.entitylabel;
      // Fish out any relevant old annotation
      const beginId = this.props.selection.start.replace('r', '');
      const endId = this.props.selection.start.replace('r', '');
      const oldAnnotation = this.props.annotations.find(x =>
          x.label === this.referencelabel && anchoredToReadingSpan(x, beginId, endId));
      // Get the list of autocomplete suggestions for the reference
      const entities = this.props.annotations
        .filter(x => x.label === label);
      // Set the state
      this.setState({
        show: true,
        oldAnnotation: oldAnnotation,
        inputValue: '',
        entities: entities,
        suggestions: [],
        newOrExisting: 'existing'
      });
    }
  }

  setLinkType = event => {
    const linkType = event.target.value;
    const newState = {linkType: linkType};
    if (this.state.oldAnnotation) {
      const oldReference = this.props.annotations.find(x =>
        this.anchoredToReference(x, this.state.oldAnnotation.id, linkType));
      newState.oldReference = oldReference;
    }
    this.setState(newState);
  };

  // Deal with switch between new and existing pane
  collectNewTarget = event => this.setState({newOrExisting: 'new'});
  showExistingTargets = event => this.setState({newOrExisting: 'existing'})

  // Deal with entries in the forms produced by <PropertyForm/>
  recordFormValue = (event, statevar) => {
    const formValues = this.state[statevar]
      ? this.state[statevar] : {};
    const formField = event.target.getAttribute('name');
    // TODO validate data types using the annotation spec
    if (event.target.getAttribute('type') === 'checkbox') {
      formValues[formField] = event.target.value === 'on';
    } else {
      formValues[formField] = event.target.value;
    }
    this.setState({[statevar]: formValues});
  }

  recordEntityFormValue = (event) => {
    return this.recordFormValue(event, 'entityFormValues');
  }
  recordReferenceFormValue = (event) => {
    return this.recordFormValue(event, 'referenceFormValues');
  }

  // Deal with autocomplete suggestions
  getSuggestions(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    return inputLength === 0 ? [] : this.state.entities.filter(
      x => x.properties.identifier.toLowerCase().slice(0, inputLength) === inputValue
    );
  }

  getSuggestionValue = suggestion => suggestion.id;
  renderSuggestion = suggestion => suggestion.properties.identifier;
  onChange = (event, { newValue }) => this.setState({inputValue: newValue});
  onSuggestionsClearRequested = () => this.setState({suggestions: []});
  onSuggestionsFetchRequested = ({ value }) =>
    this.setState({suggestions: this.getSuggestions(value)});
  onSuggestionSelected = (event, { suggestion }) =>
    this.setState({selectedEntity: suggestion});


  // Make the changes and update the parent state with any new annotations
  updateAnnotation() {
    // Do we have an existing entity?
    if (this.state.selectedEntity) {
      // Do we need to make any changes at all?
      if (this.state.oldAnnotation && this.anchoredToReference(
          this.state.selectedEntity, this.state.oldAnnotation.id)) {
        this.handleClose();
        return;
      }
      this.referenceAnnotation();
    } else {
      // We need to make the entity first.
      if (!this.state.entityFormValues.identifier) {
        alert("Cannot create a new entity without an identifier!");
        return;
      }
      const newEntity = {
        label: this.entitylabel,
        properties: this.state.entityFormValues
      };
      fetch('/api/annotation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newEntity)
      })
      .then(response => response.json())
      .then(data => {
        if (data.hasOwnProperty('error')) {
          Promise.reject(new Error(data.error))
        } else {
          this.setState({selectedEntity: data});
          this.referenceAnnotation();
        }
      })
      .catch(error => alert("Annotation save error! " + error.message));
    }
  }

  referenceAnnotation() {
    // At this point we should have an entity to reference.
    if (!this.state.selectedEntity) {
      alert("Tried to call referenceAnnotation with no entity!");
      return;
    }
    // Do we have an existing reference annotation?
    if (this.state.oldAnnotation) {
      // Use the THINGREF we have already made; delete its old referent first
      const oldEntity = this.state.oldEntity;
      const url = '/api/annotation/' + oldEntity.properties.id + '/link';
      const oldLink = oldEntity.links.find(x =>
        x.target === this.state.oldAnnotation.id && x.type === 'REFERENCED');
      if (oldLink) {
        fetch (url, {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(oldLink)
        }).then(response => {
          if (!response.ok) {
            const err = response.json();
            Promise.reject(new Error(err));
          }
          this.linkEntityToRef(this.state.oldAnnotation);
        }).catch(error => alert("Failed to break old link! " + error.message));
      } else {
        this.linkEntityToRef(this.state.oldAnnotation);
      }
    } else {
      // Make a new THINGREF
      const beginId = this.props.selection.start.replace('r', '');
      const endId = this.props.selection.end.replace('r', '');
      const newRef = {
        label: this.referencelabel,
        links: [
          {type: 'BEGIN', target: parseInt(beginId)},
          {type: 'END', target: parseInt(endId)}
        ]
      };
      // Does the reference have properties?
      if (this.state.referenceFormValues) {
        newRef.properties = this.state.referenceFormValues;
      } else {
        newRef.properties = {
          authority: document.getElementById('ref-authority').value
        }
      }
      fetch('/api/annotation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(newRef)
      })
      .then(response => response.json())
      .then(data => data.hasOwnProperty('error')
        ? Promise.reject(new Error(data.error))
        : this.linkEntityToRef(data))
      .catch(error => alert("Reference annotation save error! " + error.message))
    }
  }

  linkEntityToRef(referenceAnnotation) {
    const entity = this.state.selectedEntity;
    const url = '/api/annotation/' + entity.id + '/link';
    const newLink = {
      type: 'REFERENCED',
      target: referenceAnnotation.id
    };
    fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newLink)
    }).then(response => {
      if (!response.ok) {
        const err = response.json();
        Promise.reject(new Error(err));
      } else {
        this.handleClose();
        this.props.annotationsAdded([referenceAnnotation, this.state.selectedEntity], true);
      }
    })
    .catch(error => alert("Reference link save error! " + error.message))
  }

  render() {
    const selectedText = this.props.selection ? this.props.selection.text : '';
    const inputProps = {
      placeholder: 'Select a ' + this.entitylabel.toLowerCase(),
      value: this.state.inputValue,
      onChange: this.onChange
    };

    let targetSelect;
    if (this.state.newOrExisting === 'new') {
      targetSelect = <PropertyForm
        spec={this.props.spec}
        existing={this.state.oldReference}
        recordFormValue={this.recordEntityFormValue}
      />;
    } else {
      targetSelect = <Autosuggest
        suggestions={this.state.suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={this.getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        onSuggestionSelected={this.onSuggestionSelected}
        inputProps={inputProps}
      />;
    }

    const linkTypes = [];
    if (this.props.spec) {
      Object.values(this.props.spec.links).forEach( st => {
        st.split(',')
          .filter(x => !linkTypes.includes(x))
          .forEach(x => linkTypes.push(x));
      });
    }
    linkTypes.sort();
    const linkTypeSelect = linkTypes.map(
      l => <option key={'link-' + l} value={l}>{l}</option>);

    return (
      <>
        <Button className={"controlpanel ref-" + this.props.refclass} size="lg" onClick={this.handleShow}>
          {this.props.refclass === 'dating' ? 'Date an episode' : 'Link to ' + this.props.refclass}
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Reference a {this.entitylabel.toLowerCase()}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{selectedText}</p>
            <form name="addReference" id="addReference" action="#">
              {/*TODO make this a useful value*/}
              <input type="hidden" id="ref-authority" name="authority" value="tla"/>
              <Container className="referenceform">
                <Row>
                  <Col md={6}>
                    <input type="radio"
                      onChange={this.showExistingTargets}
                      checked={this.state.newOrExisting === 'existing'}
                    />
                    <label htmlFor={"existing-" + this.props.refclass}> Link to existing </label>
                  </Col>
                  <Col md={6}>
                    <input type="radio"
                      onChange={this.collectNewTarget}
                      checked={this.state.newOrExisting === 'new'}
                    />
                  <label htmlFor={"new-" + this.props.refclass}> Create new </label>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    {targetSelect}
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    {this.props.refspec ?
                      <PropertyForm
                        spec={this.props.refspec}
                        recordFormValue={this.recordReferenceFormValue}
                      /> : ''}
                    <select onChange={this.setLinkType}>
                      {linkTypeSelect}
                    </select>
                  </Col>
                </Row>
              </Container>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={this.updateAnnotation}>
              Save Reference
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default ReferenceBox;
