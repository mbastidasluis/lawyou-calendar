import { Client, ResponseType } from "@microsoft/microsoft-graph-client";
import { MIN_TIME } from "../../utils/Constants";
import { authProvider, msalApplication } from './Config';

const options = {
    authProvider, // An instance created from previous step
};
const client = Client.initWithMiddleware(options);

// authProvider.getAccessToken().then(at => { console.log(at) }).catch(at => { console.log(at) });

const masterAccountId = 'law.you.test@gmail.com';
// const masterAccountId = 'law.you.test.lawyer@gmail.com';

// (() => { console.log(msalApplication.getAccount()); })();



export const getUserDetails = async (userId = masterAccountId) => {
    try {
        return await client.api(`/users/${userId}`).get();
    } catch (error) {
        console.log(error);
    }
}

export const getUserCalendars = async (userId = masterAccountId) => {
    try {
        return await client.api(`/users/${userId}/calendars`).get();
    } catch (error) {
        console.log(error);
    }
}

// Debe ser usado por el propietario del calendario
export const getUserCalendarPermissions = async (userId = masterAccountId) => {
    try {
        return await client.api(`/users/${userId}/calendar/calendarPermissions`).version('beta').get();
    } catch (error) {
        console.log(error);
    }
}
/**
 *      Obtener detalles de un calendario compartido con esta cuenta 
 * @param {string} sharedCalendarId: Id del calendario compartido (correo outlook)
 * @param {string} userId: Id de la cuenta 'maestra" - Su valor se asigna por defecto dede archivo de configración
 * @returns {Promise}
 */
export const gePropertiesOfSharedCalendar = async (sharedCalendarId, userId = masterAccountId) => {
    try {
        return await client.api(`/users/${userId}/calendars/${sharedCalendarId}`).version('beta').get();
    } catch (error) {
        console.log(error);
    }
}

export const getUserEvents = async (userId = masterAccountId) => {
    try {
        return await client.api(`/users/${userId}/events`).get();
    } catch (error) {
        console.log(error);
    }
}

/**
 * Devuelve listado de todos los eventos un calendario compartido 
 * @param {string} calendarId Id del calendario del cual se consultan los eventos
 * @returns {Promise}
 */
export const getEventsFromSharedCalendar = async (calendarId) => {
    try {
        return await client
            .api(`/me/calendars/${calendarId}/events`)
            // Select only data of interest
            .select(['subject', 'body', 'start', 'end'])
            // Filter by date & time
            // .filter(`start/dateTime ge '${MIN_TIME.toISOString()}'`)
            .header('Prefer', 'outlook.timezone="Europe/Madrid"')
            .get();
    } catch (error) {
        console.log(error);
    }
}

export const getPermissionsGranted = async (userId = masterAccountId) => {
    try {
        return await client.api(`/users/${userId}/oauth2PermissionGrants`).get();
    } catch (error) {
        console.log(error);
    }
}


export const createEvent = async (userId, event) => {
    try {
        return await client.api(`/users/${userId}/events`).post(event);
    } catch (error) {
        console.log('GraphApiCalendar -- createEvent');
        console.log(error);
    }
}


export const createSharedEvent = async (calendarId, event) => {
    try {
        return await client.api(`/me/calendars/${calendarId}/events`).post(event);
    } catch (error) {
        console.log('GraphApiCalendar -- createSaredEvent -- error');
        console.log(error);
    }
}

export const updateSharedEvent = async (calendarId, eventId, event) => {
    try {
        return await client
            .api(`/me/calendars/${calendarId}/events/${eventId}`)
            .update(event);
    } catch (error) {
        console.log('GraphApiCalendar -- createSaredEvent -- error');
        console.log(error);
    }
}

export const deleteSaredEvent = async (calendarId, eventId) => {
    try {
        return await client
            .api(`/me/calendars/${calendarId}/events/${eventId}`)
            .responseType(ResponseType.RAW)
            .delete();
    } catch (error) {
        console.log('GraphApiCalendar -- createSaredEvent -- error');
        console.log(error);
    }
}

export const logout = async () => {
    try {
        msalApplication.logout(); //
    } catch (error) {
        console.log('GraphApiCalendar -- logout');
        console.error(error);
    }
}

export const getSharingInfo = async () => {
    try {
        return await client.api(`/users/${masterAccountId}/calendar/calendarPermissions`).get();
    } catch (error) {
        console.log('GraphApiCalendar -- logout');
        console.log(error);
    }
}