import React from 'react';
import { Box, Grid, Container, Paper, Typography, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import 'fontsource-roboto';
import LineChartRaw from './LineChartRaw';
import LineChartAccel from './LineChartAccel';
import LineChartRMS from './LineChartRMS';
import ButtonControl from './ButtonControl';
import NavigationData from './NavigationData';


const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
    alignItems: 'center',
  },
  paperBig: {
    padding: 10,
    height: 350,
    textAlign: 'center',
    borderRadius: 10,
  },
}));

function Dashboard() {
  const classes = useStyles();
  
  return(
    <Container className={classes.root}>
      <Box mt={0} p={2}>
        <Typography variant='h2' gutterBottom align={'left'}>
          <Box fontWeight={200} fontSize={48}>
            Dashboard Chart
          </Box>
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Paper className={classes.paperBig} elevation={3} >
              <Typography variant='h5' gutterBottom>
                <Box fontWeight={300} fontSize={26}>
                  Raw Data
                </Box>
              </Typography>
              <Divider light style={{margin:10}}/>
              <LineChartRaw />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paperBig} elevation={3} >
              <Typography variant='h5' gutterBottom>
                <Box fontWeight={300} fontSize={26}>
                  RMS Data
                </Box>
              </Typography>
              <Divider light style={{margin:10}}/>
              <LineChartRMS />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paperBig} elevation={3} >
              <Typography variant='h5' gutterBottom>
                <Box fontWeight={300} fontSize={26}>
                  Button Control
                </Box>
              </Typography>
              <Divider light style={{margin:10}}/>
              <ButtonControl />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paperBig} elevation={3} >
              <Typography variant='h5' gutterBottom>
                <Box fontWeight={300} fontSize={26}>
                  Navigation Data
                </Box>
              </Typography>
              <Divider light style={{margin:10}}/>
              <NavigationData />
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paperBig} elevation={3} >
              <Typography variant='h5' gutterBottom>
                <Box fontWeight={300} fontSize={26}>
                  Acceleration data 1
                </Box>
              </Typography>
              <Divider light style={{margin:10}}/>
              <LineChartAccel topic='acceldata1'/>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper className={classes.paperBig} elevation={3} >
              <Typography variant='h5' gutterBottom>
                <Box fontWeight={300} fontSize={26}>
                  Acceleration data 2
                </Box>
              </Typography>
              <Divider light style={{margin:10}}/>
              <LineChartAccel topic='acceldata2'/>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Dashboard;