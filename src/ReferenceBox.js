import React from 'react';
import Autosuggest from 'react-autosuggest';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropertyForm from './PropertyForm';

const defaultState = {
  show: false,
  suggestions: [],
  linkTypes: [],
  inputValue: '',
  willCreateNew: false
  // Other state variables used:
  // selectedEntity
  // entityFormValues
  // referenceFormValues
}

class ReferenceBox extends React.Component {
  constructor(props, context) {
    super(props, context);

    // Bind the instance methods
    this.handleShow = this.handleShow.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.getSuggestions = this.getSuggestions.bind(this);
    this.updateOrCreateEntity = this.updateOrCreateEntity.bind(this);
    this.referenceAnnotation = this.referenceAnnotation.bind(this);
    this.linkEntityToRef = this.linkEntityToRef.bind(this);

    // This state handles show/hide of Modal, form display toggle, and state for Autosuggest
    this.state = defaultState;
  }

  handleClose() {
    this.setState(defaultState);
  }

  handleShow() {
    // Only react if there is a selection
    if (this.props.selection) {
      // We will show the dialog box
      const linkTypes = [];
      if (this.props.spec) {
        Object.values(this.props.spec.links).forEach( st => {
          st.split(',')
            .filter(x => !linkTypes.includes(x))
            .forEach(x => linkTypes.push(x));
        });
      }
      linkTypes.sort();
      // Do we have an existing linked entity of our default link type?
      const oldEntity = this.props.linkedEntities[linkTypes[0]];
      // Set the state
      this.setState({
        show: true,
        linkTypes: linkTypes,
        linkType: linkTypes[0],
        inputValue: oldEntity ? oldEntity.properties.identifier : '',
      });
    }
  }

  // This is called when the link type dropdown is changed
  setLinkType = event => this.setState({ linkType: event.target.value });
  // This is a utility function for getting the existing (old) linked entity
  // according to whichever link type is currently selected
  getEntityForLinkType = () => this.props.linkedEntities[this.state.linkType]

  // Deal with switch between new and existing pane
  collectNewTarget = event => this.setState({willCreateNew: true});
  showExistingTargets = event => this.setState({willCreateNew: false})

