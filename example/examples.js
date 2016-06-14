var Wasaas = require("./websphere-on-bluemix");
var wasaas = new Wasaas({api_url:"YOUR_API_URL", username:"YOUR_USERNAME", password:"YOUR_PASS"});

// Get all orgs.
wasaas.get_organizations(function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Get an org by name.
wasaas.get_organization_by_name({organization:"YOUR_ORG"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Get all spaces.
wasaas.get_spaces({organization:"YOUR_ORG"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Get a space by name.
wasaas.get_space_by_name({organization:"YOUR_ORG", space: "YOUR_SPACE"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Create a service instance.
wasaas.create_service_instance({organization:"YOUR_ORG", space:"YOUR_SPACE", type:"LibertyNDServer", name:"My_WebSphere_on_Bluemix_Service", application_server_vm_size: "S"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Get all service instances.
wasaas.get_service_instance({organization:"YOUR_ORG", space:"YOUR_SPACE", service_instance_id:"YOUR_SERVICE_ID"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Get a single service instance.
wasaas.get_service_instances({organization:"YOUR_ORG", space:"YOUR_SPACE"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});


// Delete a service instance.
wasaas.delete_service_instance({organization:"YOUR_ORG", space:"YOUR_SPACE", service_instance_id:"YOUR_SERVICE_ID"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Get all resources.
wasaas.get_resources({organization:"YOUR_ORG", space:"YOUR_SPACE", service_instance_id:"YOUR_SERVICE_ID"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Apply an action on all resources in a subscription.
wasaas.action_resources({organization:"YOUR_ORG", space:"YOUR_SPACE", service_instance_id:"YOUR_SERVICE_ID", action: "stop"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});

// Apply an action to a single resource.
wasaas.action_resource({organization:"YOUR_ORG", space:"YOUR_SPACE", service_instance_id:"YOUR_SERVICE_ID", resource_id:"YOUR_RESOURCE_ID", action:"stop"}, function(err, result){
    if(err){
        console.error(err);
    }
    else{
        console.log(result);
    }
});