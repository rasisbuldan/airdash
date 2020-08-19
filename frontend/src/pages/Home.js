import React from 'react';
import { Container, Typography, Box, Grid, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    height: 140,
    width: 100,
  },
}));



function Home() {
  const classes = useStyles();

  return(
    <React.Fragment>
      <Container maxwidth='md'>
        <Typography variant='h2' gutterBottom align={'center'}>
          <Box fontWeight={400}>
            Welcome!
          </Box>
        </Typography>
      </Container>
      <Grid container className={classes.root} spacing={4}>
        <Grid item xs={12}>
          <Grid container justify="center" spacing={4}>
            {[...Array(3).keys()].map((value) => (
              <Grid key={value} item>
                <Paper className={classes.paper} elevation={4} />
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  )
}

export default Home;