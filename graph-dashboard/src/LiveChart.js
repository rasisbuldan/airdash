import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Grid, Paper, Container, Typography } from '@material-ui/core';
import { Line } from 'react-chartjs-2'
import ExampleLineChart from './ExampleLineChart'
import 'fontsource-roboto';

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    height: 400,
    width: 600,
  }
}));

const lineData = {
  labels: [],
  datasets: [
    {
      lineTension: 0.2,
      data: [],
    }
  ]
};

setInterval(() => {
  var labelArray = []
  var dataArray = []

  for(var i=0; i<20; i++){
    labelArray.push(i);
    dataArray.push(Math.floor(Math.random()));
  }

  lineData.labels = labelArray;
  lineData.datasets.data = dataArray;

  console.log('Updating chart data')

}, 500);

class LineChart1 extends React.Component {
  constructor(props) {
    super(props);
    this.chartReference = React.createRef();
  }

  componentDidMount() {
    // Return chart.js instance (?)
    console.log(this.chartReference);
  }

  render() {
    return (
      <Line ref={this.chartReference} data={this.props.lineData} />
    )
  }
}

function LiveChart() {
  const classes = useStyles();

  return(
    <Container>
      <Box m={5}>
        <Grid container className={classes.root}>
          <Container>
            <Typography align='center' variant='h4' gutterBottom>
              Live Chart Demo
            </Typography>
          </Container>
          <Grid item sm={12}>
            <Grid container justify="center">
              {
                [...Array(1).keys()].map((value) => (
                  <Grid key={value} item>
                    <Paper className={classes.paper} elevation={3}>
                      <ExampleLineChart />
                    </Paper>
                  </Grid>
                ))
              }
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default LiveChart;