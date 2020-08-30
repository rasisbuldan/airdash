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
const nVibAxis = 3

var inputVibBuf = tf.tensor2d([], [0,nVibAxis]);
var inputNavBuf = tf.tensor2d([], [0,nFeatureInput]);
var featureArr = tf.tensor2d([], [0,nFeatureOutput]);
var predArr = [];

const sliceColumn = (tensorArr, col) => {
  return tensorArr.slice([0,col], [tensorArr.shape[0], 1]);
}

const aggregate = async (buf) => {
  // Calculate feature aggregate for each axis, concat into length 15 array
  let featureBuf = await calculateAggTensor(sliceColumn(buf, 0));
  featureBuf = featureBuf.concat(await calculateAggTensor(sliceColumn(buf, 1)), 1);
  featureBuf = featureBuf.concat(await calculateAggTensor(sliceColumn(buf, 2)), 1);
  
  // Add calculated feature aggregate to featureArr
  featureArr = featureArr.concat(featureBuf, 0);
}

const addToInputVibBuf = async (payload) => {
  // Convert payload into tensor
  let convTensor = tf.tensor2d([payload.mpu1.x, payload.mpu1.y, payload.mpu1.z], [1,nVibAxis]);
  inputVibBuf = inputVibBuf.concat(convTensor, 0);

  // Aggregating
  let lenBuf = inputVibBuf.shape[0];
  if (lenBuf >= nSequence) {
    await aggregate(inputVibBuf);
    console.log(`Added data to featureBuf! (${featureArr.shape[0]})`);
    inputVibBuf = inputVibBuf.slice([lenBuf]);
  }

  //console.log(`Added data to inputVibBuf! (${inputVibBuf.shape[0]})`);
}

const preprocPayload = async (payload) => {
  let pdata = {
    pwm: payload.pwm[0],
    r: payload.orientation[0],
    p: payload.orientation[1],
    y: payload.orientation[2]
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
  socket.on('rawnavdata', async (payload) => {
    let pload = payload;
  });

  // Raw live vibration data
  socket.on('rawvibdata', async (payload) => {
    //let pdata = await preprocPayload(payload);
    addToInputVibBuf(payload);
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
const calcCrest = (arr) => { return calcRMS([...arr])/Math.max(...arr); }
const calcP2P = (arr) => { return (Math.max(...arr) - Math.min(...arr)); }

// Calculate aggregation for each time series feature
const calculateAggTensor = async (arrTensor) => {
  let arr = await arrTensor.reshape([arrTensor.shape[0]*arrTensor.shape[1]]).array();
  let featureVal = tf.tensor2d([
    calcRMS(arr),
    calcKurt(arr),
    calcSkew(arr),
    calcCrest(arr),
    calcP2P(arr)
  ], [1,5]);

  return featureVal;
}


/***** Main program *****/

// Load model
/* loadModel('file://vib-estimate/model.json').then((model) => {
  model.summary();
}) */

/* loopInputBuf(5).then(() => {
  inputBuf.print();
}); */