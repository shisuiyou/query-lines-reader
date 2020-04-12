const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { exec } = require('child_process');
const readline = require('readline');
const ProcessLimit = require('./lib/process-limit');
const OsType = require('./lib/os-type');

const processLimit = new ProcessLimit();

const MODES = {
    START_END: 'START_END',
    PAGE: 'PAGE'
}

module.exports = class QueryLinesReader{
    constructor(filePath, options){
        let needStreamReadLine = false;
        if(typeof filePath === 'string'){
            if(!path.isAbsolute(filePath)){
                throw new Error('filePath is required');
            }
            this._filePath = filePath;
        }else if(filePath instanceof stream){
            if(typeof filePath.path === 'string'){
                if(!(path.isAbsolute(filePath.path))){
                    throw new Error('path in fileStream must be absolute');
                }
            }
            
            this._streamOptions = {};
            let parameter = ['flags', 'encoding', 'fd', 'mode', 'autoClose', 'emitClose', 'start', 'end', 'highWaterMark'];
            parameter.forEach(key => {
                if(filePath[key]!== void(0)){
                    this._streamOptions[key] = filePath[key];
                }

                if(filePath._readableState && filePath._readableState[key]!== void(0)){
                    this._streamOptions[key] = filePath._readableState[key];
                }
            });

            if(this._streamOptions.start || this._streamOptions.end !== Infinity){
                needStreamReadLine = true;
            }
            this._filePath = filePath.path;
        }

        // check file
        if(!this._filePath){
            throw new Error('filePath is required')
        }

        // os 
        this._osType = new OsType();

        // init options
        this._options = Object.assign({
            needTotal: false,
            reverse: false,
            _needStreamReadLine: needStreamReadLine,
        }, options || {});

        this._minSizeOfCommand = 1.5 * 1024;

    }

    async getTotal(options){
        return this._getTotal(Object.assign({}, this.options, options || {}))
    }

    async getTotalByReadline(options){
        return this._getTotal(Object.assign({}, this.options, options || {}))
    }

    async queryLines(options){
        // init options
        let singleOptions = this._initOptions(options);

        let total;
        if(singleOptions.needTotal || singleOptions.reverse || singleOptions.include){
            total = await this._getTotal(singleOptions);
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

    setMinSizeOfCommand(fileSize){
        if(!fileSize){
            throw new Error('fileSize must be > 0')
        }
        if(typeof fileSize !== 'number'){
            throw new Error('fileSize must be Number')
        }

        this._minSizeOfCommand = fileSize;
    }

    async _getTotal(singleOptions){
        singleOptions = singleOptions || {};
        if(singleOptions._needStreamReadLine || singleOptions.include){
            return this._getTotalByReadline(singleOptions);
        }
        let totalCommand = this._osType.getTotalCommand({filePath: this._filePath});
        if(!totalCommand){
            return this._getTotalByReadline(singleOptions);
        }

        let fileSize = await getFileSize(this._filePath).catch(err => null);
        if(!fileSize || fileSize < this._minSizeOfCommand){
            return this._getTotalByReadline(singleOptions);
        }

        if(!processLimit.check()){
            return this._getTotalByReadline(singleOptions);
        }

        let tp = new Promise((resolve, reject)=>{
            exec(totalCommand, async (error, totalLine, outError) => {
                if(error || outError){
                    reject(error || outError)
                }else{
                    let total = await this._osType.getTotal(totalLine);
                    if(this._osType.checkTotal){
                        let realTotal = await this._checkTotal(total).catch(ce => {
                            reject(ce);
                            return Promise.reject(ce);
                        });
                        resolve(+realTotal)
                    }else{
                        resolve(total)
                    }
                }
            })
        }).catch(async error => {
            return this._getTotalByReadline(singleOptions);
        })

        return processLimit.add(tp)

    }

    async _getTotalByReadline(singleOptions){
        singleOptions = singleOptions || this._options;
        const rl = readline.createInterface({
            input: fs.createReadStream(this._filePath, this._streamOptions),
            crlfDelay: Infinity
        });
        let total = 0;
        rl.on('line', (line)=>{
            if(singleOptions.include){
                if(typeof singleOptions.include === 'string'){
                    if((line || '').includes(singleOptions.include)){
                        total ++
                    }
                }

                if(singleOptions.include instanceof RegExp){
                    if(singleOptions.include.test(line)){
                        total ++
                    }
                }
            }else{
                total ++
            }
            
        });
        await new Promise((resolve)=>{rl.on('close', ()=>{resolve()})});
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
        if(singleOptions._needStreamReadLine || singleOptions.include){
            return this._readLinesByReadline(singleOptions)
        }
        let readCommand = this._osType.getReadCommand({
            filePath: this._filePath,
            start: singleOptions._start,
            end: singleOptions._end
        });

        if(!readCommand){
            return this._readLinesByReadline(singleOptions)
        }

        let fileSize = await getFileSize(this._filePath).catch(err => null);
        if(!fileSize || fileSize < this._minSizeOfCommand){
            return this._readLinesByReadline(singleOptions);
        }

        if(!processLimit.check()){
            return this._readLinesByReadline(singleOptions)
        }

        let rp = new Promise((resolve, reject)=>{
            exec(readCommand, (error, listLine, outError) => {
                if(error || outError){
                    reject(error || outError)
                }else{
                    let lines = this._osType.getLineArr(listLine);
                    resolve(lines);
                }
            })
        }).catch(error => {
            return this._readLinesByReadline(singleOptions)
        })
        return processLimit.add(rp)
    }

    async _readLinesByReadline(singleOptions){
        const rl = readline.createInterface({
            input: fs.createReadStream(this._filePath, this._streamOptions),
            crlfDelay: Infinity
        });

        let {_start, _end} = singleOptions,
            index = -1,
            result = [];

        let handleLine = (line)=>{
            if(singleOptions.include){
                if(typeof singleOptions.include === 'string'){
                    if(!(line || '').includes(singleOptions.include)){
                        return;
                    }
                    index ++;
                }else if(singleOptions.include instanceof RegExp){
                    if(!singleOptions.include.test(line)){
                        return;
                    }
                    index ++;
                }else{
                    return
                }

            }else{
                index ++;
            }
            if(index >= _start && index < _end){
                result.push(line);
            }
            if(index >= _end){
                rl.close();
                rl.removeListener('line', handleLine);
            }
        }

        rl.on('line', handleLine);

        await new Promise((resolve)=>{rl.on('close', ()=>{resolve()})});
        return result;
    }

    _initOptions(options){
        options = options || {};
        let checkOptions = Object.assign({}, this._options, options);
        let resultOptions = Object.assign({
            start: 0,
            end: 10,
            currentPage: 0,
            pageSize: 10,
            include: null,
            // needTotal: false,
            // reverse: false,
        }, this._options, options);

        resultOptions._start = resultOptions.start;
        resultOptions._end = resultOptions.end;
        if(checkOptions.hasOwnProperty('start') && checkOptions.hasOwnProperty('end')){
            resultOptions.queryMode = MODES.START_END;
        }
        if(checkOptions.hasOwnProperty('pageSize')){
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

module.exports.setProcessNumberOfSingleCpu = processLimit.setProcessNumberOfSingleCpu.bind(processLimit);

async function getFileSize(filePath){
    return new Promise((resolve, reject)=>{
        fs.stat(filePath, (err, stats)=>{
            if(err){
                return reject(err)
            }

            let size = stats.size;
            resolve(size / 1024);
        })
    })
}
