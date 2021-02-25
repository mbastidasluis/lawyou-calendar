import { useEffect, useReducer, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_CALENDAR from './utils/ApiCalendar';

// Constantes útiles a lo largo del tiempo de ejecución
import { DATE_FORMAT, TIME_FORMAT, MIN_TIME, MAX_TIME, STRING_NOW, CALENDAR_TAGS_ES } from './utils/Constants';

// Traductor de la información de fechas y horas mostradas en el calendario
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
            return { ...state, isError: false };
        case 'LOGOUT':
            return { ...state, data: [], modalEvent: {}, isLoading: false, isError: false };
        case 'ACCOUNT_CHANGE':
            return { ...state, data: [], modalEvent: {} };
        case 'EVENTS_FETCH_SUCCESS':
            return { ...state, data: action.payload, isLoading: false, isError: false };
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

    // Instancia de la API de calendario
    const api = API_CALENDAR;

    const [calendarId, setCalendarId] = useState(api.calendar);

    const [events, dispatchEvents] = useReducer(
        eventsReducer,
        // Estado inicial de variables internas
        { data: [], modalEvent: {}, isLoading: false, isError: false, errorMessage: '', modalIsVisible: false }
    );

    useEffect(() => {
        setCalendarId(api.calendar);
    }, [api.calendar]);

    // Gestión de inicio de sesión - usado en pruebas
    const handleLogin = async () => {
        return await api.handleAuthClick();
    }

    // Gestión de cierre de sesión
    const handleLogout = async () => {
        dispatchEvents({ type: 'WAIT' });
        try {
            await api.handleSignoutClick();
            dispatchEvents({ type: 'LOGOUT' });
        } catch (err) {
            alert(err);
        }
    }

    // Gestión de múltiples calendarios con uns cuenta "Maestra"
    const handleCalendarChange = async (newCalendarId) => {
        // Al cambiar la cuenta se restablecen los valores del calendario por defecto (vacío)
        dispatchEvents({ type: 'ACCOUNT_CHANGE' });

        // Verifica que se seleccione una cuenta válida
        if (newCalendarId === 'none') { return; }

        // Se cambia el id del calendario (correo gmail) en los valores internos de la API
        api.setCalendar(newCalendarId);

        // Se muestra la pantalla de espera
        dispatchEvents({ type: 'WAIT' });

        // Si no se ha autenticado se realiza el proceso inicialmente
        if (!api.sign) {
            try {
                api.handleAuthClick().then(
                    () => {
                        handleGetEvents();
                    }, (e) => {
                        console.log(e.error);
                        api.handleSignoutClick();
                        dispatchEvents({
                            type: 'ERROR',
                            payload: 'Debe autenticarse para poder gestionar la agenda del abogado.'
                        })
                    });
            } catch (e) {
                console.log(e.error);
                api.handleSignoutClick();
                dispatchEvents({
                    type: 'ERROR',
                    payload: 'Imposible iniciar sesión. Verifique e intente nuevamente'
                });
            }
        } else {
            // Se cargan los eventos asociados a la cuenta seleccionada
            handleGetEvents();
        }
    }

    // Listado de calendarios suscritos por la cuenta maestra 
    // Sólo muestra calendarios visibles en en la página de Google Calendar
    // Usado en pruebas
    const handleGetCalendarList = async () => {
        console.log('handleGetCalendarList');
        try {
            let response = await api.listSharedCalendars();
            if (response.status === 200) {
                let { items } = response.result;
                items.map(i => {
                    console.log(i);
                })
            }
        } catch (err) {
            alert(err);
        }
    }


    // Gestión de vista del formulario de edición de citas
    const handleModalClose = () => {
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    // Gestión de selección de celdas del calendario - Prepara los datos para mostrar en el formulario de edición
    const handleEventSelection = (event) => {

        const START_DATE = moment(event.start);
        const END_DATE = moment(event.end);

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

    // Gestión de consulta de eventos del calendario
    const handleGetEvents = () => {
        dispatchEvents({ type: 'WAIT' });

        // El número representa a cantidad máxima de resultados deseados
        api.listUpcomingEvents(10)
            .then(response => {
                let upcomingEvents = response.result.items;

                // Si existen eventos agendados
                if (upcomingEvents.length > 0) {

                    let single = {}, all = [];
                    upcomingEvents.map(upcomingEvent => {
                        // Si el evento es de tipo allDay el tipo de dato de Inicio y fin será Date y no Datetime
                        // Para el calendario es necesario pasar estos valores como Date
                        let start = upcomingEvent.start.dateTime ? new Date(upcomingEvent.start.dateTime) : upcomingEvent.start.date;
                        let end = upcomingEvent.end.dateTime ? new Date(upcomingEvent.end.dateTime) : upcomingEvent.end.date;
                        single = {
                            ...upcomingEvent,
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
                    // Se cargan los datos al calendario y se desactiva la pantalla de espera
                    dispatchEvents({ type: 'EVENTS_FETCH_SUCCESS', payload: all });
                } else {
                    // Se desactiva la pantalla de espera y se pasa un arreglo vacío al calendario
                    dispatchEvents({ type: 'EVENTS_FETCH_SUCCESS', payload: [] });
                }
            }).catch(e => {
                if (e.status === 404) {
                    dispatchEvents({
                        type: 'ERROR',
                        payload: 'Imposible acceder al calendario. Verifique que el propietario haya otorgado su autorización de acceso.'
                    })
                } else {
                    dispatchEvents({ type: 'ERROR', payload: 'Imposible iniciar sesión' });
                }
            });
    }

    // Gestión de los valores temporales usados para crear/actualizar evento
    const handleInputChange = (e) => {
        // console.log(e.target.value);
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

    // Gestión de eliminación de eventos del calendario
    const handleEventDelete = async () => {
        dispatchEvents({ type: 'WAIT' });

        try {
            let response = await api.deleteEvent(events.modalEvent.id);

            if (response.status === 204) {
                dispatchEvents({ type: 'DELETE_EVENT', payload: events.modalEvent });
            }
        } catch (error) {
            dispatchEvents({
                type: 'ERROR',
                payload: 'Imposible eliminar cita. Verifique que el propietario haya otorgado los permisos correspondientes.'
            });
        }

        dispatchEvents({ type: 'MODAL_CLOSE' });
    }


    // Gestión de edición de carga de eventos nuevos/antigüos
    const handleEventSave = async () => {
        dispatchEvents({ type: 'WAIT' });
        let { modalEvent } = events;

        const START_DATE = moment(modalEvent.start_date);
        const END_DATE = moment(modalEvent.end_date);

        // Valida que la hora y fecha de inicio sean inferioses a la hora y fecha de fin de la cita
        if (START_DATE.isAfter(END_DATE) || modalEvent.start_time.split(':')[0] > modalEvent.end_time.split(':')[0]) {
            dispatchEvents({
                type: 'ERROR',
                payload: 'Fecha y hora de inicio de cita deben ser previas a la fecha y hora de fin de la misma.'
            });
            return;
        }

        try {

            // Si el evento gestionado tiene ID entonces se trata de una edición de un evento anterior 
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
                // Creación de un evento nuevo
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
                } else if (response.status === 403) {
                    dispatchEvents({
                        type: 'ERROR',
                        payload: 'No posee autorización para añadir nuevas citas. Por favor, solicite los permisos correspondientes al titular de esta agenda.'
                    });
                }
            }
        } catch (error) {
            dispatchEvents({
                type: 'ERROR',
                payload: 'Imposible modificar agenda. Verifique que el propietario haya otorgado los permisos correspondientes.'
            });
        }
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    const handleErrorMesage = () => {
        dispatchEvents({ type: 'ERROR_CLOSE' });
    }


    return (
        <>
            <div className="container is-fluid">

                <div className="field">
                    <div className="field-body mt-4">
                        <div className="field">
                            {/* Selector de prueba - gestión de múltiples cuentas */}
                            <p className="select">
                                <select onChange={e => handleCalendarChange(e.target.value)}>
                                    <option value="none">Elige una agenda a gestionar</option>
                                    <option value="law.you.test.lawyer@gmail.com">Abogado 2</option>
                                    <option value="law.you.test.abogado@gmail.com">Abogado 3</option>
                                </select>
                            </p>
                        </div>

                        {/* Se ocultan estos botones cuando el id del calendario es igual a 'Primary' - aún no se ha seleccionado cuenta de un socio */}
                        {/* Es decir que estamos hablando de la cuenta maestra - para esta cuenta no gestionamos eventos */}
                        {api.calendar !== 'primary' ?
                            <>
                                <div className="field">
                                    <p className="control is-expanded">
                                        <Button classes={['button', 'is-info']} onClickHandler={handleGetEvents} tag="Actualizar" />
                                    </p>
                                </div>
                                <div className="field">
                                    <p className="control is-expanded">
                                        <Button classes={['button', 'is-danger']} onClickHandler={handleLogout} tag="Cerrar" />
                                    </p>
                                </div>
                            </>
                            : ''}
                    </div>
                </div>

                <hr />
                <div>
                    {/* El calendario mostrado dependerá del estado de inicio de sesión */}
                    {
                        api.sign
                            ?
                            <Calendar
                                selectable                                                  // Habilita la selección de las celdas del calendario
                                min={MIN_TIME}                                              // Hora mínima habilitada para carga de eventos - por defecto las 8H
                                max={MAX_TIME}                                              // Hora máxima habilitada para carga de eventos - por defecto las 20H
                                titleAccessor="summary"                                     // Variable que guarda el título del evento
                                localizer={localizer}                                       // Traductor de fechas mostradas en el calendario
                                events={events.data}                                        // Eventos
                                startAccessor="start"                                       // Variable que guarda el inicio del evento
                                endAccessor="end"                                           // Variable que guarda el fin del evento
                                style={{ height: 640 }}                                     // Estilo / tamaño del calendario (obligatorio)
                                defaultView={'work_week'}                                   // Vista por defecto
                                views={['day', 'work_week', 'agenda']}                      // Vistas disponibles
                                messages={CALENDAR_TAGS_ES}                                 // Traducción de etiqueta
                                onSelectEvent={event => handleEventSelection(event)}        // Gestión de celdas con eventos 
                                onSelectSlot={event => handleEventSelection(event)}         // Gestión de celdas vacías    
                            />
                            :
                            <Calendar
                                events={[]}
                                min={MIN_TIME}
                                max={MAX_TIME}
                                localizer={localizer}
                                style={{ height: 640 }}
                                messages={CALENDAR_TAGS_ES}
                                defaultView={'work_week'}
                                views={['day', 'work_week', 'agenda']}
                            />
                    }
                </div>

                {/* Bloque usado para mostrar mensajes de error */}
                <div className={`notification is-danger is-light ${!events.isError ? 'is-hidden' : ''}`}>
                    <button className="delete" onClick={handleErrorMesage}></button>
                    {events.errorMessage}
                </div>


                {/* Pantalla de espera - modal que inhabilita la interacción con el resto de los componentes mientra se cargan los datos */}
                <div className={`modal ${events.isLoading ? 'is-active' : ''}`}>
                    <div className="modal-background"></div>
                    <div className="modal-content">
                        <progress className="progress is-large is-info" max="100">60%</progress>
                    </div>
                </div>
                {/* --- */}


                {/* Formulario / modal para edición y creación de eventos */}
                <div className={`modal ${events.modalIsVisible ? 'is-active' : ''}`}>
                    {/* <div className={'modal is-active'}> */}
                    <div className="modal-background" onClick={() => handleModalClose()}></div>
                    <div className="modal-card">

                        <header className="modal-card-head">
                            <p className="modal-card-title">{events.modalEvent.id ? 'Editar cita' : 'Agendar cita'}</p>
                            <button className="delete" aria-label="close" onClick={() => handleModalClose()}></button>
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

                        {/* Botones al final del formulario */}
                        <footer className="modal-card-foot">
                            <div className="field is-horizontal">
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
                                    {/* Botén de eliminación - deshabilitado si el evento no cuenta con ID - es un nuevo evento */}
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

{/* Componente Botón Axiliar */ }
const Button = ({ onClickHandler, tag, classes }) => {
    return (
        <>
            <button className={`${classes.join(' ')}`} onClick={onClickHandler}>{`${tag}`}</button>
        </>
    );
};

export default App;