  // Deal with entries in the forms produced by <PropertyForm/>
  // TODO revisit this
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
    return inputLength === 0 ? [] : this.props.suggestionList.filter(
      x => x.properties.identifier.toLowerCase().includes(inputValue)
    );
  }

  getSuggestionValue = suggestion => suggestion.properties.identifier;
  renderSuggestion = suggestion => suggestion.properties.identifier;
  updateSelected = (event, { newValue }) => this.setState({inputValue: newValue});
  onSuggestionsClearRequested = () => this.setState({suggestions: []});
  onSuggestionsFetchRequested = ({ value }) =>
    this.setState({suggestions: this.getSuggestions(value)});
  onSuggestionSelected = (event, { suggestion }) =>
    this.setState({selectedEntity: suggestion});


  // --- Make the changes and update the parent state with any new annotations

  // We start with ensuring that the entity exists and is not already linked
  // to this span of text.
  updateOrCreateEntity() {
    // Have we selected an existing entity?
    if (this.state.selectedEntity && !this.state.willCreateNew) {
      // If the selected entity is already linked to the existing (old)
      // reference annotation, then we don't need to make any changes at all.
      const linkedEntity = this.getEntityForLinkType();
      if (linkedEntity && linkedEntity.id === this.state.selectedEntity.id) {
        this.handleClose();
        return;
      }
      // Otherwise we should set up the reference to the selected entity.
      this.referenceAnnotation();

    // Otherwise...
    } else if (this.state.willCreateNew) {
      // We need to make the entity first.
      if (!this.state.entityFormValues.identifier) {
        alert("Cannot create a new entity without an identifier!");
        return;
      }
      const newEntity = {
        label: this.props.spec.name,
        primary: true,
        properties: this.state.entityFormValues
      };
      fetch('/api/annotation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',
                  'X-Authhash': this.props.authhash},
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

  // The entity to be linked is now stored in state.selectedEntity; here
  // we make sure that the reference annotation exists.
  referenceAnnotation() {
    // At this point we should have an entity to reference.
    if (!this.state.selectedEntity) {
      alert("Tried to call referenceAnnotation with no entity!");
      return;
    }
    // Do we have an existing reference annotation?
    debugger;
    if (this.props.oldReference) {
      const oldEntity = this.getEntityForLinkType();
      // We already know that oldEntity is not selectedEntity; otherwise
      // we would have already been finished. Delete the link between
      // oldEntity and oldReference.
      const url = '/api/annotation/' + oldEntity.id + '/link';
      const oldLink = oldEntity.links.find(x =>
        x.target === parseInt(this.props.oldReference.id)
        && x.type === this.state.linkType);
      // If an old link exists, delete it and re-link to the new entity
      if (oldLink) {
        fetch (url, {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json',
                    'X-Authhash': this.props.authhash},
          body: JSON.stringify(oldLink)
        })
        .then(response => response.json())
        .then(data => data.hasOwnProperty('error')
          ? Promise.reject(new Error(data.error))
          : this.linkEntityToRef(this.props.oldReference, data))
        .catch(error => alert("Failed to break old link! " + error.message));

      // Otherwise just re-link to the new entity
      } else {
        this.linkEntityToRef(this.props.oldReference);
      }
    } else {
      // We will need a new reference annotation.
      const beginId = this.props.selection.start.replace('r', '');
      const endId = this.props.selection.end.replace('r', '');
      const newRef = {
        label: this.props.refspec.name,
        links: [
          {type: 'BEGIN', target: parseInt(beginId)},
          {type: 'END', target: parseInt(endId)}
        ]
      };
      // Does the reference have properties?
      if (this.state.referenceFormValues) {
        newRef.properties = this.state.referenceFormValues;
      } else {
        // There always has to be an authority.
        newRef.properties = { authority: this.props.authority }
      }
      // Make the reference...
      fetch('/api/annotation', {
        method: 'POST',
        headers: {'Content-Type': 'application/json',
                  'X-Authhash': this.props.authhash},
        body: JSON.stringify(newRef)
      })
      .then(response => response.json())
      .then(data => data.hasOwnProperty('error')
        ? Promise.reject(new Error(data.error))
        : this.linkEntityToRef(data)) // ...and link it.
      .catch(error => alert("Reference annotation save error! " + error.message))
    }
  }

  // We now definitely have an entity node and a reference node, which are
  // definitely unlinked, so link them together.
  linkEntityToRef(referenceAnnotation, alsoUpdated) {
    const entity = this.state.selectedEntity;
    const url = '/api/annotation/' + entity.id + '/link';
    const newLink = {
      type: this.state.linkType,
      target: referenceAnnotation.id
    };
    fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json',
                'X-Authhash': this.props.authhash},
      body: JSON.stringify(newLink)
    })
    .then(response => response.json())
    .then(data => {
      if (data.hasOwnProperty('error')) {
        Promise.reject(new Error(data.error));
      } else {
        this.handleClose();
        // Send the new bzw. updated annotations to the parent
        const updated = [referenceAnnotation, data];
        if (alsoUpdated) { updated.push(alsoUpdated) };
        this.props.annotationsAdded(updated, true);
      }
    })
    .catch(error => alert("Reference link save error! " + error.message))
  }

  render() {
    const selectedText = this.props.selection ? this.props.selection.text : '';
    const refclass = this.props.refspec.hasOwnProperty('name') ?
      this.props.refspec.name.toLowerCase().replace('ref', '') : '';
    const inputProps = {
      placeholder: 'Select a ' + refclass,
      value: this.state.inputValue,
      onChange: this.updateSelected
    };

    // targetSelect contains the HTML either for selecting an existing entity,
    // or for adding a new one.
    let targetSelect;
    if (this.state.willCreateNew) {
      targetSelect = <PropertyForm
        spec={this.props.spec}
        existing={this.getEntityForLinkType()}
        recordFormValue={this.recordEntityFormValue}
      />;
    } else {
      targetSelect = (
        <Container className="propertybox">
          <Row>
            <Col md={3}>
              <label htmlFor="entity-autosuggest">Link to: </label>
            </Col>
            <Col md={9}>
              <Autosuggest
                id="entity-autosuggest"
                suggestions={this.state.suggestions}
                onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                getSuggestionValue={this.getSuggestionValue}
                renderSuggestion={this.renderSuggestion}
                onSuggestionSelected={this.onSuggestionSelected}
                inputProps={inputProps}
              />
            </Col>
          </Row>
        </Container>
      );

    }

    const linkTypeSelect = this.state.linkTypes.map(
      l => <option key={'link-' + l} value={l}>{l}</option>);

    return (
      <>
        <Button
          className={"controlpanel ref-" + refclass}
          size="lg"
          onClick={this.handleShow}
          disabled={this.props.selection ? false : true}
        >
          {this.props.buttontext}
        </Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Reference a {refclass}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>{selectedText}</p>
            <form name="addReference" id="addReference" action="#">
              <Container className="referenceform">
                <Row>
                  <Col md={6}>
                    <input type="radio"
                      onChange={this.showExistingTargets}
                      checked={!this.state.willCreateNew}
                    />
                    <label htmlFor={"existing-" + refclass}> Link to existing </label>
                  </Col>
                  <Col md={6}>
                    <input type="radio"
                      onChange={this.collectNewTarget}
                      checked={this.state.willCreateNew}
                    />
                  <label htmlFor={"new-" + refclass}> Create new </label>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <h4>Entity properties</h4>
                    {targetSelect}
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <h4>Reference properties</h4>
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
            <Button variant="primary" onClick={this.updateOrCreateEntity}>
              Save Reference
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default ReferenceBox;
