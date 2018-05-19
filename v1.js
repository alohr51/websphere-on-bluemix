const request = require('request');
const validMultiServerValues = ["WASCell", "LibertyCollective"];
const validSingleServerValues = ["LibertyCore", "LibertyNDServer", "WASBase", "WASNDServer"];

// version 1 API with org and spaces
let WebSphereOnBluemix = function(credentials){
	this.username = "apikey";
	this.api_key = credentials.api_key;
	this.api_url = credentials.api_url;

	// Validate credentials.
	if (isUndefinedOrEmpty([this.api_url, this.api_key])){
		throw Error("WebSphereOnBluemix Initialization Error: api_url and api_key must both be defined.");
	}
	this.api_url = `${this.api_url}/v1`;
	return this;
};

WebSphereOnBluemix.prototype.get_bearer_token = function (callback){
	// Check if the bearer token is set and not expired.
	if (this.bearer_token){
		return callback(null, this.bearer_token);
	}

	let req_options = getOptions();
	req_options.method = "GET";
	req_options.url = `${this.api_url}/oauth`;
	req_options.auth = {user: this.username, pass: this.api_key};

	request(req_options, (err, res, body) => {
		if(err) {
			return callback(`WebSphereOnBluemix bearer token Error: ${err}`, null);
		}
		else if(res.statusCode !== 200){
			// The request was good, but the API told us something went wrong.
			return callback(body, null);
		}
		else {
			let bodyJSON = JSON.parse(body);

			this.bearer_token = bodyJSON.access_token;
			this.refresh_token = bodyJSON.refresh_token;

			return callback(null, this.bearer_token);
		}
	});
};

// Get all organizations.
WebSphereOnBluemix.prototype.get_organizations = function(callback) {
	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err, null);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations`;

		this.send_request(req_options, callback);
	});
};

// Get an org by name.
WebSphereOnBluemix.prototype.get_organization_by_name = function(options, callback) {
	// Validate the user provided an org.
	let organization_name = options.organization;
	if (isUndefinedOrEmpty([organization_name])){
		return callback("organization must be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}`;
		this.send_request(req_options, callback);
	});
};

// Get all spaces in a given org.
WebSphereOnBluemix.prototype.get_spaces = function(options, callback) {
	// Validate the user provided an org.
	let organization_name = options.organization;
	if (isUndefinedOrEmpty([organization_name])){
		return callback("organization must be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces`;
		this.send_request(req_options, callback);
	});
};

// Get a space given an org and space name.
WebSphereOnBluemix.prototype.get_space_by_name = function(options,  callback) {
	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	if (isUndefinedOrEmpty([organization_name, space_name])){
		return callback("organization and space must be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}`;
		this.send_request(req_options, callback);
	});
};

// Create a WebSphere on IBM Cloud service instance.
WebSphereOnBluemix.prototype.create_service_instance = function(options,  callback) {
	let isMultiServer;

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let type = options.type;
	let name = options.name;

	if (isUndefinedOrEmpty([organization_name, space_name, name])){
		return callback("organization, space, and name must all be defined in options", null);
	}

	// check for a valid type
	if(validMultiServerValues.indexOf(type) > -1){
		isMultiServer = true;
	}
	else if(validSingleServerValues.indexOf(type) > -1){
		isMultiServer = false;
	}
	else{
		return callback(`type must be one of the following: ${validSingleServerValues.join(", ")} , ${validMultiServerValues.join(", ")}`, null);
	}

	// If false, doProvision allows us to create a subscription without provisioning it so the user can configure it to their needs through
	// another means (for examples the IBM Cloud UI)
	// if doProvision is not specified the default is true
	let do_provision = options.doProvision;
	do_provision = typeof do_provision === "undefined" ? true : options.doProvision;
	if(typeof do_provision  !== "boolean"){
		return callback("doProvision must be one of: true, false", null);
	}

	let service_instance_obj = isMultiServer ? get_multi_server_body(do_provision, options, callback) : get_single_server_body(do_provision, options, callback);
	// if there were some validation issues with the users options we will return and not send the request
	if(service_instance_obj === false){
		return;
	}

	do_provision = do_provision ? "yes" : "no";

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "POST";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances?provision=${do_provision}`;
		req_options.json = service_instance_obj;
		this.send_request(req_options, callback);
	});
};

function get_single_server_body(doProvision, options, callback){
	// if doProvision is false the size doesn't matter as the user will configure it later, the API still wants a size to be happy though
	let application_server_vm_size = doProvision ? options.application_server_vm_size : "S";

	if(typeof application_server_vm_size === "undefined" || application_server_vm_size === ""){
		callback("application_server_vm_size must be defined.", null);
		return false;
	}

	return {Type: options.type, Name: options.name, ApplicationServerVMSize: application_server_vm_size};
}

function get_multi_server_body(doProvision, options, callback){
	// if doProvision if false these values do not matter as the user will configure it later, but the API still requires they are sent
	let application_server_vm_size = doProvision ? options.application_server_vm_size : "S";
	let control_server_vm_size = doProvision ? options.control_server_vm_size : "S";
	let num_app_vms = doProvision ? options.number_of_app_vms : 1;

	if (isUndefinedOrEmpty([application_server_vm_size, control_server_vm_size, num_app_vms])){
		callback("control_server_vm_size, application_server_vm_size, and num_app_vms must all be defined.", null);
		return false;
	}

	return {
				Type: options.type,
				Name: options.name,
				ApplicationServerVMSize: application_server_vm_size,
				ControlServerVMSize: control_server_vm_size,
				NumberOfApplicationVMs: num_app_vms
			};
}

// Get all service instances in a given org and space.
WebSphereOnBluemix.prototype.get_service_instances = function(options,  callback) {
	

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	if (isUndefinedOrEmpty([organization_name, space_name])){
		return callback("organization and space must be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances`;
		this.send_request(req_options, callback);
	});
};

