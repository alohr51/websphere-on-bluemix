var request = require('request');

var WebSphereOnBluemix = function(credentials){
	this.api_url = credentials.api_url;
	this.api_version = credentials.api_version;
	this.username = credentials.username;
	this.password = credentials.password;

	// Validate credentials.
	if(this.api_url === undefined || this.api_version === undefined || this.username === undefined || this.password === undefined || this.api_url === "" || this.username === "" || this.password === "" || this.api_version === "") {
		throw Error("WebSphereOnBluemix Initialization Error: api_url, api_version, username, and password must all be defined.");
	}

	// add api version to the url
	this.api_url = this.api_url + "/" + this.api_version;

	return this;
};

WebSphereOnBluemix.prototype.get_bearer_token = function (callback){
	// Check if the bearer token is set and not expired.
	if (this.bearer_token)
		return callback(null, this.bearer_token);

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
		if (err)
			return callback(err, null);
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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org.
		var organization_name = options.organization;
		if (organization_name === undefined || organization_name === "")
			return callback("organization name must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org.
		var organization_name = options.organization;
		if (organization_name === undefined || organization_name === "")
			return callback("options must be passed in with organization defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name === undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

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

// Create a WebSphere on Bluemix single server service instance.
WebSphereOnBluemix.prototype.create_single_server_service_instance = function(options,  callback) {
	var self = this;
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate the type (or plan) of the service instance provided, the name of the service, and the size (S, M, L, XL, XXL);
		var type = options.type;
		var name = options.name;
		var application_server_vm_size = options.application_server_vm_size;

		if(typeof(type) === 'undefined' ||  type === '' || (type !== 'LibertyCore' && type !== 'LibertyNDServer' && type !== 'WASBase' && type !== 'WASNDServer'))
			return callback("type must be one of single server: 'LibertyCore', 'LibertyNDServer', 'WASBase', 'WASNDServer' ", null);

		if (name == undefined || application_server_vm_size === undefined || name === "" || application_server_vm_size === "")
			return callback("name, and application_server_vm_size must be defined.", null);

		var service_instance_obj = {Type: type, Name: name, ApplicationServerVMSize: application_server_vm_size};

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances",
			method: "POST",
			headers: {
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

// Create a WebSphere on Bluemix cell or collective service instance.
WebSphereOnBluemix.prototype.create_multi_server_service_instance = function(options,  callback) {
	var self = this;
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate the type (or plan) of the service instance provided, the name of the service, and the size (S, M, L, XL, XXL);
		var type = options.type;
		var name = options.name;
		var application_server_vm_size = options.application_server_vm_size;
		var control_server_vm_size = options.control_server_vm_size;
		var num_app_vms = options.number_of_app_vms;

		if(typeof(type) === 'undefined' ||  type === "" || (type !== 'LibertyCollective' && type !== 'WASCell'))
			return callback("type must be one of Cell or Collective: 'LibertyCollective', 'WASCell' ", null);

		if (typeof(name) == "undefined" || name === "" || typeof(application_server_vm_size) === "undefined" || application_server_vm_size === "" || typeof(control_server_vm_size) === "undefined" || control_server_vm_size === "" || typeof(num_app_vms) === "undefined" || num_app_vms === "")
			return callback("name, control_server_vm_size, and application_server_vm_size must be defined.", null);

		var service_instance_obj = {Type: type, Name: name, ApplicationServerVMSize: application_server_vm_size, ControlServerVMSize: control_server_vm_size, NumberOfApplicationVMs: num_app_vms};

		var request_options = {
			url: self.api_url + "/organizations/" + organization_name + "/spaces/" + space_name + "/serviceinstances",
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

// Get all service instances in a given org and space.
WebSphereOnBluemix.prototype.get_service_instances = function(options,  callback) {
	var self = this;
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided and org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate user provided a service id.
		var service_instance_id = options.service_instance_id;

		if (service_instance_id === undefined || service_instance_id === "")
			return callback("service_instance_id must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate the user provided a service id.
		var service_instance_id = options.service_instance_id;
		if (service_instance_id === undefined || service_instance_id === "")
			return callback("service_instance_id must be defined.", null);

		// Validate the user provided an action.
		var action = options.action;
		if (action === undefined || action === "")
			return callback("action must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate user provided a service id.
		var service_id = options.service_instance_id;

		if (service_id === undefined || service_id === "")
			return callback("service_id must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate user provided a service id.
		var service_instance_id = options.service_instance_id;
		if (service_instance_id === undefined || service_instance_id === "")
			return callback("service_instance_id must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate the user provided a service id.
		var service_instance_id = options.service_instance_id;
		if (service_instance_id === undefined || service_instance_id === "")
			return callback("service_instance_id must be defined.", null);

		// Validate the user provided a resource id
		var resource_id = options.resource_id;
		if (resource_id === undefined || resource_id === "")
			return callback("resource_id must be defined.", null);

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
	this.get_bearer_token(function (err, bearer_token) {
		if (err)
			return callback(err);

		// Validate the user provided an org and space.
		var organization_name = options.organization;
		var space_name = options.space;
		if (organization_name === undefined || space_name == undefined || organization_name === "" || space_name === "")
			return callback("organization and space must be defined.", null);

		// Validate the user provided a service id.
		var service_instance_id = options.service_instance_id;
		if (service_instance_id === undefined || service_instance_id === "")
			return callback("service_instance_id must be defined.", null);

		// Validate the user provided a resource id.
		var resource_id = options.resource_id;
		if (resource_id === undefined || resource_id === "")
			return callback("resource_id must be defined.", null);

		// Validate the user provided an action.
		var action = options.action;
		if (action === undefined || action === "")
			return callback("action must be defined.", null);

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
					else if (res.statusCode != 200) {
						console.error("Failed request on retry: " + JSON.stringify(body));
						return callback(JSON.stringify(body));
					}
					// Request was successful.
					else{
						return callback(null, body);
					}
				});
			});
		}
		// The request was good, but the API told us something went wrong.
		else if (res.statusCode != 200) {
			return callback(JSON.stringify(body), null);
		}
		// Request was successful.
		else {
			return callback(null, body);
		}
	});
};


module.exports = WebSphereOnBluemix;