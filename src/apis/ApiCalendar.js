import moment from 'moment';
import 'moment/locale/es';

import * as graph from './microsoft/index';
import google from './google/GoogleApiCalendar';


// mail: law.you.test@gmail.com -- id: 67837593282dbaf8
// mail: law.you.test.lawyer@gmail.com -- id: 5f02525e30ae6965
// mail: law.you.test.lawyer@gmail.com -- calendarId: AQMkADAwATM3ZmYAZS0zYTJkLWQ2ZGQALTAwAi0wMAoARgAAA1SvgvTQIT9Bt-tUQS0SCCAHAP5kivdQvmZHi6aK96ozddIAAAIBBgAAAP5kivdQvmZHi6aK96ozddIAAAIOIAAAAA==



class ApiCalendar {

    async getUserDetails() {
        let events = await this.graph.getUserDetails();
        console.log(events);
    }

    // ************************* GET EVENTS *************************
    async getEvents(id, provider) {
        // let events =
        return await provider === 'google'
            ? this.getGoogleEvents(id)
            : this.getGraphEvents(id);
        // console.log(events);
    }

    async getGoogleEvents(id) {
        let single = {}, all = [];

        if (!google.sign) {
            await google.handleAuthClick()
        }

        // Se cambia el id del calendario (correo gmail) en los valores internos de la API
        google.setCalendar(id);

        // El número representa a cantidad máxima de resultados deseados
        let response = await google.listUpcomingEvents(10)
        let upcomingEvents = response.result.items;

        if (upcomingEvents.length > 0) {

            upcomingEvents.map(upcomingEvent => {
                // Si el evento es de tipo allDay el tipo de dato de Inicio y fin será Date y no Datetime
                // Para el calendario es necesario pasar estos valores como Date
                let start = upcomingEvent.start.dateTime ? new Date(upcomingEvent.start.dateTime) : upcomingEvent.start.date;
                let end = upcomingEvent.end.dateTime ? new Date(upcomingEvent.end.dateTime) : upcomingEvent.end.date;
                single = {
                    ...upcomingEvent,
                    title: upcomingEvent.summary,
                    start: start,
                    start_time: moment(start).format('MM:ss'),
                    end: end,
                    end_time: moment(end).format('MM:ss'),
                    // allDay: false
                };
                // console.log("SINGLE", single);
                all.push(single);
            });
            // console.log("ALL", all);
            return all;
        } else {
            return [];
        }

    }

    async getGraphEvents(id) {
        let single = {}, all = [];

        let response = await graph.getEventsFromSharedCalendar(id);
        let upcomingEvents = response.value;

        if (upcomingEvents.length > 0) {

            upcomingEvents.map(upcomingEvent => {
                // console.log('ApiCalendar -- getGraphEvents -- upcomingEvent', upcomingEvent);
                // Si el evento es de tipo allDay el tipo de dato de Inicio y fin será Date y no Datetime
                // Para el calendario es necesario pasar estos valores como Date
                let start = upcomingEvent.start.dateTime
                    ? moment(upcomingEvent.start.dateTime).toDate()
                    : upcomingEvent.start.date;

                let end = upcomingEvent.end.dateTime
                    ? moment(upcomingEvent.end.dateTime).toDate()
                    : upcomingEvent.end.date;
                single = {
                    ...upcomingEvent,
                    title: upcomingEvent.subject,
                    start: start,
                    start_time: moment(start).format('MM:ss'),
                    end: end,
                    end_time: moment(end).format('MM:ss'),
                    // allDay: false
                };
                // console.log("SINGLE", single);
                all.push(single);
            });
            // console.log("getGraphEvents -- all ", all);
            return all;
        } else {
            return [];
        }


    }

    // ************************* GET EVENTS *************************


    // ************************* SAVE EVENT *************************
    async saveEvent(id, provider, event) {
        return await
            provider === 'google'
            ? this.saveGoogleEvent(id, event)
            : provider === 'outlook'
                ? this.saveGraphEvent(id, event)
                : 'ERROR';
    }

