"use strict";
exports.__esModule = true;
/**
 * return the day of the year (1..366)
 */
function dayOfTheYear(date) {
    return ((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
        Date.UTC(date.getFullYear(), 0, 1)) /
        86400000 +
        1);
}
exports["default"] = dayOfTheYear;
