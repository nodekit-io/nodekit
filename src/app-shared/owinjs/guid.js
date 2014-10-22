var util = require('util');

/**
 * Create a new guid
 *
 * @method guid
 * @returns guid (string)
 * @private
 */
exports.guid = function() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

/**
 * Create a new 4 character ID (random)
 *
 * @method s4
 * @returns (string)
 * @private
 */
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
};
