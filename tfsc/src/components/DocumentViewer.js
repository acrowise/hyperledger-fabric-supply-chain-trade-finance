import React from 'react';
import PropTypes from 'prop-types';
import { Button, Overlay, Card } from '@blueprintjs/core';

const DocumentViewer = ({ dialogIsOpen, setDialogOpenState }) => (
  <Overlay usePortal isOpen={dialogIsOpen}>
    <div
      style={{
        display: 'flex',
        width: '100vw',
        justifyContent: 'center',
        paddingTop: '15vh'
      }}
    >
      <Card style={{ width: '20vw' }}>
        <>
          <>document data</>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              large
              intent="primary"
              onClick={() => {
                setDialogOpenState(false);
              }}
            >
              Close
            </Button>
          </div>
        </>
      </Card>
    </div>
  </Overlay>
);

DocumentViewer.propTypes = {
  dialogIsOpen: PropTypes.bool,
  setDialogOpenState: PropTypes.func
};

export default DocumentViewer;
