import React from 'react'
import { Container } from '@material-ui/core';
import SideDrawer from './components/SideDrawer'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

/* Pages */
import Home from './pages/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import DataBrowser from './pages/DataBrowser/DataBrowser';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

function App(){
  /* return (
    <Sidebar items={items}/>
  ) */
  return (
    <Router history={history}>
      <div>
        <SideDrawer />
      </div>
      <Container disableGutters='true'>
        <Switch>
          <Route path="/home" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/databrowser" component={DataBrowser} />
        </Switch>
      </Container>
    </Router>
  )
}

export default App;