// Get a single service instance with respect to a service ID.
WebSphereOnBluemix.prototype.get_service_instance = function(options,  callback) {

	// Validate the user provided and org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let service_instance_id = options.service_instance_id;

	if (isUndefinedOrEmpty([organization_name, space_name])){
		return callback("organization, space, and service_instance_id must all be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances/${service_instance_id}`;
		this.send_request(req_options, callback);
	});
};

// Apply an action to all resources with respect to a service ID.
WebSphereOnBluemix.prototype.action_resources = function(options,  callback) {

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let service_instance_id = options.service_instance_id;
	let action = options.action;

	if (isUndefinedOrEmpty([organization_name, space_name, service_instance_id, action])){
		return callback("organization, space, service_instance_id, and action must all be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "PUT";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name} /serviceinstances/${service_instance_id}?action=${action}`;
		this.send_request(req_options, callback);
	});
};

// Delete a service instance given a service instance ID.
WebSphereOnBluemix.prototype.delete_service_instance = function(options,  callback) {

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let service_instance_id = options.service_instance_id;

	if (isUndefinedOrEmpty([organization_name, space_name, service_instance_id])){
		return callback("organization and space must be defined.", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "DELETE";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances/${service_instance_id}`;
		this.send_request(req_options, callback);
	})
};

// Get all resources with respect to a service ID.
WebSphereOnBluemix.prototype.get_resources = function(options,  callback) {
	

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let service_instance_id = options.service_instance_id;

	if (isUndefinedOrEmpty([organization_name, space_name, service_instance_id])){
		return callback("organization, space, and service_instance_id must all be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances/${service_instance_id}/resources`;
		this.send_request(req_options, callback);
	});
};

// Get a single resource with respect to service instance ID and resource ID.
WebSphereOnBluemix.prototype.get_resource = function(options,  callback) {
	

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let service_instance_id = options.service_instance_id;
	let resource_id = options.resource_id;
	if (isUndefinedOrEmpty([organization_name, space_name, service_instance_id, resource_id])){
		return callback("organization, space, service_instance_id, and resource_id must all be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}

		let req_options = getOptions(token);
		req_options.method = "GET";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances/${service_instance_id}/resources/${resource_id}`;
		this.send_request(req_options, callback);
	});
};

// Apply an action single resource with respect to service instance ID and resource ID.
WebSphereOnBluemix.prototype.action_resource = function(options,  callback) {
	

	// Validate the user provided an org and space.
	let organization_name = options.organization;
	let space_name = options.space;
	let service_instance_id = options.service_instance_id;
	let resource_id = options.resource_id;
	let action = options.action;

	if (isUndefinedOrEmpty([organization_name, space_name, service_instance_id, resource_id])){
		return callback("organization,  space, service_instance_id, resource_id, and action must all be defined in options", null);
	}

	this.get_bearer_token((err, token) => {
		if (err){
			return callback(err);
		}
		let req_options = getOptions(token);
		req_options.method = "PUT";
		req_options.url = `${this.api_url}/organizations/${organization_name}/spaces/${space_name}/serviceinstances/${service_instance_id}/resources/${resource_id}?action=${action}`;
		this.send_request(req_options, callback);
	});
};

// Continually check if a subscriptions resources are ready and returns the resource info when it is ready
WebSphereOnBluemix.prototype.monitor_resources = function(options,  callback) {
	let check_status = () => {
		this.get_resources(options, (err, resource) => {
			if(err){
				console.log(err);
				clearInterval(intervalID);
				return callback(err, null);
			}

			let resourceJSON = JSON.parse(resource);
			if(resourceJSON.length > 0) {
				clearInterval(intervalID);
				return callback(null, resource);
			}
		});
	};

	// check status now and every 3 min
	check_status();
	let intervalID = setInterval(check_status, 3 * 60 * 1000);
};

WebSphereOnBluemix.prototype.send_request = function (request_options, callback){
	
	request(request_options, (err, res, body) => {
		if (err) {
			return callback(err, null);
		}
		// If we get a 401 or 400 it's possible the bearer token expired. Refresh the token and retry the request.
		else if (res.statusCode === 400 || res.statusCode === 401) {
			this.bearer_token = null;

			this.get_bearer_token((err, refreshed_bearer_token) =>{
				request_options.auth.bearer =  refreshed_bearer_token;
				// Retry the request.
				request(request_options, (err, res, body) => {
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

function getOptions(token){
	return {
		headers: {
			Accept: "application/json"
		},
		auth: {
			bearer: token
		}
	};
}

function isUndefinedOrEmpty(arr){
	let isBad = false;
	arr.forEach(function (param){
		if(typeof param === "undefined" || param === ""){
			isBad = true;
		}
	});
	return isBad;
}

module.exports = WebSphereOnBluemix;