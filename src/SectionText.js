import React from 'react';

function SectionText(props) {
  const els = [];
  let inSelection = false;
  // Chew up the existing annotations
  const annotations = digestAnnotations(props.annotations);

  // Iterate through the readings to make the spans
  for (const [idx, rdg] of props.readings.entries()) {
    // Get the span text
    const rdgtext = rdg.normal_form ? rdg.normal_form : rdg.text;
    // Push on any space that needs to go before the span
    if (idx > 0 && !props.readings[idx-1].join_next && !rdg.join_prior) {
      els.push(' ');
    }
    // Get the span class(es)
    // First, whether the reading is selected
    const spanClasses = ['reading'];
    if (props.selection && props.selection.start === 'r' + rdg.id) {
      inSelection = true;
    }
    if (inSelection) {
      spanClasses.push('selected');
    }
    if (props.selection && props.selection.end === 'r' + rdg.id) {
      inSelection = false;
    }
    // Now for each reading, check whether we are in an annotation
    for (let anno of annotations) {
      let classLabel = 'translated';
      if (anno.class === 'COMMENT') {
        classLabel = 'commented';
      }
      if (anno.class.endsWith('REF') || anno.class === 'DATING') {
        classLabel = anno.class.toLowerCase();
      }
      if (anno.start === parseInt(rdg.id)) {
        anno.weAreIn = true;
        spanClasses.push(classLabel + '-start');
      }
      if (anno.weAreIn) {
        spanClasses.push(classLabel);
      }
      if (anno.end === parseInt(rdg.id)) {
        spanClasses.push(classLabel + '-end');
        anno.weAreIn = false;
      }
    }

    els.push(<span className={spanClasses.join(' ')} key={rdg.id} id={'r' + rdg.id}>{rdgtext}</span>);
  }
  return (
    <p id="textbox" onMouseUp={props.textSelectHandler}>{els}</p>
  );
}

function digestAnnotations(annotations) {
  // Transform our list of annotations for an easier reading check
  const annotated = [];
  for (let anno of annotations) {
    const startLink = anno.links.find(x => x.type === 'BEGIN');
    const endLink = anno.links.find(x => x.type === 'END')
    const annoInfo = {
      class: anno.label,
      start: startLink ? startLink.target : '',
      end : endLink ? endLink.target : ''
    };
    annotated.push(annoInfo);
  }
  return annotated;
}

export default SectionText;
