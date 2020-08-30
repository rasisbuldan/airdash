/* Tensorflow */
const tf = require('@tensorflow/tfjs-node-gpu');

// Load cached model
var modelLoaded = false;
const loadModel = async (filename) => {
  const model = await tf.loadLayersModel(filename);
  pred = model.predict(
    tf.tensor2d([
      [0,0,0,0],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2],
      [255,2,2,2]
    ]).reshape([1,10,4])
  )

  pred.print();
  return model;
}

const predictVib = (inputBuf) => {
  if (modelLoaded == false) {
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
const nFeatureInput = 4;
const nFeatureOutput = 15;
const nSequence = 10;
const nVibAxis = 3

var inputVibBuf = tf.tensor2d([], [0,nVibAxis]);
var inputNavBuf = tf.tensor2d([], [0,nFeatureInput]);
var featureArr = tf.tensor2d([], [0,nFeatureOutput]);
var predArr = [];
const timeWindow = 1000;
var timePrevNavAgg = Date.now();
var timePrevVibAgg = Date.now();
var inputPredBuf = tf.tensor2d([], [0,nFeatureInput]);

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

  // Aggregating
  let lenBuf = inputVibBuf.shape[0];
  let timeNowVibAgg = Date.now();
  if ((timeNowVibAgg - timePrevVibAgg) > timeWindow) {
    await aggregate(inputVibBuf);
    console.log(`Added data to featureBuf! (${inputVibBuf.shape[0]}) -> (${featureArr.shape[0]})`);
    inputVibBuf = inputVibBuf.slice([lenBuf]);
    timePrevVibAgg = timeNowVibAgg;
  }
}


const addToInputNavBuf = async (payload) => {
  let ploadTensor = tf.tensor2d([
    payload.pwm[0],
    payload.orientation[0],
    payload.orientation[1],
    payload.orientation[2]
  ], [1, nFeatureInput]);
  inputNavBuf = inputNavBuf.concat(ploadTensor, 0);

  let lenBuf = inputNavBuf.shape[0];
  let timeNowNavAgg = Date.now();
  if ((timeNowNavAgg - timePrevNavAgg) > timeWindow) {
    await aggregateNav(inputNavBuf);
    console.log(`Added data to inputPredBuf! (${inputNavBuf.shape[0]}) -> (${inputPredBuf.shape[0]})`);
    inputNavBuf = inputNavBuf.slice([lenBuf]);
    timePrevNavAgg = timeNowNavAgg;
    
    if (inputPredBuf.shape[0] > nSequence) {
      predictVib(inputPredBuf.slice(inputPredBuf.shape[0] - nSequence));
    }
  }
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
    addToInputNavBuf(payload);
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
const { input, model } = require('@tensorflow/tfjs-node-gpu');

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
const mainLoop = async () => {
  try {
    var model = await loadModel('file://vib-estimate/model.json');
    console.log('[TF] Model load successful!');
    modelLoaded = true;
    model.summary();
  } catch (err) {
    console.log(err);
  }
}

mainLoop();