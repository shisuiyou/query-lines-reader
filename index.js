const fs = require('fs');
const path = require('path');
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
        totalCommand: 'wc -l {{filePath}}',
        readCommand: 'sed -n "{{start}},{{end}}p" {{filePath}}',
        getTotal(totalLine){
            return totalLine.replace(/^\D*(\d+).*/g, '$1')
        },
        checkTotal: true,
        getLineArr(listLine){
            return listLine ? listLine.split(/\r\n?|\n/) : []
        }
    },
    macos: {
        totalCommand: 'wc -l {{filePath}}',
        readCommand: 'sed -n "{{start}},{{end}}p" {{filePath}}',
        getTotal(totalLine){
            return totalLine.replace(/^\D*(\d+).*/g, '$1')
        },
        checkTotal: true,
        getLineArr(listLine){
            return listLine ? listLine.split(/\r\n?|\n/) : []
        }
    },
    windows: {
        totalCommand: 'find /v /c "" {{filePath}}',
        getTotal(totalLine){
            return totalLine
        },
    },
}

module.exports = class QueryLinesReader{
    constructor(filePath, options){
        if(typeof filePath === 'string'){
            this._filePath = filePath;
            this._readStream = fs.createReadStream(filePath);
        }else if(filePath instanceof stream){
            this._readStream = filePath;
            if(_readStream.path && path.isAbsolute(_readStream.path)){
                this._filePath = _readStream.path;
            }
        }else if(filePath instanceof Buffer){
            this._fileBuffer = filePath;
        }

        // check file
        if(!(this._filePath || this._readStream || this._fileBuffer)){
            throw new Error('filePath is required')
        }

        // init options
        this._options = Object.assign({
            needTotal: false,
            reverse: false
        }, options || {});

    }

    async getTotal(){
        let osTypeSetting = osTypeList[this._getOsType()];
        return new Promise((resolve, reject)=>{
            exec(osTypeSetting
                .totalCommand.replace(/{{filePath}}/, this._filePath), 
                async (error, totalLine, outError) => {
                    if(error || outError){
                        reject(error || outError)
                    }else{
                        let total = Number(osTypeSetting.getTotal(totalLine));
                        if(osTypeSetting.checkTotal){
                            let realTotal = await this._checkTotal(total).catch(ce => {
                                reject(ce);
                                return Promise.reject(ce);
                            });
                            resolve(Number(realTotal))
                        }else{
                            resolve(total)
                        }
                    }
                }
            )
        })
        
    }

    async queryLines(options){
        // init options
        let singleOptions = this._initOptins(options);

        let total;
        if(singleOptions.needTotal || singleOptions.reverse){
            total = await this.getTotal();
        }

        let lineList = await this._readLines(singleOptions, total);
        let lineLen = lineList.length;
        if(lineLen < singleOptions.end){
            if(!lineList[lineLen - 1]){
                lineList.splice(lineLen - 1, 1)
            }
        }
        if(total !== void(0)){
            
        }
        return this._generateResult({
            singleOptions,
            lineList,
            total
        });

    }

    async _checkTotal(total){
        total = Number(total);
        let lines = await this._readLines({
            start: total,
            end: total + 1,
        });
        if(lines[0]){
            return total + 1;
        }

        return total;
    }

    async _readLines(singleOptions, total){
        let osTypeSetting = osTypeList[this._getOsType()];
        return new Promise((resolve, reject)=>{
            exec(osTypeSetting.readCommand
                .replace(/{{start}}/, Number(singleOptions.start) + 1)
                .replace(/{{end}}/, Number(singleOptions.end))
                .replace(/{{filePath}}/, this._filePath), 
                function(error, listLine, outError){
                    if(error || outError){
                        reject(error || outError)
                    }else{
                        let lines = osTypeSetting.getLineArr(listLine);
                        resolve(lines);
                    }
                    
                }
            )
        })

    }

    _getOsType(){
        return osTypeMap[(os.type() || '').toLowerCase()]
    }

    _initOptins(options){
        options = options || {};
        return Object.assign({
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
    }

    _generateResult({singleOptions,lineList,total}){
        let result = {
            lineList,
            needTotal: singleOptions.needTotal,
            reverse: singleOptions.reverse
        };

        if(singleOptions.needTotal){
            result.total = total;
        }

        if(singleOptions.queryMode === MODES.START_END){
            result.start = singleOptions.start;
            result.end = singleOptions.end;
        }

        if(singleOptions.queryMode === MODES.PAGE){
            result.currentPage = singleOptions.currentPage;
            result.pageSize = singleOptions.pageSize;
        }

        return result;

    }

}
