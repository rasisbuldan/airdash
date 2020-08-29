import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { Box, Grid, Container, Paper, Typography, Divider, Button, Card, CardContent } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import 'fontsource-roboto';
// eslint-disable-next-line
import ardrone from './ardrone-trace.png';
// eslint-disable-next-line
import { red, green, orange, blue, grey, teal, cyan, brown } from '@material-ui/core/colors';
import axios from 'axios';
import PWMChart from './PWMChart';
import RMSChart from './RMSChart';
import HealthChart from './HealthChart';
import HealthChartModel from './HealthChartModel';
import openSocket from 'socket.io-client';

/* Icons */
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import FlightTakeoffIcon from '@material-ui/icons/FlightTakeoff';
import FlightLandIcon from '@material-ui/icons/FlightLand';
import WarningIcon from '@material-ui/icons/Warning';
import CachedIcon from '@material-ui/icons/Cached';
import RefreshIcon from '@material-ui/icons/Refresh';

/* Socket */
const socketHost = 'localhost';
const socketPort = 3002;
const socket = openSocket(`http://${socketHost}:${socketPort}`);

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    alignItems: 'center',
    marginTop: '1vw',
    marginLeft: '3vw',
    marginRight: '3vw',
  },
  paperBig: {
    margin: theme.spacing(1),
    padding: theme.spacing(1),
    height: 350,
    textAlign: 'center',
    borderRadius: 10,
  },
  smallPaper: {
    backgroundColor: 'white',
    height: '20vh',
  },
  box: {
    margin: '1vw',
    padding: '2vw',
    backgroundColor: grey[50],
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  paperMotorStatusIcon: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: '5vw',
    height: '5vh',
    padding: theme.spacing(4),
    margin: '1vw',
    textAlign: 'center',
  },
  bigPaper: {
    margin: 0,
    padding: theme.spacing(3),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    borderRadius: 10
  },
  liveChartpaper: {
    margin: 0,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    borderRadius: 10
  },
  ardrone: {
    width: '20vw',
    display: 'block',
    margin: 'auto'
  },
  droneStatusConnected: {
    height: '5vh',
    backgroundColor: green[700],
    margin: theme.spacing(1.5),
    marginTop: 0,
    padding: theme.spacing(1),
    textAlign: 'left',
    fontSize: 16,
    color: 'white',
    verticalAlign: 'middle'
  },
  droneStatusDisconnected: {
    height: '5vh',
    backgroundColor: red[700],
    margin: theme.spacing(1.5),
    marginTop: 0,
    padding: theme.spacing(1),
    textAlign: 'left',
    fontSize: '0.9vw',
    color: 'white',
    verticalAlign: 'middle'
  },
  flightButton: {
    height: '5vh',
    backgroundColor: blue[500],
    margin: theme.spacing(1.5),
    marginTop: 0,
    padding: theme.spacing(1),
    textAlign: 'left',
    fontSize: '0.9vw',
    color: 'white',
    verticalAlign: 'middle',
  },
  healthChartPaper: {
    margin: 0,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    borderRadius: 10
  },
  healthChartTitle: {
    marginLeft: '0.2vw',
    marginBottom: '0.5vw',
    color: 'black'
  },
  axisButton: {
    padding: theme.spacing(1),
    margin: 0,
    marginLeft: theme.spacing(2),
    height: '1.2vw',
    border: 0,
    borderRadius: 0
  }
}));


