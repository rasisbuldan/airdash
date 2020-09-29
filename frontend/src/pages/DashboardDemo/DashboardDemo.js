import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { Box, Grid, Container, Paper, Typography, Divider, Button, Card, CardContent } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import 'fontsource-roboto';
// eslint-disable-next-line
// eslint-disable-next-line
import { red, green, orange, blue, grey, teal, cyan, brown } from '@material-ui/core/colors';
import axios from 'axios';
import openSocket from 'socket.io-client';
import NavChartDemo from './NavChartDemo';
import VibChartDemo from './VibChartDemo';

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
  }
}));

var motStatusInterval = '';

function DashboardDemo() {
  const classes = useStyles();
  const [status, setStatus] = useState("Disconnected!");
  const [motorStatus, setMotorStatus] = useState({});
  const [rmsAxis, setRmsAxis] = useState('x');
  const [navDesc, setNavDesc] = useState('pwm');

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
            <Grid container spacing={2} direction='column'>
              <Grid item xs={12}>
                <Paper elevation={3} className={classes.liveChartpaper}>
                  <Typography variant='h6' align='left' style={{marginLeft: '0.2vw', color: 'black'}}>
                    <Box fontWeight={400} fontSize={22}>
                      Navigation Data
                      <ToggleButtonGroup 
                        size='small'
                        value={navDesc}
                        exclusive
                        onChange={(event, val) => {setNavDesc(val);}}
                      >
                        <ToggleButton value='pwm' className={classes.axisButton}>
                          PWM
                        </ToggleButton>
                        <ToggleButton value='roll' className={classes.axisButton}>
                          Roll
                        </ToggleButton>
                        <ToggleButton value='pitch' className={classes.axisButton}>
                          Pitch
                        </ToggleButton>
                        <ToggleButton value='yaw' className={classes.axisButton}>
                          Yaw
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Typography>
                  <NavChartDemo />
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
                  <VibChartDemo />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default DashboardDemo;