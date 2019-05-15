import React from 'react';

function SectionText(props) {
  const els = [];
  for (const [idx, rdg] of props.readings.entries()) {
    const rdgtext = rdg.normal_form ? rdg.normal_form : rdg.text;
    if (idx > 0 && !props.readings[idx-1].join_next && !rdg.join_prior) {
      els.push(' ');
    }
    els.push(<span className="reading" key={rdg.id} id={'r' + rdg.id}>{rdgtext}</span>);
  }
  return (
    <p id="textbox" onMouseUp={props.textSelectHandler}>{els}</p>
  );
}

export default SectionText;
