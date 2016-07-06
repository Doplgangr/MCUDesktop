import React from 'react';

export default class App extends React.Component {
  handleLogin() {
    const { onLogin } = this.props;
    const username = this.refs.username.value;
    const password = this.refs.password.value;
    console.log(username);
    onLogin({ username, password, loggedIn: true });

  }

  onUserNameChanged(e){
      this.setState({username: e.target.value});
  }

  render() {  
    return (
      <div className="ui modal transition visible active">
      <div className="content">
        <form className="ui large form">
            <div className="field">
              <div className="ui left icon input">
                <i className="user icon"></i>
                <input ref="username" onChange={this.onUserNameChanged.bind(this)} type="text" name="username" placeholder="CWEM ID"/>
              </div>
            </div>
            <div className="field">
              <div className="ui left icon input">
                <i className="lock icon"></i>
                <input ref="password" type="password" name="password" placeholder="Password"/>
              </div>
            </div>
            <div className="ui fluid large teal submit basic button" onClick={::this.handleLogin}>Login</div>

          <div className="ui error message"></div>

        </form>
        </div>
      </div>
    );
  }
}
