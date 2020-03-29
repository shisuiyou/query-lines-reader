const fs = require('fs');
const path = require('path');
const stream = require('stream');
const os = require('os');
const { exec } = require('child_process');
const readline = require('readline');
const { once } = require('events');

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
                        let total = + await osTypeSetting.getTotal(totalLine);
                        if(osTypeSetting.checkTotal){
                            let realTotal = await this._checkTotal(total).catch(ce => {
                                reject(ce);
                                return Promise.reject(ce);
                            });
                            resolve(+realTotal)
                        }else{
                            resolve(total)
                        }
                    }
                }
            )
        }).catch(async error => {
            return this.getTotalByReadline();
        })

    }

    async queryLines(options){
        // init options
        let singleOptions = this._initOptions(options);

        let total;
        if(singleOptions.needTotal || singleOptions.reverse){
            total = await this.getTotal();
            if(singleOptions._start >= total){
                return this._generateResult({
                    singleOptions,
                    lineList: [],
                    total
                });
            }

            if(singleOptions._end > total){
                singleOptions._end = total;
            }
        }

        this._reverseInnerStartEnd(singleOptions, total);

        let lineList = await this._readLines(singleOptions, total);

        return this._generateResult({
            singleOptions,
            lineList,
            total
        });

    }

    async getTotalByReadline(){
        const rl = readline.createInterface({
            input: this._readStream,
            crlfDelay: Infinity
        });
        let total = 0;
        rl.on('line', (line)=>{
            total ++
        });
        await once(rl, 'close');
        return total;
    }

    async _checkTotal(total){
        total = +total;
        let lines = await this._readLines({
            _start: total,
            _end: total + 1,
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
                .replace(/{{start}}/, singleOptions._start + 1)
                .replace(/{{end}}/, singleOptions._end)
                .replace(/{{filePath}}/, this._filePath),
                (error, listLine, outError) => {
                    if(error || outError){
                        reject(error || outError)
                    }else{
                        let lines = osTypeSetting.getLineArr(listLine);
                        resolve(lines);
                    }

                }
            )
        }).catch(error => {
            return this._readLinesByReadline(singleOptions)
        })

    }

    async _readLinesByReadline(singleOptions){
        const rl = readline.createInterface({
            input: this._readStream,
            crlfDelay: Infinity
        });

        let {_start, _end} = singleOptions,
            index = 0,
            result = [];
        rl.on('line', (line)=>{
            if(index >= _start && index < _end){
                result.push(line);
            }
            index ++;
        });

        await once(rl, 'close');
        return result;
    }

    _getOsType(){
        return osTypeMap[(os.type() || '').toLowerCase()]
    }

    _initOptions(options){
        options = options || {};
        let checkOptions = Object.assign({}, this._options, options);
        let resultOptions = Object.assign({
            start: 0,
            end: 10,
            currentPage: 0,
            pageSize: 10,
            // needTotal: false,
            // reverse: false,
        }, this._options, options);

        resultOptions._start = resultOptions.start;
        resultOptions._end = resultOptions.end;
        if(checkOptions.hasOwnProperty('start') && checkOptions.hasOwnProperty('end')){
            resultOptions.queryMode = MODES.START_END;
        }
        if(checkOptions.hasOwnProperty('currentPage') && checkOptions.hasOwnProperty('pageSize')){
            resultOptions.queryMode = MODES.PAGE;

            resultOptions._start = resultOptions.currentPage * resultOptions.pageSize;
            resultOptions._end = (+resultOptions.currentPage + 1) * resultOptions.pageSize;
        }

        if(resultOptions._start < 0){
            throw new Error('start line must be >= 0');
        }
        if(resultOptions._end < 0){
            throw new Error('end line must be >= 0');
        }
        if(resultOptions._start >=  resultOptions._end){
            resultOptions._end = resultOptions._start + 1
        }
        resultOptions.needLength = resultOptions._end - resultOptions._start;
        return resultOptions
    }

    _reverseInnerStartEnd(singleOptions, total){
        if(!singleOptions.reverse){
            return;
        }
        let {_start, _end} = singleOptions;
        singleOptions._start = total - _end;
        singleOptions._end = total - _start;

    }

    _generateResult({singleOptions, lineList, total}){
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

        if(lineList.length > singleOptions.needLength){
            lineList.splice(singleOptions.needLength, lineList.length - singleOptions.needLength);
        }

        if(typeof total !== void(0) && lineList.length > total){
            lineList.splice(total, lineList.length - total);
        }

        if(singleOptions.reverse){
            lineList.reverse()
        }

        return result;

    }

}
