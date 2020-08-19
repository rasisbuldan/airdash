import React, { useState, useEffect } from 'react';
import { Container, TextField, Typography, Box, Paper, Divider } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import axios from 'axios';
import NavdataChartRaw from './NavdataChartRaw';



const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  paperSingle: {
    marginTop: 20,
    padding: 10,
    'min-height': 400,
    textAlign: 'center',
    borderRadius: 5,
    width: '100%'
  },
  main: {
    textAlign: 'left',
  },
  featureButton: {
    '& > *': {
      margin: theme.spacing(1),
    },
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center'
  }
}));


function DataBrowser() {
  const classes = useStyles();
  const [selectedDesc, setSelectedDesc] = useState('aug10_2_hover10s_1.json');
  const [descList, setDescList] = useState({ desc: [] });

  const useComponentWillMount = (func) => {
    const willMount = React.useRef(true);
  
    if (willMount.current) {
      func();
    }
  
    willMount.current = false;
  };

  useComponentWillMount(() => {
    axios.get('http://localhost:3001/getdesclist2')
    .then((response) => {
      //console.log(response.data);
      setDescList({ desc: response.data.descList });
      console.log('willmount');
      setSelectedDesc(descList.desc[Math.floor(Math.random() * descList.length)]);
      console.log(selectedDesc);
    });
  });

  useEffect(() => {
    //console.log(descList.desc);
    // Pick random initial selected desc
    if (descList.desc !== []) {
      setSelectedDesc(descList.desc[Math.floor(Math.random() * descList.length)]);
    }
  }, [descList]);


  /* useEffect(() => {
    clearInterval(seldesc);
    seldesc = setInterval(() => {
      console.log(selectedDesc);
    }, 1000);
  }, [selectedDesc]); */

  return(
    <Container className={classes.main} disableGutters='true'>
      <Typography variant='h5' gutterBottom>
        <Box fontWeight={300} fontSize={40} width={1}>
          Data Browser
        </Box>
      </Typography>
      <Autocomplete
        id="combo-box-demo"
        options={descList.desc}
        getOptionLabel={(option) => option.title}
        style={{ width: 400 }}
        renderInput={(params) => <TextField {...params} label="Select Description" variant="outlined" />}
        onChange={(event,val) => {
          setSelectedDesc(val.title);
        }}
      />
      <Paper className={classes.paperSingle} elevation={2}>
        <Typography variant='h5' gutterBottom>
          <Box fontWeight={300} fontSize={22} width={1}>
            {selectedDesc}
          </Box>
        </Typography>
      <Divider />
      <NavdataChartRaw desc={selectedDesc} />
      </Paper>
    </Container>
  )
}

export default DataBrowser;