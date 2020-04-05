const assert = require('assert');
const path = require('path');
const QueryLinesReader = require('../');

describe('total', function() {
    describe('command total', function() {
        it('should return totalLine', async function() {
            let queryLinesReader = new QueryLinesReader(path.resolve(__dirname, './data/mac-a.txt'), {
                start: 0,
                end: 4,
                //include: 'b'
            })
            let total = await queryLinesReader.getTotal()
            console.log(total)
            assert.strictEqual(typeof total, 'number')

            let total2 = await queryLinesReader.getTotalByReadline()
            console.log(total2)

            QueryLinesReader.setProcessNumberOfSingleCpu()            
        })
    });
});
