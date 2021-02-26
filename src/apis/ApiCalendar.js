import * as graph from './microsoft/GraphApiCalendar';
import apiCalendar from './google/GoogleApiCalendar';

class ApiCalendar {
    provider;
    graph;
    google;
    constructor() {
        this.provider = undefined;
        this.graph = graph;
        this.google = apiCalendar;
    }

    async getEvents() {
        let events = await this.graph.getEvents();
        console.log(events);
    }

    async getUserDetails() {
        let events = await this.graph.getUserDetails();
        console.log(events);
    }



}

export default ApiCalendar;