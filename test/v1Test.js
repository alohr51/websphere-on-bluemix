let assert = require('chai').assert;
let should = require('chai').should();
let expect = require('chai').expect;
let WebSphere_on_Bluemix = require('../v1');

let test_api_url = process.env.api_url;
let test_api_key = process.env.api_key;

// globals used for the tests. They will be set in the tests for get orgs and get spaces
let org_name = "";
let space_name = "";
let wob;

// Get instance of WebSphere_on_Bluemix and set org and space name to use for tests.
before(function(done) {
    wob = new WebSphere_on_Bluemix({api_url: test_api_url, api_key: test_api_key});
    wob.get_organizations(function(err, org_result){
        expect(err).to.be.null;
        let parsed_org_result = JSON.parse(org_result);
        parsed_org_result.should.be.an('array');
        // Set the first org name to be used for rest of tests.
        expect(parsed_org_result).to.have.length.of.at.least(1);
        org_name = parsed_org_result[0].entity.name;
        wob.get_spaces({organization:org_name}, function(err, space_result){
            expect(err).to.be.null;
            let parsed_space_result = JSON.parse(space_result);
            parsed_space_result.should.be.an('array');
            // Set the first space name to be used for rest of tests.
            expect(parsed_space_result).to.have.length.of.at.least(1);
            space_name = parsed_space_result[0].entity.name;
            done();
        });
    })
});

describe('WebSphere on Bluemix v1', function() {
    it('is a function', function() {
        WebSphere_on_Bluemix.should.be.a('function');
    });

    it('has arity 1: credentials', function() {
        WebSphere_on_Bluemix.should.have.lengthOf(1);
    });

    it('sets credentials', function() {
        let wob = new WebSphere_on_Bluemix({api_url:"https://testAPI.com/api", api_key:"iamtestkey"});
        expect(wob.api_url).to.equal("https://testAPI.com/api/v1");
        expect(wob.api_key).to.equal("iamtestkey");
    });
    it('fails with missing api key', function() {
        expect(function(){WebSphere_on_Bluemix({api_url:"https://testAPI.com/api"})}).to.throw("Error");
    });
});

describe('Organizations', function() {
    it('gets an org by name', function(done) {
        let options = {organization: org_name};
        wob.get_organization_by_name(options, function(err, result) {
            let parsed_result = JSON.parse(result);
            expect(err).to.be.null;
            expect(parsed_result.entity.name).to.equal(org_name);
            done();
        });
    });
});

describe('Spaces', function() {
    it('gets a space by name', function(done) {
        let options = {organization: org_name, space: space_name};
        wob.get_space_by_name(options, function(err, result) {
            let parsed_result = JSON.parse(result);
            expect(err).to.be.null;
            expect(parsed_result.entity.name).to.equal(space_name);
            done();
        });
    });
});