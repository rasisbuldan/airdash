/* Tensorflow */
const tf = require('@tensorflow/tfjs-node-gpu');

var model = '';
var predHist = {
  mot1: [],
  mot2: []
}

// Load cached model
var modelLoaded = false;
const loadModel = async (filename) => {
  model = await tf.loadLayersModel(filename);
  //return model;
}

const predictData = async (data) => {
  pred = await model.predict(data);
  predVal = await pred.array();
  predVal = predVal[0][0];
  console.log(predVal);
  predHist.mot1.push(Number(predVal).toFixed(4));
  if (predHist.mot1.length > 60) {
    predHist.mot1.shift();
  }
}

const predictData2 = async (data) => {
  pred = await model.predict(data);
  predVal = await pred.array();
  predVal = predVal[0][0];
  console.log(predVal);
  predHist.mot2.push(Number(predVal).toFixed(4));
  if (predHist.mot2.length > 60) {
    predHist.mot2.shift();
  }
}

const predictVib = (inputBuf) => {
  console.log('Predicting data')
  if (modelLoaded === false) {
    console.log('[TF] Model is not ready');
    return;
  }
  else {
    console.log(`predictVib -> ${inputBuf.shape}`);
    let pred = model.predict(inputBuf);
    pred.print();
  }
}


// Convert input from message handler to tensor2d
const nFeatureInput = 3;
const nFeatureOutput = 15;
const nSequence = 30;
const nVibAxis = 3
const maxBuf = 30;

var inputVibBuf = tf.tensor2d([], [0,nVibAxis]);
var inputVibBuf2 = tf.tensor2d([], [0,nVibAxis]);
var inputNavBuf = tf.tensor2d([], [0,nFeatureInput]);
var featureArr = tf.tensor2d([], [0,nFeatureOutput]);
var featureArr2 = tf.tensor2d([], [0,nFeatureOutput]);
var predArr = [];
const timeWindow = 1000;
var timePrevNavAgg = Date.now();
var timePrevVibAgg = Date.now();
var inputPredBuf = tf.tensor2d([], [0,nFeatureInput]);
var inputClassBuf = tf.tensor2d([], [0,nFeatureInput]);

const sliceColumn = (tensorArr, col) => {
  return tensorArr.slice([0,col], [tensorArr.shape[0], 1]);
}


const aggregate = async (buf) => {
  // Calculate feature aggregate for each axis, concat into length 15 array
  let featureBuf = await calculateAggTensor(sliceColumn(buf, 0));
  featureBuf = featureBuf.concat(await calculateAggTensor(sliceColumn(buf, 1)), 1);
  featureBuf = featureBuf.concat(await calculateAggTensor(sliceColumn(buf, 2)), 1);
  console.log(`[1] featureBuf: ${featureBuf.shape}`);
  
  // Add calculated feature aggregate to featureArr
  featureArr = featureArr.concat(featureBuf, 0);
  if (featureArr.shape[0] > nSequence) {
    featureArr = featureArr.slice(featureArr.shape[0]-maxBuf);
  }
}

const aggregate2 = async (buf) => {
  // Calculate feature aggregate for each axis, concat into length 15 array
  let featureBuf2 = await calculateAggTensor(sliceColumn(buf, 0));
  featureBuf2 = featureBuf2.concat(await calculateAggTensor(sliceColumn(buf, 1)), 1);
  featureBuf2 = featureBuf2.concat(await calculateAggTensor(sliceColumn(buf, 2)), 1);
  console.log(`[2] featureBuf: ${featureBuf2.shape}`);
  
  // Add calculated feature aggregate to featureArr
  featureArr2 = featureArr2.concat(featureBuf2, 0);
  if (featureArr2.shape[0] > nSequence) {
    featureArr2 = featureArr2.slice(featureArr2.shape[0]-maxBuf);
  }
}

const aggregateNav = async (buf) => {
  let navAvg = buf.mean(0).reshape([1,nFeatureInput]);
  inputPredBuf = inputPredBuf.concat(navAvg);
}


