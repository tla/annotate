import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function PropertyForm(props) {
  const formrows = [];
  Object.keys(props.spec.properties)
    .filter(x => x !== 'authority') // We handle the authority separately
    .forEach(k => {
      const v = props.spec.properties[k];
      const label = <label key={k + "Label"} htmlFor={k + "Input"}>{k}</label>;
      let existingValue = props.existing ? props.existing.properties[k] : '';
      // Convert values into strings where necessary
      if (v.includes("Date")) {
        const dateparts = [
          (existingValue.year + "").padStart(4, "0"),
          (existingValue.monthValue + "").padStart(2, "0"),
          (existingValue.dayOfMonth + "").padStart(2, "0")
        ];
        existingValue = dateparts.join('-');
      } else if (v === "Boolean") {
        existingValue = "checked";
      }
      const formitem = <input
        key={k + "Input"}
        id={k + "Input"}
        type={v === "Boolean" ? "checkbox" : "text"}
        name={k}
        defaultValue={existingValue}
        onChange={props.recordFormValue}
        />;
      formrows.push(
        <Row key={k}>
          <Col md={3}>
            {label}
          </Col>
          <Col md={9}>
            {formitem}
          </Col>
        </Row>
      );
  });
  return(
    <Container>
      {formrows}
    </Container>
  )
}

export default PropertyForm;
