const assert = require('assert');
const path = require('path');
const QueryLinesReader = require('../');

describe('read-lines', function() {
    describe('command lines', function() {
        it('should return lineList', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/a.txt'), {
                start: 0,
                end: 10
            })
            let lineObj = await queryLinesReader.queryLines()
            console.log(lineObj)
            assert.strictEqual(lineObj.lineList[0], 'aaa')
        });
    });
});
