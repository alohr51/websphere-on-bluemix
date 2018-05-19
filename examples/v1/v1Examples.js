let Wasaas = require("../../v1");
let wob = new Wasaas({api_url: "YOUR_API_URL", api_key : "YOUR_API_KEY"});

// Get all organizations
wob.get_organizations(function(err, orgs){
	if(err){
		console.error(err);
	}
	else{
		console.log(`All my Bluemix orgs are: ${orgs}`);
	}
});

// Get a organization by name
wob.get_organization_by_name({organization: "MyOrg"}, function(err, org){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My Bluemix org is: ${org}`);
	}
});

// Get all spaces for an org
wob.get_spaces({organization: "MyOrg"}, function(err, spaces){
	if(err){
		console.error(err);
	}
	else{
		console.log(`All my Bluemix spaces are: ${spaces}`);
	}
});

// Get a specific space by name for an org
wob.get_space_by_name({organization: "MyOrg", space: "MySpace"}, function(err, space){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My Bluemix space is: ${space}`);
	}
});

// Create a single server WASaaS instance and do not provision it. This requires you to finish configuration through the IBM Cloud UI
// Type can be: 'LibertyCore', 'LibertyNDServer', 'WASBase', 'WASNDServer'
// ApplicationServerVmSize can be: 'S', 'M', 'L', 'XL', 'XXL'
// doProvision: true, false. Allows you to create a subscription, but not provision it yet
wob.create_service_instance({organization: "MyOrg", space: "MySpace", type: "LibertyCore", name: "myWASaaSLibertyCore", application_server_vm_size: "S", doProvision: false }, function(err, instanceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My new service is: ${JSON.stringify(instanceDetails, null, 2)}`);
	}
});

// Create a Small Liberty Core and then start monitoring it for completion using "resource_status" feature.
wob.create_service_instance({organization: "MyOrg", space: "MySpace", type: "LibertyCore", name: "myWASaaSLibertyCore", application_server_vm_size:"S" }, function(err, serviceDetails){
	if(err){
		console.error(err);
	}
	else{
		let subID = serviceDetails.ServiceInstance.ServiceInstanceID;
		console.log(`Starting to monitor resources in subscription: ${subID}`);

		// This method checks the subscriptions resources every 3 minutes until they are done and returns the resource JSON 
		wob.monitor_resources({organization: "MyOrg", space: "MySpace", service_instance_id: subID}, function(err, resourceDetails){
			if(err){
				console.error(err);
			}
			else{
				console.log(`My resources are finished provisioning and they are: ${resourceDetails}`);
			}
		});
	}
});

// Create a Liberty Collective or WAS Cell
// Type can be: 'LibertyCollective', 'WASCell'
// ApplicationServerVmSize The size of the Controller/Dmgr can be: 'S', 'M', 'L', 'XL', 'XXL'
// ControlServerVMSize  the size of the nodes can be: 'S', 'M', 'L', 'XL', 'XXL'
// number_of_app_vms is the number of nodes your Cell or Collective will have
wob.create_service_instance({organization: "MyOrg", space: "MySpace", type: "LibertyCollective", name: "myWASaaSCollective", application_server_vm_size: "S", control_server_vm_size: "S", number_of_app_vms: 1 }, function(err, instanceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My new service is: ${JSON.stringify(instanceDetails, null, 2)}`);
	}
});

// Get  all service instances in a org and space
wob.get_service_instances({organization: "MyOrg", space: "MySpace"}, function(err, instanceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My services are: ${JSON.stringify(instanceDetails, null, 2)}`);
	}
});

// Get a service instance in a org and space
wob.get_service_instance({organization: "MyOrg", space: "MySpace", service_instance_id: "MyServiceInstanceID"}, function(err, instanceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My service instance details are: ${JSON.stringify(instanceDetails, null, 2)}`);
	}
});

// Issue an Action on all resources with respect to a instance ID
// Currently action can be: 'stop', 'start'
wob.action_resources({organization: "MyOrg", space: "MySpace", service_instance_id: "MyServiceInstanceID", action: "stop"}, function(err, instanceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`Action Result: ${JSON.stringify(instanceDetails, null, 2)}`);
	}
});

// Issue an action on a single resource
wob.action_resource({organization: "MyOrg", space: "MySpace", service_instance_id: "MyServiceInstanceID", resource_id: "MyResourceID", action: "stop"}, function(err, actionResult){
	if(err){
		console.error(err);
	}
	else{
		console.log(`Action Result: ${JSON.stringify(actionResult, null, 2)}`);
	}
});

// Delete a service instance
wob.delete_service_instance({organization: "MyOrg", space: "MySpace", service_instance_id: "MyServiceInstanceID"}, function(err){
	if(err){
		console.error(err);
	}
	else{
		console.log("Deleted");
	}
});

// Get all resource information in a service instance
wob.get_resources({organization: "MyOrg", space: "MySpace", service_instance_id: "MyServiceInstanceID"}, function(err, resourceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My resources are: ${JSON.stringify(resourceDetails, null, 2)}`);
	}
});

// Get a single resource with respect to service instance ID and resource ID.
wob.get_resource({organization: "MyOrg", space: "MySpace", service_instance_id: "MyServiceInstanceID", resource_id: "MyResourceID"}, function(err, resourceDetails){
	if(err){
		console.error(err);
	}
	else{
		console.log(`My resource details are: ${JSON.stringify(resourceDetails, null, 2)}`);
	}
});
