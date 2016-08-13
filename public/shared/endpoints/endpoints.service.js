/**
 * @overview 	A sevice that sends get, post, put, and delete requests to the server through http. Allows raw mongoDB queries to be passed to the server. The user creates a new instance of the endpoints service providing an endpoint url to reach and calls api methods on that instance.
 * @author Jon Paul Miles <milesjonpaul@gmail.com>
 * @version 1.0.0
 * @license MIT
 * @example `var menus = new endpoints('menus');
 * var replaceMenu = {
 * 	url: '/new-url',
 * 	classes: 'another-class',
 * 	target:'_self'
 * };
 * //Pass in raw mongoDB queries
 * menus.update({url: '/about'}, replaceMenu).then(cb);`
 */

(function(){
	angular.module('meanbaseApp').factory('endpoints', function($http, toastr, feathers) {

		/**
		 * Sets up a rest endpoint for the given url so create, find, update, and delete can be performed on it. Calls generic error handler `errorHandler()` if error.
		 * @constructor
		 * @param  {string} endpoint The URL of the server endpoint to reach. `/api/` prefix is already assumed.
		 * @return {nothing}
		 */
		function endpoints(endpoint) {
			this.endpoint = endpoint || '';

			if(endpoint.indexOf('http://') > -1 || endpoint.indexOf('https://') > -1) {
				this.url = endpoint; // If the url is a full address then don't modify it
			} else { // else prefix it with /api/ so it calls our server api
				// this.url = '/api/' + this.endpoint;
				this.url = '/api/' + this.endpoint;
			}
		}

		/**
		 * Adds content in the server database for the endpoint passed into the constructor function. Calls generic error handler `errorHandler()` if error.
		 * @param  {object} content the item to be added to the database
		 * @return {promise}         An object or array of items that were created
		 */
		endpoints.prototype.create = function(content) {
			var self = this;
			return feathers.service(this.url).create(content).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
		 * Gets data matching the query. Calls generic error handler `errorHandler()` if error.
		 * @param  {object} identifier Raw mongoDB query
		 * @return {promise}            An object or array of items matching the query
		 */
		endpoints.prototype.find = function(identifier) {
			var self = this;
			return feathers.service(this.url).find({ query: identifier }).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
		 * Updates data in the server database identified with a mongoDB query with the replacement data passed in. Calls generic error handler `errorHandler()` if error.
		 * @param  {object} identifier  Raw mongoDB query
		 * @param  {object} replacement Whatever data you want to replace the found data with
		 * @return {promise}             Number of items that were updated
		 */
		endpoints.prototype.update = function(identifier, replacement) {
			var self = this;
			return feathers.service(this.url).patch(null, replacement, {query: identifier}).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
		 * Deletes data from the server database that matches the mongoDB query passed in. Calls generic error handler `errorHandler()` if error.
		 * @param  {object} identifier Raw mongoDB query
		 * @return {promise}            http response object
		 */
		endpoints.prototype.delete = function(identifier) {
      let id = null;
      let query = {query: identifier};
      if(identifier._id) { id = identifier._id; query = undefined; }

			var self = this;
			return feathers.service(this.url).remove(id, query).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
		 * Returns one item from the server that has the mongoDB _id passed in. Calls generic error handler `errorHandler()` if error.
		 * @param  {string} id The _id value of the object to retrieve
		 * @return {promise}    Object that has that id
		 */
		endpoints.prototype.findOne = function(id) {
			var self = this;
			return feathers.service(this.url).get(id).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
		 * Updates one item in the database that has the _id passed in with the information in replacement. Calls generic error handler `errorHandler()` if error.
		 * @param  {string} id          The `_id` of the mongoDB object
		 * @param  {object} replacement The content to replace the found object with
		 * @return {promise}             Number of items replaced
		 */
		endpoints.prototype.updateOne = function(id, replacement) {
			var self = this;
			return feathers.service(this.url).patch(id, replacement).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
		 * Deletes one item from the server database that has the _id that was passed in. Calls generic error handler `errorHandler()` if error.
		 * @param  {string} id The _id of the mongoDB object to delete
		 * @return {promise}    http response object
		 */
		endpoints.prototype.deleteOne = function(id) {
			var self = this;
			return feathers.service(this.url).remove(id).catch(function(data, status, headers, config) {
				self.errorHandler(data, status, headers, config);
			});
		};

		/**
	 * Generic error handler as a catch all. Tests that an html page didn't return. If so it prints out a console.log with the error. If the error is a mongoose validation error then it prints out the value of the property that was invalid in a toastr.  Otherwise we give a generic response saying the server is having trouble with... the 'menus' or whatever endpoint was passed in. If the server does return an html page then we just say the server is having trouble with the particular endpoint
	 * @param  {object|array} data    Response from the server
	 * @param  {Number} status  Status Code received from server
	 * @param  {[type]} headers Headers received from server
	 * @param  {object} config  Describes the request made to the server
	 * @return {nothing}
	 */
		endpoints.prototype.errorHandler = function(data) {

      var category = this.endpoint;

      toastr.warning(category + ': ' + data);
      console.log("general error: ", data);
			// var category = this.endpoint;

			// if(!/<[a-z][\s\S]*>/i.test(data)) {
			// 	console.log('Server API call to "' + category + '" failed. ', data);
			// 	var response = '';
			// 	if(data.message && data.message === 'Validation failed') {
			// 		for (var field in data.errors) {
			// 		  if (data.errors.hasOwnProperty(field)) {
			// 		  	if(data.errors[field].value && data.errors[field].value.length < 50) {
			// 			  	response += data.errors[field].value + ' is invalid.';
			// 			  }
			// 		  }
			// 		}
			// 		toastr.warning("Some of the form information was invalid. " + response);
			// 	} else {
			// 		toastr.error('Hmmmm, the server is having trouble with the ' + category + '.');
			// 	}
			// } else {
			// 	console.log('api request error.');
			// 	if(status !== 404) {
			// 		toastr.error('Hmmmm, there server is having trouble with the ' + category + '.');
			// 	}
			// }
		};

		return endpoints;
	});
})();
