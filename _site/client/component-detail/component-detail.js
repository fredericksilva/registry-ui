angular.module('registry')

.controller('DetailController', function($scope, $route, $routeParams, $location, $http, $sce) {
  $scope.$route = $route;
  $scope.$location = $location;
  $scope.$routeParams = $routeParams;
  
  $scope.notDisplayedInColumn = $scope.$parent.filter.notDisplayedInColumn;

  $scope.frameLoaded = function(id){
    var demoFrame = document.getElementById(id); 
  }

  // TODO: remove listener when the view gets destroyed
  window.addEventListener("message", receiveMessage, false);
  function log(logger,eventName,data){
    if(data !== undefined){
      text = eventName  + " triggered with " + removeCircularRefs(data);
    }
    message = document.createElement("div");
    message.textContent = text;
  
    // insert the div always at the top
    if(logger.childNodes.length > 0){
      logger.insertBefore(message,logger.firstChild);
    }else{
      logger.appendChild(message);
    }
  
    // cleanup
    if(logger.childNodes.length > 10){
      logger.removeChild(logger.lastChild);
    }
  }

  function removeCircularRefs(obj){
    return JSON.stringify(obj, function( key, value) {
      if( key == 'parent') { return value.id;}
      else {return value;}
    })
  }

  function receiveMessage(event)
  {
    console.log("cors", event.data);
    log(document.getElementById("evt-console"), event.data.name, event.data.data);
  }

  // get package name from the URL
  var name = $route.current.params.name;
  name = name.trim().toLowerCase();

  function getPackage(name,scope,sce){
    components = scope.$parent.components;
    for(var index in components){
      // search for package - probably
      // there is a more efficient way
      if(components[index].name === name){
        scope.c = components[index];
        console.log(scope.c);
        break;
      }
    }
    if(scope.c === undefined){
        console.log("Package " +name+  " not found.");
    }


   console.log("received readme:" +scope.c.readmeSrc);
   $http.get(scope.c.readmeSrc)
      .success(function(response) {

       response = response.toString().substring(1,response.length - 1);

        // workaround to translated escaped new lines
        response = response.split("\\n").join("\n");

        response = response.replace(/\\'/g, "'");
        response = response.replace(/\\"/g, '"');

        var html = marked( response );

       scope.c.readme = sce.trustAsHtml(html);
       })
       .error(function(response){
           console.log("error");
       });
  }

  $scope.$parent.components.$promise.finally(function(){
    getPackage(name,$scope, $sce);
  });
});

// callback for frames
angular.module('registry')
.directive('iframeOnload', [function(){
return {
    scope: {
        callBack: '&iframeOnload'
    },
    link: function(scope, element, attrs){
        element.on('load', function(){
            return scope.callBack();
        })
    }
}}])