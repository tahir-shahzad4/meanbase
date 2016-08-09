// Handles starting up and shutting down the inline text editors and syncing up changes with the model when edits are saved

'use strict';

angular.module('meanbaseApp')
  .directive('meanbaseEditable', function ($sanitize, $rootScope) {
    return {
      restrict: 'EA',
      scope: {
      	html:'=ngBindHtml',
      	config:'=config'
      },
      link: function (scope, element, attrs) {

        var el = jQuery(element);
        var selectedImage;

        // Sets up default configuration for our text editors
        var config = {
          autogrow: true,
          fullscreenable: false,
          btnsDef: {
              // Customizables dropdowns
              align: {
                  dropdown: ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                  ico: 'justifyLeft'
              },
              image: {
                  dropdown: ['insertImage', 'chooseImage'],
                  ico: 'insertImage'
              },
              lists: {
                dropdown: ['unorderedList', 'orderedList'],
                ico:'unorderedList'
              },
              chooseImage: {
                func: function(params, tbw) {
                  el.trumbowyg('saveSelection');
                  scope.$parent.openImageModal({multiple: false}, function(image) {
                    el.trumbowyg('restoreSelection');
                    // var imageWrapper = document.createElement('span');
                    // imageWrapper.classList.add('mb-img-container');

                    var imageToInsert = new Image();
                    imageToInsert.src = image.small;
                    imageToInsert.alt = image.alt;
                    imageToInsert.class = 'img-responsive';

                    // imageWrapper.appendChild(imageToInsert);
                    var sel = el.trumbowyg('getSelection');
                    sel.insertNode(imageToInsert);
                    startImageListeners();
                  });
                },
                ico: 'insertImage'
              },
              floatLeft: {
                func: function(params, tbw) {
                  if(selectedImage) {
                    selectedImage.classList.remove('image-float-right');
                    if(!selectedImage.classList.contains('image-float-left')) {
                      selectedImage.classList.add('image-float-left');
                    } else {
                      selectedImage.classList.remove('image-float-left');
                    }
                    selectedImage = null;
                  }
                },
                ico: 'justifyLeft'
              },
              floatRight: {
                func: function(params, tbw) {
                  if(selectedImage) {
                    selectedImage.classList.remove('image-float-left');
                    if(!selectedImage.classList.contains('image-float-right')) {
                      selectedImage.classList.add('image-float-right');
                    } else {
                      selectedImage.classList.remove('image-float-right');
                    }
                    selectedImage = null;
                  }
                },
                ico: 'justifyRight'
              }
          },
          btns: [
            'viewHTML',
            '|', 'formatting',
            '|', 'align',
            '|', 'lists',
            '|', 'chooseImage', 'floatLeft', 'floatRight'
          ]
        };

        var _snapshot;
        var allImages;

        // function clickAnywhere() {
        //   if(selectedImage && selectedImage.classList) {
        //     selectedImage.classList.remove('mb-currently-selected-img');
        //   }
        //   document.body.removeEventListener('click', clickAnywhere)
        // }

        function getSelectedImage(event) {
          selectedImage = event.target;
          // selectedImage.classList.add('mb-currently-selected-img');
          event.stopPropagation();
          // document.body.addEventListener('click', clickAnywhere, {once: true})
        }


        function enableTextEditor() {
          // Create the text editor instance. These events enable us to wrap the text in green outlines
          el.trumbowyg(config)
          .on('tbwfocus', function(){ trumbowygBox.addClass('hasFocus'); })
          .on('tbwblur', function(){ trumbowygBox.removeClass('hasFocus'); });

          // Get the el we want to add the hasFocus class to
          var trumbowygBox = el.parent('.trumbowyg-box');
          angular.element(window).bind('click', trackMouse);

        	// Store the initial data in a snapshot in case we need to restore the inital data if the user cancels their changes
        	_snapshot = angular.copy(scope.html);

          // We want to set the trumbowyg html to a copy of the inital value so if the extension drags around we retain it's html
          el.trumbowyg('html', _snapshot);
          startImageListeners();
        } //enableTextEditor

        function startImageListeners() {
          if(allImages) {
            removeImageListeners();
          }
          allImages = document.querySelectorAll('[meanbase-editable] img');
          allImages.forEach(function(image) {
            image.addEventListener("click", getSelectedImage);
          });
        }


        // Start up the text editors when editMode is activated
        if($rootScope.editMode) {
          enableTextEditor();
        }

        scope.$onRootScope('cms.editMode', function(event, value) {
          if(value) { enableTextEditor(); }
        });

        function trackMouse(event) {
          var evt = $(event.target);
          if(evt.is('[meanbase-editable]') || evt.parents('[meanbase-editable]').length > 0) {
            var box = evt.parents('.trumbowyg-box');
            var topPosition = box.offset().top + box.outerHeight() - event.pageY + 25;
            var pane = box.find('ul.trumbowyg-button-pane');
            pane.css('bottom', topPosition);
          }
        }

        function removeImageListeners() {
          allImages.forEach(function(image) {
            image.removeEventListener("click", getSelectedImage);
            console.log("image.classList", image.classList);
            if(image.classList.contains('mb-currently-selected-img')) {
              image.classList.remove('mb-currently-selected-img');
            }
          });
          allImages = null;
        }

        // When the user discards their edits, reset trumbowyg and ng-bind-html to the snapshot
        scope.$onRootScope('cms.discardEdits', function() {
          removeImageListeners();
          el.trumbowyg('html', _snapshot);
          scope.html = _snapshot;
          el.trumbowyg('destroy');
          angular.element(window).unbind('click', trackMouse);
        });

        // When the user saves their changes, update the ng-bind-html with the trymbowyg html
        scope.$onRootScope('cms.saveEdits', function() {
          removeImageListeners();
          console.log('save edits');
          scope.html = el.trumbowyg('html');
          el.trumbowyg('destroy');
        });

      } //link
    }; //return
  });