const addToInputVibBuf = async (payload) => {
  // Convert payload into tensor
  let ploadTensor = tf.tensor2d([
    payload.mpu1.x,
    payload.mpu1.y,
    payload.mpu1.z
  ], [1,nVibAxis]);
  inputVibBuf = inputVibBuf.concat(ploadTensor, 0);

  let ploadTensor2 = tf.tensor2d([
    payload.mpu2.x,
    payload.mpu2.y,
    payload.mpu2.z
  ], [1,nVibAxis]);
  inputVibBuf2 = inputVibBuf2.concat(ploadTensor2, 0);

  // Aggregating
  let lenBuf = inputVibBuf.shape[0];
  let timeNowVibAgg = Date.now();
  if ((timeNowVibAgg - timePrevVibAgg) > timeWindow) {
    await aggregate(inputVibBuf);
    await aggregate2(inputVibBuf2);
    console.log(`Added data to featureBuf! (${inputVibBuf.shape}) -> (${featureArr.shape})`);
    inputVibBuf = inputVibBuf.slice([lenBuf]);
    inputVibBuf2 = inputVibBuf2.slice([lenBuf]);
    timePrevVibAgg = timeNowVibAgg;
    
    if (featureArr.shape[0] >= nSequence) {
      predictData(featureArr.slice([featureArr.shape[0] - nSequence, 5], [nSequence, 5]).reshape([1,nSequence,5]));
      predictData2(featureArr2.slice([featureArr2.shape[0] - nSequence, 5], [nSequence, 5]).reshape([1,nSequence,5]));
    }
  }
}


const addToInputNavBuf = async (payload) => {
  let ploadTensor = tf.tensor2d([
    payload.orientation[0],
    payload.orientation[1],
    payload.orientation[2]
  ], [1, nFeatureInput]);
  inputNavBuf = inputNavBuf.concat(ploadTensor, 0);

  let lenBuf = inputNavBuf.shape[0];
  let timeNowNavAgg = Date.now();
  /* if ((timeNowNavAgg - timePrevNavAgg) > timeWindow) {
    await aggregateNav(inputNavBuf);
    console.log(`Added data to inputPredBuf! (${inputNavBuf.shape[0]}) -> (${inputPredBuf.shape[0]})`);
    //inputNavBuf = inputNavBuf.slice([lenBuf]);
    timePrevNavAgg = timeNowNavAgg;
    
    if (inputPredBuf.shape[0] > nSequence) {
      //predictVib(inputPredBuf.slice(inputPredBuf.shape[0] - nSequence));
      let i = 0;
    }
  } */
}


/* Socket */
const socketPort = 3003;
const io = require('socket.io')();
io.listen(socketPort);
console.log(`[Socket] Socket listening on ${socketPort}`);

io.sockets.on('connection', (socket) => {
  console.log(`[Socket ${socketPort}] connection from ${socket.id}`);
  timePrevAgg = Date.now();

  // Raw live flight data
  socket.on('rawnavdata', async (payload) => {
    //addToInputNavBuf(payload);
    i = 0;
  });

  // Raw live vibration data
  socket.on('rawvibdata', async (payload) => {
    //let pdata = await preprocPayload(payload);
    addToInputVibBuf(payload);
  });
});

/* Communicate to modelPredict */
var ioClient = require('socket.io-client');
var socketClient = ioClient.connect('http://localhost:3002/', {
  reconnection: true
});

const sendToMain = setInterval(() => {
  motorCond = predHist;
  if (motorCond.mot1.length > 0) {
    console.log(motorCond);
    socketClient.emit('motorcond', motorCond);
  }
}, 500);

/* Data processing */
const qmean = require('compute-qmean');
const kurtosis = require('compute-kurtosis');
const skewness = require('compute-skewness');
const { input } = require('@tensorflow/tfjs-node-gpu');

// Compute function for each feature
const calcPWMAvg = (arr) => { return arr.reduce((a,b) => a + b)/arr.length }
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
const mainLoop = async () => {
  try {
    await loadModel('file://model3/model.json');
    console.log('[TF] Model load successful!');
    /* let dummyData = await tf.tensor2d([
      [0,0,0,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2],
      [2,2,2,2,2]
    ]).reshape([1,10,5]);
    predictData(dummyData); */
    modelLoaded = true;
    //model.summary();
  } catch (err) {
    console.log(err);
  }
}

mainLoop();