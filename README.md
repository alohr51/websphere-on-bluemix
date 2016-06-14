# WebSphere On Bluemix
##### [WebSphere On Bluemix](https://console.ng.bluemix.net/docs/services/ApplicationServeronCloud/index.html) Node.js Client.

This client is built to help you quickly access and get started with the WebSphere On Bluemix.  
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
var user = 'me'; // Use your Bluemix Account.
var pass = process.env.my_bluemix_password;
var url = 'my_api_url' // Your WebSphere On Bluemix API url.
// Initialize WebSphere On Bluemix with your account.
var wob = new Wob({api_url:url, username:user, password:pass});

wob.get_service_instances({organization:"YOUR_ORG", space:"YOUR_SPACE"}, function(err, instances){
	if(err){
		console.error(err);
	}
	else{
		console.log("All my WebSphere On Bluemix Service instances are: " + instances);
	}
});
```

### API Reference
The docs for the WebSphere On Bluemix API can be found [here](https://new-console.ng.bluemix.net/apidocs/212)

### Run the tests
  The test framework used is mocha.js with the chai assertion library.

1. Ensure mocha.js and chai are installed
   * `npm install --save mocha`
   * `npm install --save chai`
1. cd to the projects root: `/websphere-on-bluemix`
1. Set environment variables
   * `set api_url=your_api_url`
   * `set api_url=username`
   * `set api_url=password`
1. `node ./node_modules/mocha/bin/mocha --timeout 15000`