import React from 'react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
// eslint-disable-next-line
import { BrowserRouter as Router, Switch, Route, Link} from 'react-router-dom'

function ListItemLink(props) {
  const { primary, to } = props;

  const CustomLink = React.useMemo(
    () =>
      React.forwardRef((linkProps, ref) => (
        <Link ref={ref} to={to} {...linkProps} />
      )),
    [to],
  );

  return (
    <li>
      <ListItem button component={CustomLink}>
        <ListItemText primary={primary} />
      </ListItem>
    </li>
  );
}

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clicked: false,
    }
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    var lastState = this.state.clicked
    this.setState({
      clicked: !lastState
    })
  }

  render() {
    return (
      <div className="sidebar">
        <Router>
          <List disablePadding dense>
            {
              this.props.items.map(({label, name, items:subItems, ...rest}) => (
                <React.Fragment key={name}>
                  <ListItemLink primary={label} to={"/test"}/>
                  {
                    (Array.isArray(subItems) && this.state.clicked) ? (
                      <SidebarChild subItems={subItems}/>
                    ) : null
                  }
                </React.Fragment>
              ))
            }
          </List>
        </Router>
      </div>
    )
  }
}
/* 
<ListItem style={{ paddingLeft: 18 }} button onClick={this.handleClick} {...rest} component="a" href="/">
                    <ListItemText className="sidebar-item-text-parent">{label}</ListItemText>
                  </ListItem> */

class SidebarChild extends React.Component {

  render() {
    return(
      <List disablePadding>
        {this.props.subItems.map((subItem) => (
          <ListItem key={subItem.name} style={{ paddingLeft: 36 }} button dense>
            <ListItemText>
              <span className="sidebar-item-text-sub">
                {subItem.label}
              </span>
            </ListItemText>
          </ListItem>
        ))}
      </List>
    )
  }
}

export default Sidebar;