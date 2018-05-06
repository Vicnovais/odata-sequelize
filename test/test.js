'use strict';

var expect = require('chai').expect;
var parser = require('../index');
var mockSequelize = require('./mock');

describe('#odataParser', function() {
    it('should parse top', function() {
        var result = parser("$top=10", mockSequelize);
        expect(result).to.deep.equal({
            'limit': 10
        });
    });

    it('should parse skip', function() {
        var result = parser("$skip=5", mockSequelize);
        expect(result).to.deep.equal({
            'offset': 5
        });
    });

    it('should parse top skip', function() {
        var result = parser("$top=10&$skip=5", mockSequelize);
        expect(result).to.deep.equal({
            'limit': 10,
            'offset': 5
        });
    });

    it('should parse select', function() {
        var result = parser("$select=foo", mockSequelize);
        expect(result).to.deep.equal({
            'attributes': ['foo']
        });
    });

    it('should parse orderby', function() {
        var result = parser("$orderby=name desc", mockSequelize);
        expect(result).to.deep.equal({
            'order': [
                ['name', 'DESC']
            ]
        });
    });

    it('should parse orderby with multiple columns', function() {
        var result = parser("$orderby=name desc,ranking", mockSequelize);
        expect(result).to.deep.equal({
            'order': [
                ['name', 'DESC'],
                ['ranking', 'ASC']
            ]
        });
    });
});