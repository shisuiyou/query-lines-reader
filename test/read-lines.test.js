const assert = require('assert');
const path = require('path');
const fs = require('fs');
const QueryLinesReader = require('../');

describe('read-lines', function() {
    describe('command lines', function() {
        it('should return first line', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                start: 0,
                end: 0,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList[0], 'aaa')
        });

        it('should return lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                start: 0,
                end: 4,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'aaa,,bbb,11')
        });

        it('should return reverse lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                start: 0,
                end: 3,
                reverse: true
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'cfd,abc,ddd')
        });

        it('should return page lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                currentPage: 2,
                pageSize: 1,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList[0], 'bbb')
        });

        it('should return page reverse lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                currentPage: 2,
                pageSize: 2,
                reverse: true
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), '333,')
        });

        it('should return reverse lineList by stream', async function() {
            let queryLinesReader = new QueryLinesReader(fs.createReadStream(path.resolve(__dirname, './data/a.txt')), {
                currentPage: 2,
                pageSize: 2,
                reverse: true
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), '333,')
        });

        it('should return reverse include lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                currentPage: 0,
                pageSize: 10,
                reverse: false,
                include: 'c'
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'abc,cfd')
        });

        it('should return reverse include RegExp lineList', async function() {
            let queryLinesReader = new QueryLinesReader(fs.createReadStream(path.resolve(__dirname, './data/a.txt')), {
                currentPage: 0,
                pageSize: 1,
                reverse: false,
                include: /b/g
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'bbb')
        });

        it('should return buffer path lineList', async function() {
            let queryLinesReader = new QueryLinesReader(fs.createReadStream(Buffer.from(path.resolve(__dirname, './data/a.txt'))), {
                currentPage: 0,
                pageSize: 1
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'aaa')
        });

        // it('should return reverse lineList', async function() {
        //     let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/big.txt'), {
        //         start: 5000,
        //         end: 10000,
        //         reverse: true
        //     })
        //     queryLinesReader.setMinSizeOfCommand(2000*1024)
        //     let lineObj = await queryLinesReader.queryLines()
        //     //assert.strictEqual(lineObj.lineList.toString(), 'cfd,abc,ddd')
        // });
    });

    describe('command total', function() {
        it('should return totalLine', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                start: 0,
                end: 4,
                //include: 'b'
            })
            let total = await queryLinesReader.getTotal()
            //console.log(total)
            assert.strictEqual(typeof total, 'number')

            let total2 = await queryLinesReader.getTotalByReadline()
            //console.log(total2)

            QueryLinesReader.setProcessNumberOfSingleCpu()            
        })
    });
});
