class GoogleCalendarApi {

    gapi;
    logged;
    SCOPES;
    API_KEY;
    CLIENT_ID;
    DISCOVERY_DOCS;

    constructor(confing) {
        this.gapi = null;
        this.logged = false;
        this.SCOPES = confing['SCOPES'];
        this.API_KEY = confing['API_KEY'];
        this.CLIENT_ID = confing['CLIENT_ID'];
        this.DISCOVERY_DOCS = confing['DISCOVERY_DOCS'];
    }

    handleClientLoad() {
        this.gapi = window['gapi'];
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        document.body.appendChild(script);
        script.onload = () => {
            window['gapi'].load('client:auth2', this.initClient);
        };
    }

    /**
    *  Initializes the API client library and sets up sign-in state
    *  listeners.
    */
    initClient = () => {
        this.gapi = window['gapi'];
        this.gapi.client.init({
            apiKey: this.API_KEY,
            clientId: this.CLIENT_ID,
            discoveryDocs: this.DISCOVERY_DOCS,
            scope: this.SCOPES
        }).then(function () {
            // Listen for sign-in state changes.
            this.gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);

            // Handle the initial sign-in state.
            this.updateSigninStatus(this.gapi.auth2.getAuthInstance().isSignedIn.get());
            this.authorizeButton.onclick = this.handleAuthClick;
            this.signoutButton.onclick = this.handleSignoutClick;
        }, function (error) {
            this.appendPre(JSON.stringify(error, null, 2));
        });
    }

    /**
    *  Called when the signed in status changes, to update the UI
    *  appropriately. After a sign-in, the API is called.
    */
    updateSigninStatus = (isSignedIn) => {
        this.logged = isSignedIn;
        if (this.logged) {
            this.authorizeButton.style.display = 'none';
            this.signoutButton.style.display = 'block';
            this.listUpcomingEvents();
        } else {
            this.authorizeButton.style.display = 'block';
            this.signoutButton.style.display = 'none';
        }
    }

    /**
    *  Sign in the user upon button click.
    */
    handleAuthClick = (event) => {
        this.gapi.auth2.getAuthInstance().signIn();
    }

    /**
    *  Sign out the user upon button click.
    */
    handleSignoutClick = (event) => {
        this.gapi.auth2.getAuthInstance().signOut();
    }


    /**
    * Print the summary and start datetime/date of the next ten events in
    * the authorized user's calendar. If no events are found an
    * appropriate message is printed.
    */
    getUpcomingEvents = () => {
        this.gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        }).then(function (response) {
            var events = response.result.items;

            if (events.length > 0) {
                return events;
            } else {
                return [];
            }
        });
    }

    toString() {
        return JSON.stringify(this);
    }
}

export default GoogleCalendarApi;