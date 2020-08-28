import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { red } from '@material-ui/core/colors';
import openSocket from 'socket.io-client';
// eslint-disable-next-line
import { Box, Typography } from '@material-ui/core';
import RawChart from './RawChart';

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

function RawChartWrapper() {
  const [lineDataX, setLineDataX] = useState(lineDataTemplate);
  const [lineDataY, setLineDataY] = useState(lineDataTemplate);
  const [lineDataZ, setLineDataZ] = useState(lineDataTemplate);

  useEffect(() => {
    socket.on('rawlive', (data) => {
      let ldX = {
        ...lineDataX
      }
      let ldY = {
        ...lineDataY
      }
      let ldZ = {
        ...lineDataZ
      }
      ldX.datasets[1].data = data.x;
      setLineDataX(ldX);
      ldY.datasets[1].data = data.y;
      setLineDataY(ldY);
      ldZ.datasets[1].data = data.z;
      setLineDataZ(ldZ);
    });
  }, []);

  return(
    <div>
      <Typography variant='h2' gutterBottom align={'left'}>
        <Box fontWeight={300} fontSize={30} style={{color: 'black'}}>
          Axis X
        </Box>
      </Typography>
      <Line data={lineDataX} options={lineOptions} height={'30vw'} />
      <Typography variant='h2' gutterBottom align={'left'}>
        <Box fontWeight={300} fontSize={30} style={{color: 'black'}}>
          Axis Y
        </Box>
      </Typography>
      <Line data={lineDataY} options={lineOptions} height={'30vw'} />
      <Typography variant='h2' gutterBottom align={'left'}>
        <Box fontWeight={300} fontSize={30} style={{color: 'black'}}>
          Axis Z
        </Box>
      </Typography>
      <Line data={lineDataZ} options={lineOptions} height={'30vw'} />
    </div>
  )
}

export default RawChartWrapper;