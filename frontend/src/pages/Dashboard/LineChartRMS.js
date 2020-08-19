import React from 'react';
import { Line } from 'react-chartjs-2';
import openSocket from 'socket.io-client';
import 'fontsource-roboto';

/* Socket Connect */
const socketHost = 'localhost';
const socketPort = 3002;
var socket = openSocket(`http://${socketHost}:${socketPort}`);

/* Global variable */
const nLineData = 20;

const lineData = {
  labels: [...Array(nLineData).keys()],
  datasets: [
    {
      label: 'RMS Data',
      fill: false,
      lineTension: 0.5,
      backgroundColor: '#e67e22',
      borderWidth: 1,
      borderColor: '#e67e22',
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

class LineChartRMS extends React.Component {
  componentWillMount(){
		this.setState(lineData);
  }
    
	componentDidMount(){
		var _this = this;

		/* Get data from socket */
    socket.on('chartdatarms', (data) => {
      var oldDataSet = _this.state.datasets[0];
      var newDataSet = {
        ...oldDataSet
      };

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

export default LineChartRMS;