    async saveGoogleEvent(id, event) {
        let response;
        google.setCalendar(id);

        event = {
            ...event,
            summary: event.title,
            start: {
                dateTime: moment(event.start_date + ' ' + event.start_time).toISOString(),
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: moment(event.end_date + ' ' + event.end_time).toISOString(),
                timeZone: 'Europe/Madrid',
            },
        };

        try {
            // Si el evento gestionado tiene ID entonces se trata de una edición de un evento anterior 
            if (event.id) {
                response = await google.updateEvent(event, event.id);
            } else {
                response = await google.createEvent(event);
            }

            if (response.status === 200) {
                let { result } = response;

                return {
                    ...result,
                    title: result.summary,
                    start: result.start.dateTime ? new Date(result.start.dateTime) : result.start.date,
                    end: result.end.dateTime ? new Date(result.end.dateTime) : result.end.date,
                    mode: event.id ? 'update' : 'create'
                };
            } else {
                console.log(
                    'ApiCalendar  -- saveGoogleEvent',
                    'No posee autorización. Por favor, solicite los permisos correspondientes al titular de esta agenda.'
                );
            }
        } catch (error) {
            console.log(
                'ApiCalendar  -- saveGoogleEvent ',
                error
            );
        }
    }

    async saveGraphEvent(calendarId, event) {
        let response;

        event = {
            ...event,
            subject: event.title,
            start: {
                dateTime: event.start_date + ' ' + event.start_time,
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: event.end_date + ' ' + event.end_time,
                timeZone: 'Europe/Madrid',
            },
        };

        try {
            if (event.id) {
                response = await graph.updateSharedEvent(calendarId, event.id, this.strip(event))
            } else {
                response = await graph.createSharedEvent(calendarId, this.strip(event));
            }

            // console.log('saveGraphEvent -- response', response);
            // if (response.status === 200 || response.status === 201) {

            return {
                ...response,
                title: response.subject,
                start: response.start.dateTime ? new Date(response.start.dateTime) : response.start.date,
                end: response.end.dateTime ? new Date(response.end.dateTime) : response.end.date,
                mode: event.id ? 'update' : 'create'
            }
            // } else {
            //     console.log(
            //         'ApiCalendar  -- saveGraphEvent',
            //         'No posee autorización para añadir nuevas citas. Por favor, solicite los permisos correspondientes al titular de esta agenda.'
            //     );
            // }
        } catch (error) {
            console.log('ApiCalendar -- saveGraphEvent -- error', error);
        }

    }

    // ************************* SAVE EVENT *************************

    // ************************* DELETE EVENT *************************
    async deleteEvent(provider, agendaId, eventId) {
        return await
            provider === 'google'
            ? this.deleteGoogleEvent(agendaId, eventId)
            : provider === 'outlook'
                ? this.deleteGraphEvent(agendaId, eventId)
                : 'ERROR';
    }

    async deleteGoogleEvent(agendaId, eventId) {
        google.setCalendar(agendaId);
        return await google.deleteEvent(eventId);

    }

    async deleteGraphEvent(agendaId, eventId) {
        let res; try {
            res = await graph.deleteSaredEvent(agendaId, eventId);
            return res;
        } catch (error) {
            console.log(
                'ApiCalendar  -- deleteGraphEvent',
                error
            );
        }

    }

    // ************************* DELETE EVENT *************************


    async logout() {
        try {
            await google.handleSignoutClick();
            await graph.logout();
        } catch (error) { console.error(); }
    }



    prepareEvent(event) {
        return {
            ...event,
            subject: event.title,
            // summary: event.title,
            start: {
                dateTime: moment(event.start_date + ' ' + event.start_time).toISOString(),
                timeZone: 'Europe/Madrid',
            },
            end: {
                dateTime: moment(event.end_date + ' ' + event.end_time).toISOString(),
                timeZone: 'Europe/Madrid',
            },
        };
    }

    /**
     * Método usado para despoja al objeto evento que se enviará al servidos de 
     * otlook de las propiedades que generar conflivto. Cualquier propiedad incluida
     * abajo será obviada del nuevobjeto creado.
     * @param {any} eventObject Variable objeto que representa un evento de Outlook
     */
    strip(eventObject) {
        const { slots, resourceId, action, bounds, box, title, start_date, end_date, start_time, end_time, mode, ...newEventObject } = eventObject;
        // console.log('Stripped object', newEventObject);
        return newEventObject;
    }

}

export default ApiCalendar;