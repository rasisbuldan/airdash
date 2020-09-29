import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { red } from '@material-ui/core/colors';
import openSocket from 'socket.io-client';

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
        {x: -4000, y: 500},
        {x: 0, y: 500},
        {x: 0.000001, y: -100}
      ],
      borderWidth: 4,
    },
    {
      label: 'Live Data',
      fill: true,
      lineTension: 0,
      borderColor: 'rgba(52,152,219, 1)',
      backgroundColor: 'rgba(52,152,219, 0.3)',
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
        {x: -4000, y: 255},
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
          min: -4000,
          max: 100,
        }
      },
    ],
    yAxes: [
      {
        id: 'data',
        ticks: {
          min: 0,
          max: 300,
          stepSize: 100
        }
      }
    ],
  }
};

function NavChartDemo() {
  const [lineData, setLineData] = useState(lineDataTemplate);

  useEffect(() => {
    socket.on('pwmlive', (data) => {
      let ld = {
        ...lineDataTemplate
      }
      ld.datasets[1].data = data;
      setLineData(ld);
    });
  }, []);

  return (
    <Line data={lineData} options={lineOptions} height={'60vw'} />
  )
}

export default NavChartDemo;