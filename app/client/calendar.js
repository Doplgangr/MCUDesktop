import request from "request-promise";
import cheerio from "cheerio";
import React from 'react';
import Backend from './api';
import MCMSEvent from './MCMSClasses/MCMSEvent';
import DateFormat from "dateformat";

var url = 'https://intranet.mfpo.cuhk.edu.hk/med/index.aspx';
var timetable = 'https://intranet.mfpo.cuhk.edu.hk/med/timetable/index.aspx';
var calendar = 'https://intranet.mfpo.cuhk.edu.hk/med/timetable/StudentDailyEventViewer.aspx';
var uA = "Mozilla/5.0 (Windows; U; WindowsNT 5.1; en-US; rv1.8.1.6) Gecko/20070725 Firefox/2.0.0.6";

let context;
let eventDB = new PouchDB('EventDB', {adapter: 'websql'});
const getCalendarForm = {
    method: 'GET',
    uri: calendar,
    jar: true,
    headers: {
        'User-Agent': uA
    },
}
const postCalendarForm = {
    method: 'POST',
    uri: calendar,
    jar: true,
    headers: {
        'User-Agent': uA
    }
}
export default class Dashboard extends Backend{    

  
    constructor(props) {
        super(props);
        this.state = {
            hasdata: null,
            data: null,
        };
        context= this;
    }

    render(){
        context.readAll(
            () => {}
        );
        return(
            <div className="ui large feed">
            {
                !this.state.hasdata ?
                this.grab() : 
                this.renderdata()
            }
            { this.renderModal() }
            </div>
        );
    }
    readAll(onDatabaseChange) {
        return eventDB.query(function (doc, emit) {
                emit(doc.date + doc.time);
            },{ include_docs: true })
            .then(docs => {

                // Each row has a .doc object and we just want to send an 
                // array of birthday objects back to the calling controller,
                // so let's map the array to contain just the .doc objects.

                context.setState({
                    hasdata: true,
                    data: docs.rows.map(row => {
                        let temp = new MCMSEvent();
                        return temp.overwriteWith(row.doc);
                    })
                });

                // Listen for changes on the database.
                eventDB.changes({ live: true, since: 'now', include_docs: true })
                    .on('change', onDatabaseChange);

                return context.state.data;
            });
        }

    
    renderdata(){
        let temp;
        return this.state.data.map((display) => {
            let header = (<div className="ui large header">{display.date}</div>);
            let render = (
                <div className="event">
                    <div className="label">
                    <i className="calendar outline icon"></i>
                    </div>
                    <div className="content">
                        <a className="summary"onClick={this.handleClick.bind(display._id)}>
                            {display.topic}
                            <div className="date">
                            {display.teacher}
                            </div>
                        </a>
                        <div className="extra text">
                            {display.time}
                        </div>
                        <div className="meta">
                            <i className="map icon"></i> {display.location}
                        </div>
                    </div>
                </div>
            );
            if (temp == display.date){
                temp = display.date;
                return render;
            }else{
                temp = display.date;
                return [header,render];
            }
        }
        );
    }
    
    componentDidMount() {
        var self = this;
        $(window).on('modal.visible', function(ev){
        self.setState({visible: true});
        });
        $(window).on('modal.hidden', function(ev){
        self.setState({visible: false});
        });
    }

    renderModal() {
        var modal_classes = (this.state.visible)? 'ui small modal transition visible active' : 'ui small modal transition hidden';
        return (
        <div className={modal_classes}>
            <div className="ui center aligned header">Hello</div>
            <div className="content">
            <p></p>
            </div>
        </div>
        );
    }

