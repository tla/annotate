import React from 'react';
// import logo from './logo.svg';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// import Login from './Login';
import Navigation from './Navigation';
import SectionText from './SectionText';
import ReferenceBox from './ReferenceBox';
import TranslationBox from './TranslationBox';

// ---- Utility functions

// Is the (span) element a reading?
function isReading(el) {
  return el.classList.contains('reading');
}

// Is the given annotation anchored to the given start and end readings?
function isAnchoredToReadingSpan(annotation, startId, endId) {
  const rdgstart = parseInt(startId.replace('r', ''));
  const rdgend = parseInt(endId.replace('r', ''));
  const beginLink = annotation.links
    .find(x => x.type === 'BEGIN' && x.target === rdgstart);
  const endLink = annotation.links
    .find(x => x.type === 'END' && x.target === rdgend);
  return beginLink && endLink;
}

// Is the given entity anchored to the given annotation (reference)? Return
// the link type if so, otherwise null.
function entityLinkedAs(annotation, refid) {
  const ourLink = annotation.links.find(x => x.target === parseInt(refid));
  return ourLink ? ourLink.type : null;
}


// The main event
class Annotate extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.textLoadHandler = this.textLoadHandler.bind(this);
    this.textSelectHandler = this.textSelectHandler.bind(this);
    this.annotationsAdded = this.annotationsAdded.bind(this);
    this.annotationsRemoved = this.annotationsRemoved.bind(this);
    this.getReferenceBox = this.getReferenceBox.bind(this);

    this.state = {
      selection: null,
      annotations: [],
      annotationspecs: {},
      selectionAnnotations: {},
      sectionList: [],
      loadText: []
    };
  }

  componentDidMount() {
    // Initialise the section list
    fetch('/api/sections', {headers: {'X-Authhash': this.props.authhash}})
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.setState({sectionList: data}))
    .catch(error => alert("Error loading sections! " + error.message));

    // Initialise the annotations list
    fetch('/api/annotations', {headers: {'X-Authhash': this.props.authhash}})
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.setState({annotations: data}))
    .catch(error => alert("Error loading annotations! " + error.message));

    // Initialise the list of annotation labels
    const annotationlabels = {};
    fetch('/api/annotationlabels', {headers: {'X-Authhash': this.props.authhash}})
    .then(response => response.json())
    .then(data => {
      if (data.hasOwnProperty('error')) {
        Promise.reject(new Error(data.error));
      }
      data.forEach(x => annotationlabels[x.name.toLowerCase()] = x);
      this.setState({annotationspecs: annotationlabels});
    })
    .catch(error => alert("Error loading annotation specs! " + error.message));
  }

  // Alter the app's state to load the lemma text for the selected section.
  textLoadHandler(sectionId) {
    const url = '/api/section/' + sectionId + '/lemmareadings';
    fetch(url, {headers: {'X-Authhash': this.props.authhash}})
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.setState({loadText: data, selection: null}))
    .catch(error => console.log("Error! " + error));
  }

  textSelectHandler() {
    const sel = window.getSelection();
    if (sel.text !== "") {
      // See if the selection is actually part of the text
      let anchorSpan;
      let targetSpan;
      if (sel.anchorNode.textContent === " " && isReading(sel.anchorNode.nextElementSibling)) {
        anchorSpan = sel.anchorNode.nextElementSibling;
      } else {
        anchorSpan = sel.anchorNode.parentElement;
      }
      if (sel.focusNode.textContent === " " && isReading(sel.focusNode.previousElementSibling)) {
        targetSpan = sel.focusNode.previousElementSibling;
      } else {
        targetSpan = sel.focusNode.parentElement;
      }
      if (isReading(anchorSpan) && isReading(targetSpan)) {
        const newState = {};
        // We will hilight the selected spans and
        // enable buttons to add an annotation
        const startSpan = anchorSpan.compareDocumentPosition(targetSpan)
          & Node.DOCUMENT_POSITION_FOLLOWING
          ? anchorSpan : targetSpan;
        const endSpan = startSpan === anchorSpan ? targetSpan : anchorSpan;
        // First, extend and save the selection we have made
        sel.setBaseAndExtent(startSpan.childNodes[0], 0, endSpan.childNodes[0], endSpan.textContent.length);
        const beginId = startSpan.getAttribute('id');
        const endId = endSpan.getAttribute('id');
        newState.selection = {
          text: sel.toString(),
          start: beginId,
          end: endId
        }
        // Then look up any existing annotation(s) on this selection
        const selectionAnnotations = {};
        this.state.annotations.filter(
          x => isAnchoredToReadingSpan(x, beginId, endId))
          .map(x => selectionAnnotations[x.label.toLowerCase()] = x);
        newState.selectionAnnotations = selectionAnnotations;
        const selectionEntities = {};
        Object.values(selectionAnnotations).forEach(a => {
          this.state.annotations.forEach(x => {
            const link = entityLinkedAs(x, a.id);
            if (link) {
              selectionEntities[link] = x;
            }
          });
        });
        newState.selectionEntities = selectionEntities;
        this.setState(newState);

        // Then, remove any previous selection
        for (let rspan of document.getElementsByClassName("reading")) {
          rspan.classList.remove("selected");
        }
        // Then get the selected spans
        const selected = [];
        var next = startSpan;
        while(next != null && next.getAttribute("id") !== endSpan.getAttribute("id")) {
          selected.push(next);
          next = next.nextElementSibling;
        }
        selected.push(endSpan);
        selected.forEach( el => el.classList.add("selected"));

        // Finally remove the browser selection marker
        sel.removeAllRanges();
      } else {
        this.setState({selection: null});
      }
    }
  }

  getExisting = annolabel => this.state.annotations.filter(
    x => x.label === annolabel);
  getAnnotationSpec = label => this.state.annotationspecs.hasOwnProperty(label)
    ? this.state.annotationspecs[label] : {};

  annotationsAdded(annolist, doRemoveSelection) {
    // Add the new annotation to our list and reset the state
    const annotations = [...this.state.annotations];
    annolist.forEach( a => {
      // Does it exist?
      const aidx = annotations.findIndex(x => x.id === a.id);
      if (aidx > -1) {
        // Replace it; the links might have updated
        annotations[aidx] = a;
      } else {
        // Add it
        annotations.push(a);
      }
    });
    this.setState({
      selection: doRemoveSelection ? null : this.state.selection,
      annotations: annotations
    });
  }

  annotationsRemoved(annolist) {
    // Weed the old annotation out of our list and reset the state
    // Get a list of annotation IDs to be removed
    const deletedIds = annolist.map(x => x.id);
    const remaining = this.state.annotations.filter(x => !deletedIds.includes(x.id));
    if (remaining.length !== this.state.annotations.length) {
      this.setState({annotations: remaining});
    }
  }

  getReferenceBox(btype) {
    let buttontext = "Tag a " + btype;
    let entitytype = btype;
    let referencetype = btype + 'ref';
    if (btype === 'dating') {
      buttontext = "Date an episode";
      entitytype = "date";
      referencetype = "dating";
    }
    return (
      <ReferenceBox
        annotations={this.state.annotations}
        authority={this.props.authority}
        authhash={this.props.authhash}
        buttontext={buttontext}
        selection={this.state.selection}
        oldReference={this.state.selectionAnnotations[referencetype]}
        linkedEntities={this.state.selectionEntities}
        suggestionList={this.getExisting(entitytype.toUpperCase())}
        spec={this.getAnnotationSpec(entitytype)}
        refspec={this.getAnnotationSpec(referencetype)}
        annotationsAdded={this.annotationsAdded}
        annotationsRemoved={this.annotationsRemoved}
      />
    );
  }

  render() {
    return (
      <div>
      <Navigation sections={this.state.sectionList} loadSection={this.textLoadHandler}/>
      <Container id="main">
        <Row>
          <Col md={9}>
            <SectionText
              textSelectHandler={this.textSelectHandler}
              readings={this.state.loadText}
              selection={this.state.selection}
              annotations={this.state.annotations}
            />
          </Col>
          <Col>
            <Container className="sticky-top">
              <Row><Col md={12}>
                {this.getReferenceBox('person')}
              </Col></Row>
              <Row><Col md={12}>
                {this.getReferenceBox('place')}
              </Col></Row>
              <Row><Col md={12}>
                {this.getReferenceBox('date')}
              </Col></Row>
              <Row><Col md={12}>
                {this.getReferenceBox('dating')}
              </Col></Row>
              <Row><Col md={12}>
                <TranslationBox
                  authhash={this.props.authhash}
                  selection={this.state.selection}
                  annotations={this.state.annotations}
                  annotationsAdded={this.annotationsAdded}
                  annotationsRemoved={this.annotationsRemoved}
                />
              </Col></Row>
            </Container>
          </Col>
        </Row>
      </Container>
      </div>
    );
  }
}

export default Annotate;
