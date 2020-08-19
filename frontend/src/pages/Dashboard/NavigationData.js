import React from 'react';
import { Container, Grid, Box, Typography } from '@material-ui/core';
import { withStyles } from "@material-ui/core/styles";
import openSocket from 'socket.io-client';
import 'fontsource-roboto';

/* Icon */
//import Battery90RoundedIcon from '@material-ui/icons/Battery90Rounded';

/* Socket Connect */
const socketHost = 'localhost';
const socketPort = 3002;
var socket = openSocket(`http://${socketHost}:${socketPort}`);

const NavDataTypography = withStyles({
  root: {
    color: '#1565c0',

  }
})(Typography);

class NavigationData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      navdata: {
        batteryPercentage: '-',
        orientation: {
          roll: '-',
          pitch: '-',
          yaw: '-',
        },
        pwm: {
          mot1: '-',
          mot2: '-',
          mot3: '-',
          mot4: '-',
        },
        altitude: '-',
      }
    }
  }

  componentDidMount(){
    socket.on('navigationdata', (navdata) => {
      this.setState(navdata);
    });
  }

  render() {
    return (
      <Container>
        <Grid container direction="row" alignItems="center">
          <Grid container>
            <NavDataTypography variant='h5' gutterBottom>
              <Box fontWeight={300} fontSize={20}>
                Battery Percentage: {Number(this.state.navdata.batteryPercentage).toFixed(2)}
              </Box>
            </NavDataTypography>
          </Grid>
          <Grid container>
            <NavDataTypography variant='h5' gutterBottom>
              <Box fontWeight={300} fontSize={20}>
                Altitude: {Number(this.state.navdata.altitude).toFixed(2)}
              </Box>
            </NavDataTypography>
          </Grid>
          <Grid container>
            <NavDataTypography variant='h5' gutterBottom>
              <Box fontWeight={300} fontSize={20}>
                Roll: {Number(this.state.navdata.orientation.roll).toFixed(4)}
              </Box>
            </NavDataTypography>
          </Grid>
          <Grid container>
            <NavDataTypography variant='h5' gutterBottom>
              <Box fontWeight={300} fontSize={20}>
                Pitch: {Number(this.state.navdata.orientation.pitch).toFixed(4)}
              </Box>
            </NavDataTypography>
          </Grid>
          <Grid container>
            <NavDataTypography variant='h5' gutterBottom>
              <Box fontWeight={300} fontSize={20}>
                Yaw: {Number(this.state.navdata.orientation.yaw).toFixed(4)}
              </Box>
            </NavDataTypography>
          </Grid>
          <Grid container>
            <NavDataTypography variant='h5' gutterBottom>
              <Box fontWeight={300} fontSize={20}>
                PWM: [ 
                  {Number(this.state.navdata.pwm.mot1)},
                  {Number(this.state.navdata.pwm.mot2)},
                  {Number(this.state.navdata.pwm.mot3)},
                  {Number(this.state.navdata.pwm.mot4)}
                 ]
              </Box>
            </NavDataTypography>
          </Grid>
        </Grid>
      </Container>
    )
  }
}

export default NavigationData;