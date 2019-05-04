const ipfsClient = require('ipfs-http-client');

const ipfs = ipfsClient({
  host: 'localhost',
  port: '3000',
  'api-path': '/api/channels/common/chaincodes/supply-chain-chaincode',
  protocol: 'http'
});

const documentTypes = {
  '.pdf': 'pdf',
  'image/png': 'png'
};

const upload = (file) => {
  const promise = new Promise((resolve, reject) => {
    const reader = new FileReader();
    console.log('file.type', file.type);
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
        ipfs.add(testBuffer, (err, result) => {
          if (err) {
            reject(err);
          }
          resolve({
            hash: result[0].hash,
            type: fileType
          });
        });
      }
    });
  });

  return hash;
};

const getDocument = (hash) => {
  const promise = new Promise((resolve, reject) => {
    ipfs.get(hash, (err, files) => {
      if (err) {
        reject(err);
      }
      resolve(files[0].content);
    });
  });

  return promise();
};

export default {
  addDocument,
  getDocument
};
