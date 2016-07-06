   
export default class MCMSEvent{
    constructor() {
        this._id = null;
        this.date = null;
        this.time = null;
        this.course = null;
        this.format = null;
        this.topic = null;
        this.location = null;
        this.teacher = null;
        this.remarks = null;
        this.group = null;
     }
     overwriteWith(newer){
        newer._id = this._id ? this._id : newer._id;
        newer.date = this.date ? this.date : newer.date;
        newer.time = this.time ? this.time : newer.time;
        newer.course = this.course ? this.course : newer.course;
        newer.format = this.format ? this.format : newer.format;
        newer.topic = this.topic ? this.topic : newer.topic;
        newer.location = this.location ? this.location : newer.location;
        newer.teacher = this.teacher ? this.teacher : newer.teacher;
        newer.remarks = this.remarks ? this.remarks : newer.remarks;
        newer.group = this.group ? this.group : newer.group;
        return newer;
     }
}