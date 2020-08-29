/* Express Initialization */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


/* Express add-on */
var whitelist = ['http://localhost:3000', 'http://localhost']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}
app.use(cors());


/* Aedes broker */
const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const brokerPort = 1884;

server.listen(brokerPort, () => {
  console.log(`[Aedes] Broker started and listening to port ${brokerPort}`);
});

aedes.on('client', (client) => {
  console.log(`[Aedes] Client connected with id ${client.id}`);
});

aedes.on('subscribe', (subscriptions, client) => {
  console.log(`[Aedes] Client with id ${client.id} subscribed with topic ${subscriptions[0].topic}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`[Aedes] Client disconnected with id ${client.id}`);
});


/* MQTT Initialization */
var subscribeTopic = [
  'topic/pi/mpu6050',
  'topic/pi/rawmpu'
];
const mqttHost = 'localhost';
const mqttPort = 1884;
const mqtt = require('mqtt');
const mqttClient = mqtt.connect(`mqtt://${mqttHost}:${mqttPort}`);


/* Socket.IO Initialization */
const socketPort = 3002;
const io = require('socket.io')();
io.listen(socketPort);
console.log(`[Socket] Socket listening on ${socketPort}`);


/* MongoDB Connector */
const dbHost = 'localhost';
const dbName = 'test-db';
const mongoose = require('mongoose');
const { json } = require('body-parser');
require('mongoose-long')(mongoose);

var SchemaTypes = mongoose.Schema.Types;

mongoose.connect(`mongodb://${dbHost}/${dbName}`, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;

db.on('error', (err) => {
  console.log('Error: ', err.message);
});

db.once('open', () => {
  console.log(`[DB] Connection to ${dbHost} successful!`);
});


/* Schema definition */
const combinedDataSchema = new mongoose.Schema({
  description: {type: String},
  timestamp: {type: Number},
  pwm: {type: Number},
  vib: {
    x: {type: Number},
    y: {type: Number},
    z: {type: Number}
  }
});

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
})

const navdataDroneSchema = new mongoose.Schema({
  timestamp: {type: String},
  navdata: {
    batteryPercentage: {type: Number},
    altitude: {type: Number},
    orientation: {
      roll: {type: Number},
      pitch: {type: Number},
      yaw: {type: Number},
    },
    pwm: {
      mot1: {type: Number},
      mot2: {type: Number},
      mot3: {type: Number},
      mot4: {type: Number},
    },
  },
},
{
  versionKey: false
});

const CombinedData = mongoose.model('CombinedData', combinedDataSchema);
const FlightData = mongoose.model('FlightData', flightDataSchema);
const NavdataDrone = mongoose.model('NavdataDrone', navdataDroneSchema);

/********** Global Variable **********/
var dataBuffer = [];
var RMSBuffer = [];
var RMSData = [];
var nDataBuffer = 100;
var accelBuffer = {
  x: [{x: -1, y: 10},{x: 0, y: 0}],
  y: [{x: -1, y: 10},{x: 0, y: 0}],
  z: [{x: -1, y: 10},{x: 0, y: 0}]
};
var nDataBufferAccel = 100;
var dataBufferAccel = {
  mpu1: {
    x: [],
    y: [],
    z: [],
  },
  mpu2: {
    x: [],
    y: [],
    z: [],
  },
}


var motorStatus = {};
var motorRUL = {};

var nAccel = 0;


/********** API **********/
app.listen(port, () => {
  console.log(`[Express] Server up and running on port ${port}`);
});

/*** Dashboard ***/
app.get('/desclist', (req, res, next) => {
  /* Query distinct description list, filtered with string equality */
  FlightData.distinct('description', (err, descriptions) => {
    /* Filter */
    let descs = descriptions.filter((desc) => {
      return desc !== '';
    });

    let descObjList = [];

    /* Convert to list of object */
    for (let desc of descs) {
      descObjList.push({
        title: desc
      });
    }

    /* Send response */
    res.json({
      descList: descObjList
    });
  });
});

app.get('/navdataraw', async (req, res) => {
  let desc = req.query.desc;
  console.log(`Getting desc: [${desc}]`);

  let payloadArr = {
    description: 'desc',
    data: {
      pwm: [0],
      x: [0],
      y: [0],
      z: [0]
    }
  }

  if (desc === '') {
    res.json(payloadArr);
    return;
  }

  let tsStart = 0;
  let tsStop = 0;

  // Find navdata documents by description
  FlightData.find({
    'description': desc
  }, {'_id': 0}).sort({
    'timestamp': 1
  }).exec((err, combdatas) => {
    tsStart = Number(combdatas[0].timestamp);
    tsStop = Number(combdatas[combdatas.length-1].timestamp);

    combdatas.forEach((doc) => {
      payloadArr.data.pwm.push({
        'x': Number(doc.timestamp),
        'y': Number(doc.pwm[0])
      });

      payloadArr.data.x.push({
        'x': Number(doc.timestamp),
        'y': Number(doc.mpu1[0])
      });

      payloadArr.data.y.push({
        'x': Number(doc.timestamp),
        'y': Number(doc.mpu1[1])
      });

      payloadArr.data.z.push({
        'x': Number(doc.timestamp),
        'y': Number(doc.mpu1[2])
      });
    });

    // Send response
    res.json(payloadArr);
  });
});

app.get('/motorstatus', (req,res) => {
  res.json(motorStatus);
});

/********** Socket **********/
io.sockets.on('connection', (socket) => {
  console.log(`[Socket] connection from ${socket.id}`);

  // Motor condition (from dataproc)
  socket.on('motorConditionRes', (payload) => {
    motorStatus = JSON.parse(payload);
  });
});


/********** MQTT **********/
/* Connect to broker and subscribe */
mqttClient.on('connect', () => {
  console.log(`[MQTT] Connection to ${mqttHost} successful!`);
  /* Batch subscribe */
  for (topic of subscribeTopic) {
    mqttClient.subscribe(topic, (err, granted) => {
      if (!err) {
        console.log(`[MQTT] Subscription to ${granted[0].topic} at qos ${granted[0].qos} successful!`);
      }
      else {
        console.log('Error occured: ', err);
      }
    });
  }
});


mqttClient.on('message', (topic, message) => {
  let d = new Date();
  let dateString = d.toLocaleString();

  if (topic == 'topic/pi/rawmpu') {
    let msgData = JSON.parse(message.toString());
    accelBuffer.x.forEach((val,idx,arr) => {
      val.x -= 1;
    });
    accelBuffer.y.forEach((val,idx,arr) => {
      val.x -= 1;
    });
    accelBuffer.z.forEach((val,idx,arr) => {
      val.x -= 1;
    });

    accelBuffer.x.push({x: 0, y: Number(msgData.mpu1.x)});
    accelBuffer.y.push({x: 0, y: Number(msgData.mpu1.y)});
    accelBuffer.z.push({x: 0, y: Number(msgData.mpu1.z)});

    if (accelBuffer.x.length > 200) {
      accelBuffer.x.shift();
      accelBuffer.y.shift();
      accelBuffer.z.shift();
    }
  }

  /* MPU6050 raw vibration (2 mpu) - Raspi ZeroW */
  else if (topic == 'topic/pi/mpu6050') {
    let msgData = JSON.parse(message.toString());

    /* Insert to DB */
    AccelData.create({
      timestamp: Math.floor(Number(msgData.timestamp)/1000000),
      mpu1: {
        x: Number(msgData.mpu1.x),
        y: Number(msgData.mpu1.y),
        z: Number(msgData.mpu1.z)
      },
      mpu2: {
        x: Number(msgData.mpu2.x),
        y: Number(msgData.mpu2.y),
        z: Number(msgData.mpu2.z)
      }
    });
  }

  /* Navigation data (ARDrone) */
  else if (topic == 'topic/navdataraw') {
    let navdata = JSON.parse(message.toString());
    let payload = {
      navdata: {
        batteryPercentage: 0,
        altitude: 0,
        orientation: {
          roll: 0,
          pitch: 0,
          yaw: 0,
        },
        pwm: {
          mot1: 0,
          mot2: 0,
          mot3: 0,
          mot4: 0,
        },
      }
    }

    if (navdata.demo) {
      payload.navdata.batteryPercentage = navdata.demo.batteryPercentage
      payload.navdata.orientation.roll = navdata.demo.leftRightDegrees
      payload.navdata.orientation.pitch = navdata.demo.frontBackDegrees
      payload.navdata.orientation.yaw = navdata.demo.clockwiseDegrees
      payload.navdata.altitude = navdata.demo.altitude
    }

    if (navdata.pwm) {
      payload.navdata.pwm.mot1 = navdata.pwm.motors[0]
      payload.navdata.pwm.mot2 = navdata.pwm.motors[1]
      payload.navdata.pwm.mot3 = navdata.pwm.motors[2]
      payload.navdata.pwm.mot4 = navdata.pwm.motors[3]
    }

    var navdataTimeMs = d.getTime();
    NavdataDrone.create({
      timestamp: navdataTimeMs.toString(),
      navdata: payload.navdata
    });
  }
});

/* RMS Data */
setInterval(() => {
  io.sockets.emit('rawlive', accelBuffer);
}, 50);


/****** Simulate Chart Data ******/
var pwmData = [];
var rmsData = [];
var healthIndicatorData = {
  history: [],
  predict: [],
  rul: [],
};
var healthIndicatorModelData = {
  history: [],
  predict: [],
  rul: []
};
var orientationData = {

}
/* PWM Data */
/* setInterval(() => {
  let d = new Date().getTime();

  pwmData.push({
    x: d,
    y: Math.floor(80 + Math.random()*175)
  });

  let i = pwmData.length-1
  let tNow = pwmData[i].x


/* PWM Data */
var simArrIdx = 0;
setInterval(() => {
  let d = new Date().getTime();

  pwmData.push(d);

  let i = pwmData.length-1
  let tNow = pwmData[i]

  let pwmPayload = [];

  if (chartPayload.pwm.length > 0) {
    while (tNow - pwmData[i] < 4100 && i > 0) {
      //console.log(`${chartPayload.pwm[simArrIdx].y} - ${chartPayload.pwm.length}`)
      pwmPayload.unshift({
        x: pwmData[i] - tNow,
        y: chartPayload.pwm[simArrIdx+i].y
      });
      i--;
    }
    pwmData = pwmData.slice(i, pwmData.length);
    simArrIdx = (simArrIdx + 1) % (chartPayload.pwm.length-pwmData.length);
  }

  io.sockets.emit('pwmlive', pwmPayload);
}, 10);

/* RMS Data */
setInterval(() => {
  let d = new Date().getTime();

  rmsData.push({
    x: d,
    y: Math.floor(9 + Math.random()*4)
  });

  let i = rmsData.length-1
  let tNow = rmsData[i].x

  let rmsPayload = [];
  while (tNow - rmsData[i].x < 2100 && i > 0) {
    rmsPayload.unshift({
      x: rmsData[i].x - tNow,
      y: rmsData[i].y
    });
    i--;
  }

  io.sockets.emit('rmslive', rmsPayload);
}, 13);
/* var simArrIdx = 0;
setInterval(() => {
  let d = new Date().getTime();

  rmsData.push({
    x: d,
    y: Math.floor(80 + Math.random()*175)
  });

  let i = pwmData.length-1
  let tNow = pwmData[i].x

  let pwmPayload = [];

  if (chartPayload.pwm.length > 0) {
    while (tNow - pwmData[i].x < 4100 && i > 0) {
      //console.log(`${chartPayload.pwm[simArrIdx].y} - ${chartPayload.pwm.length}`)
      pwmPayload.unshift({
        x: pwmData[i].x - tNow,
        y: chartPayload.pwm[simArrIdx+i].y
      });
      i--;
    }
    simArrIdx = (simArrIdx + 1) % chartPayload.pwm.length
  }

  io.sockets.emit('pwmlive', pwmPayload);
}, 5); */

/* Health Indicator Chart Data */
app.get('/healthchart', (req,res) => {
  healthIndicatorData.history = [
    {x: -300, y: 20 + (Math.random() * 5)},
    {x: -280, y: 24 + (Math.random() * 5)},
    {x: -260, y: 26 + (Math.random() * 5)},
    {x: -240, y: 28 + (Math.random() * 5)},
    {x: -220, y: 30 + (Math.random() * 5)},
    {x: -200, y: 32 + (Math.random() * 5)},
    {x: -180, y: 34 + (Math.random() * 5)},
    {x: -160, y: 36 + (Math.random() * 5)},
    {x: -140, y: 38 + (Math.random() * 5)},
    {x: -120, y: 40 + (Math.random() * 5)},
    {x: -100, y: 42 + (Math.random() * 5)},
    {x: -80, y: 44 + (Math.random() * 5)},
    {x: -60, y: 46},
  ];

  healthIndicatorData.window = [
    {x: -60, y: 46},
    {x: -50, y: 48 + (Math.random() * 5)},
    {x: -40, y: 50 + (Math.random() * 5)},
    {x: -30, y: 52 + (Math.random() * 5)},
    {x: -20, y: 54 + (Math.random() * 5)},
    {x: -10, y: 56 + (Math.random() * 5)},
    {x: 0, y: 60},
  ];

  healthIndicatorData.predict = [
    {x: 0, y: 60},
    {x: 10, y: 62 + (Math.random() * 10)},
    {x: 20, y: 64 + (Math.random() * 10)},
    {x: 30, y: 68 + (Math.random() * 10)},
    {x: 40, y: 70 + (Math.random() * 10)},
    {x: 50, y: 72 + (Math.random() * 10)},
    {x: 60, y: 76 + (Math.random() * 10)}
  ];

  let s = getFailureStep(healthIndicatorData.predict, 75);
  healthIndicatorData.rul = [
    {x: -100, y: 1000},
    {x: s, y: 1000},
    {x: s+0.0001, y: -1000}
  ];

  res.json(healthIndicatorData);
});

/* Health Indicator (Model) Chart Data */
app.get('/healthchartmodel', (req,res) => {
  healthIndicatorModelData.history = [
    {x: -300, y: 20 + (Math.random() * 5)},
    {x: -280, y: 24 + (Math.random() * 5)},
    {x: -260, y: 26 + (Math.random() * 5)},
    {x: -240, y: 28 + (Math.random() * 5)},
    {x: -220, y: 30 + (Math.random() * 5)},
    {x: -200, y: 32 + (Math.random() * 5)},
    {x: -180, y: 34 + (Math.random() * 5)},
    {x: -160, y: 36 + (Math.random() * 5)},
    {x: -140, y: 38 + (Math.random() * 5)},
    {x: -120, y: 40 + (Math.random() * 5)},
    {x: -100, y: 42 + (Math.random() * 5)},
    {x: -80, y: 44 + (Math.random() * 5)},
    {x: -60, y: 46},
  ];

  healthIndicatorModelData.window = [
    {x: -60, y: 46},
    {x: -50, y: 48 + (Math.random() * 5)},
    {x: -40, y: 50 + (Math.random() * 5)},
    {x: -30, y: 52 + (Math.random() * 5)},
    {x: -20, y: 54 + (Math.random() * 5)},
    {x: -10, y: 56 + (Math.random() * 5)},
    {x: 0, y: 60},
  ];

  healthIndicatorModelData.predict = [
    {x: 0, y: 60},
    {x: 10, y: 62 + (Math.random() * 10)},
    {x: 20, y: 64 + (Math.random() * 10)},
    {x: 30, y: 68 + (Math.random() * 10)},
    {x: 40, y: 70 + (Math.random() * 10)},
    {x: 50, y: 72 + (Math.random() * 10)},
    {x: 60, y: 76 + (Math.random() * 10)}
  ];

  let s = getFailureStep(healthIndicatorModelData.predict, 75);
  healthIndicatorModelData.rul = [
    {x: -100, y: 1000},
    {x: s, y: 1000},
    {x: s+0.0001, y: -1000}
  ];

  res.json(healthIndicatorModelData);
});

/* Data simulator using database flight data */
// Selected description
/* const descList = [
  'aug9_0_hover10s.json',
  'aug9_0_hover20s.json',
  'aug9_0_hover20s_2.json',
  'aug9_0_hover20s_3.json',
  'aug9_0_hover30s_1.json',
  'aug9_0_hover30s_10.json',
  'aug9_0_hover30s_11.json',
  'aug9_0_hover30s_12.json',
  'aug9_0_hover30s_2.json',
  'aug9_0_hover30s_3.json',
  'aug9_0_hover30s_4.json',
  'aug9_0_hover30s_5.json',
  'aug9_0_hover30s_6.json',
  'aug9_0_hover30s_7.json',
  'aug9_0_hover30s_8.json',
  'aug9_0_hover30s_9.json',
  'aug9_2_hover20s.json',
  'aug9_2_hover20s_2.json',
  'aug9_2_hover20s_3.json',
  'aug9_2_hover20s_4.json',
  'aug9_2_hover20s_5.json',
  'aug9_2_hover30s_1.json',
  'aug9_3_hover10s.json',
]; */

const descList = [
  'aug9_0_hover10s.json',
  'aug9_0_hover20s.json',
  'aug9_0_hover20s_2.json'
];

var simulatedFlightData = [];
var chartPayload = {
  pwm: [],
  rms: []
};

const insertIntoSimulatedFlightData = (docs) => {
  //console.log(docs[0]);
  simulatedFlightData = simulatedFlightData.concat(docs);
  for (doc of docs) {
    if (doc.pwm[0] !== 0) {
      chartPayload.pwm.push({
        x: doc.timestamp,
        y: doc.pwm[0]
      });
    }
  }
};

const getSimulatedFlightData = () => {
  for (let desc of descList) {
    console.log(`get simulated data ${desc}`);
    FlightData.find({
      'description': desc
    }, {'_id': 0}).sort({
      'timestamp': 1
    }).exec().then((docs) => {
      insertIntoSimulatedFlightData(docs);
    });
  }
}

getSimulatedFlightData();

/******* Python Socket Data ******/
setInterval(() => {
  io.sockets.emit('motorConditionReq', {x: 'hellox', y: 'helloy'});
}, 1000);

/* Helper Function */
const getFailureStep = (pred, treshold) => {
  let t = 0;
  while (pred[t].y < treshold) {
    t ++;
  }
  let prev = pred[t-1];
  let next = pred[t];

  let a = (treshold - pred[t-1].y) / (pred[t].y - pred[t-1].y)
  let x = a * (pred[t].x - pred[t-1].x) + pred[t-1].x

  return x
}
