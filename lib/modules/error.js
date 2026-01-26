/**
 * Central logging and error handling module.
 * Renamed to ErrorHandler to avoid conflicts with the native JS Error class.
 */
export class ErrorHandler{
    constructor(){
        this.history = [];
    }

    /**
     * Logs a standard message.
     * @param {string} message The message to log.
     */
    log(message){
        console.log(`[Bonobo] ${message}`);
        this._add('log', message);
    }

    /**
     * Logs a warning message.
     * @param {string} message The warning message.
     */
    warn(message){
        console.warn(`[Bonobo WARN] ${message}`);
        this._add('warn', message);
    }

    /**
     * Logs an error message.
     * @param {string} message The error message.
     */
    error(message){
        console.error(`[Bonobo ERROR] ${message}`);
        this._add('error', message);
    }

    _add(type, message){
        this.history.push({
            type: type,
            message: message,
            timestamp: Date.now()
        });
    }

    /**
     * Returns the history of logged messages.
     * @returns {Array<object>} Array of log entries.
     */
    get logs(){
        return this.history;
    }
}