function MotorStatusCard({ number, motstatus }) {
  const [statusColor, setStatusColor] = useState(grey[500]);
  const [motorStatus, setMotorStatus] = useState('Normal');

  useEffect(() => {
    if (motstatus) {
      setMotorStatus(motstatus);
      if (motstatus.status === "Normal") {
        setStatusColor(green[500]);
      }
      else {
        setStatusColor(orange[500]);
      }
    }
    console.log(motstatus);
  }, [motstatus]);

  return(
    <Grid item xs={6}>
      <Card style={{backgroundColor: statusColor, borderRadius: 15}} elevation={3}>
        <CardContent>
          <Typography variant='h6' align='left' style={{color: 'white'}}>
            <Box fontWeight={300} fontSize={32}>
              Motor {number}
            </Box>
          </Typography>
          <Typography variant='h6' align='left' style={{color: grey[200]}}>
            <Box fontWeight={300} fontSize={18}>
              Status: <b>{motorStatus.status}</b> ({motorStatus.statusVal}%)
            </Box>
          </Typography>
          <Typography variant='h6' align='left' style={{color: grey[200]}}>
            <Box fontWeight={300} fontSize={18}>
              RUL: <b>{motorStatus.rul}</b> 
            </Box>
          </Typography>
          <Typography variant='h6' align='left' style={{color: grey[200]}}>
            <Box fontWeight={300} fontSize={18}>
              RUL: <b>{motorStatus.rul}</b>
            </Box>
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

var motStatusInterval = '';

function Dashboard() {
  const classes = useStyles();
  const [status, setStatus] = useState("Disconnected!");
  const [motorStatus, setMotorStatus] = useState({});
  const [rmsAxis, setRmsAxis] = useState('x');
  const [updateChart, setUpdateChart] = useState(0);
  const [updateChartModel, setUpdateChartModel] = useState(0);

  useEffect(() => {
    if (status === "Connected!") {
      motStatusInterval = setInterval(() => {
        // Get motor status from API
        axios.get('http://localhost:3001/motorstatus')
        .then((res) => {
          setMotorStatus(res.data);
        });
      }, 1000);
    }

    if (status === "Disconnected!") {
      clearInterval(motStatusInterval);
    }
  }, [status]);

  return (
    <div className={classes.root}>
      <Typography variant='h2' gutterBottom align={'left'} style={{paddingLeft: 15}}>
        <Box fontWeight={200} fontSize={48}>
          Dashboard
        </Box>
      </Typography>
      <Box mt={0} p={2} boxShadow={3} className={classes.box} borderRadius={10}>
        <Grid container spacing={3} direction='row'>
          <Grid item xs={2}>
            <Grid container spacing={3} direction='column'>
              <Grid item xs={2}>
                <Typography variant='h6' align='left' style={{marginBottom: 0, color: 'black'}}>
                  <Box fontWeight={300} fontSize={22}>
                    Connection
                  </Box>
                </Typography>
              </Grid>
              <Button
                className={status === "Connected!" ? classes.droneStatusConnected : classes.droneStatusDisconnected}
                startIcon={<CheckCircleIcon/>}
                onClick={() => {
                  setTimeout(() => {
                    status === "Connected!" ? setStatus("Disconnected!") : setStatus("Connected!")
                  }, 200) }}
              >
                {status}
              </Button>
              <Grid item xs={2}>
                <Typography variant='h6' align='left' style={{marginBottom: 0, color: 'black'}}>
                  <Box fontWeight={300} fontSize={22}>
                    Flight
                  </Box>
                </Typography>
              </Grid>
              <Button
                className={classes.flightButton}
                startIcon={<CachedIcon/>}
                onClick={() => { socket.emit('flightAction', 'ftrim'); }}
                style={{backgroundColor: brown[500]}}
              >
                Flat trim
              </Button>
              <Button
                className={classes.flightButton}
                startIcon={<FlightTakeoffIcon/>}
                onClick={() => { socket.emit('flightAction', 'takeoff'); }}
                style={{backgroundColor: blue[500]}}
              >
                Takeoff
              </Button>
              <Button
                className={classes.flightButton}
                startIcon={<FlightLandIcon/>}
                onClick={() => { socket.emit('flightAction', 'land'); }}
                style={{backgroundColor: teal[500]}}
              >
                Land
              </Button>
              <Button
                className={classes.flightButton}
                startIcon={<WarningIcon/>}
                onClick={() => { socket.emit('flightAction', 'emergency'); }}
                style={{backgroundColor: red[500]}}
              >
                Emergency
              </Button>
            </Grid>
          </Grid>
          <Grid item xs={5}>
            <Paper elevation={3} className={classes.bigPaper}>
              <Typography variant='h2' gutterBottom align={'left'}>
                <Box fontWeight={300} fontSize={30} style={{color: 'black'}}>
                  Motor Status
                </Box>
              </Typography>
              <Divider/>
              <Grid container spacing={3} direction='row' style={{marginTop: 10}}>
                <MotorStatusCard number={1} motstatus={motorStatus.mot1}/>
                <MotorStatusCard number={2} motstatus={motorStatus.mot2}/>
                <MotorStatusCard number={3} motstatus={motorStatus.mot3}/>
                <MotorStatusCard number={4} motstatus={motorStatus.mot4}/>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={5}>
            <Grid container spacing={2} direction='column'>
              <Grid item xs={12}>
                <Paper elevation={3} className={classes.liveChartpaper}>
                  <Typography variant='h6' align='left' style={{marginLeft: '0.2vw', color: 'black'}}>
                    <Box fontWeight={400} fontSize={22}>
                      PWM Data
                    </Box>
                  </Typography>
                  <PWMChart />
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper elevation={3} className={classes.liveChartpaper}>
                  <Typography variant='h6' align='left' style={{marginLeft: '0.2vw', color: 'black'}}>
                    <Box fontWeight={400} fontSize={22}>
                      Feature Data
                      <ToggleButtonGroup
                        size='small'
                        value={rmsAxis}
                        exclusive
                        onChange={(event, val) => {setRmsAxis(val);}}
                      >
                        <ToggleButton value='x' className={classes.axisButton}>
                          X
                        </ToggleButton>
                        <ToggleButton value='y' className={classes.axisButton}>
                          Y
                        </ToggleButton>
                        <ToggleButton value='z' className={classes.axisButton}>
                          Z
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Typography>
                  <RMSChart />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Box mt={0} p={2} boxShadow={3} className={classes.box} borderRadius={10}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Paper elevation={3} className={classes.healthChartPaper}>
              <Typography variant='h6' align='left' className={classes.healthChartTitle}>
                <Box fontWeight={400} fontSize={22}>
                  Health Indicator Prediction
                  <Button style={{padding: '0.5vw', marginLeft: '0.5vw'}}>
                    <RefreshIcon onClick={() => { setUpdateChart((updateChart+1)%2) }}/>
                  </Button>
                </Box>
              </Typography>
              <HealthChart update={updateChart}/>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper elevation={3} className={classes.healthChartPaper}>
                <Typography variant='h6' align='left' className={classes.healthChartTitle}>
                  <Box fontWeight={400} fontSize={22}>
                    Health Indicator (Model) Prediction
                    <Button style={{padding: '0.5vw', marginLeft: '0.5vw'}}>
                    <RefreshIcon onClick={() => { setUpdateChartModel((updateChartModel+1)%2) }}/>
                  </Button>
                  </Box>
                </Typography>
              <HealthChartModel update={updateChartModel}/>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default Dashboard;

//<img src={ardrone} alt="Parrot AR Drone 2.0" className={classes.ardrone}/>
