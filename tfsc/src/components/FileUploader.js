import React, { useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

import ipfs from '../helper/ipfs';

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

function FileUploader({ files, setFiles, withPreview }) {
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
            console.log('ok');
            // this.changeDocumentHash(document.hash);
            // this.changeDocumentType(document.type);
            // this.props.dispatch(alertActions.success('Document file was uploaded'));
          }
        },
        (error) => {
          console.error(error);
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
        <svg
          width="40"
          height="29"
          viewBox="0 0 40 29"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.5 10.4999C10 -1.00006 31.5 -5.00012 31.5 12.9999C39.5 12.9999 42.5 25.5 33 27.9999H8.5L3.5 25.5L1 18.9999L3.5 12.9999L8.5 10.4999Z"
            fill="#fff"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M31.6462 27.4666H31.6449H11.0918V27.4544L10.0802 27.4661C10.0481 27.4665 10.016 27.4666 9.98374 27.4666C5.47412 27.4666 1.81836 23.8109 1.81836 19.3013C1.81836 15.3157 4.67482 11.9952 8.45253 11.279L9.15732 11.1454L9.25665 10.435C10.002 5.10354 14.5823 1 20.1193 1C26.1772 1 31.0882 5.91095 31.0882 11.9689C31.0882 12.1382 31.0844 12.3064 31.0768 12.4737L31.0319 13.4663L32.0242 13.5175C35.7078 13.7078 38.6366 16.7559 38.6366 20.4873C38.6366 24.215 35.7138 27.2606 32.0355 27.4566L31.8471 27.4666H31.6698H31.6684L31.6573 27.4666L31.6462 27.4666ZM9.95571 28.4666C9.92901 28.4665 9.90234 28.4663 9.8757 28.466C4.86358 28.4081 0.818359 24.3271 0.818359 19.3013C0.818359 14.8264 4.02529 11.1005 8.26628 10.2965C9.07978 4.47798 14.0766 0 20.1193 0C26.7295 0 32.0882 5.35866 32.0882 11.9689C32.0882 12.1532 32.084 12.3366 32.0758 12.5189C36.2881 12.7365 39.6366 16.2209 39.6366 20.4873C39.6366 24.7494 36.295 28.2311 32.0887 28.4551V28.4666H31.6698L31.6573 28.4666L31.6449 28.4666H31.0887H11.0918H10.0918V28.466C10.0652 28.4663 10.0385 28.4665 10.0118 28.4666L9.98374 28.4666L9.95571 28.4666ZM19.4316 23.1788C19.6201 23.3484 19.9058 23.3501 20.0962 23.1826L25.2227 18.6748C25.4301 18.4924 25.4504 18.1765 25.268 17.9691C25.0857 17.7618 24.7698 17.7415 24.5624 17.9238L20.266 21.7017V10.1365C20.266 9.86036 20.0422 9.6365 19.766 9.6365C19.4899 9.6365 19.266 9.86036 19.266 10.1365V21.6846L15.0905 17.9276C14.8852 17.7429 14.5691 17.7596 14.3844 17.9649C14.1997 18.1702 14.2163 18.4863 14.4216 18.671L19.4316 23.1788Z"
            fill="#1B263C"
          />
        </svg>
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
          border: '2px dashed #687585',
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
          border: '2px dashed #687585',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {dragInner}
      </div>
      <ul
        style={{
          padding: '10px 0 0 0',
          margin: '5px 0 0 0',
          textAlign: 'center',
          color: '#69D7BC',
          listStyle: 'none'
        }}
      >
        {files.map((file, i) => (
          <li
            key={i.toString()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ marginRight: '5px' }}>
              <svg
                style={{ display: 'block' }}
                width="14"
                height="17"
                viewBox="0 0 14 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.96295 1.96289V15.037H12.0741V5.94035H9.06638C8.67859 5.94035 8.37036 5.62469 8.37036 5.2429V1.96289H1.96295ZM9.37036 2.73355L11.4253 4.94035H9.37036V2.73355ZM0.962952 1.66033C0.962952 1.27854 1.27119 0.962891 1.65898 0.962891H8.87036C9.00915 0.962891 9.1417 1.02058 9.23628 1.12215L12.94 5.09961C13.0262 5.19215 13.0741 5.3139 13.0741 5.44035V15.3395C13.0741 15.7213 12.7658 16.037 12.378 16.037H1.65898C1.27118 16.037 0.962952 15.7213 0.962952 15.3395V1.66033ZM10.4051 7.72524C10.5988 7.92203 10.5964 8.2386 10.3996 8.43232L6.26565 12.5019C6.16186 12.6041 6.01868 12.656 5.87354 12.6439C5.72839 12.6319 5.59572 12.5571 5.51018 12.4393L3.92021 10.2479C3.75804 10.0244 3.80776 9.71177 4.03127 9.5496C4.25477 9.38743 4.56743 9.43715 4.7296 9.66066L5.97827 11.3816L9.69804 7.71969C9.89483 7.52597 10.2114 7.52845 10.4051 7.72524Z"
                  fill="#69D7BC"
                />
              </svg>
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
