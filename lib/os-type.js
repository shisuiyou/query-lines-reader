const os = require('os');

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
            return totalLine.replace(/.*(\D+|^)(\d+)\D*/g, '$2')
        },
    },
}

module.exports = class OsType{
    constructor(){
        this._osType = osTypeList[osTypeMap[(os.type() || '').toLowerCase()]];
    }

    getTotalCommand({filePath}){
        if(!this._osType){
            return null
        }

        if(!this._osType.totalCommand){
            return null
        }
        return this._osType.totalCommand.replace(/{{filePath}}/, filePath)
    }

    getTotal(totalLine){
        return + this._osType.getTotal(totalLine)
    }

    checkTotal(){
        return this._osType.checkTotal
    }

    getReadCommand({filePath, start, end}){
        if(!this._osType){
            return null
        }
        if(!this._osType.readCommand){
            return null
        }

        return this._osType.readCommand.replace(/{{start}}/, start + 1)
                                        .replace(/{{end}}/, end)
                                        .replace(/{{filePath}}/, filePath)
    }

    getLineArr(listLine){
        if(!this._osType){
            return null
        }

        return this._osType.getLineArr(listLine)
    }
}