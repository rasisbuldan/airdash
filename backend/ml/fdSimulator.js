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
const getFlightData = async (desc) => {
  await FlightData.find({
    'description': desc
  }, {'_id': 0}).sort({
    'timestamp': 1
  }).exec().then((docs) => {
    //let tsStart = Number(docs[0].timestamp);
    //let tsStop = Number(docs[datas.length-1].timestamp);

    docs.forEach((doc) => {
      addToFD(doc);
    });
  });
}


/* Communicate to modelPredict */
var io = require('socket.io-client');
var socket = io.connect('http://localhost:3003/', {
  reconnection: true
});

const sendDummyNavData = () => {
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

  socket.emit('rawnavdata', payload);
}

const sendDummyVibData = () => {
  let payload = {
    mpu1: {
      x: (Math.random() * 2) - 1,
      y: (Math.random() * 2) - 1,
      z: (Math.random() * 2) - 1
    }
  }

  socket.emit('rawvibdata', payload);
}

const sendVibData = (cursor) => {
  let payload = {
    pwm: FD[cursor].pwm[0],
    mpu1: {
      x: FD[cursor].mpu1[0],
      y: FD[cursor].mpu1[1],
      z: FD[cursor].mpu1[2]
    },
    mpu2: {
      x: FD[cursor].mpu2[0],
      y: FD[cursor].mpu2[1],
      z: FD[cursor].mpu2[2]
    }
  }

  socket.emit('rawvibdata', payload);
}

socket.on('connect', async () => {
  var descs = await getFlightDescList();
  var descsFiltered = descs.filter(a => a.includes('aug11_6_h'));
  console.log(descsFiltered);
  console.log('Fetching data...');
  for (desc of descsFiltered) {
    await getFlightData(desc);
  }
  console.log('Fetching data completed!');
  var fdCursor = 0;
  const dummyInterval = setInterval(() => {
    sendDummyNavData();
    sendVibData(fdCursor);
    fdCursor = (fdCursor + 1) % FD.length;
  }, 7);
});

/***** Main program *****/


/* socket.on('connect', () => {
  const dummyInterval = setInterval(() => {
    sendDummyNavData();
    sendDummyVibData();
  }, 200);
}); */

/* getFlightDescList().then((descs) => {
  console.log(descs[0]);
  getFlightData('aug9_0_hover20s_2.json');
}); */