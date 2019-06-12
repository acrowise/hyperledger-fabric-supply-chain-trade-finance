const ipfsClient = require('ipfs-http-client');

const IPFS_PORT = window.__STATE__ ? window.__STATE__.ipfs_port : '7001'; // eslint-disable-line no-underscore-dangle

const ipfs = ipfsClient({
  host: window.location.hostname,
  port: IPFS_PORT
});

const documentTypes = {
  'image/jpeg': '1',
  'image/jpg': '1',
  'image/png': '2',
  xls: '3',
  pdf: '4',
  csv: '5',
  'image/gif': '6' // FIXME:
};

const upload = (file) => {
  const promise = new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileType = documentTypes[file.type];
    if (fileType === undefined) {
      resolve(undefined);
    } else {
      reader.readAsArrayBuffer(file);
      reader.onload = (event) => {
        resolve({
          file: event.target.result,
          type: fileType
        });
      };
    }
  });
  return promise;
};

const addDocument = (file) => {
  const hash = new Promise((resolve, reject) => {
    upload(file).then((result) => {
      if (result === undefined) {
        resolve(undefined);
      } else {
        const testBuffer = Buffer.from(result.file);
        const fileType = result.type;
        ipfs.add(testBuffer, (err, res) => {
          if (err) {
            reject(err);
          }
          resolve({
            hash: res[0].hash,
            type: fileType
          });
        });
      }
    });
  });

  return hash;
};

export default {
  addDocument
};
