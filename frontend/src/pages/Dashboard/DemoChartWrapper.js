import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { red } from '@material-ui/core/colors';
import openSocket from 'socket.io-client';
// eslint-disable-next-line
import { Box, Typography } from '@material-ui/core';

/* Socket */
const socketHost = 'localhost';
const socketPort = 3002;
const socket = openSocket(`http://${socketHost}:${socketPort}`);

const lineDataTemplate = {
  datasets: [
    {
      label: 'Vertical Line',
      fill: false,
      lineTension: 0,
      borderColor: 'rgba(46,204,113 ,1)',
      backgroundColor: 'rgba(46,204,113 ,0.05)',
      yAxisID: 'data',
      pointRadius: 0,
      data: [
        {x: -1000, y: 500},
        {x: 0, y: 500},
        {x: 0.000001, y: -100}
      ],
      borderWidth: 4,
    },
    {
      label: 'Live Data',
      fill: true,
      lineTension: 0,
      borderColor: 'rgba(46,204,113 ,1)',
      backgroundColor: 'rgba(46,204,113 ,0.3)',
      yAxisID: 'data',
      pointRadius: 0,
      data: [{x: 0, y: 0}],
      borderWidth: 1.5,
    },
    {
      label: 'PWM Limit',
      fill: false,
      lineTension: 0,
      borderColor: red[500],
      yAxisID: 'data',
      pointRadius: 0,
      data: [
        {x: -1000, y: 255},
        {x: 100, y: 255},
      ],
      borderWidth: 2,
    },
  ],
};

const lineOptions = {
  animation: {
    duration: 0,
  },
  legend: {
    display: false
  },
  scales: {
    xAxes: [
      {
        type: 'linear',
        ticks: {
        min: -200,
        max: 10,
        }
      },
    ],
    yAxes: [
      {
        id: 'data',
        ticks: {
        min: -16,
        max: 16,
        stepSize: 4
        }
      }
    ],
  }
};

function DemoChartWrapper() {
  const [lineData1, setLineData1] = useState(lineDataTemplate);
  const [lineData2, setLineData2] = useState(lineDataTemplate);

  useEffect(() => {
    socket.on('demoestimate', (data) => {
      let ld1 = {
        ...lineData1
      }
      let ld2 = {
        ...lineData2
      }
      ldX1.datasets[1].data = data.x;
      setLineData1X(ldX);
      ld2.datasets[1].data = data.y;
      setLineData2(ldY);
    });
  }, []);

  return(
    <div>
      <Typography variant='h2' gutterBottom align={'left'}>
        <Box fontWeight={300} fontSize={30} style={{color: 'black'}}>
          Raw Data
        </Box>
      </Typography>
      <Line data={lineData1} options={lineOptions} height={'30vw'} />
      <Typography variant='h2' gutterBottom align={'left'}>
        <Box fontWeight={300} fontSize={30} style={{color: 'black'}}>
          Condition Estimate
        </Box>
      </Typography>
      <Line data={lineData2} options={lineOptions} height={'30vw'} />
    </div>
  )
}

export default DemoChartWrapper;