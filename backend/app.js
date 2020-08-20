/********** Initialization **********/
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
  console.log(`[Aedes] Broker started and listening to port ${port}`);
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
  'topic/pi/mpu6050'
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

const testMQTTSchema = new mongoose.Schema({
  timestamp: {type: String},
  topic: {type: String},
  message: {type: String}
},
{
  versionKey: false
});

const testMQTTTimeSchema = new mongoose.Schema({
  timestamp: {type: String},
  topic: {type: String},
  message: {type: String}
},
{
  versionKey: false,
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

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

const navdataSchema = new mongoose.Schema({
  description: {type: String},
  timestart: {type: SchemaTypes.Long},
  timestamp: {type: SchemaTypes.Long},
  state: {
    controlState: {type: String},
    batteryPercentage: {type: Number},
    batteryMillivolt: {type: Number}
  },
  navdata: {
    altitude: {type: Number},
    orientation: {
      roll: {type: Number},
      pitch: {type: Number},
      yaw: {type: Number}
    },
    pwm: {
      mot1: {type: Number},
      mot2: {type: Number},
      mot3: {type: Number},
      mot4: {type: Number}
    },
    input: {
      uroll: {type: Number},
      upitch: {type: Number},
      uyaw: {type: Number}
    },
    rawMeasures: {
      accelerometers: {
        x: {type: Number},
        y: {type: Number},
        z: {type: Number}
      }
    }
  }
})

const CombinedData = mongoose.model('CombinedData', combinedDataSchema);
const FlightData = mongoose.model('FlightData', flightDataSchema);
const NavdataDrone = mongoose.model('NavdataDrone', navdataDroneSchema);

/********** Global Variable **********/
var dataBuffer = [];
var RMSBuffer = [];
var RMSData = [];
var nDataBuffer = 100;
var accelBuffer = [];
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
})

/********** Socket **********/
io.sockets.on('connection', (socket) => {
  console.log(`[Socket] connection from ${socket.id}`);

  // Motor condition (from dataproc)
  socket.on('motorConditionRes', (payload) => {
    motorStatus = JSON.parse(payload);
  });
});

/* Live Raw Chart */
/* setInterval(() => {
  io.sockets.emit('chartdata', dataBuffer);
}, 10); */

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

  /* MPU6050 raw vibration (2 mpu) - Raspi ZeroW */
  if (topic == 'topic/pi/mpu6050') {
    var msgData = JSON.parse(message.toString());
    
    /* Insest to dataBuffer */
    /* dataBufferAccel.mpu1.x.push(msgData.mpu1.x);
    dataBufferAccel.mpu1.y.push(msgData.mpu1.y);
    dataBufferAccel.mpu1.z.push(msgData.mpu1.z);
    dataBufferAccel.mpu2.x.push(msgData.mpu2.x);
    dataBufferAccel.mpu2.y.push(msgData.mpu2.y);
    dataBufferAccel.mpu2.z.push(msgData.mpu2.z);

    if (dataBufferAccel.mpu1.x.length > nDataBufferAccel) {
      dataBufferAccel.mpu1.x.shift();
      dataBufferAccel.mpu1.y.shift();
      dataBufferAccel.mpu1.z.shift();
      dataBufferAccel.mpu2.x.shift();
      dataBufferAccel.mpu2.y.shift();
      dataBufferAccel.mpu2.z.shift();
    } */

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


/****** Simulate Chart Data ******/
var pwmData = [];
var rmsData = [];
var healthData = [];
var healthModelData = [];

/* PWM Data */
setInterval(() => {
  let d = new Date().getTime();
  
  pwmData.push({
    x: d,
    y: Math.floor(80 + Math.random()*175)
  });
  
  let i = pwmData.length-1
  let tNow = pwmData[i].x

  let pwmPayload = [];
  while (tNow - pwmData[i].x < 2100 && i > 0) {
    pwmPayload.unshift({
      x: pwmData[i].x - tNow,
      y: pwmData[i].y
    });
    i--;
  }

  io.sockets.emit('pwmlive', pwmPayload);
}, 13);

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


/******* Python Socket Test ******/
setInterval(() => {
  io.sockets.emit('motorConditionReq', 'hello');
}, 1000);


/****** */