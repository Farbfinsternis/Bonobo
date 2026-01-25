/**
 * Central logging and error handling module.
 * Renamed to ErrorHandler to avoid conflicts with the native JS Error class.
 */
export class ErrorHandler{
    constructor(){
        this.history = [];
    }

    log(message){
        console.log(`[Bonobo] ${message}`);
        this._add('log', message);
    }

    warn(message){
        console.warn(`[Bonobo WARN] ${message}`);
        this._add('warn', message);
    }

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

    get logs(){
        return this.history;
    }
}