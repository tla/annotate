import React from 'react';
// import logo from './logo.svg';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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
    this.textStyleHandler = this.textStyleHandler.bind(this);

    this.state = {
      selectedText: null,
      selectionStart: "",
      selectionEnd: "",
      sectionList: [],
      loadText: []
    };
  }

  componentDidMount() {
    // Initialise the section list
    fetch('/api/sections')
    .then(response => response.json())
    .then(data => this.setState({sectionList: data}))
    .catch(error => alert("Error! " + error));
  }

  // Alter the app's state to load the lemma text for the selected section.
  textLoadHandler(val) {
    const url = '/api/section/' + val + '/lemmareadings';
    fetch(url)
    .then(response => response.json())
    .then(data => this.setState({loadText: data}))
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
        // First, extend and save the selection we have made
        sel.setBaseAndExtent(anchorSpan.childNodes[0], 0, targetSpan.childNodes[0], targetSpan.textContent.length);
        this.setState({
          selectedText: sel.toString(),
          selectionStart: anchorSpan.getAttribute('id'),
          selectionEnd: targetSpan.getAttribute('id')
        })
        // First, remove any previous selection
        for (let rspan of document.getElementsByClassName("reading")) {
          rspan.classList.remove("selected");
        }

        // Then get the selected spans
        const selected = [];
        var next = anchorSpan;
        while(next != null && next.getAttribute("id") !== targetSpan.getAttribute("id")) {
          selected.push(next);
          next = next.nextElementSibling;
        }
        selected.push(targetSpan);
        selected.forEach( el => el.classList.add("selected"));

        // TODO enable the annotations

        // Finally remove the browser selection
        sel.removeAllRanges();
      } else {
        this.setState({
          selectedText: null,
          selectionStart: "r",
          selectionEnd: "r"
        });
      }
    }
  }

  textStyleHandler(annotatedStyle) {
    // Get the list of spans that need to be restyled
    const range = document.createRange();
    range.setStart(document.getElementById(this.state.selectionStart), 0);
    range.setEnd(document.getElementById(this.state.selectionEnd), 0);
    const frag = range.cloneContents();
    // Make sure that we only restyle children that are actually spans
    frag.querySelectorAll('.reading')
      .forEach(sp => {
        let el = document.getElementById(sp.id);
        el.classList.add(annotatedStyle);
        el.classList.remove('selected');
      });
    // Clear our own selection
    this.setState({
      selectedText: null,
      selectionStart: "",
      selectionEnd: ""
    });
  }

  render() {
    return (
      <div>
      <Navigation sections={this.state.sectionList} loadSection={this.textLoadHandler}/>
      <Container id="main">
        <Row>
          <Col md={9}>
            <SectionText textSelectHandler={this.textSelectHandler} readings={this.state.loadText}/>
          </Col>
          <Col>
            <Container className="sticky-top">
              <Row><Col md={12}>
                <ReferenceBox refclass="person" selectedText={this.state.selectedText}/>
              </Col></Row>
              <Row><Col md={12}>
                <ReferenceBox refclass="place" selectedText={this.state.selectedText}/>
              </Col></Row>
              <Row><Col md={12}>
                <ReferenceBox refclass="date" selectedText={this.state.selectedText}/>
              </Col></Row>
              <Row><Col md={12}>
                <TranslationBox
                  selectedText={this.state.selectedText}
                  selectionStart={parseInt(this.state.selectionStart.substring(1))}
                  selectionEnd={parseInt(this.state.selectionEnd.substring(1))}
                  annotationAdded={this.textStyleHandler}
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
