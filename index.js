const fs = require('fs');
const stream = require('stream');
const os = require('os');
const { exec } = require('child_process');

const MODES = {
    START_END: 'START_END',
    PAGE: 'PAGE'
}

const osTypeMap = {
    linux: 'linux',
    darwin: 'macos',
    windows_nt: 'windows'
}

const osTypeList = {
    linux: {
        command: 'wc -l {{filePath}}',
        match: /^/g,
    },
    macos: {
        command: 'wc -l {{filePath}}',
        match: /^/g,
    },
    windows: {
        command: 'find /v /c "" {{filePath}}',
        match: /^/g,
    },
}

module.exports = class QueryLinesReader{
    constructor(filePath, options){
        // check file
        if(typeof filePath === 'string'){
            this._filePath = filePath;
            this._readStream = fs.createReadStream(filePath);
        }else if(filePath instanceof stream){
            this._readStream = filePath;
            this._filePath = _readStream.path;
        }else if(filePath instanceof Buffer){
            this._fileBuffer = filePath;
        }

        // init options
        this._options = Object.assign({
            needTotal: false,
            reverse: false
        }, options || {});

    }

    async getTotal(){

    }

    async getLines(options){
        // init options
        this._initOptins(options);
        return await this._readLines()

    }

    async _readLines(){
        
    }

    _getOsType(){
        return osTypeMap[(os.type() || '').toLowerCase()]
    }

    _initOptins(options){
        options = options || {};
        this._queryOptions = Object.assign({
            start: 0,
            end: 10,
            currentPage: 0,
            pageSize: 10,
            // needTotal: false,
            // reverse: false,
            queryMode: (() => {
                if(options.hasOwnProperty('start') && options.hasOwnProperty('end')){
                    return MODES.START_END;
                }
                if(options.hasOwnProperty('currentPage') && options.hasOwnProperty('pageSize')){
                    return MODES.PAGE;
                }

                return MODES.START_END;
            })()
        }, this._options, options);

        return this._queryOptions;
    }

}
