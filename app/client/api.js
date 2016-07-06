import request from "request-promise";
import cheerio from "cheerio";
import React from 'react';

var url = 'https://intranet.mfpo.cuhk.edu.hk/med/index.aspx';
var dashboard = 'https://intranet.mfpo.cuhk.edu.hk/med/timetable/index.aspx';
var calendar = 'https://intranet.mfpo.cuhk.edu.hk/med/timetable/StudentDailyEventViewer.aspx';
var uA = "Mozilla/5.0 (Windows; U; WindowsNT 5.1; en-US; rv1.8.1.6) Gecko/20070725 Firefox/2.0.0.6";

const loginForm = {
    method: 'POST',
    uri: url,
    jar: true,
    simple: false
}
const dashboardForm = {
    method: 'GET',
    uri: dashboard,
    jar: true
}
let context;
export default class Backend extends React.Component{    

  
    constructor(props) {
        super(props);
        this.state = {
            hasdata: null,
            data: null,
        };
        context = this;
    }

    loginwithHiddenParams(){    
        return this.requestHiddenParams()
                    .then(function(params){
                        var txtUserName = context.props.username;
                        var txtPassword = context.props.password;               
                        params["txtUserName"] = txtUserName;
                        params["txtPassword"] = txtPassword;
                        params["btnLogin"] = "Sign+in";
                        console.log(JSON.stringify(params));
                        return params;
                    }).then(function(params){
                        let loginFormwithParams = loginForm;
                        loginFormwithParams.form = params;
                        return request(loginFormwithParams);
                    });
    }
    requestHiddenParams(){
        return request(loginForm)
                    .then(function(body){
                    var $ = cheerio.load(body);   
                    var form = new Array();             
                    $('input[type=hidden]').each(function(i, element){                    
                        var a = $(this);
                        if (a.attr("id") != null && a.attr("value") != null) {
                            form[a.attr("id")] = a.attr("value");
                        }
                    });
                    return form;

                });
    }
    requestMainPage(){        
        return request(dashboardForm)
            .then(function (body){
                var $ = cheerio.load(body);
                var display = $('div.modal-dialog-center').map(function(i, el) {
                        // this === el
                        return $(this).text();
                    }).get();
                return display;
            });
    }
}