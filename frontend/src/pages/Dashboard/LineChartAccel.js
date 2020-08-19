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
      lineTension: 0,
      backgroundColor: '#3498db',
      data: [0],
    }
  ],
};

const datasets = [
  {
    label: 'X',
    fill: false,
    lineTension: 0,
    borderColor: '#2196f3',
    pointRadius: 0,
    data: [0],
  },
  {
    label: 'Y',
    fill: false,
    lineTension: 0,
    borderColor: '#009688',
    pointRadius: 0,
    data: [0],
  },
  {
    label: 'Z',
    fill: false,
    lineTension: 0,
    borderColor: '#f44336',
    pointRadius: 0,
    data: [0],
  }
]

const lineOptions = {
  animation: {
    duration: 0,
  },
  scales: {
    yAxes: [
      {
        ticks: {
          min: -10,
          max: 10,
          stepSize: 2
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
    socket.on(this.props.topic, (data) => {
      //var oldDataSet = _this.state.datasets[0];

      var newDataSets = datasets;

      newDataSets[0].data = data.x;
      newDataSets[1].data = data.y;
      newDataSets[2].data = data.z;
      
      var newState = {
        ...lineData,
        datasets: newDataSets
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