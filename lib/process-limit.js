const os = require('os');

const STATUS = {
    PENDING: 'pending',
    RUNNING: 'running',
    DONE: 'done'
}
module.exports = class ProcessLimit{
    constructor(){
        this._cpuLength = os.cpus().length || 1;
        this._allProcessNumber = this._cpuLength * 10;
        this._jobs = [];
    }

    setProcessNumberOfSingleCpu(num){
        if(!num){
            this._allProcessNumber = this._cpuLength * 10;
            return;
        }
        if(typeof num !== 'number'){
            throw new Error('num must be number')
        }
        if(num < 1){
            num = 1;
        }

        this._allProcessNumber = this._cpuLength * num;
        
    }

    check(){
        if(this._jobs.length >= this._allProcessNumber){
            return false;
        }
        return true;
    }

    add(fn){
        let option = {
            fn: fn,
            status: STATUS.PENDING,
            promise: (() => {
                let _p = {};
                let p = new Promise((resolve, reject) => {
                    _p._resolve = resolve;
                    _p._reject = reject;
                });
                return Object.assign(p, _p);
            })()
        };

        this._jobs.push(option);
        this._run();
        return option.promise;
    }

    _run(){
        this._clear();
        this._jobs.forEach(async job => {
            if(job.status === STATUS.PENDING){
                job.status = STATUS.RUNNING;
                try{
                    if(typeof job.fn === 'function'){
                        let res = await (job.fn());
                        job.promise._resolve(res);
                    }else if(job.fn && typeof job.fn.then === 'function'){
                        let res = await (job.fn);
                        job.promise._resolve(res);
                    }else{
                        job.promise._reject(new Error('add first argument must be function or promise'));
                    }

                }catch(e){
                    job.promise._reject(e);
                }
                job.status = STATUS.DONE;
                this._run();
            }
        });
    }

    _clear(){
        let len = this._jobs.length;
        for(let i=0; i<len; i++){
            let currentJob = this._jobs[i];
            if(currentJob.status === STATUS.DONE){
                this._jobs.splice(i, 1);
                i--;
                len--;
            }
        }
    }
}
