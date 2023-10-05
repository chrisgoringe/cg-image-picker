class Logger {
    static ERROR       = 0; // actual errors
    static PROBLEM     = 1; // things that stop the workflow working
    static INFORMATION = 2; // record of good things
    static DETAIL      = 3; // details

    static LEVEL = Logger.INFORMATION;
    static TRACE = true;

    static log(level, message, array) {
        if (level <= Logger.LEVEL) {
            console.log(message);
            if (array) for (var i=0; i<array.length; i++) { console.log(array[i]) }
        }
    }

    static log_call(level, method) {
        if (level <= Logger.LEVEL) {
            method.apply();
        }
    }

    static log_error(level, message) {
        if (level <= Logger.LEVEL) {
            console.error(message);
        }
    }

    static trace(message, array, node) {
        if (Logger.TRACE) {
            if (node) { console.log(`TRACE (${node.id}) : ${message}`) } else { console.log(`TRACE : ${message}`) }
            if (array && Logger.LEVEL>=Logger.INFORMATION) for (var i=0; i<array.length; i++) { console.log(`  ${i} = ${array[i]}`) }
        }
    }
}

export { Logger }