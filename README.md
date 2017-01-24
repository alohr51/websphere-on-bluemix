# WebSphere On Bluemix
[![npm version](https://badge.fury.io/js/websphere-on-bluemix.svg)](https://badge.fury.io/js/websphere-on-bluemix)

##### [WebSphere On Bluemix](https://console.ng.bluemix.net/docs/services/ApplicationServeronCloud/index.html) Node.js Client.

This client is built to help you quickly access and get started with the WebSphere On Bluemix API.  
[Installation](#installation)  
[Getting Started](#getting-started)  
[API Reference](#api-reference)  
[Run Tests](#run-the-tests)  


### Installation
run npm install with the --save option to automatically add the dependency to your package.json.

`$ npm install --save websphere-on-bluemix`

### Getting Started
```
// Load the WebSphere On Bluemix library.
var Wob = require('websphere-on-bluemix');
var user = 'myBluemixUsername'; // Use your Bluemix Account.
var pass = process.env.my_bluemix_password; // Use your Bluemix Password
var url = 'my_api_url' // Your WebSphere On Bluemix API url. For example: https://wasaas-broker.ng.bluemix.net/wasaas-broker/api
var version = 'v1' // the api version
// Initialize WebSphere On Bluemix with your account.
var wob = new Wob({api_url:url, api_version: version, username:user, password:pass});

wob.get_service_instances({organization:"YOUR_ORG", space:"YOUR_SPACE"}, function(err, instances){
	if(err){
		console.error(err);
	}
	else{
		console.log("All my WebSphere On Bluemix Service instances are: " + instances);
	}
});
```
### More Examples.

There are more examples in [examples.js](https://github.com/alohr51/websphere-on-bluemix/blob/master/example/examples.js).

### API Reference
WebSphere on Bluemix provides Swagger UI API Documentation in 3 different environments:
  * [Dallas, USA](https://wasaas-broker.ng.bluemix.net/wasaas-broker/api)
  * [London, UK](https://wasaas-broker.eu-gb.bluemix.net/wasaas-broker/api)
  * [Sydney, AUS](https://wasaas-broker.au-syd.bluemix.net/wasaas-broker/api)

### Run the tests
  The test framework used is mocha.js with the chai assertion library.

1. Go to the projects root: `/websphere-on-bluemix`
1. Ensure dependencies are installed
   * `npm install`
1. Set environment variables
   * `set api_url=your_api_url`
   * `set username=username`
   * `set password=password`
1. `node ./node_modules/mocha/bin/mocha --timeout 15000`
