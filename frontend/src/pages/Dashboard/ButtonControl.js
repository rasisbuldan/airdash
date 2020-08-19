import React from 'react';
import { Container, Button, Box, Typography, Divider } from '@material-ui/core';
import { withStyles } from "@material-ui/core/styles";
import openSocket from 'socket.io-client';
import 'fontsource-roboto';

/* Socket Connect */
const socketHost = 'localhost';
const socketPort = 3002;
const socket = openSocket(`http://${socketHost}:${socketPort}`);

const MotionTextTypography = withStyles({
  root: {
    color: '#ef6c00',

  }
})(Typography);

class ButtonControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numClick: 0,
      motion: 'hover'
    };
    console.log(this.state.numClick)

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.clickedAction = this.clickedAction.bind(this);

    this.t = undefined;
  }

  onMouseDown(action) {
    this.clickedAction(action);
  }
  

  onMouseUp() {
    clearTimeout(this.t);
    this.setState({
      motion: 'stop'
    })
  }

  /* clickedAction() {
    console.log(this.state.numClick);
    this.setState({
      numClick: this.state.numClick + 1
    });
    this.t = setTimeout(this.clickedAction, 50);
  } */

  clickedAction(action) {
    this.setState({
      motion: action
    })
    switch(action) {
      case 'forward':
        console.log('Going forward!');
        break;
      case 'backward':
        console.log('Going backward!');
        break;
      case 'left':
        console.log('Going left!');
        break;
      case 'right':
        console.log('Going right!');
        break;
      case 'up':
        console.log('Going up!');
        break;
      case 'down':
        console.log('Going down!');
        break;
      case 'takeoff':
        console.log('Going takeoff!');
        break;
      case 'land':
        console.log('Going land!');
        break;
      default:
        console.log('Hover!');
        break;
    }
    socket.emit('motionData', action);
    this.t = setTimeout(this.clickedAction, 50, action);
  }

  render() {
    return (
      <Container>
        <Container>
          <MotionTextTypography variant='h5' gutterBottom>
            <Box fontWeight={500} fontSize={24}>
              {this.state.motion.toUpperCase()}
            </Box>
          </MotionTextTypography>
        </Container>
        <Container>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('forward')} size='large' style={{margin:0, minWidth: 80}}>
            FORWARD
          </Button>
        </Container>
        <Container>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('left')} size='large' style={{margin:10, minWidth: 80}}>
            LEFT
          </Button>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('right')} size='large' style={{margin:10, minWidth: 80}}>
            RIGHT
          </Button>
        </Container>
        <Container>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('backward')} size='large' style={{margin:0, minWidth: 80}}>
            BACKWARD
          </Button>
        </Container>
        <Divider light style={{margin:10}}/>
        <Container>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('up')} size='large' style={{marginRight:10, minWidth: 80}}>
            UP
          </Button>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('down')} size='large' style={{marginLeft:10, marginRight:10, minWidth: 80}}>
            DOWN
          </Button>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('takeoff')} size='large' style={{marginLeft:10, marginRight:10, minWidth: 80}}>
            TAKEOFF
          </Button>
          <Button variant="contained" color="primary" onMouseUp={this.onMouseUp} onMouseDown={() => this.onMouseDown('land')} size='large' style={{marginLeft:10, minWidth: 80}}>
            LAND
          </Button>
        </Container>
      </Container>
    )
  }
}

export default ButtonControl;