/* MongoDB Connector */
const dbHost = 'localhost';
const dbName = 'test-db';
const mongoose = require('mongoose');
require('mongoose-long')(mongoose);

mongoose.connect(`mongodb://${dbHost}/${dbName}`, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;

db.on('error', (err) => {
  console.log('Error: ', err.message);
});

db.once('open', () => {
  console.log(`[DB] Connection to ${dbHost} successful!`);
});

/* Schema definition */
const flightDataSchema = new mongoose.Schema({
  description: {type: String},
  timestamp: {type: Number},
  state: {
    controlState: {type: String},
    batteryPercentage: {type: String},
    batteryMillivolt: {type: String}
  },
  pwm: {type: Array},
  orientation: {type: Array},
  mpu1: {type: Array},
  mpu2: {type: Array}
});
const FlightData = mongoose.model('FlightData', flightDataSchema);

// Flight data storage variable
var descList = [];
var FD = [];

const addToFD = (doc) => {
  FD.push(doc);
}

const addToDescList = (descs) => {
  descList = descList.concat(descs);
  console.log(descs);
}

// Get description list
const getFlightDescList = async () => {
  await FlightData.distinct('description').exec().then((descs) => {
    addToDescList(descs);
  });

  return descList;
}

// Get flight data by description
const getFlightData = (desc) => {
  FlightData.find({
    'description': desc
  }, {'_id': 0}).sort({
    'timestamp': 1
  }).exec().then((docs) => {
    let tsStart = Number(docs[0].timestamp);
    let tsStop = Number(docs[datas.length-1].timestamp);

    docs.forEach((doc) => {
      addToFD(doc);
    });
  });

  return FD;
}


/* Communicate to modelPredict */
var io = require('socket.io-client');
var socket = io.connect('http://localhost:3003/', {
  reconnection: true
});

const sendDummyData = () => {
  let payload = {
    description: 'test data',
    timestamp: 0,
    pwm: [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255)
    ],
    orientation: [
      Math.random() * 2,
      2 + Math.random() * 2,
      4 + Math.random() * 2
    ]
  };

  socket.emit('rawdata', payload);
}


socket.on('connect', () => {
  const dummyInterval = setInterval(() => {
    sendDummyData();
  }, 500);
})


/***** Main program *****/

/* getFlightDescList().then((descs) => {
  console.log(descs[0]);
}); */

/* Send dummy data */
