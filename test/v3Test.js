var assert = require('chai').assert;
var should = require('chai').should();
var expect = require('chai').expect;
var WebSphere_on_IBM_Cloud = require('../v3');

var test_api_url = process.env.api_url;
var test_api_key = process.env.api_key;

// globals used for the tests. They will be set in the tests for resource groups
var RESOURCE_GROUP_NAME = "";
var wob;

// Get instance of WebSphere_on_IBM_Cloud and set org and space name to use for tests.
before(function(done) {
	wob = new WebSphere_on_IBM_Cloud({api_url: test_api_url, api_key: test_api_key});

	// set (and test) the resource group name for future tests
	wob.get_resource_groups(function(err, result) {
		expect(err).to.be.null;
		var parsed_group_result = JSON.parse(result);
		parsed_group_result.should.be.an('array');

		// Set the first org name to be used for rest of tests.
		expect(parsed_group_result).to.have.length.of.at.least(1);
		RESOURCE_GROUP_NAME = parsed_group_result[0].name;
		done();
	});
});

describe('WebSphere on IBM Cloud v3', function() {
	it('is a function', function() {
		WebSphere_on_IBM_Cloud.should.be.a('function');
	});

	it('has arity 1: credentials', function() {
		WebSphere_on_IBM_Cloud.should.have.lengthOf(1);
	});

	it('sets credentials', function() {
		var wob = new WebSphere_on_IBM_Cloud({api_url:"https://testAPI.com/api",  api_key:"iamtestkey"});
		expect(wob.api_url).to.equal("https://testAPI.com/api/v3");
		expect(wob.api_key).to.equal("iamtestkey");
	});
	it('fails with missing api key', function() {
		expect(function(){WebSphere_on_IBM_Cloud({api_url:"https://testAPI.com/api/v1"})}).to.throw("Error");
	});
});

describe('Resource Groups', function() {
	it('gets a resource group by name', function(done) {
		var options = {resource_group_name: RESOURCE_GROUP_NAME};
		wob.get_resource_group_by_name(options, function(err, result) {
			var parsed_result = JSON.parse(result);
			expect(err).to.be.null;
			expect(parsed_result.name).to.equal(RESOURCE_GROUP_NAME);
			done();
		});
	});
});