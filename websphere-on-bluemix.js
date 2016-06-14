var request = require('request');

var WebSphereOnBluemix = function(credentials){
    this.api_url = credentials.api_url;
    this.username = credentials.username;
    this.password = credentials.password;

    // Validate credentials.
    if(this.api_url === undefined || this.username === undefined || this.password === undefined || this.api_url === "" || this.username === "" || this.password === "") {
        throw Error("WebSphereOnBluemix Initialization Error: api_url, username, and password must all be defined.");
    }

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

WebSphereOnBluemix.prototype.refresh_bearer_token = function (callback){
    // need to figure out what url to use compared to what the user provides for api_url
    var bluemix_oauth_url = "https://login.stage1.ng.bluemix.net/UAALoginServerWAR";
    var self = this;
    var request_options = {
        url: bluemix_oauth_url + "/oauth/token",
        method: "POST",
        headers: {
            'Authorization': "Basic Y2Y6",
            'Accept': "application/json",
            'Content-Type':"application/x-www-form-urlencoded"
        },
        form:{
            grant_type: "refresh_token",
            refresh_token: self.refresh_token
        }
    };

    request(request_options, function(err, res, body){
        if(err) {
            return callback("WebSphereOnBluemix refresh token Error: " + err, null);
        }
        // The request was good, but the API told us something went wrong.
        else if (res.statusCode != 200) {
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
            return callback(err);

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

// Create a WebSphere on Bluemix service instance.
WebSphereOnBluemix.prototype.create_service_instance = function(options,  callback) {
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
        if (type === undefined || name == undefined || application_server_vm_size === undefined || type === "" || name === "" || application_server_vm_size === "")
            return callback("type, name, and application_server_vm_size must be defined.", null);

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
            self.refresh_bearer_token(function(err, refreshed_bearer_token){
                request_options.auth.bearer = refreshed_bearer_token;
                // Retry the request.
                request(request_options, function (err, res, body) {
                    if (err) {
                        return callback(err, null);
                    }
                    // The request was good, but the API told us something went wrong.
                    else if (res.statusCode != 200) {
                        return callback(JSON.parse(body), null);
                    }
                    // Request was successful.
                    else{
                        return callback(null, JSON.parse(body));
                    }
                });
            });
        }
        // The request was good, but the API told us something went wrong.
        else if (res.statusCode != 200) {
            return callback(JSON.parse(body), null);
        }
        // Request was successful.
        else {
            return callback(null, JSON.parse(body));
        }
    });
};


module.exports = WebSphereOnBluemix;