    handleClick(item, event){
        console.log(item);
        console.log(event);
        context.setState({visible: true, activeEvent: item});
    }
    getEvents(params, date){
        params["ctl00$ContentPlaceHolder1$txtDate"] = date;
        params["ctl00$ContentPlaceHolder1$btnNext"] = ">>";
        console.log(JSON.stringify(params));
        let queryFormwithParams = postCalendarForm;
        queryFormwithParams.form = params;
        return request(queryFormwithParams);
    }
    getHiddenParams(){          
        return request(getCalendarForm)
            .then(function (body){
                var $ = cheerio.load(body);
                var form = new Array();             
                $('input[type=hidden]').each(
                    function(i, element){                    
                    var a = $(this);
                    if (a.attr("id") != null && a.attr("value") != null) {
                        form[a.attr("id")] = a.attr("value");
                    }
                });
                return form;
            });
    }
    dissectEventPage(body){
        var $ = cheerio.load(body);
        let results = new Array();
        $('a[style="display:block"][data-toggle="modal"] ,div.modal').each(function(i, element){                    
            var a = $(this);
            results.push($.html(a));
        });
        return results;
    }
    parseIntoEvent(chunk){
        var $ = cheerio.load(chunk);
        let temp = new MCMSEvent();
        $('a[href*=modalCount]').each(
            (i, element) => temp._id = $(element).attr("href").split("modalCount")[1]
        );
        $('div[id*=modalCount]').each(
            (i, element) => temp._id = $(element).attr("id").split("modalCount")[1]
        );
        
        if (temp._id) {
	        let idchain = temp._id.split("-");
            if (idchain.length >= 4)
                temp.date = idchain[1] + "-" + idchain[2] + "-" + idchain[3];
        }
        $('p:contains(Course:)').each(
            (i, element) => temp.course = $(element).text().split("Course: ")[1].split(" \\(Group:.*\\)")[0]
        );
        $('p:contains(Format:)').each(
            (i, element) => temp.format = $(element).text().split("Format: ")[1]
        );
        $('p:contains(Topic:)').each(
            (i, element) => temp.topic = $(element).text().split("Topic: ")[1]
        );
        $('p:contains(Location:)').each(
            (i, element) => temp.location = $(element).text().split("Location: ")[1]
        );
        $('i + h4').each(
            (i, element) => temp.time = $(element).text().split(" ")[1]
        );
        $('td[width=160px]').each(
            (i, element) => temp.location = $(element).text()
        );
        $('td[width=240px]').each(
            (i, element) => temp.teacher = $(element).text().trim()
        );
        $('td[width=40px]').each(
            (i, element) => temp.group = $(element).text()
        );
        $('div.form-inline:contains(Remark) + div').each(
            (i, element) => temp.remarks = $(element).text()
        );
        return temp;
    }
    grab(){
        eventDB.allDocs()
            .then(
                (results) => console.log(results)
            );
        this.loginwithHiddenParams().then(
                (body) => context.requestMainPage()
            ).then(
                (dump) => context.getHiddenParams()
            ).then(
                (params) => context.pacemaker(params, 5, new Date())
            );
    }

    sequentialSaveEvent(events){
        let event = events[0];  
        if (event)      
            return eventDB.get(event._id).then(
                (doc) => {
                    return eventDB.put(event.overwriteWith(doc));
                }
            ).catch((err) => {
                if (err.status == 404) {
                    // No problem, add ahead
                    return eventDB.put(event);
                }
                console.log(JSON.stringify(err));
            }).then(
                () => {
                    if (events.length > 1){
                        events.splice(0,1);
                        return context.sequentialSaveEvent(events);
                    }
                }
            )
    }

    pacemaker(params, count, date){        
        return context.getEvents(params, DateFormat(date,"dd-mmm-yyyy"))
        .then(
            (body) => context.dissectEventPage(body)
        ).then(
            (chunks) => chunks.map((chunk) => context.parseIntoEvent(chunk))
        ).then(
            (events) => {
                context.sequentialSaveEvent(events);
                console.log(JSON.stringify(events));
            }
        ).then(
            () => {
                return new Promise(function (fulfill) {
                            setTimeout(fulfill, 500);
                        });
            }            
        ).then(
            (dump) =>{
                if (count>1)
                    return context.pacemaker(params, count-1, new Date(date.getTime() + (24 * 60 * 60 * 1000)));
            }
        )
    }
}