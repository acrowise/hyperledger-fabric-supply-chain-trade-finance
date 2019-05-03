import React, {useEffect} from 'react';
import {useDropzone} from 'react-dropzone';

const thumbsContainer = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
};

const thumb = {
  display: 'inline-flex',
  borderRadius: 2,
  border: '1px solid red',
  marginBottom: 8,
  marginRight: 8,
  width: 100,
  height: 100,
  padding: 4,
  boxSizing: 'border-box'
};

const thumbInner = {
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden'
};

const img = {
  display: 'block',
  width: 'auto',
  height: '100%'
};

function FileUploader({files, setFiles, withPreview}) {
  // const [files, setFiles] = useState([]);
  const {getRootProps, getInputProps} = useDropzone({
    accept: 'image/*',
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map(file => Object.assign(file, {
          preview: URL.createObjectURL(file)
        }))
      );
    }
  });

  const thumbs = files.map(file => (
    <div style={thumb} key={file.name}>
      fdfasd
      <div style={thumbInner}>
        <img src={file.preview} style={img}/>
      </div>
    </div>
  ));

  useEffect(
    () => () => {
      files.forEach(file => URL.revokeObjectURL(file.preview));
    },
    [files]
  );

  return (
    <section>
      <div
        {...getRootProps({className: 'dropzone'})}
        style={{
          width: '240px',
          height: '60px',
          backgroundColor: '#F8F9FA',
          border: '2px dashed #687585',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <input {...getInputProps()} />
        <div>Drag & Drop a file</div>
      </div>
      {withPreview ? (
        <aside style={thumbsContainer}>{thumbs}</aside>
      ) : (
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
              style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            >
              <span style={{marginRight: '5px'}}>
                <svg style={{display: 'block'}} width='14' height='17' viewBox='0 0 14 17' fill='none'
                     xmlns='http://www.w3.org/2000/svg'>
                  <path fillRule='evenodd' clipRule='evenodd'
                        d='M1.96295 1.96289V15.037H12.0741V5.94035H9.06638C8.67859 5.94035 8.37036 5.62469 8.37036 5.2429V1.96289H1.96295ZM9.37036 2.73355L11.4253 4.94035H9.37036V2.73355ZM0.962952 1.66033C0.962952 1.27854 1.27119 0.962891 1.65898 0.962891H8.87036C9.00915 0.962891 9.1417 1.02058 9.23628 1.12215L12.94 5.09961C13.0262 5.19215 13.0741 5.3139 13.0741 5.44035V15.3395C13.0741 15.7213 12.7658 16.037 12.378 16.037H1.65898C1.27118 16.037 0.962952 15.7213 0.962952 15.3395V1.66033ZM10.4051 7.72524C10.5988 7.92203 10.5964 8.2386 10.3996 8.43232L6.26565 12.5019C6.16186 12.6041 6.01868 12.656 5.87354 12.6439C5.72839 12.6319 5.59572 12.5571 5.51018 12.4393L3.92021 10.2479C3.75804 10.0244 3.80776 9.71177 4.03127 9.5496C4.25477 9.38743 4.56743 9.43715 4.7296 9.66066L5.97827 11.3816L9.69804 7.71969C9.89483 7.52597 10.2114 7.52845 10.4051 7.72524Z'
                        fill='#69D7BC'/>
                </svg>
              </span>
              <span>{file.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default FileUploader;
