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
// Load the WebSphere On Bluemix library with a specific version.
var Wob = require('websphere-on-bluemix/v1');
var apikey = process.env.my_bluemix_apikey; // Use your IBM Cloud api key
var url = 'my_api_url' // Your WebSphere On Bluemix API url. For example: https://wasaas-broker.ng.bluemix.net/wasaas-broker/api

// Initialize WebSphere On Bluemix with your account.
var wob = new Wob({api_url: url, api_key: apikey});

// Create a Small Liberty Core and then start monitoring it for completion using "monitor_resources" feature.
wob.create_service_instance({organization:"MyOrg", space:"MySpace", type:"LibertyCore", name:"myWASaaSLibertyCore", application_server_vm_size:"S" }, function(err, serviceDetails){
	if(err){
		console.error(err);
	}
	else{
		var subID = serviceDetails.ServiceInstance.ServiceInstanceID;
		console.log("Starting to monitor resources in subscription: " + subID);

		// This method checks the resources in the subscription every 3 minutes until they are finished provisioning and returns the resources JSON 
		wob.monitor_resources({organization:"MyOrg", space:"MySpace", service_instance_id: subID}, function(err, resourceDetails){
			if(err){
				console.error(err);
			}
			else{
				console.log("My resources are finished provisioning and they are: " + resourceDetails);
			}
		});
	}
});
```
### More Examples.

There are more examples in [v3Examples.js](https://github.com/alohr51/websphere-on-bluemix/blob/master/examples/v1/v1Examples.js).

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
	 * `api_url=your_api_url`
	 * `api_key=your_api_key`
1. `node ./node_modules/mocha/bin/mocha --timeout 15000`
