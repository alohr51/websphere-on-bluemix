var request = require('request');
const validMultiServerValues = ["WASCell", "LibertyCollective"];
const validSingleServerValues = ["LibertyCore", "LibertyNDServer", "WASBase", "WASNDServer"];

var WebSphereOnBluemix = function(credentials){
	this.api_url = credentials.api_url;
	this.api_version = credentials.api_version;
	this.username = credentials.username;
	this.password = credentials.password;

	// Validate credentials.
	if(typeof this.api_url === "undefined" || typeof this.api_version === "undefined" || typeof this.username === "undefined" ||
		typeof this.password === "undefined" || this.api_url === "" || this.username === "" || this.password === "" || this.api_version === "") {
		throw Error("WebSphereOnBluemix Initialization Error: api_url, api_version, username, and password must all be defined.");
	}

	// add api version to the url
	this.api_url = this.api_url + "/" + this.api_version;

	return this;
};

WebSphereOnBluemix.prototype.get_bearer_token = function (callback){
	// Check if the bearer token is set and not expired.
	if (this.bearer_token){
		return callback(null, this.bearer_token);
	}

	var self = this;
	var request_options = {
		url: self.api_url + "/oauth",
		method: "GET",
		headers: {
			'Accept': 'application/json'
		},
		'auth': {
			'user': this.username,
			'pass': this.password
		}
	};

	request(request_options, function(err, res, body){
		if(err) {
			return callback("WebSphereOnBluemix bearer token Error: " + err, null);
		}
		else if(res.statusCode != 200){
			// The request was good, but the API told us something went wrong.
			return callback(body, null);
		}
		else {
			var bodyJSON = JSON.parse(body);
			self.bearer_token = bodyJSON.access_token;
			self.refresh_token = bodyJSON.refresh_token;
			return callback(null, bodyJSON.access_token);
		}
	});
};

// Get all organizations.
WebSphereOnBluemix.prototype.get_organizations = function(callback) {
	var self = this;
	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err, null);
		}
		var request_options = {
			url: self.api_url + "/organizations",
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};

		self.send_request(request_options, callback);
	});
};

// Get an org by name.
WebSphereOnBluemix.prototype.get_organization_by_name = function(options, callback) {
	var self = this;

	// Validate the user provided an org.
	var organization_name = options.organization;
	if (typeof organization_name === "undefined" || organization_name === ""){
		return callback("organization name must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name,
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};

		self.send_request(request_options, callback);
	});
};

// Get all spaces in a given org.
WebSphereOnBluemix.prototype.get_spaces = function(options, callback) {
	var self = this;

	// Validate the user provided an org.
	var organization_name = options.organization;
	if (typeof organization_name === "undefined" || organization_name === ""){
		return callback("options must be passed in with organization defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces",
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Get a space given an org and space name.
WebSphereOnBluemix.prototype.get_space_by_name = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name,
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Create a WebSphere on IBM Cloud service instance.
WebSphereOnBluemix.prototype.create_service_instance = function(options,  callback) {
	var self = this;
	var isMultiServer;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name == "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	var type = options.type;
	var name = options.name;
	if(typeof name == "undefined" || name === ""){
		return callback("name must be defined", null);
	}

	// check for a valid type
	if(validMultiServerValues.indexOf(type) > -1){
		isMultiServer = true;
	}
	else if(validSingleServerValues.indexOf(type) > -1){
		isMultiServer = false;
	}
	else{
		return callback("type must be one of the following: " + validSingleServerValues.join(", ") + ", " + validMultiServerValues.join(", "), null);
	}

	// If false, doProvision allows us to create a subscription without provisioning it so the user can configure it to their needs through
	// another means (for example the IBM Cloud UI)
	// if doProvision is not specified the default is true
	var do_provision = options.doProvision;
	do_provision = typeof do_provision === "undefined" ? true : options.doProvision;
	if(typeof do_provision  !== "boolean"){
		return callback("doProvision must be one of: true, false", null);
	}

	var service_instance_obj = isMultiServer ? getMultiServerBody(do_provision, options, callback) : getSingleServerBody(do_provision, options, callback);
	// if there were some validation issues with the users options we will return and not send the request
	if(service_instance_obj === false){
		return;
	}

	do_provision = do_provision ? "yes" : "no";

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances?provision=" + do_provision,
			method: "POST",
			auth: {
				'Accept': 'application/json'
			},
			retryStrategy: self.refresh_retry_policy,
			'auth': {
				'bearer': bearer_token
			},
			json: service_instance_obj
		};
		self.send_request(request_options, callback);
	});
};

function getSingleServerBody(doProvision, options, callback){
	// if doProvision is false the size doesn't matter as the user will configure it later, the API still wants a size to be happy though
	var application_server_vm_size = doProvision ? options.application_server_vm_size : "S";

	if(typeof application_server_vm_size === "undefined" || application_server_vm_size === ""){
		callback("application_server_vm_size must be defined.", null);
		return false;
	}

	return {Type: options.type, Name: options.name, ApplicationServerVMSize: application_server_vm_size};
}

function getMultiServerBody(doProvision, options, callback){
	// if doProvision if false these values do not matter as the user will configure it later, but the API still requires they are sent
	var application_server_vm_size = doProvision ? options.application_server_vm_size : "S";
	var control_server_vm_size = doProvision ? options.control_server_vm_size : "S";
	var num_app_vms = doProvision ? options.number_of_app_vms : 1;

	if (typeof application_server_vm_size === "undefined" || application_server_vm_size === "" || typeof control_server_vm_size === "undefined" ||
		control_server_vm_size === "" || typeof num_app_vms === "undefined" || num_app_vms === ""){
		callback("control_server_vm_size, application_server_vm_size, and num_app_vms must all be defined.", null);
		return false;
	}

	return {Type: options.type, Name: options.name, ApplicationServerVMSize: application_server_vm_size, ControlServerVMSize: control_server_vm_size, NumberOfApplicationVMs: num_app_vms};
}

