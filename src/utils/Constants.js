/**
 * Constantes útiles a lo largo del tiempo de ejecución
 */

import moment from 'moment';
import 'moment/locale/es';

/**
 * Formato de fecha para la localización: 'es'
 */
const DATE_FORMAT = 'yyyy-MM-DD';

/**
 * Formato de hora - 24H
 */
const TIME_FORMAT = 'HH:mm';

/**
 * AHORA - Marca el inicio del tiempo de ejecución del módulo
 */
const NOW = moment().locale('es');

/**
 * Define la hora mínima a mostrar en el calendario
 */
const MIN_TIME = moment().set('hour', 8).set('minute', 0).toDate();

/**
 * Define la hora máxima a mostrar en el calendario
 */
const MAX_TIME = moment().set('hour', 20).set('minute', 0).toDate();

/**
 * AHORA - en formato texto
 */
const STRING_NOW = moment().format(DATE_FORMAT);

/**
 * Traducciones de todas las etiquetas mostradas en el calendario
 */
const CALENDAR_TAGS_ES = {
    allDay: 'Todo el día',
    agenda: 'Agenda',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    work_week: 'Semana',
    day: 'Día',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
};

export { DATE_FORMAT, TIME_FORMAT, NOW, MIN_TIME, MAX_TIME, STRING_NOW, CALENDAR_TAGS_ES };