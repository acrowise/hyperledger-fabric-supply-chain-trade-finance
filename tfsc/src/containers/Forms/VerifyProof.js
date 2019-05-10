import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Overlay, Card, Label, TextArea, FormGroup, InputGroup
} from '@blueprintjs/core';

import { post } from '../../helper/api';
import { cropId } from '../../helper/utils';
import FileUploader from '../../components/FileUploader';

const ValidateProof = ({
  dialogIsOpen, setDialogOpenState, proof, role, type
}) => {
  const [files, setFiles] = useState([]);
  const [, validateProof] = post('validateProof')();
  const [, uploadDocs] = post('uploadDocuments')();

  console.log('proof', proof);
  if (!proof || !proof.contract) {
    return <></>;
  }
  return (
    <Overlay usePortal isOpen={dialogIsOpen}>
      <div
        style={{
          display: 'flex',
          width: '100vw',
          justifyContent: 'center',
          paddingTop: '15vh'
        }}
      >
        <Card className="modal" style={{ width: '720px' }}>
          <div className="modal-header">
            {type === 'update'
              ? 'Update Report'
              : `Verify ${role === 'uscts' ? 'Commercial Trade' : 'Goods'}`}
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-6">
                <FormGroup className="form-group-horizontal" label="ContractId">
                  <InputGroup disabled value={cropId(proof.contract.key.id)} />
                </FormGroup>

                <FormGroup className="form-group-horizontal" label="Consignor">
                  <InputGroup disabled value={proof.contract.value.consignorName} />
                </FormGroup>

                <FormGroup className="form-group-horizontal" label="Consignee">
                  <InputGroup disabled value={proof.contract.value.consigneeName} />
                </FormGroup>
                <br />
                {proof.documents
                  && proof.documents.map(i => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 15
                      }}
                    >
                      <svg
                        style={{ marginRight: 5 }}
                        width="15"
                        height="18"
                        viewBox="0 0 15 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                      >
                        <rect width="15" height="18" fill="url(#pattern0)" />
                        <defs>
                          <pattern
                            id="pattern0"
                            patternContentUnits="objectBoundingBox"
                            width="1"
                            height="1"
                          >
                            <use
                              xlinkHref="#image0"
                              transform="matrix(.00207 0 0 .00173 0 -.013)"
                            />
                          </pattern>
                          <image
                            id="image0"
                            width="482"
                            height="594"
                            xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeIAAAJSCAYAAAAfy8ZLAAABN2lDQ1BBZG9iZSBSR0IgKDE5OTgpAAAokZWPv0rDUBSHvxtFxaFWCOLgcCdRUGzVwYxJW4ogWKtDkq1JQ5ViEm6uf/oQjm4dXNx9AidHwUHxCXwDxamDQ4QMBYvf9J3fORzOAaNi152GUYbzWKt205Gu58vZF2aYAoBOmKV2q3UAECdxxBjf7wiA10277jTG+38yH6ZKAyNguxtlIYgK0L/SqQYxBMygn2oQD4CpTto1EE9AqZf7G1AKcv8ASsr1fBBfgNlzPR+MOcAMcl8BTB1da4Bakg7UWe9Uy6plWdLuJkEkjweZjs4zuR+HiUoT1dFRF8jvA2AxH2w3HblWtay99X/+PRHX82Vun0cIQCw9F1lBeKEuf1UYO5PrYsdwGQ7vYXpUZLs3cLcBC7dFtlqF8hY8Dn8AwMZP/fNTP8gAAAAJcEhZcwAACxMAAAsTAQCanBgAAAbJaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0MiA3OS4xNjA5MjQsIDIwMTcvMDcvMTMtMDE6MDY6MzkgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMDQtMThUMDU6MjM6MjMrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTA0LTI0VDEzOjI3OjQ2KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTA0LTI0VDEzOjI3OjQ2KzAzOjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IkFkb2JlIFJHQiAoMTk5OCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NmRlMTkyYmEtZTc2ZC02ZTQ0LWJjZTUtMTBhYTg4M2NjN2Q5IiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6YmI4MTljNGUtNGJjNS1kYTQyLTg0MGEtZWRjNGZiOTEyMmVkIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NDYwM2UxYWYtZTU0OC05ZDRhLTk3ODItNDY0OWEwZTM1OTUxIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0NjAzZTFhZi1lNTQ4LTlkNGEtOTc4Mi00NjQ5YTBlMzU5NTEiIHN0RXZ0OndoZW49IjIwMTktMDQtMThUMDU6MjM6MjMrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChXaW5kb3dzKSIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTQwM2Y5YmUtODY4Zi1kODRmLWI3YzAtMzljYjJmMDgzMTM2IiBzdEV2dDp3aGVuPSIyMDE5LTA0LTIzVDA5OjQxOjIyKzAzOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOCAoV2luZG93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"
                          />
                        </defs>
                      </svg>
                      {i}
                    </div>
                  ))}
              </div>
              <div className="col-6">
                <FormGroup className="form-group-horizontal" label="Shipment number">
                  <InputGroup disabled value={cropId(proof.shipmentId)} />
                </FormGroup>
                <Label>Add report</Label>
                <FileUploader files={files} setFiles={setFiles} />
                <Label>
                  Description
                  <TextArea
                    value={proof.description}
                    growVertically={true}
                    // onChange={({ target: { value } }) => dispatch({
                    //   type: 'change',
                    //   payload: {
                    //     field: 'description',
                    //     value
                    //   }
                    // })
                    // }
                  />
                </Label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            {type === 'update' ? (
              <Button
                large
                intent="primary"
                className="btn-modal"
                onClick={() => {
                  setDialogOpenState(false);
                }}
              >
                Update Report
              </Button>
            ) : (
              <>
                <Button
                  large
                  intent="primary"
                  className="btn-modal"
                  onClick={() => {
                    setDialogOpenState(false);
                    validateProof({
                      fcn: 'validateProof',
                      contractId: proof.contract.key.id,
                      shipmentId: proof.shipmentId,
                      factor: role,
                      args: [proof.id]
                    });

                    const form = new FormData();
                    form.append('type', role === 'uscts' ? 'USCTS Report' : 'GGCB Report');
                    form.append('contractId', proof.contract.key.id);
                    files.forEach((f) => {
                      form.append('file', f);
                    });
                    uploadDocs(form);
                  }}
                >
                  {role === 'uscts' ? 'Trade permitted' : 'Goods approved'}
                </Button>
                <Button
                  large
                  intent="none"
                  className="btn-modal btn-default"
                  onClick={() => {
                    setDialogOpenState(false);
                  }}
                >
                  {role === 'uscts' ? 'Trade ' : 'Goods'} prohibited
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </Overlay>
  );
};

export default ValidateProof;

ValidateProof.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};
