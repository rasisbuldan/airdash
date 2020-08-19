import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import 'fontsource-roboto';
import { Container, Button, Divider, TextField } from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { red, blue } from '@material-ui/core/colors';
import skewness from 'compute-skewness';
import kurtosis from 'compute-kurtosis';

var minTs = 0;
var maxTs = 0;

const useStyles = makeStyles((theme) => ({
  featureButton: {
    '& > *': {
      margin: theme.spacing(1),
    },
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  }
}));

/* Global variable */
const lineDataTemplate = {
  datasets: [
    {
      label: 'PWM1',
      fill: true,
      lineTension: 1,
      borderColor: 'rgba(52,152,219,1)',
      backgroundColor: 'rgba(52,152,219,0.3)',
      yAxisID: 'pwm',
      pointRadius: 0,
      data: [{x: 0, y: 0}],
      borderWidth: 2,
      //labels: [...Array(nLineData).keys()],
    },
    {
      label: 'Vib-Y',
      fill: false,
      lineTension: 0,
      borderColor: 'rgba(245,124,0,0.8)',
      pointRadius: 0,
      yAxisID: 'vib',
      data: [{x: 0, y: 0}],
      borderWidth: 1,
      //labels: [...Array(nLineData).keys()],
    },
  ],
};

var lineOptions = {
  animation: {
    duration: 1,
  },
  scales: {
    xAxes: [
      {
        type: 'linear',
        ticks: {
          min: minTs,
          max: maxTs,
          stepSize: 20
        }
      },
    ],
    yAxes: [
      {
        id: 'pwm',
        ticks: {
          min: 0,
          max: 300,
          stepSize: 20
        }
      },
      {
        id: 'vib',
        position: 'right',
        ticks: {
          min: 0,
          max: 16,
          stepSize: 2
        }
      },
    ],
  }
};

const AxisButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
  },
}))(Button);

const FeatureButton = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    '&:hover': {
      backgroundColor: blue[700],
    },
  },
}))(Button);



