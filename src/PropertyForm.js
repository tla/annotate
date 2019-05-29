import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function PropertyForm(props) {
  const formrows = [];
  Object.entries(props.spec.properties).forEach(([k, v]) => {
    const label = <label key={k + "Label"} htmlFor={k + "Input"}>{k}</label>;
    const formitem = <input
      key={k + "Input"}
      id={k + "Input"}
      type={v === "Boolean" ? "checkbox" : "text"}
      name={k}
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
  })
  return(
    <Container>
      {formrows}
    </Container>
  )
}

export default PropertyForm;
