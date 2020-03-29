const assert = require('assert');
const path = require('path');
const QueryLinesReader = require('../');

describe('read-lines', function() {
    describe('command lines', function() {
        it('should return lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                currentPage: 3,
                pageSize: 2,
                reverse: false
            })
            let lineObj = await queryLinesReader.queryLines()
            console.log(lineObj)
            assert.strictEqual(Array.isArray(lineObj.lineList), true)
        });

        it('should return reverse lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                currentPage: 1,
                pageSize: 0,
                reverse: true
            })
            let lineObj = await queryLinesReader.queryLines()
            console.log(lineObj)
            assert.strictEqual(Array.isArray(lineObj.lineList), true)
        });
    });
});
