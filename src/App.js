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

function isReading(el) {
  return el.classList.contains('reading');
}

class App extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.textLoadHandler = this.textLoadHandler.bind(this);
    this.textSelectHandler = this.textSelectHandler.bind(this);
    this.annotationsAdded = this.annotationsAdded.bind(this);
    this.annotationRemoved = this.annotationRemoved.bind(this);

    this.state = {
      selection: null,
      annotations: [],
      annotationspecs: [],
      sectionList: [],
      loadText: []
    };
  }

  componentDidMount() {
    // Initialise the section list
    fetch('/api/sections')
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.setState({sectionList: data}))
    .catch(error => alert("Error loading sections! " + error));

    // Initialise the annotations list
    fetch('/api/annotations')
    .then(response => response.json())
    .then(data => data.hasOwnProperty('error')
      ? Promise.reject(new Error(data.error))
      : this.setState({annotations: data}))
    .catch(error => alert("Error loading annotations! " + error));

    // TODO Initialise the list of annotation labels
    // For now, hardcode it
    this.setState({annotationspecs: {
      "person": {"name": "PERSON", "properties": {"identifier": "String", "datasource": "String", "href": "String"}, "links": {"PERSONREF": "REFERENCED,POSSIBLY,NAMED"}},
      "place": {"name": "PLACE", "properties": {"identifier": "String", "datasource": "String", "href": "String", "locatable": "Boolean"}, "links": {"PLACEREF": "REFERENCED"}},
      "date": {"name": "DATE", "properties": {"notAfter": "LocalDate", "notBefore": "LocalDate"}, "links": {"DATEREF": "REFERENCED", "DATING": "REFERENCED"}}
    }});
  }

  // Alter the app's state to load the lemma text for the selected section.
  textLoadHandler(sectionId) {
    const url = '/api/section/' + sectionId + '/lemmareadings';
    fetch(url)
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
        // We will hilight the selected spans and
        // enable buttons to add an annotation
        const startSpan = anchorSpan.compareDocumentPosition(targetSpan)
          & Node.DOCUMENT_POSITION_FOLLOWING
          ? anchorSpan : targetSpan;
        const endSpan = startSpan === anchorSpan ? targetSpan : anchorSpan;
        // First, extend and save the selection we have made
        sel.setBaseAndExtent(startSpan.childNodes[0], 0, endSpan.childNodes[0], endSpan.textContent.length);
        this.setState({ selection: {
          text: sel.toString(),
          start: startSpan.getAttribute('id'),
          end: endSpan.getAttribute('id')
        }});
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

  annotationsAdded(annolist, doRemoveSelection) {
    // Add the new annotation to our list and reset the state
    const annotations = [...this.state.annotations];
    annolist.forEach( a => {
      if (!annotations.find(x => x.id === a.id)) {
        annotations.push(a);
      }
    });
    this.setState({
      selection: doRemoveSelection ? null : this.state.selection,
      annotations: annotations
    });
  }

  annotationRemoved(annotation) {
    // Weed the old annotation out of our list and reset the state
    const remaining = this.state.annotations.filter(x => x.id !== annotation.id);
    if (remaining.length !== this.state.annotations.length) {
      this.setState({annotations: remaining});
    }
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
                <ReferenceBox
                  refclass="person"
                  selection={this.state.selection}
                  annotations={this.state.annotations}
                  spec={this.state.annotationspecs.person}
                  annotationsAdded={this.annotationsAdded}
                />
              </Col></Row>
              <Row><Col md={12}>
                <ReferenceBox
                  refclass="place"
                  selection={this.state.selection}
                  annotations={this.state.annotations}
                  spec={this.state.annotationspecs.place}
                  annotationsAdded={this.annotationsAdded}
                />
              </Col></Row>
              <Row><Col md={12}>
                <ReferenceBox
                  refclass="date"
                  selection={this.state.selection}
                  annotations={this.state.annotations}
                  spec={this.state.annotationspecs.date}
                  annotationsAdded={this.annotationsAdded}
                />
              </Col></Row>
              <Row><Col md={12}>
                <TranslationBox
                  selection={this.state.selection}
                  annotations={this.state.annotations}
                  annotationsAdded={this.annotationsAdded}
                  annotationRemoved={this.annotationRemoved}
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

export default App;
