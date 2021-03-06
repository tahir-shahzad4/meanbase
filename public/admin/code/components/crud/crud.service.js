angular.module('meanbaseApp')
  .service('crud', function (toastr, $timeout) {

    function CRUD(scope, collection, apiInstance) {
			this.scope = scope;
			this.collection = collection;
      this.api = apiInstance;
		}

    CRUD.prototype.create = function(item, message, failure) {
      var self = this;
      return this.api.create(item).then(function(p) {
        self.scope[self.collection].push(p);
        if(message) { toastr.clear(); toastr.success(message); }
      }, function(err) {
        if(failure) { toastr.clear(); toastr.warning(failure); }
      });
    };

    CRUD.prototype.find = function(query, message, failure) {
      var self = this;
      return this.api.find(query).then(function(res) {
        self.scope[self.collection] = res;
        $timeout(function() {
          componentHandler.upgradeAllRegistered()
        });
        if(message) { toastr.clear(); toastr.success(message); }
      }, function(err) {
        if(failure) { toastr.clear(); toastr.warning(failure); }
      });
    };

    CRUD.prototype.update = function(item, update, message, failure) {
      var self = this;
      var promise;
      if(item._id) {
        promise = this.api.updateOne(item._id, update);
      } else {
        promise = this.api.update(item, update);
      }
      return promise.then(function(response) {
        var collection = self.scope[self.collection];
        for (var i = 0; i < collection.length; i++) {
          if(collection[i]._id === item._id) {
            collection[i] = _.merge(collection[i], update);
          }
        }
        if(message) { toastr.clear(); toastr.success(message); }
      }, function(err) {
        console.log("Error updating item", err);
        if(failure) { toastr.clear(); toastr.warning(failure); }
      });
    };

    CRUD.prototype.delete = function(item, message, failure) {
      var self = this;
      var identifier = item._id? { _id: item._id }: item;

      return this.api.delete(identifier).then(function(response) {
        var collection = self.scope[self.collection];

        for (var i = 0; i < collection.length; i++) {
          if(collection[i]._id === item._id) {
            collection.splice(i, 1);
          }
        }

        if(message) { toastr.clear(); toastr.success(message); }
      }, function(err) {
        if(failure) { toastr.clear(); toastr.warning(failure); }
      });
    };

    CRUD.prototype.toggleModal = function(modalSwitch, copiedPropertyName, item) {
      var self = this;
      self.scope[modalSwitch] = !self.scope[modalSwitch];

      if(!self.scope[modalSwitch]) {
        self.scope[copiedPropertyName] = {};
      } else {
        self.scope[copiedPropertyName] = _.merge({}, item);
        self.scope[copiedPropertyName].$$hashKey = undefined;
      }
    };

    CRUD.prototype.listFilter = function() {

    };

    return CRUD;
  });
