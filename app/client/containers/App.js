import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import userActions from '../actions/user';
import Login from '../components/Login';
import Dashboard from '../dashboard';
import Calendar from '../calendar';

@connect((state) => state)
export default class App extends React.Component {
  
  constructor(props) {
      super(props);
      this.state = {
          navigator: 'Home',
      };
  }

  render() {
    const { user, dispatch } = this.props;
    const boundUserActions = bindActionCreators(userActions, dispatch);

    return (
      !user.loggedIn ?
        <Login onLogin={ boundUserActions.login } /> :
        <div className="ui grid padded">
          <div className="four wide column">
            <div className="ui vertical fluid menu">
              {this.renderMenu()}
            </div>
          </div>
          
          <div className="twelve wide stretched column">
            {this.renderMain(user)}
            <div className="ui tiny progress">
              <div className="bar"></div>
              <div className="label">FUMIST</div>
            </div>
          </div>
        </div>
    );
  }
  onClickMenu(e){
    this.setState({
        navigator : e.target.text,
    });
  }
  renderMenu(){
    const menu = ["Home","Calendar","Material"];
    return menu.map((item) => {      
      let className = (this.state.navigator == item) ? 'active' : '';
      className = className+" item";
      return (
          <a className={className} onClick={::this.onClickMenu}>
            {item}
          </a>)
    });
  }
  renderMain(user){
    switch(this.state.navigator){
      case "Calendar": return (
          <Calendar username={ user.username } password={user.password}/>
          );
      default: return (
          <Dashboard username={ user.username } password={user.password}/>
          );
    }
  }
}

