import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import ipfs from '../helper/ipfs';

import Icon from './Icon/Icon';

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  paddingLeft: 30
};

const thumb = {
  display: 'inline-flex'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden',
  marginRight: 15
};

const img = {
  display: 'block',
  width: 50,
  height: 70,
  border: '1px solid #687585',
  objectFit: 'cover'
};

function FileUploader({
  files, setFiles, withPreview, error, setHash
}) {
  // const [files, setFiles] = useState([]);
  useEffect(
    () => () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: (acceptedFiles) => {
      ipfs.addDocument(acceptedFiles[0]).then(
        (document) => {
          if (!document) {
            console.log('no document');
          } else {
            console.log('ipfs document added', document);
            setHash(document);
          }
        },
        (e) => {
          console.error(e);
        }
      );
      setFiles(
        acceptedFiles.map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }))
      );
    }
  });

  const thumbs = files.map(file => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img src={file.preview} style={img} />
      </div>
    </div>
  ));

  const dragInner = (
    <>
      <input {...getInputProps()} />
      <span>
        <Icon name="cloud" />
      </span>
    </>
  );

  const uploadWithPreview = (
    <div
      style={{
        display: 'flex',
        marginBottom: '20px'
      }}
    >
      <div
        {...getRootProps({ className: 'dropzone' })}
        style={{
          width: '210px',
          height: '100px',
          backgroundColor: '#F8F9FA',
          border: `2px dashed ${error && files.length === 0 ? '#db3737' : '#687585'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {dragInner}
      </div>
      <aside style={thumbsContainer}>{thumbs}</aside>
    </div>
  );

  const uploadWithoutPreview = (
    <>
      <div
        {...getRootProps({ className: 'dropzone' })}
        style={{
          width: '240px',
          height: '60px',
          backgroundColor: '#F8F9FA',
          border: `2px dashed ${error && files.length === 0 ? '#db3737' : '#687585'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {dragInner}
      </div>
      <ul
        style={{
          padding: '5px 0 0 0',
          margin: '5px 0 0 0',
          color: '#69D7BC',
          listStyle: 'none'
        }}
      >
        {files.map((file, i) => (
          <li key={i.toString()} style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '5px' }}>
              <Icon name="document" />
            </span>
            <span>{file.name}</span>
          </li>
        ))}
      </ul>
    </>
  );

  return <section>{withPreview ? uploadWithPreview : uploadWithoutPreview}</section>;
}

export default FileUploader;
