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
                        let total = +osTypeSetting.getTotal(totalLine);
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
        let singleOptions = this._initOptins(options);

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

    _initOptins(options){
        options = options || {};
        let _options = Object.assign({
            start: 0,
            end: 10,
            currentPage: 0,
            pageSize: 10,
            // needTotal: false,
            // reverse: false,
        }, this._options, options);

        _options._start = _options.start;
        _options._end = _options.end;
        if(options.hasOwnProperty('start') && options.hasOwnProperty('end')){
            _options.queryMode = MODES.START_END;
        }
        if(options.hasOwnProperty('currentPage') && options.hasOwnProperty('pageSize')){
            _options.queryMode = MODES.PAGE;

            _options._start = options.currentPage * options.pageSize;
            _options._end = (+options.currentPage + 1) * options.pageSize;
        }

        if(_options._start < 0){
            throw new Error('start line must be >= 0');
        }
        if(_options._end < 0){
            throw new Error('end line must be >= 0');
        }
        if(_options._start >=  _options._end){
            _options._end = _options._start + 1
        }
        return _options
    }

    _reverseInnerStartEnd(singleOptions, total){
        if(!singleOptions.reverse){
            return;
        }
        let {_start, _end} = singleOptions;
        singleOptions._start = total - _end - 1;
        singleOptions._end = total - _start - 1;

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

        if(singleOptions.reverse){
            result.lineList.reverse()
        }

        return result;

    }

}
