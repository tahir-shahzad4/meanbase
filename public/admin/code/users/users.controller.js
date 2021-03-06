(function(){
	angular.module('meanbaseApp').controller('UsersCtrl', UsersCtrl);

	UsersCtrl.$inject = ['$scope', 'endpoints', 'toastr', 'api', 'crud', '$rootScope', '$timeout'];
	function UsersCtrl($scope, endpoints, toastr, api, crud, $rootScope, $timeout) {

    var u = $scope.u = new crud($scope, 'users', api.users);

    var r = $scope.r = new crud($scope, 'roles', api.roles);

    api.settings.find({})

    api.settings.find({name: 'defaultRole'}).then(function(res) {
      $scope.defaultRole = res[0].value;
    });

    function findall() {
      api.users.find({}).then(function(response) {
        $scope.users = response
      }, function(err) {
        toastr.warning('Sorry but we could not fetch the users.')
      });
    }
    findall();

		$scope.$parent.pageTitle = "Users and Permissions";
		$scope.$parent.tabs = [
      {title: "Users", id: '#users-list', active: true},
      {title: "Roles and Permissions", id: '#role-and-permissions', active: false}
    ];

	  // Get all roles and their permissions and set the roles panel selected role to the first one
	  api.roles.find({}).then(function(roles) {
	  	$scope.roles = roles;
	  	$scope.selectedRole = $scope.roles[0];

      if(!$scope.defaultRole) {
        for (var i = 0; i < $scope.roles.length; i++) {
          if($scope.roles[i].role === 'basic') {
            $scope.defaultRole = $scope.roles[i]
          }
        }

      }
	  });

    $scope.setDefaultRole = function() {
      api.settings.upsert({name: 'defaultRole'}, {name: 'defaultRole', value: $scope.defaultRole}).then(function(roles) {
  	  	toastr.success('Default role for new users is saved.')
  	  }, function() {
        toastr.warning("Sorry there was an error, and the default role could not be saved.")
      });
    };


    $scope.toggleEnabled = function(user) {
      user.enabled = !user.enabled;
      var message = user.enabled? user.email + ' enabled.': user.email + ' blocked.';
      var failure = user.enabled? 'Could not publish ' + user.email: 'Could not unpublish ' + user.email;
      $scope.u.update(user, {enabled: user.enabled}, message, failure);
  	};

	  // Create a new role
	  $scope.createRole = function() {
	  	var pass = true;
	  	var roleName = prompt('Role Name?');
	  	if(!roleName || !$scope.selectedRole) { return false; }
	  	for(var i = 0; i < $scope.roles.length; i++) {
	  		if($scope.roles[i].role === roleName) {
	  			toastr.warning('That role already exists just modify it.');
	  			pass = false;
	  			return false;
	  		}
	  	}
	  	if(!pass) { return false; }

	  	var newRole = {role: roleName, permissions: angular.copy($scope.selectedRole.permissions)};

  		api.roles.create(newRole).then(function(response) {
				$scope.roles.push(response);
  			$scope.selectedRole = response;
				toastr.clear();
				toastr.success('Created new role: ' + roleName);
  		});
	  };

	  // Update a role
	  $scope.updateRole = function(roleForm) {
	  	if(!$scope.selectedRole || $scope.selectedRole.role === 'admin') { return false; }
      $scope.r.update({_id: $scope.selectedRole._id}, {permissions: $scope.selectedRole.permissions}).then(function() {
        toastr.clear();
  			toastr.success('Updated ' + $scope.selectedRole.role + ' role.');
      });
	  };

    $scope.deleteUser = function(user) {
      var message = user.email + " deleted";
      var failure = 'Could not delete ' + user.email;
      $scope.u.delete(user, message, failure);
      $scope.u.toggleModal('isDeleteOpen', 'userToDelete');
    };

	  // Delete a role and move the users of that role to 'basic'
	  $scope.deleteRole = function(disabled) {
      if(!disabled) {
        var confirmed = confirm('Are you sure you want to delete ' + $scope.selectedRole.role + '? All users currently using this role will be switched to basic.');
  	  	if(!confirmed) return false;
  	  	if(!$scope.selectedRole || $scope.selectedRole.role === 'basic' || $scope.selectedRole.role === 'admin') { return false; }

    		api.users.update({role: $scope.selectedRole.role}, {role: 'basic'}).then(function(response) {
    			toastr.clear();
    			toastr.warning('Moved users with ' + $scope.selectedRole.role + ' over to basic');
          findall()
    		}).then(function(response) {
    			api.roles.delete({role: $scope.selectedRole.role}).then(function(response) {
    				toastr.success('Deleted ' + $scope.selectedRole.role + ' role.');
    				$scope.roles.splice($scope.roles.indexOf($scope.selectedRole), 1);
    				$scope.selectedRole = $scope.roles[0];
  				});
    		});
      }

	  };

    $scope.openSettingsModal = function() {
      var settings = {
        "email": "",
        "name": "",
        "password": "",
        "enabled": true
      };

      $scope.u.toggleModal('isSettingsOpen', 'settings', settings)
    };

    $scope.saveSettings = function(user, settings) {
      if(user && user._id) {
        $scope.u.update(user, settings, user.email + ' updated', 'Could not update ' + user.email);
      } else if(user && !user._id) {
        $scope.u.create(user, user.email + ' created', 'Could not create ' + user.email).then(function(response) {
          findall();
          $timeout(function() {
            componentHandler.upgradeAllRegistered()
          });
        });
      }

      $scope.u.toggleModal('isSettingsOpen', 'settings');
  	};

	  $scope.userFilter = '';
	  $scope.filterUsers = function(user) {
	  	return (user.name + user.email + user.role + user.lastVisited).toLowerCase().indexOf($rootScope.searchText.toLowerCase()) >= 0;
	  };

    $scope.$on('$destroy', function() {
      $scope.$parent.tabs = null;
      componentHandler.upgradeAllRegistered()
    });
	}
})();
