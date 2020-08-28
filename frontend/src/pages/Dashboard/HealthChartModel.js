import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { red } from '@material-ui/core/colors';
import axios from 'axios';

/* Global Variable */
const lineDataTemplate = {
  datasets: [
    {
      label: 'History Data',
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
      label: 'Window Data',
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
      label: 'Forecast Data',
      fill: true,
      lineTension: 0,
      borderColor: 'rgba(230,126,34, 1)',
      backgroundColor: 'rgba(230,126,34, 0.3)',
      yAxisID: 'data',
      pointRadius: 0,
      data: [{x: 0, y: 0}],
      borderWidth: 1.5,
    },
    {
      label: 'RUL Line',
      fill: false,
      lineTension: 0,
      borderColor: red[500],
      backgroundColor: red[500],
      yAxisID: 'data',
      pointRadius: 0,
      data: [
        {x: -100, y: 500},
        {x: 0, y: 500},
        {x: 0.000001, y: -100}
      ],
      borderWidth: 3,
    },
    {
      label: 'Health Limit',
      fill: false,
      lineTension: 0,
      borderColor: red[500],
      yAxisID: 'data',
      pointRadius: 0,
      data: [
        {x: -1000, y: 75},
        {x: 100, y: 75},
      ],
      borderWidth: 2,
    },
    {
      label: 'Vertical Line',
      fill: false,
      lineTension: 0,
      borderColor: 'rgba(46,204,113 ,1)',
      yAxisID: 'data',
      pointRadius: 0,
      data: [
        {x: -100, y: 500},
        {x: 0, y: 500},
        {x: 0.000001, y: -100}
      ],
      borderWidth: 4,
    },
    {
      label: 'Vertical Line 2',
      fill: false,
      lineTension: 0,
      borderColor: 'rgba(46,204,113 ,1)',
      yAxisID: 'data',
      pointRadius: 0,
      data: [
        {x: -100, y: 500},
        {x: -60, y: 500},
        {x: -60.000001, y: -100}
      ],
      borderWidth: 4,
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
        scaleLabel: {
          display: true,
          labelString: 'Waktu (s)',
          fontSize: 16,
        },
        type: 'linear',
        ticks: {
          min: -300,
          max: 60,
          stepSize: 10
        }
      },
    ],
    yAxes: [
      {
        scaleLabel: {
          display: true,
          labelString: 'Health Indicator',
          fontSize: 16,
        },
        id: 'data',
        ticks: {
          min: 0,
          max: 100,
          stepSize: 20
        }
      }
    ],
  }
};

function HealthChartModel({ update }) {
  const [lineData, setLineData] = useState(lineDataTemplate);

  useEffect(() => {
    axios.get('http://localhost:3001/healthchartmodel')
    .then((res) => {
      let ld = {
        ...lineDataTemplate
      }
      ld.datasets[0].data = res.data.history;
      ld.datasets[1].data = res.data.window;
      ld.datasets[2].data = res.data.predict;
      ld.datasets[3].data = res.data.rul;
      setLineData(ld);
    });
  }, [update]);

  return (
    <Line data={lineData} options={lineOptions} height={'100vw'} />
  )
}

export default HealthChartModel;