import React from 'react';
import { Line } from 'react-chartjs-2';
import openSocket from 'socket.io-client';
import 'fontsource-roboto';

/* Socket Connect */
const socketHost = 'localhost';
const socketPort = 3002;
var socket = openSocket(`http://${socketHost}:${socketPort}`);

/* Global variable */
const nLineData = 100;

const lineData = {
  labels: [...Array(nLineData).keys()],
  datasets: [
    {
      label: 'Raw data',
      fill: false,
      lineTension: 0.1,
      backgroundColor: '#3498db',
      borderWidth: 1,
      borderColor: '#3498db',
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 1.0,
      borderJoinStyle: 'miter',
      pointBorderWidth: 0,
      pointRadius: 0,
      pointHitRadius: 10,
      data: [0],
    }
  ],
};

const lineOptions = {
  animation: {
    duration: 0,
  },
  scales: {
    yAxes: [
      {
        ticks: {
          min: 0,
          max: 100,
          stepSize: 20
        }
      },
    ],
  }
};

class LineChartRaw extends React.Component {
  componentWillMount(){
		this.setState(lineData);
  }
    
	componentDidMount(){
		var _this = this;
    
    /* Get data from socket */
    socket.on('chartdata', (data) => {
      var oldDataSet = _this.state.datasets[0];

      // Copy dataset
      var newDataSet = {
        ...oldDataSet
      };

      // Set new data
      newDataSet.data = data;

      
      var newState = {
        ...lineData,
        datasets: [newDataSet]
      };

      _this.setState(newState);
    });
  }

  render() {
    return(
      <Line data={this.state} options={lineOptions} />
    )
  }
}

export default LineChartRaw;