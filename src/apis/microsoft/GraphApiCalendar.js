import { Client } from "@microsoft/microsoft-graph-client";
import { authProvider } from './Config';

const options = {
    authProvider, // An instance created from previous step
};
const client = Client.initWithMiddleware(options);

const masterAccountId = 'law.you.test@gmail.com';



export const getUserDetails = async (userId = masterAccountId) => {
    try {
        return await client.api(`/users`).get();
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
 * @param {string} sharerUserId Id del usuario que comparte el calendario
 * @returns {Promise}
 */
export const getEventsFromSharedCalendar = async (sharerUserId) => {
    try {
        return await client.api(`/users/${sharerUserId}/calendar/events`).get();
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