function NavdataChartRaw(props) {
  const classes = useStyles();
  const [rawData, setRawData] = useState();
  const [lineData, setLineData] = useState(lineDataTemplate);
  const [lineOpt, setLineOpt] = useState(lineOptions);
  const [windowSize, setWindowSize] = useState(200);
  const [vibAxis, setVibAxis] = useState('x');

  useEffect(() => {
    console.log(`get desc: ${props.desc}`)
    if (props.desc !== undefined) {
      axios.get('http://localhost:3001/navdataraw2', {
        params: {
          desc: props.desc
        }
      }).then((res) => {
        //console.log(res);
        setRawData(res.data);
      });
    }
  }, [props.desc]);

  useEffect(() => {
    if (rawData) {
      let ld = {
        ...lineDataTemplate
      };
      //ld.labels = rawData.timestamp;
      ld.datasets[0].data = rawData.data.pwm.slice();
      ld.datasets[1].data = rawData.data.x.slice();

      maxTs = Math.max(rawData.data.pwm[rawData.data.pwm.length - 1].x, rawData.data.x[rawData.data.x.length - 1].x);
      console.log(`maxts: ${maxTs}`);
      
      let lo = {
        ...lineOptions
      };

      lo.scales.xAxes[0].ticks.max = maxTs;
      //console.log(lineOptions.scales.xAxes[0].ticks);
      
      //console.log(ld);
      setLineData(ld);
      setLineOpt(lo);
    }
  }, [rawData]);

  const changeChartdata = (idx, data_arr) => {
    let ld = {
      ...lineDataTemplate
    };
    ld.datasets[idx].data = data_arr;

    setLineData(ld);
    console.log(lineData);
  }

  const changeFeatureTickRange = (idx, min, max, step) => {
    let lo = {
      ...lineOptions
    }
    lo.scales.yAxes[idx].ticks.min=min;
    lo.scales.yAxes[idx].ticks.max=max;
    lo.scales.yAxes[idx].ticks.stepSize=step;
  }

  const rms = (arr) => {
    //console.log('Calculating RMS');
    let squares = arr.map((val) => (Math.pow(val,2)));
    let sums = squares.reduce((acum,val) => (acum + val));
    let means = sums/arr.length;

    changeFeatureTickRange(1,0,16,2);

    return Math.sqrt(means);
  }

  const kurt = (arr) => {
    //console.log('Calculating Kurt');
    changeFeatureTickRange(1,-10,10,2);

    return kurtosis(arr);
  }

  const skew = (arr) => {
    //console.log('Calculating Skew');
    changeFeatureTickRange(1,-10,10,2);

    return skewness(arr);
  }

  const crest = (arr) => {
    //console.log('Calculating Crest Factor');
    let maxArr = Math.max(...arr);
    let squares = arr.map((val) => (Math.pow(val,2)));
    let sums = squares.reduce((acum,val) => (acum + val));
    let means = sums/arr.length;

    changeFeatureTickRange(1,-10,10,2);

    return (maxArr/Math.sqrt(means));
  }

  const peak = (arr) => {
    //console.log('Calculating Peak-to-Peak');
    let minArr = Math.min(...arr);
    let maxArr = Math.max(...arr);

    changeFeatureTickRange(1,0,40,4);

    return (maxArr - minArr);
  }

  const calcFeature = (arr, feature) => {
    /* console.log('arr calcfeature');
    
    let dataArr = arr.slice();
    console.log(dataArr);

    let tsArr = [];
    let rawArr = []; */

    let tsArr = [];
    let rawArr = [];
    
    // Get array of each axis
    for (let val of arr) {
      tsArr.push(val.x);
      rawArr.push(val.y);
    }

    let tsPrev = 0;
    let bufArr = [];
    let aggArr = [];
    for (let i=0; i<tsArr.length; i++) {
      bufArr.push(rawArr[i]);
      
      // If exceed window size
      if ((tsArr[i] - tsPrev) > windowSize) {
        aggArr.push({
          x: tsArr[i],
          y: feature(bufArr)
        });
        bufArr = [];
        tsPrev = tsArr[i];
      }

    }
    
    // Change line chart data
    changeChartdata(1, aggArr);
  }

  const changeAxis = (axis) => {
    setVibAxis(axis);
    changeChartdata(1,rawData.data[vibAxis].slice());
    console.log(`Changing axis ${axis}`);
  }

  return(
    <Container style={{marginTop: 10, marginBottom: 10}}>
      <Container className={classes.featureButton}>
        <FeatureButton variant="contained" size="small" color="primary" className={classes.margin} onClick={() => {changeChartdata(1,rawData.data[vibAxis].slice())}}>
          Raw
        </FeatureButton>
        <FeatureButton variant="contained" size="small" color="primary" className={classes.margin} onClick={() => {calcFeature(rawData.data[vibAxis].slice(), rms)}}>
          RMS
        </FeatureButton>
        <FeatureButton variant="contained" size="small" color="primary" className={classes.margin} onClick={() => {calcFeature(rawData.data[vibAxis].slice(), kurt)}}>
          Kurtosis
        </FeatureButton>
        <FeatureButton variant="contained" size="small" color="primary" className={classes.margin} onClick={() => {calcFeature(rawData.data[vibAxis].slice(), skew)}}>
          Skewness
        </FeatureButton>
        <FeatureButton variant="contained" size="small" color="primary" className={classes.margin} onClick={() => {calcFeature(rawData.data[vibAxis].slice(), crest)}}>
          Crest Factor
        </FeatureButton>
        <FeatureButton variant="contained" size="small" color="primary" className={classes.margin} onClick={() => {calcFeature(rawData.data[vibAxis].slice(), peak)}}>
          Peak-to-peak
        </FeatureButton>
        <Divider orientation="vertical" flexItem='true'/>
        <AxisButton variant="contained" size="small" color="secondary" className={classes.margin} onClick={() => {changeAxis('x')}}>
          X
        </AxisButton>
        <AxisButton variant="contained" size="small" color="secondary" className={classes.margin} onClick={() => {changeAxis('y')}}>
          Y
        </AxisButton>
        <AxisButton variant="contained" size="small" color="secondary" className={classes.margin} onClick={() => {changeAxis('z')}}>
          Z
        </AxisButton>
        <AxisButton variant="contained" size="small" color="secondary" className={classes.margin} onClick={() => {changeAxis('a')}}>
          All
        </AxisButton>
      </Container>
      <Container style={{marginTop: 10, marginBottom: 10}}>
        <TextField id="outlined-basic" label="Time Window" size='small' width='300' variant="outlined" onChange={(event) => {setWindowSize(event.target.value)}}/>
      </Container>
      <Line data={lineData} options={lineOpt} />
    </Container>
  )
}

export default NavdataChartRaw;