const assert = require('assert');
const path = require('path');
const QueryLinesReader = require('../');

describe('read-lines', function() {
    describe('command lines', function() {
        it('should return first line', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/mac-a.txt'), {
                start: 0,
                end: 0,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList[0], 'aaa')
        });
        it('should return lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/mac-a.txt'), {
                start: 0,
                end: 4,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'aaa,,bbb,11')
        });
        it('should return reverse lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/mac-a.txt'), {
                start: 0,
                end: 3,
                reverse: true
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), 'ddd,,333')
        });
        it('should return lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/mac-a.txt'), {
                currentPage: 2,
                pageSize: 1,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList[0], 'bbb')
        });
        it('should return reverse lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/mac-a.txt'), {
                currentPage: 2,
                pageSize: 2,
                reverse: true
            })
            let lineObj = await queryLinesReader.queryLines()
            assert.strictEqual(lineObj.lineList.toString(), '11,bbb')
        });
    });
});
