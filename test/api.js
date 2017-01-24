var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var WebSphere_on_Bluemix = require('../websphere-on-bluemix.js');

var test_api_url = process.env.api_url;
var api_version = "v1"
var test_username = process.env.username;
var test_password = process.env.password;

// globals used for the tests. They will be set in the tests for get orgs and get spaces
var org_name = "";
var space_name = "";
var wob;

// Get instance of WebSphere_on_Bluemix and set org and space name to use for tests.
before(function(done) {
    wob = new WebSphere_on_Bluemix({api_url: test_api_url, api_version: api_version, username: test_username, password: test_password});
    wob.get_organizations(function(err, org_result){
        expect(err).to.be.null;
        var parsed_org_result = JSON.parse(org_result);
        parsed_org_result.should.be.an('array');
        // Set the first org name to be used for rest of tests.
        expect(parsed_org_result).to.have.length.of.at.least(1);
        org_name = parsed_org_result[0].entity.name;
        wob.get_spaces({organization:org_name}, function(err, space_result){
            expect(err).to.be.null;
            var parsed_space_result = JSON.parse(space_result);
            parsed_space_result.should.be.an('array');
            // Set the first space name to be used for rest of tests.
            expect(parsed_space_result).to.have.length.of.at.least(1);
            space_name = parsed_space_result[0].entity.name;
            console.log(space_name);
            done();
        });
    })
});

describe('WebSphere on Bluemix', function() {
    it('is a function', function() {
        WebSphere_on_Bluemix.should.be.a('function');
    });

    it('has arity 1: credentials', function() {
        WebSphere_on_Bluemix.should.have.lengthOf(1);
    });

    it('sets credentials', function() {
        var wob = new WebSphere_on_Bluemix({api_url:"https://testAPI.com/api", api_version: "v1", username:"iamtestus3rname", password:"iamtestp@ssword"});
        expect(wob.api_url).to.equal("https://testAPI.com/api/v1");
        expect(wob.api_version).to.equal("v1");
        expect(wob.username).to.equal("iamtestus3rname");
        expect(wob.password).to.equal("iamtestp@ssword");
    });
    it('fails with missing credentials', function() {
        expect(function(){WebSphere_on_Bluemix({api_url:"https://testAPI.com/api/v1", username:"iamtestus3rname"})}).to.throw("Error");
    });
});

describe('Organizations', function() {
    it('gets an org by name', function(done) {
        var options = {organization: org_name};
        wob.get_organization_by_name(options, function(err, result) {
            var parsed_result = JSON.parse(result);
            expect(err).to.be.null;
            expect(parsed_result.entity.name).to.equal(org_name);
            done();
        });
    });
});

describe('Spaces', function() {
    it('gets a space by name', function(done) {
        var options = {organization: org_name, space: space_name};
        wob.get_space_by_name(options, function(err, result) {
            var parsed_result = JSON.parse(result);
            expect(err).to.be.null;
            expect(parsed_result.entity.name).to.equal(space_name);
            done();
        });
    });
});