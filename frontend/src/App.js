import React from 'react'
// eslint-disable-next-line
import { Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SideDrawer from './components/SideDrawer'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

/* Pages */
import Home from './pages/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import DataBrowser from './pages/DataBrowser/DataBrowser';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

const useStyles = makeStyles((theme) => ({
  root: {
    height: "50vh",
  }
}));

function App(){
  const classes = useStyles();

  return (
    <Router history={history}>
      <div className={classes.root}>
        <SideDrawer />
        <Switch>
          <Route path="/home" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/databrowser" component={DataBrowser} />
        </Switch>
      </div>
    </Router>
  )
}

export default App;