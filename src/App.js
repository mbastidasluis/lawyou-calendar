import { useEffect, useReducer, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_CALENDAR from './apis/google/GoogleApiCalendar';
import ApiCalendar from './apis/ApiCalendar';
import { Providers, ProviderState } from '@microsoft/mgt-element';


// Constantes útiles a lo largo del tiempo de ejecución
import { DATE_FORMAT, TIME_FORMAT, MIN_TIME, MAX_TIME, STRING_NOW, CALENDAR_TAGS_ES }
    from './utils/Constants';

// Traductor de la información de fechas y horas mostradas en el calendario
const localizer = momentLocalizer(moment);

const eventsReducer = (state, action) => {
    // console.log('eventsReducer', action);
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
            return { ...state, data: [], modalEvent: {}, };
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
            return { ...state, data: [...state.data, action.payload] };
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

const abogados = [
    {
        id: 'law.you.test.lawyer@gmail.com',
        nombre: 'ABC',
        proveedor: 'google'
    },
    {
        id: 'law.you.test.abogado@gmail.com',
        nombre: 'DEF',
        proveedor: 'google'
    },
    {
        id: 'AQMkADAwATM3ZmYAZS0zYTJkLWQ2ZGQALTAwAi0wMAoARgAAA1SvgvTQIT9Bt-tUQS0SCCAHAP5kivdQvmZHi6aK96ozddIAAAIBBgAAAP5kivdQvmZHi6aK96ozddIAAAIOIAAAAA==',
        nombre: 'GHI',
        proveedor: 'outlook'
    },
]

const App = () => {

    // Instancia de la API de calendario
    const api = API_CALENDAR;
    const _api = new ApiCalendar();

    const [agenda, setAgenda] = useState({});

    const [events, dispatchEvents] = useReducer(
        eventsReducer,
        // Estado inicial de variables internas
        { data: [], modalEvent: {}, lawyer: {}, isLoading: false, isError: false, errorMessage: '', modalIsVisible: false }
    );

    useEffect(() => {
        if (agenda.id) { handleGetEvents(); }
    }, [agenda]);

    // // Gestión de inicio de sesión - usado en pruebas
    // const handleLogin = async () => {
    //     return await api.handleAuthClick();
    // }

    // Gestión de cierre de sesión
    const handleLogout = async () => {
        dispatchEvents({ type: 'WAIT' });
        try {
            await _api.logout();
            dispatchEvents({ type: 'LOGOUT' });
        } catch (err) {
            alert(err);
        }
    }

    ////////CUSTOM HOOK/////////////////////////

    const useIsSignedIn = () => {
        const [isSignedIn, setIsSignedIn] = useState(false);

        useEffect(() => {
            const updateState = () => {
                const provider = Providers.globalProvider;
                setIsSignedIn(provider && provider.state === ProviderState.SignedIn);
            };

            Providers.onProviderUpdated(updateState);
            updateState();

            return () => {
                Providers.removeProviderUpdatedListener(updateState);
            }
        }, []);

        return [isSignedIn];
    }

    const [isSignedIn] = useIsSignedIn();


    ////////MICROSOFT/////////////////////////


    const handleCalendarChange = async (newAgenda) => {
        // Los datos de la agenda son pasados como String
        let _agenda = JSON.parse(newAgenda);

        // Verifica que se seleccione una cuenta
        if (!_agenda.id) { return; }

        // Al cambiar la cuenta se restablecen los valores del calendario por defecto (vacío)
        dispatchEvents({ type: 'ACCOUNT_CHANGE' });

        // Se actualizan los datos de la agenda a administrar
        setAgenda(_agenda);
    }



    // Gestión de vista del formulario de edición de citas
    const handleModalClose = () => {
        dispatchEvents({ type: 'MODAL_CLOSE' });
    }

    // Gestión de selección de celdas del calendario.
    // Prepara los datos para mostrar en el formulario de edición
    const handleEventSelection = (event) => {

        const START_DATE = moment(event.start);
        const END_DATE = moment(event.end);

        dispatchEvents({
            type: 'SINGLE_EVENT_MANAGEMENT',
            payload: {
                ...event,
                title: event.id ? event.title : 'Nuevo Evento',
                start_date: START_DATE.format(DATE_FORMAT),
                end_date: END_DATE.format(DATE_FORMAT),
                start_time: START_DATE.format(TIME_FORMAT),
                end_time: END_DATE.format(TIME_FORMAT)
            }
        });

    };

    // Gestión de consulta de eventos del calendario
    const handleGetEvents = async () => {
        dispatchEvents({ type: 'WAIT' });
        // Los datos del abogado son pasados como String

        let eventos;

        // Si no se ha autenticado se realiza el proceso inicialmente
        try {
            eventos = await _api.getEvents(agenda.id, agenda.proveedor);
            // console.log("eventos", eventos);
            if (eventos) {
                dispatchEvents({ type: 'EVENTS_FETCH_SUCCESS', payload: eventos });
            }
            else {
                dispatchEvents({ type: 'EVENTS_FETCH_SUCCESS', payload: [] });
            }
        } catch (e) {
            // console.log(e.error);
            dispatchEvents({
                type: 'ERROR',
                payload: 'Imposible consultar eventos. Verifique e intente de nuevo.'
            });
        }

    }

    // Gestión de los valores temporales usados para crear/actualizar evento
    const handleInputChange = (e) => {
        // console.log(e.target.value);
        let { modalEvent } = events;

        switch (e.target.id) {
            case 'title':
                dispatchEvents({ type: 'UPDATE_MODAL_EVENT', payload: { ...modalEvent, title: e.target.value } });
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
            let response = await _api.deleteEvent(agenda.proveedor, agenda.id, events.modalEvent.id);
            if (response.status === 204) {
                dispatchEvents({
                    type: 'DELETE_EVENT',
                    payload: events.modalEvent
                });
            }
        } catch (error) {
            dispatchEvents({
                type: 'ERROR',
                payload:
                    `Imposible eliminar cita.
                     Verifique que el propietario haya otorgado los permisos correspondientes.`
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
            // console.log('handleEventSave -- agenda', agenda);
            let result = await _api.saveEvent(agenda.id, agenda.proveedor, modalEvent);

            // Existen dos posibles valores para la variable 'mode': 'update'|'create'. 
            // Si ninguno de estos valores retorna en el resultado se asume un error en el proceso
            let modType = result.mode === 'update'
                ? 'UPDATE_EVENT'
                : result.mode === 'create'
                    ? 'CREATE_EVENT'
                    : 'ERROR';

            if (modType === 'ERROR') {
                dispatchEvents({
                    type: 'ERROR',
                    payload: 'Imposible modificar agenda. Verifique los valores suminstrados e intente de nuevo.'
                });
            } else {
                dispatchEvents({
                    type: modType,
                    payload: result
                });
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
                                    {abogados.map(abogado =>
                                        <option key={abogado.id} value={JSON.stringify(abogado)}>
                                            {abogado.nombre} - {abogado.proveedor}
                                        </option>
                                    )}
                                </select>
                            </p>
                        </div>


                        {/* Se ocultan estos botones cuando el id del calendario es igual a 'Primary' - aún no se ha seleccionado cuenta de un socio */}
                        {/* Es decir que estamos hablando de la cuenta maestra - para esta cuenta no gestionamos eventos */}
                        {api.calendar !== 'primary' ?
                            <>
                                <div className="field">
                                    <p className="control is-expanded">
                                        <Button
                                            classes={['button', 'is-info']}
                                            onClickHandler={handleGetEvents}
                                            tag="Actualizar" />
                                    </p>
                                </div>
                                <div className="field">
                                    <p className="control is-expanded">
                                        <Button
                                            classes={['button', 'is-danger']}
                                            onClickHandler={handleLogout}
                                            tag="Cerrar" />
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
                                // titleAccessor="summary"                                  // Variable que guarda el título del evento
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
                                            <input id="title" className="input" type="text" placeholder="Text input" value={events.modalEvent.title} onChange={e => handleInputChange(e)} />
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
