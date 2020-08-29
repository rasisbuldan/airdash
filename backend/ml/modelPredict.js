/* Tensorflow */
const tf = require('@tensorflow/tfjs-node-gpu');

// Load cached model
const loadModel = async (filename) => {
  const model = await tf.loadLayersModel(filename);
  
  return model;
}

// Convert input from message handler to tensor2d
const nFeatureInput = 4;
const nFeatureOutput = 15;
const nSequence = 10;

var inputBuf = tf.tensor2d([], [0,nFeatureInput]);
var featureBuf = [];
var predArr = [];

const addToInputBuf = async (payload) => {
  /*  Expected Input:
   *  obj {
        pwm,
        r,
        p,
        y
      }
   */
  let convTensor = tf.tensor2d([payload.pwm, payload.r, payload.p, payload.y], [1,nFeatureInput]);
  inputBuf = inputBuf.concat(convTensor, 0);

  let lenBuf = inputBuf.shape[0];
  if (lenBuf >= nSequence) {
    featureBuf.push(inputBuf.cumsum());
    inputBuf = inputBuf.slice([lenBuf]);
    console.log(`Added data to featureBuf! (${featureBuf.length})`);
  }

  console.log(`Added data to inputBuf! (${inputBuf.shape[0]})`);
  //inputBuf.print();
}

const loopInputBuf = async (n) => {
  for (let i = 0; i < n; i++) {
    addToInputBuf({
      pwm: Math.floor(Math.random()*255),
      r: Math.random()*2,
      p: 2 + Math.random()*2,
      y: 4 + Math.random()*2
    });
  }
}

const preprocPayload = async (payload) => {
  let pload = payload;
  let pdata = {
    pwm: pload.pwm[0],
    r: pload.orientation[0],
    p: pload.orientation[1],
    y: pload.orientation[2]
  }

  return pdata
}


/* Socket */
const socketPort = 3003;
const io = require('socket.io')();
io.listen(socketPort);
console.log(`[Socket] Socket listening on ${socketPort}`);

io.sockets.on('connection', (socket) => {
  console.log(`[Socket ${socketPort}] connection from ${socket.id}`);

  // Raw live flight data
  socket.on('rawdata', async (payload) => {
    let pdata = await preprocPayload(payload);
    addToInputBuf(pdata);
  });
});


/* Data processing */
const qmean = require('compute-qmean');
const kurtosis = require('compute-kurtosis');
const skewness = require('compute-skewness');
const { input } = require('@tensorflow/tfjs-node-gpu');

// Compute function for each feature
const calcRMS = (arr) => { return qmean([...arr]); }
const calcKurt = (arr) => { return kurtosis([...arr]); }
const calcSkew = (arr) => { return skewness([...arr]); }
const calcCrest = (arr) => { return rms([...arr])/max(arr); }
const calcP2P = (arr) => { return (max(arr) - min(arr)); }

// Calculate aggregation value
const calculateAgg = (arr) => {
  let featureVal = {
    rms: calcRMS(arr),
    kurt: calcKurt(arr),
    skew: calcSkew(arr),
    crest: calcCrest(arr),
    p2p: calcP2P(arr)
  }

  console.log(`featureVal from arr[${arr.length}]`);
  console.log(featureVal);
  return featureVal;
}

// Aggregation over dataset (currently single feature)
const aggregate = (arr) => {
  let i = 0;
}


/***** Main program *****/

// Load model
/* loadModel('file://vib-estimate/model.json').then((model) => {
  model.summary();
}) */

loopInputBuf(5).then(() => {
  inputBuf.print();
});