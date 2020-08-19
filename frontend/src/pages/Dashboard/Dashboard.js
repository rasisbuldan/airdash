// eslint-disable-next-line
import React, { useState, useEffect } from 'react';
// eslint-disable-next-line
import { Box, Grid, Container, Paper, Typography, Divider, Button, Card, CardContent } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import 'fontsource-roboto';
// eslint-disable-next-line
import ardrone from './ardrone-trace.png';
import { red, green, grey } from '@material-ui/core/colors';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import axios from 'axios';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    alignItems: 'center',
    marginLeft: '5vw',
    marginRight: '5vw',
  },
  paperBig: {
    padding: 10,
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
    backgroundColor: grey[100],
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
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: '50vh',
    borderRadius: 10
  },
  ardrone: {
    width: '20vw',
    display: 'block',
    margin: 'auto'
  },
  droneStatusConnected: {
    height: '5vh',
    backgroundColor: green[500],
    margin: theme.spacing(1.5),
    padding: theme.spacing(1),
    textAlign: 'left',
    fontSize: 16,
    color: 'white',
    verticalAlign: 'middle'
  },
  droneStatusDisconnected: {
    height: '5vh',
    backgroundColor: red[500],
    margin: theme.spacing(1.5),
    padding: theme.spacing(1),
    textAlign: 'left',
    fontSize: '0.9vw',
    color: 'white',
    verticalAlign: 'middle'
  }
}));

function MotorStatus() {
  const classes = useStyles();
  const [RUL, setRUL] = useState(0);

  return(
    <Grid container spacing={4} style={{paddingLeft: '2vw'}}>
      <Grid item xs={2}>
        <Paper elevation={3} style={{width: '5vh', height: '5vh', verticalAlign: 'middle', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: '2.5vh'}}>
          <CheckCircleIcon style={{width: '4vh', height: '4vh'}}/>
        </Paper>
      </Grid>
      <Grid item xs={10}>
        <Typography variant='h2' gutterBottom align={'left'} style={{paddingLeft: 15}}>
          <Box fontWeight={200} fontSize={36}>
            Motor 1
          </Box>
        </Typography>
      </Grid>
    </Grid>
  )
}

function MotorStatusCard({ number, motstatus }) {
  const classes = useStyles();
  const [statusColor, setStatusColor] = useState(grey[300]);
  const [RUL, setRUL] = useState('unknown');
  const [motorStatus, setMotorStatus] = useState('Normal');

  useEffect(() => {
    setMotorStatus(motstatus);
    if (motstatus === "Normal") {
      setStatusColor(green[500]);
    }
    else {
      setStatusColor(red[500]);
    }
  }, [motstatus]);

  return(
    <Grid item xs={6}>
      <Card style={{backgroundColor: statusColor, borderRadius: 15}} elevation={3}>
        <CardContent>
          <Typography variant='h6' align='left' style={{color: 'white'}}>
            <Box fontWeight={500} fontSize={32}>
              Motor {number}
            </Box>
          </Typography>
          <Typography variant='h6' align='left' style={{color: grey[200]}}>
            <Box fontWeight={300} fontSize={18}>
              Status: {motorStatus}
            </Box>
          </Typography>
          <Typography variant='h6' align='left' style={{color: grey[200]}}>
            <Box fontWeight={300} fontSize={18}>
              RUL: {RUL}
            </Box>
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
}

function Dashboard() {
  const classes = useStyles();
  const [status, setStatus] = useState("Disconnected!");
  const [motorStatus, setMotorStatus] = useState({});
  var motStatusInterval = '';

  useEffect(() => {
    console.log(status);
    if (status === "Connected!") {
      motStatusInterval = setInterval(() => {
        // Get motor status from API
        axios.get('http://localhost:3001/motorstatus')
        .then((res) => {
          console.log(res);
          setMotorStatus(res.data);
        });
      }, 2000);
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
              <Typography variant='h6' align='left' style={{color: 'black'}} style={{marginBottom: 0}}>
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
                  }, 1000) }}
                style={{marginTop: 0}}
              >
                {status}
              </Button>
            </Grid>
          </Grid>
          <Grid item xs={5}>
            <Paper className={classes.bigPaper}>
              <Typography variant='h2' gutterBottom align={'center'}>
                <Box fontWeight={300} fontSize={36} style={{color: 'black'}}>
                  Motor Status
                </Box>
              </Typography>
              <Divider/>
              <Grid container spacing={4} direction='row' style={{marginTop: '2vh'}}>
                <MotorStatusCard number={1} motstatus={motorStatus.mot1}/>
                <MotorStatusCard number={2} motstatus={motorStatus.mot2}/>
                <MotorStatusCard number={3} motstatus={motorStatus.mot3}/>
                <MotorStatusCard number={4} motstatus={motorStatus.mot4}/>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={5}>
            <Paper className={classes.bigPaper}>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

export default Dashboard;

//<img src={ardrone} alt="Parrot AR Drone 2.0" className={classes.ardrone}/>