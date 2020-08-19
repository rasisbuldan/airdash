import React from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
// eslint-disable-next-line
import { Drawer, Button, List, Divider, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { grey } from '@material-ui/core/colors';
// eslint-disable-next-line
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';

const useStyles = makeStyles({
  list: {
    width: 250,
  },
  fullList: {
    width: "auto",
  },
  paper: {
    background: grey[900],
    color: 'white',
  }
});

function TemporaryDrawer() {
  const styles = useStyles();

  const [state, setState] = React.useState({
    active: false
  });

  const toggleDrawer = (anchor, open) => (event) => {
    setState({ ...state, [anchor]: open })
  };

  const list = () => (
    <div
      className={clsx(styles.list)}
      role="presentation"
      onClick={toggleDrawer('active', false)}
      onKeyDown={toggleDrawer('active', false)}
    >
      <List>
        {
          ['Home', 'Dashboard', 'Data Browser', 'About'].map((text, index) => (
            <ListItem button component={Link} key={text} to={"/" + text.replace(/ /g, "").toLowerCase()}>
              <ListItemText primary={text} />
            </ListItem>
          ))
        }
      </List>
    </div>
  );

  return (
    <div>
      <React.Fragment key={'sidedrawer'}>
        <Button onClick={toggleDrawer('active', true)}>
          <MenuRoundedIcon />
        </Button>
        <Drawer
          classes = {{ paper: styles.paper }}
          open={state['active']} 
          onClose={toggleDrawer('active', false)}
        >
          {list()}
        </Drawer>
      </React.Fragment>
    </div>
  )
}

/*  <Button onClick={toggleDrawer('active', true)}>
      <MenuRoundedIcon />
    </Button> */

export default TemporaryDrawer;