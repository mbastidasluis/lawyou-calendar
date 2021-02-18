import { useEffect, useReducer, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_CALENDAR from './components/ApiCalendar';

const localizer = momentLocalizer(moment);

const eventsReducer = (state, action) => {
    switch (action.type) {
        case 'WAIT':
            return { ...state, isLoading: true, isError: false };
        case 'LOGIN_SUCCESS':
            return { ...state, isLoading: false, isError: false, isLoged: true };
        case 'LOGOUT':
            return { ...state, data: [], isLoading: false, isError: false, isLoged: false };
        case 'EVENTS_FETCH_SUCCESS':
            return { ...state, data: action.payload, isLoading: false, isError: false };
        case 'EVENTS_FETCH_FAILURE':
            return { ...state, isLoading: false, isError: true };
        case 'SINGLE_EVENT_MANAGEMENT':
            return { ...state, modalIsVisible: true, modalEvent: action.payload };
        case 'SINGLE_EVENT_MANAGEMENT_SUCCESS':
            return { ...state, modalIsVisible: false, modalEvent: {} };
        case 'UPDATE_MODAL_EVENT':
            return { ...state, modalEvent: action.payload };
        case 'MODAL_CLOSE':
            return { ...state, isLoading: false, modalIsVisible: false, modalEvent: {} };
        case 'CREATE_EVENT':
            return { ...state, data: state.data.concat(action.payload) };
        case 'UPDATE_EVENT':

            let eventIndex = state.data.findIndex(event => event.id === action.payload.id);
            let newEventsArray = [...state.data];
            newEventsArray[eventIndex] = action.payload;
            return { ...state, data: newEventsArray };

        case 'DELETE_EVENT':
            return { ...state, data: state.data.filter(event => action.payload.id !== event.id) };
        default:
            throw new Error();
    }
};

const App = () => {
    const api = API_CALENDAR;

    // const [modalEvent, setModalEvent] = useState({ summary: 'Título', start: new Date(), end: new Date() });

    const [events, dispatchEvents] = useReducer(
        eventsReducer,
        { data: [], modalEvent: {}, isLoading: false, isError: false, isLoged: false, modalIsVisible: false }
    );

    const handleLogin = async (event) => {
        dispatchEvents({ type: 'WAIT' });
        try {
            await api.handleAuthClick();
            dispatchEvents({ type: 'LOGIN_SUCCESS' });
        } catch (err) {
            alert(err);
        }
    }

    const handleLogout = async (event) => {
        dispatchEvents({ type: 'WAIT' });
        try {
            await api.handleSignoutClick();
            dispatchEvents({ type: 'LOGOUT' });
        } catch (err) {
            alert(err);
        }
    }

    const handleModalClose = (event) => {
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    const handleEventSelection = (event = undefined) => {

        // console.log('handleEventSelection - PRE-DISPATCH ');
        // console.log('EVENT');
        // console.log(event);
        // console.log('MODAL EVENT');
        // console.log(events.modalEvent);
        // console.log('MODAL');
        // console.log(events.modalIsVisible);

        dispatchEvents({ type: 'SINGLE_EVENT_MANAGEMENT', payload: event });

        // console.log('handleEventSelection - POST-DISPATCH ');
        // console.log('EVENT');
        // console.log(event);
        // console.log('MODAL EVENT');
        // console.log(events.modalEvent);
        // console.log('MODAL');
        // console.log(events.modalIsVisible);

        try {
            if (event) {
                // alert('SINGLE_EVENT_MANAGEMENT');
                // alert('UPDATE_EVENT');
                // dispatchEvents({ type: 'UPDATE_EVENT', payload: event });
            } else {
                // alert('SINGLE_EVENT_MANAGEMENT');
                // alert('CREATE_EVENT');

                dispatchEvents({ type: 'CREATE_EVENT', payload: {} });
            }

            // dispatchEvents({ type: 'SINGLE_EVENT_MANAGEMENT_SUCCESS' });
        } catch (err) {
            console.log(err);
        }

    };

    const handleGetEvents = (e) => {
        dispatchEvents({ type: 'WAIT' });

        api.listUpcomingEvents(5)
            .then(response => {
                let upcomingEvents = response.result.items;

                if (upcomingEvents.length > 0) {

                    let single = {}, all = [];
                    upcomingEvents.map(upcomingEvent => {
                        single = {
                            ...upcomingEvent,
                            // title: upcomingEvent.summary,
                            start: new Date(upcomingEvent.start.dateTime),
                            end: new Date(upcomingEvent.end.dateTime),
                            allDay: false
                        };
                        // console.log("SINGLE");
                        // console.log(single);
                        all.push(single);
                    });
                    // console.log("ALL");
                    // console.log(all);
                    dispatchEvents({ type: 'EVENTS_FETCH_SUCCESS', payload: all });
                } else {
                    dispatchEvents({ type: 'EVENTS_FETCH_SUCCESS', payload: [] });
                }
            });
    }

    const handleInputChange = (e) => {

        let { modalEvent } = events;

        switch (e.target.id) {
            case 'summary':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, summary: e.target.value } });
                break;
            case 'init_date':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, start: e.target.value } });
                break;
            case 'end_date':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, end: e.target.value } });
                break;
            default:
                console.log('something odd happened!');
        }
    }

    const handleEventDelete = () => {
        dispatchEvents({ type: 'WAIT' });

        let response = api.deleteEvent(events.modalEvent.id);

        if (response.status === 204) {
            dispatchEvents({ type: 'DELETE_EVENT', payload: events.modalEvent });
        }


        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    const handleEventSave = () => {
        let { modalEvent } = events;

        if (modalEvent.id) {
            dispatchEvents({ type: 'UPDATE_EVENT', payload: modalEvent });
        } else {
            dispatchEvents({ type: 'CREATE_EVENT', payload: modalEvent });
        }
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }




    return (
        <>
            <div className="container is-fluid">
                <div>
                    <p>
                        Calendar
                    </p>
                    <div className="buttons">
                        {events.isLoged
                            ? <LogedButtons getEventsHandler={handleGetEvents} logoutHandler={handleLogout} />
                            : <LogoutButtons signInHandler={handleLogin} />}
                    </div>
                </div>
                <hr />
                <div>
                    {
                        events.isLoged

                            ?
                            <Calendar
                                selectable
                                titleAccessor="summary"
                                localizer={localizer}
                                events={events.data}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 640 }}
                                onSelectEvent={event => handleEventSelection(event)}
                                onSelectSlot={() => handleEventSelection()}
                            />
                            :

                            <Calendar localizer={localizer} events={[]} style={{ height: 640 }} />
                    }
                </div>


                {/* Loading indicator */}
                <div className={`modal ${events.isLoading ? 'is-active' : ''}`}>
                    <div className="modal-background"></div>
                    <div className="modal-content">
                        <progress className="progress is-large is-info" max="100">60%</progress>
                    </div>
                </div>
                {/* --- */}


                {/* Event editing modal */}
                <div className={`modal ${events.modalIsVisible ? 'is-active' : ''}`}>
                    {/* <div className={'modal is-active'}> */}
                    <div className="modal-background" onClick={(e) => handleModalClose(e)}></div>
                    <div className="modal-content">

                        <div className="field">
                            <label className="label">Título</label>
                            <div className="control">
                                <input id="summary" className="input" type="text" placeholder="Text input" value={events.modalEvent.summary} onChange={e => handleInputChange(e)} />
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Inicio</label>
                            <div className="control has-icons-right">
                                <input id="init_date" className="input" type="date" placeholder="Inicio" value={events.modalEvent.start} onChange={(e) => handleInputChange(e)} />
                                <span className="icon is-small is-right">
                                    <i className="fas fa-check"></i>
                                </span>
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Fin</label>
                            <div className="control has-icons-right">
                                <input id="end_date" className="input" type="date" placeholder="Fin" value={events.modalEvent.end} onChange={(e) => handleInputChange(e)} />
                                <span className="icon is-small is-right">
                                    <i className="fas fa-check"></i>
                                </span>
                            </div>
                        </div>


                        <div className="field is-grouped">
                            <p className="control">
                                <Button classes={["button", "is-link"]} onClickHandler={handleEventSave} tag="Save" />
                            </p>
                            <p className="control">
                                <Button classes={["button"]} onClickHandler={handleModalClose} tag="Close" />
                            </p>
                            <p className="control">
                                <Button classes={["button", "is-danger"]} onClickHandler={handleEventDelete} tag="Delete" />
                            </p>
                        </div>

                    </div>
                    <button className="modal-close is-large" aria-label="close" onClick={(e) => handleModalClose(e)}></button>
                </div>
            </div>
            {/* --- */}
        </>
    );
};

const Button = ({ onClickHandler, tag, classes }) => {
    return (
        <>
            <button className={`${classes.join(' ')}`} onClick={onClickHandler}>{`${tag}`}</button>
        </>
    );
};

const LogedButtons = ({ getEventsHandler, logoutHandler }) =>
    <>
        <Button classes={['button', 'is-info']} onClickHandler={getEventsHandler} tag="Get Events" />
        <Button classes={['button', 'is-danger']} onClickHandler={logoutHandler} tag="Sign-Out" />
    </>;

const LogoutButtons = ({ signInHandler }) =>
    <>
        <Button classes={['button', 'is-success']} onClickHandler={signInHandler} tag="Sign-In" />
    </>;

export default App;
