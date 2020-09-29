import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const lineDataTemplate = {
  datasets: [
    {
      label: 'Live Data',
      fill: true,
      lineTension: 0,
      borderColor: 'rgba(255,255,255, 1)',
      backgroundColor: 'rgba(255,255,255, 0.2)',
      yAxisID: 'data',
      pointRadius: 4,
      data: [{x: 0, y: 0}],
      borderWidth: 1.5,
    },
    {
      label: 'Treshold Data',
      fill: false,
      lineTension: 0,
      borderColor: 'red',
      yAxisID: 'data',
      pointRadius: 4,
      data: [{x: -65, y: 0.8}, {x: 5, y: 0.8}],
      borderWidth: 1.5,
    }
  ],
};

const lineOptions = {
  animation: {
    duration: 0.2,
  },
  legend: {
    display: false
  },
  scales: {
    xAxes: [
      {
        type: 'linear',
        ticks: {
          fontColor: 'white',
          min: -60,
          max: 0,
        },
        gridLines: {
          display: false,
        }
      },
    ],
    yAxes: [
      {
        id: 'data',
        ticks: {
          fontColor: 'white',
          min: 0,
          max: 1,
          stepSize: 1
        },
        gridLines: {
          display: false,
          color: 'white'
        }
      }
    ],
  }
};

function ConditionChart({ cond }) {
  const [lineData, setLineData] = useState(lineDataTemplate);

  useEffect(() => {
    let ld = {
      ...lineDataTemplate
    }
    ld.datasets[0].data = cond;
    setLineData(ld);
  }, [cond]);

  return (
    <Line data={lineData} options={lineOptions} height={'50vw'} />
  )
}

export default ConditionChart;