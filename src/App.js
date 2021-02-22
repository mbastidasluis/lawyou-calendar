import { useEffect, useReducer, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_CALENDAR from './components/ApiCalendar';

const DATE_FORMAT = 'yyyy-MM-DD';
const TIME_FORMAT = 'HH:mm';
const NOW = moment();
const STRING_NOW = moment().format(DATE_FORMAT);

const localizer = momentLocalizer(moment);


const eventsReducer = (state, action) => {
    switch (action.type) {
        case 'WAIT':
            return { ...state, isLoading: true, isError: false };
        case 'ERROR':
            return { ...state, isLoading: false, modalIsVisible: false, isError: true, errorMessage: action.payload };
        case 'ERROR_CLOSE':
            return { ...state, isLoading: false, isError: false, errorMessage: '' };
        case 'LOGIN_SUCCESS':
            return { ...state, isError: false, isLoged: true };
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

    const [userName, setUserName] = useState(undefined);

    const [events, dispatchEvents] = useReducer(
        eventsReducer,
        { data: [], modalEvent: {}, isLoading: false, isError: false, errorMessage: '', isLoged: false, modalIsVisible: false }
    );

    useEffect(() => {
        if (events.isLoged) {
            let profile = api.getBasicUserProfile();
            setUserName(profile.getName());
        } else {
            setUserName(undefined);
        }
    }, [events.isLoged]);

    const handleLogin = async () => {
        dispatchEvents({ type: 'WAIT' });
        try {
            await api.handleAuthClick();
            dispatchEvents({ type: 'LOGIN_SUCCESS' });
            //Get events automaticalli
            handleGetEvents();
        } catch (err) {
            alert(err);
        }
    }

    const handleLogout = async () => {
        dispatchEvents({ type: 'WAIT' });
        try {
            await api.handleSignoutClick();
            dispatchEvents({ type: 'LOGOUT' });
        } catch (err) {
            alert(err);
        }
    }

    const handleModalClose = () => {
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    const handleEventSelection = (event) => {

        //Avoid creating events in the past
        if (NOW.isAfter(event.start)) { return; }

        const START_DATE = moment(event.start);
        const END_DATE = moment(event.end);
        // alert('SINGLE_EVENT_MANAGEMENT');
        // alert('UPDATE_EVENT');
        dispatchEvents({
            type: 'SINGLE_EVENT_MANAGEMENT',
            payload: {
                ...event,
                summary: event.id ? event.summary : 'Nuevo Evento',
                start_date: START_DATE.format(DATE_FORMAT),
                end_date: END_DATE.format(DATE_FORMAT),
                start_time: START_DATE.format(TIME_FORMAT),
                end_time: END_DATE.format(TIME_FORMAT)
            }
        });

    };

    const handleGetEvents = () => {
        dispatchEvents({ type: 'WAIT' });

        try {
            api.listUpcomingEvents(5)
                .then(response => {
                    let upcomingEvents = response.result.items;
                    // console.log('handleGetEvents');
                    // console.log('upcomingEvents');
                    // console.log(upcomingEvents);

                    if (upcomingEvents.length > 0) {

                        let single = {}, all = [];
                        upcomingEvents.map(upcomingEvent => {
                            // For some reason there are times where the start and ending time of event comes as DateTime and other as just date (!?) 
                            let start = upcomingEvent.start.dateTime ? new Date(upcomingEvent.start.dateTime) : upcomingEvent.start.date;
                            let end = upcomingEvent.end.dateTime ? new Date(upcomingEvent.end.dateTime) : upcomingEvent.end.date;
                            single = {
                                ...upcomingEvent,
                                // title: upcomingEvent.summary,
                                start: start,
                                start_time: moment(start).format('MM:ss'),
                                end: end,
                                end_time: moment(end).format('MM:ss'),
                                // allDay: false
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
        } catch (err) {
            console.log(err);
            dispatchEvents({ type: 'EVENTS_FETCH_FAILURE' });
        }
    }

    const handleInputChange = (e) => {
        console.log(e.target.value);
        let { modalEvent } = events;

        switch (e.target.id) {
            case 'summary':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, summary: e.target.value } });
                break;
            case 'init_date':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, start_date: (e.target.value) } });
                break;
            case 'init_date_time':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, start_time: (e.target.value) } });
                break;
            case 'end_date':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, end_date: (e.target.value) } });
                break;
            case 'end_date_time':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, end_time: (e.target.value) } });
                break;
            default:
                console.log('something odd happened!');
        }
    }

    const handleEventDelete = async () => {
        dispatchEvents({ type: 'WAIT' });

        let response = await api.deleteEvent(events.modalEvent.id);

        if (response.status === 204) {
            dispatchEvents({ type: 'DELETE_EVENT', payload: events.modalEvent });
        }

        dispatchEvents({ type: 'MODAL_CLOSE' });
    }


    const handleEventSave = async () => {
        dispatchEvents({ type: 'WAIT' });
        let { modalEvent } = events;

        const START_DATE = moment(modalEvent.start_date);
        const END_DATE = moment(modalEvent.end_date);

        if (START_DATE.isAfter(END_DATE) || modalEvent.start_time.split(':')[0] > modalEvent.end_time.split(':')[0]) {
            dispatchEvents({
                type: 'ERROR',
                payload: 'Fecha y hora de inicio de cita deben ser previas a la fecha y hora de fin de la misma.'
            });
            return;
        }


        if (modalEvent.id) {
            let response = await api.updateEvent({
                ...modalEvent,
                // start: new Date(modalEvent.start).toISOString(),
                // end: new Date(modalEvent.end).toISOString()
                start: {
                    dateTime: moment(modalEvent.start_date + ' ' + modalEvent.start_time).toISOString(),
                    timeZone: 'Europe/Madrid',
                },
                end: {
                    dateTime: moment(modalEvent.end_date + ' ' + modalEvent.end_time).toISOString(),
                    timeZone: 'Europe/Madrid',
                },
            }, modalEvent.id);
            // console.log('UPDATE_EVENT');
            // console.log(response.status);

            if (response.status === 200) {
                let { result } = response;

                dispatchEvents({
                    type: 'UPDATE_EVENT', payload:
                    {
                        ...result,
                        start: result.start.dateTime ? new Date(result.start.dateTime) : result.start.date,
                        end: result.end.dateTime ? new Date(result.end.dateTime) : result.end.date,
                    }
                });
            }
        } else {
            let response = await api.createEvent(
                {
                    ...modalEvent,
                    // start: new Date(modalEvent.start).toISOString(),
                    // end: new Date(modalEvent.end).toISOString()
                    start: {
                        dateTime: moment(modalEvent.start_date + ' ' + modalEvent.start_time).toISOString(),
                        timeZone: 'Europe/Madrid',
                    },
                    end: {
                        dateTime: moment(modalEvent.end_date + ' ' + modalEvent.end_time).toISOString(),
                        timeZone: 'Europe/Madrid',
                    },
                });


            if (response.status === 200) {
                let { result } = response;


                dispatchEvents({
                    type: 'CREATE_EVENT',
                    payload:
                    {
                        ...result,
                        start: result.start.dateTime ? new Date(result.start.dateTime) : result.start.date,
                        end: result.end.dateTime ? new Date(result.end.dateTime) : result.end.date,
                    }
                });
            }
        }
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    const handleErrorMesage = () => {
        dispatchEvents({ type: 'ERROR_CLOSE' });
    }


    return (
        <>
            <div className="container is-fluid">
                <div>
                    <p>
                        {/* Name of the user's agenda that's being managed */}
                        {userName ? <>Agenda de <strong>{userName}</strong></> : 'Calendario'}
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
                                onSelectSlot={event => handleEventSelection(event)}
                            // onSelectSlot={(e)=>console.log(e)}
                            />
                            :

                            <Calendar localizer={localizer} events={[]} style={{ height: 640 }} />
                    }
                </div>

                {/* TODO Progamatically change message and style of this component */}
                <div className={`notification is-danger is-light ${!events.isError ? 'is-hidden' : ''}`}>
                    <button className="delete" onClick={handleErrorMesage}></button>
                    {events.errorMessage}
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
                    <div className="modal-background" onClick={() => handleModalClose()}></div>
                    <div className="modal-card">

                        <header className="modal-card-head">
                            <p className="modal-card-title">{events.modalEvent.id ? 'Editar cita' : 'Agendar cita'}</p>
                            <button className="delete" aria-label="close"></button>
                        </header>

                        <section className="modal-card-body">
                            <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                    <label className="label">Título</label>
                                </div>
                                <div className="field-body">
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left">
                                            <input id="summary" className="input" type="text" placeholder="Text input" value={events.modalEvent.summary} onChange={e => handleInputChange(e)} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                    <label className="label">Inicio</label>
                                </div>
                                <div className="field-body">
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left">
                                            <input id="init_date" className="input" type="date" min={STRING_NOW} placeholder="Inicio" value={events.modalEvent.start_date} onChange={(e) => handleInputChange(e)} />
                                        </p>
                                    </div>
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left has-icons-right">
                                            <input id="init_date_time" className="input" type="time" min="08:00" max="18:00" value={events.modalEvent.start_time} onChange={(e) => handleInputChange(e)} />
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                    <label className="label">Fin</label>
                                </div>
                                <div className="field-body">
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left">
                                            <input id="end_date" className="input" type="date" min={STRING_NOW} placeholder="Fin" value={events.modalEvent.end_date} onChange={(e) => handleInputChange(e)} />
                                        </p>
                                    </div>
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left has-icons-right">
                                            <input id="end_date_time" className="input" type="time" min="08:00" max="18:00" value={events.modalEvent.end_time} onChange={(e) => handleInputChange(e)} />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <footer className="modal-card-foot">
                            <div className="field is-horizontal">
                                <div className="field-label is-normal">
                                    <label className="label"></label>
                                </div>
                                <div className="field-body">
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left">
                                            <Button classes={["button", "is-link"]} onClickHandler={handleEventSave} tag="Guardar" />
                                        </p>
                                    </div>
                                    <div className="field">
                                        <p className="control is-expanded has-icons-left">
                                            <Button classes={["button"]} onClickHandler={handleModalClose} tag="Cerrar" />
                                        </p>
                                    </div>
                                    {events.modalEvent.id &&
                                        <p className="control">
                                            <div className="field">
                                                <p className="control is-expanded has-icons-left">
                                                    <Button classes={["button", "is-danger"]} onClickHandler={handleEventDelete} tag="Eliminar" />
                                                </p>
                                            </div>
                                        </p>
                                    }

                                </div>
                            </div>
                        </footer>
                    </div>
                    <button className="modal-close is-large" aria-label="close" onClick={handleModalClose}></button>
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
        <Button classes={['button', 'is-info']} onClickHandler={getEventsHandler} tag="Actualizar" />
        <Button classes={['button', 'is-danger']} onClickHandler={logoutHandler} tag="Cerrar" />
    </>;

const LogoutButtons = ({ signInHandler }) =>
    <>
        <Button classes={['button', 'is-success']} onClickHandler={signInHandler} tag="Sincronizar" />
    </>;

export default App;