// Get all service instances in a given org and space.
WebSphereOnBluemix.prototype.get_service_instances = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances",
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			retryStrategy: self.refresh_retry_policy,
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Get a single service instance with respect to a service ID.
WebSphereOnBluemix.prototype.get_service_instance = function(options,  callback) {
	var self = this;

	// Validate the user provided and org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	// Validate user provided a service id.
	var service_instance_id = options.service_instance_id;

	if (typeof service_instance_id === "undefined" || service_instance_id === ""){
		return callback("service_instance_id must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances/" + service_instance_id,
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			retryStrategy: self.refresh_retry_policy,
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Apply an action to all resources with respect to a service ID.
WebSphereOnBluemix.prototype.action_resources = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof "space_name" === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	// Validate the user provided a service id.
	var service_instance_id = options.service_instance_id;
	if (typeof service_instance_id === "undefined" || service_instance_id === ""){
		return callback("service_instance_id must be defined.", null);
	}

	// Validate the user provided an action.
	var action = options.action;
	if (typeof action === "undefined" || action === ""){
		return callback("action must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances/" + service_instance_id + "?action=" + action,
			method: "PUT",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Delete a service instance given a service instance ID.
WebSphereOnBluemix.prototype.delete_service_instance = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	// Validate user provided a service id.
	var service_id = options.service_instance_id;

	if (typeof service_id === "undefined" || service_id === ""){
		return callback("service_id must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances/" + service_id,
			method: "DELETE",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	})
};

// Get all resources with respect to a service ID.
WebSphereOnBluemix.prototype.get_resources = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	// Validate user provided a service id.
	var service_instance_id = options.service_instance_id;
	if (typeof service_instance_id === "undefined" || service_instance_id === ""){
		return callback("service_instance_id must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances/" + service_instance_id + "/resources",
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Get a single resource with respect to service instance ID and resource ID.
WebSphereOnBluemix.prototype.get_resource = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	// Validate the user provided a service id.
	var service_instance_id = options.service_instance_id;
	if (typeof service_instance_id === "undefined" || service_instance_id === ""){
		return callback("service_instance_id must be defined.", null);
	}

	// Validate the user provided a resource id
	var resource_id = options.resource_id;
	if (typeof resource_id === "undefined" || resource_id === ""){
		return callback("resource_id must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances/" + service_instance_id + "/resources/" + resource_id,
			method: "GET",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Apply an action single resource with respect to service instance ID and resource ID.
WebSphereOnBluemix.prototype.action_resource = function(options,  callback) {
	var self = this;

	// Validate the user provided an org and space.
	var organization_name = options.organization;
	var space_name = options.space;
	if (typeof organization_name === "undefined" || typeof space_name === "undefined" || organization_name === "" || space_name === ""){
		return callback("organization and space must be defined.", null);
	}

	// Validate the user provided a service id.
	var service_instance_id = options.service_instance_id;
	if (typeof service_instance_id === "undefined" || service_instance_id === ""){
		return callback("service_instance_id must be defined.", null);
	}

	// Validate the user provided a resource id.
	var resource_id = options.resource_id;
	if (typeof resource_id === "undefined" || resource_id === ""){
		return callback("resource_id must be defined.", null);
	}

	// Validate the user provided an action.
	var action = options.action;
	if (typeof action === "undefined" || action === ""){
		return callback("action must be defined.", null);
	}

	this.get_bearer_token(function (err, bearer_token) {
		if (err){
			return callback(err);
		}

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances/" + service_instance_id + "/resources/" + resource_id + "?action=" + action,
			method: "PUT",
			headers: {
				'Accept': 'application/json'
			},
			'auth': {
				'bearer': bearer_token
			}
		};
		self.send_request(request_options, callback);
	});
};

// Continually check if a subscriptions resources are ready and returns the resource info when it is ready
WebSphereOnBluemix.prototype.monitor_resources = function(options,  callback) {
	var self = this;
	check_status();
	var intervalID = setInterval(check_status, 3 * 60 * 1000);

	function check_status(){
		self.get_resources(options, function(err, resource){
			if(err){
				console.log(err);
				clearInterval(intervalID);
				return callback(err, null);
			}
			else{
				var resourceJSON = JSON.parse(resource);
				if(resourceJSON.length > 0){
					clearInterval(intervalID);
					return callback(null, resource);
				}
			}
		});
	}
}

WebSphereOnBluemix.prototype.send_request = function (request_options, callback){
	var self = this;
	request(request_options, function (err, res, body) {
		if (err) {
			return callback(err, null);
		}
		// If we get a 401 or 400 it's possible the bearer token expired. Refresh the token and retry the request.
		else if (res.statusCode === 400 || res.statusCode === 401) {
			self.get_bearer_token(function(err, refreshed_bearer_token){
				request_options.auth.bearer =  refreshed_bearer_token;
				// Retry the request.
				request(request_options, function (err, res, body) {
					if (err) {
						return callback(err, null);
					}
					// The request was good, but the API told us something went wrong.
					else if (res.statusCode < 200 || res.statusCode > 299) {
						return callback(JSON.stringify(body), null);
					}
					// Request was successful.
					else{
						return callback(null, body);
					}
				});
			});
		}
		// The request was good, but the API told us something went wrong.
		else if (res.statusCode < 200 || res.statusCode > 299) {
			return callback(JSON.stringify(body), null);
		}
		// Request was successful.
		else {
			return callback(null, body);
		}
	});
};

module.exports = WebSphereOnBluemix;