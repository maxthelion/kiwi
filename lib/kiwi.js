//Open Ajax 1.0
if(!window.OpenAjax){OpenAjax=new function(){var b=true;var i=false;var d=window;var a="org.openajax.hub.";var c={};this.hub=c;c.implementer="http://openajax.org";c.implVersion="1.0";c.specVersion="1.0";c.implExtraData={};var e={};c.libraries=e;c.registerLibrary=function(j,h,g,f){e[j]={prefix:j,namespaceURI:h,version:g,extraData:f};this.publish(a+"registerLibrary",e[j])};c.unregisterLibrary=function(f){this.publish(a+"unregisterLibrary",e[f]);delete e[f]};c._subscriptions={c:{},s:[]};c._cleanup=[];c._subIndex=0;c._pubDepth=0;c.subscribe=function(f,n,k,j,h){if(!k){k=window}var l=f+"."+this._subIndex;var g={scope:k,cb:n,fcb:h,data:j,sid:this._subIndex++,hdl:l};var m=f.split(".");this._subscribe(this._subscriptions,m,0,g);return l};c.publish=function(f,h){var j=f.split(".");this._pubDepth++;this._publish(this._subscriptions,j,0,f,h);this._pubDepth--;if((this._cleanup.length>0)&&(this._pubDepth==0)){for(var g=0;g<this._cleanup.length;g++){this.unsubscribe(this._cleanup[g].hdl)}delete (this._cleanup);this._cleanup=[]}};c.unsubscribe=function(g){var h=g.split(".");var f=h.pop();this._unsubscribe(this._subscriptions,h,0,f)};c._subscribe=function(f,k,g,j){var h=k[g];if(g==k.length){f.s.push(j)}else{if(typeof f.c=="undefined"){f.c={}}if(typeof f.c[h]=="undefined"){f.c[h]={c:{},s:[]};this._subscribe(f.c[h],k,g+1,j)}else{this._subscribe(f.c[h],k,g+1,j)}}};c._publish=function(t,s,n,f,g,m){if(typeof t!="undefined"){var h;if(n==s.length){h=t}else{this._publish(t.c[s[n]],s,n+1,f,g,m);this._publish(t.c["*"],s,n+1,f,g,m);h=t.c["**"]}if(typeof h!="undefined"){var o=h.s;var r=o.length;for(var k=0;k<r;k++){if(o[k].cb){var q=o[k].scope;var j=o[k].cb;var l=o[k].fcb;var p=o[k].data;if(typeof j=="string"){j=q[j]}if(typeof l=="string"){l=q[l]}if((!l)||(l.call(q,f,g,p))){j.call(q,f,g,p,m)}}}}}};c._unsubscribe=function(o,n,j,g){if(typeof o!="undefined"){if(j<n.length){var f=o.c[n[j]];this._unsubscribe(f,n,j+1,g);if(f.s.length==0){for(var m in f.c){return}delete o.c[n[j]]}return}else{var k=o.s;var l=k.length;for(var h=0;h<l;h++){if(g==k[h].sid){if(this._pubDepth>0){k[h].cb=null;this._cleanup.push(k[h])}else{k.splice(h,1)}return}}}}};c.reinit=function(){for(var f in OpenAjax.hub.libraries){delete OpenAjax.hub.libraries[f]}OpenAjax.hub.registerLibrary("OpenAjax","http://openajax.org/hub","1.0",{});delete OpenAjax._subscriptions;OpenAjax._subscriptions={c:{},s:[]};delete OpenAjax._cleanup;OpenAjax._cleanup=[];OpenAjax._subIndex=0;OpenAjax._pubDepth=0}};OpenAjax.hub.registerLibrary("OpenAjax","http://openajax.org/hub","1.0",{})};

/*global Kiwi, $k, $m, $v, $c, $, OpenAjax, window*/

//Prototypical inheritance
if (typeof Object.create !== 'function') {
     Object.create = function (o) {
         var F = function () {};
         F.prototype = o;
         return new F();
     };
}

var Kiwi = {
  m: {},
  v: {},
  c: {},
  options: {
    base_url: 'http://'+window.location.host,
    global_error_handler: {base: function(message, error_code, xhr){}}
  }    
};

//Connector Object
Kiwi.Connector = function(model){
  this.model = model;  
};

Kiwi.Connector.prototype = {
  get: function(params, after_success, after_error, options){
    return this.http_request(null, 'get', params, after_success, after_error, options);
  },
  
  post: function(params, after_success, after_error, options){
    return this.http_request(null, 'post', params, after_success, after_error, options);
  },
  
  put: function(params, after_success, after_error, options){
    params = $.extend(params || {}, {method: 'put'});
    return this.http_request(null, 'post', params, after_success, after_error, options);
  },
  
  destroy: function(after_success, after_error, options){
    var params = {method: 'delete'};
    return this.http_request(null, 'post', params, after_success, after_error, options);
  },
  
  uri: function(uri, model){
     if (!model) {model = this.model;}
     return Kiwi.Parser.get_recursive_uri(uri, model);
  },
  
  serialize: function(params){
    return Kiwi.Parser.serialize_http_params(params);
  },
  
  http_request: function(uri, method, params, after_success, after_error, options){
    var request = typeof Kiwi.__request__ == 'undefined' ? false : Kiwi.__request__;
    after_error = after_error || request.options.on_error;
    var server_request_handler = new Kiwi.ServerRequestHandler(after_success, after_error);
    params = params || {}; 
    //From the scope
    if (!uri) {uri = Kiwi.options.base_url + this.uri();}  
    options = $.extend({
      type: method,
      data: this.serialize(params),
      dataType: 'json',
      url: uri,
      cache: false,
      beforeSend: function(){
        if (request) {request.before_ajax_call();}
      },
      complete: function(xhr){
        if (request) {request.after_ajax_call();}        
      },
      success: function(data, status){
        server_request_handler.success.apply(request || this, [data]);
      },
      error: function(xhr, status_message){
        server_request_handler.error(xhr, status_message);
      }
    }, options || {});
    $.ajax(options);
  }    
};

//Server Request Handler Object -- good for errors
Kiwi.ServerRequestHandler = function(success_handler, error_handler){
  //Success handler is always passed, error handler is an object with a map of http error codes to functions or a function under the key 'all', can be a function too
  this.success = success_handler;
  this.error_handler =  error_handler || {};
};

Kiwi.ServerRequestHandler.prototype = {
  error: function(xhr, status_message){
    
    //If error handler is a function, execute it and return
    if (typeof this.error_handler === 'function'){
      this.error_handler.apply(window, [xhr, status_message]);
      return;
    }
   var message_object = {};
    //TODO ADD dealing with 0 from local response
    switch (xhr.status){
      //If status is 0 no connection was made to server
      case 0:
        message_object.error = "Could not contact server, please make sure you are connected to the Internet";
        break;
      case 200:
        //If 200, then either parsererror or timeout
        message_object.error = status_message === 'timeout' ? "The connection to the server timed out" : "There was a problem with the server response";
        break;
      default:
        message_object = eval("("+ (xhr.responseText) +")");
    }
    
    var args = [xhr.status, message_object, xhr];
       
    //Call custom universal error handler if passed in the request
    if (this.error_handler.all){
      this.error_handler.all.apply(this, args);
      return;
    }    
    //Call custom by-error-code handler if passed in the request
    if(this.error_handler[xhr.status]){
      this.error_handler[xhr.status].apply(this, args);
      return;
    }
    //Call by-error-code global error handler
    if (Kiwi.options.global_error_handler[xhr.status]){
      Kiwi.options.global_error_handler[xhr.status].apply(this, args);
    }
            
    //Call base global error handler
    Kiwi.options.global_error_handler.base.apply(this, args);
  }
};

//Parser object
Kiwi.Parser = {
  get_event_name: function(string){
    return string.substring(string.lastIndexOf(" ") + 1);
  },
  get_selector: function(string){
    return string.substring(0, string.lastIndexOf(" "));
  },
  get_handler: function(string, object){
    //If a period is encountered assume a controller and get action, if not assume current view/controller
    if (string.indexOf(".") != -1){
      var a = string.split(".");
      var controller = a[0];
      var action = a[1];
      return {klass: Kiwi.c[controller], action: Kiwi.c[controller][action], action_name: action};
    } else {
      action = string;
      return {klass: object, action: object[action], action_name: action};
    }
  },
  get_recursive_uri: function(uri, model){
    if (!uri) {uri = "";}
    uri =  model.uri() + uri;
    if (model.parent) {uri = this.get_recursive_uri(uri, model.parent);}
    return uri;
  },
  serialize_http_params: function(data, path, retval, level){
    if (!retval) {
  		path = '';
  		retval = {};
  		level = 0;
  		var newPath = null;
  	}
  	for (var property in data) {
  		newPath = level === 0 ? property : path + '[' + property + ']';
  		if (typeof(data[property]) === 'string' || typeof(data[property]) === 'number') {
  			retval[newPath] = data[property];
  		} else {
  			this.serialize_http_params(data[property], newPath, retval, level + 1);
  		}
  	}
  	return retval;
  },
  make_broadcast_name: function(handler){
    return handler.klass.name + "." + handler.action_name;
  },
  get_unix_timestamp: function(){
    return parseInt(new Date().getTime().toString(), 10);    
  },
  get_object_length: function(object){
     var i = 0;
     $.each(object, function(){
       i ++;
     });
     return i;
   }  
};

//Request object -- handles persistence through action chain
Kiwi.Request = function(event, view, options){
  var that = this;
  this.event = event;
  this.view = view;
  this.options = options;
  this.data = {};
  this.handler = Kiwi.Parser.get_handler(this.options.action, this.view);
  this.current_ajax_calls = 0;
  this.id = Kiwi.Parser.get_unix_timestamp();
  this.stopper = null;
  this.target = $(this.event.target);
  //Sets up auto-id
  $.each(this.event.target.attributes, function(){
    if (this.nodeName.indexOf("_id") !== -1){
      that[this.nodeName] = this.nodeValue;
    }
  })
};

Kiwi.Request.prototype = {
  continue_to: function(follow_up){
    var self = this; 
    
    return function(data){
      self.data = data;
      self.handler = Kiwi.Parser.get_handler(follow_up, self.handler.klass);
      Kiwi.__request__ = self;
      self.execute_action();
      delete Kiwi.__request__;
    };    
  },
  publish: function(data){
    this.data = data;
    var broadcast_name = Kiwi.Parser.make_broadcast_name(this.handler);
    if (this.options.subscribe) {this.view.subscribe_to(broadcast_name, this.options.callback, this.view);}
    OpenAjax.hub.publish(broadcast_name, this.data);
  }, 
  execute_action: function(){
    this.view.current_requests[this.id] = this;
    if (this.handler.klass.type === 'controller'){
      this.handler.action.apply(this);
    } else if (this.handler.klass.type === 'view') {
      this.handler.action.apply(this.view, [this]);
    }
  },
  before_ajax_call: function(){
    this.current_ajax_calls++;
    if (this.options.unbind && this.current_ajax_calls === 1) {this.put_event_stopper();}
    if (this.options.show_loader) {this.view.show_loader();}
  },
  after_ajax_call: function(){
    this.current_ajax_calls--;
    //Do anything that should be done after each ajax
    if (this.options.after_each_ajax_call) {this.options.after_each_ajax_call();}
    //Do anything that has been defined after all ajax calls (on a per view basis)
    if (this.current_ajax_calls === 0){
      if (this.options.unbind) {this.lift_event_stopper();}
      if (this.view.count_requests() === 1) {
        var after_callback = this.options.after_all_ajax_calls || this.view.hide_loader;
        after_callback.apply(this.view);
      }
      this.clean_up();
    }
  },
  clean_up: function(){
    this.destroy_self();
  },
  destroy_self: function(){
    delete this.view.current_requests[this.id];
  },
  put_event_stopper: function(){
    //Stops propagation temporarily so that event delegation halts
    this.stopper = function(e){e.stopImmediatePropagation(); return false;};
    $(this.event.target).bind(this.event.type, this.stopper);
  },
  lift_event_stopper: function(){
    //Unbinds stopper, delegation works again
    $(this.event.target).unbind(this.event.type, this.stopper);
  }
};

//Model
Kiwi.m = function(name, model){
  var new_model = Object.create(Kiwi.m.prototype);
  new_model.name = name;
  new_model.connector = new Kiwi.Connector(new_model);
  Kiwi.m[name] = $.extend(new_model, model);
};

// Model methods
Kiwi.m.prototype = {
  name: null,
  type: 'model',
  connector: null,
  has: {},
  bound: false,
  find: function(identifier, a, b, c, d){
    //If identifier is number, interpret as id, no params
    if (typeof identifier === 'number'){
      var model = this.id(identifier);
      var after_success = a;
      var after_error = b;
      var options = c;
      return after_success ? model.connector.get(null, after_success, after_error, options) : model;
    } else if (identifier === 'all'){
      if (typeof a === 'function'){
        //If a is function interpret as as success and assume no params
        after_success = a;
        after_error = b;
        options = c;
        return this.connector.get(null, after_success, after_error, options);
      } else {
        var params = a;
        after_success = b;
        after_error = c;
        options = d;
        return this.connector.get(params, after_success, after_error, options);
      }      
    }    
  },
  
  create: function(params, after_success, after_error, options){
    if (!this.bound) {return this.connector.post(params, after_success, after_error, options);}
  },
  
  update: function(params, after_success, after_error, options){
    if (this.bound) {return this.connector.put(params, after_success, after_error, options);}
  },
  
  destroy: function(after_success, after_error, options){
    if (this.bound) {return this.connector.destroy(after_success, after_error, options);}
  },
  
  uri: function(){
    var uri = "";
    if (typeof this.id === 'number'){
      uri = "/" + this.id + uri;
    } 
    uri = "/" + this.resource + uri;
    return uri;
  },
  
  //Binds a model to a specific object
  id: function(id){
    var model =  $.extend({}, this, {id: id});
    model.bound = true;
    //Replace connector
    model.connector = new Kiwi.Connector(model);
    //Associations
    $.each(model.has, function(key, name){
      var related_model = Object.create($.extend(Kiwi.m[name], {parent: model}));
      related_model.connector = new Kiwi.Connector(related_model);
      model[key] = related_model;
    });
    return model;    
  }
};  

//Controller
Kiwi.c = function(name, controller){
  var new_controller = Object.create(Kiwi.c.prototype);
  new_controller.name = name;
  Kiwi.c[name] = $.extend(new_controller, controller);
};

Kiwi.c.prototype = {
  name: null,
  type: 'controller'
};

//View inheritance
Kiwi.v = function(name, view){
  var new_view = Object.create(Kiwi.v.prototype);
  new_view.name = name;
  Kiwi.v[name] = $.extend(new_view, view);
};

Kiwi.v.prototype = {
  name: null,
  type: 'view',
  data:  {},
  node: null,
  listeners: {},
  subscriptions: {},
  initialize: function(node, data){
    var view = Object.create(this);
    view.node = node;
    view.data = data || {};
    view.current_requests = {};
    view.register_listeners();
    view.initialize_elements();
    view.initialize_loader();
    return view;
  },
  update: function(){},
  render: function(){},
  register_listeners: function(){
    var view = this;
    $.each(this.listeners, function(key, value){
      
      //Set defaults on request options
      if (typeof value === 'string'){
        value = {action: value};
      }    
      value = $.extend({callback: 'update', subscribe: true, on_error: null, show_loader: true, unbind: true, picker: null}, value);
      
      //General callback
      var callback = function(event){               
        
        Kiwi.__request__ = new Kiwi.Request(event, view, value);
        
        Kiwi.__request__.execute_action();        
        
        //If request has ajax call cleanup is delegated to post ajax request routine
        if (Kiwi.__request__.current_ajax_calls === 0) {Kiwi.__request__.clean_up();}        
        
        delete Kiwi.__request__;
       
        return false;        
      }; 
      
      var selector = Kiwi.Parser.get_selector(key);
      var event_name = Kiwi.Parser.get_event_name(key);
      var full_selector = view.node.selector + " " + selector;
      
      //Bind callback
      view.bind(full_selector, event_name, callback);      
    });
  },
  subscribe_to: function(broadcast_name, callback_name){
    //Makes sure there is only one subscription per controller + view action pair
    this.subscriptions[broadcast_name] = this.subscriptions[broadcast_name] || {};
    if (!this.subscriptions[broadcast_name][callback_name]) {
      this.subscriptions[broadcast_name][callback_name] = true;
      OpenAjax.hub.subscribe(broadcast_name, this[callback_name], this);
    }    
    return this;
  },
  bind: function(full_selector, event_name, callback) {
    //Binds using jQuery live -- works for future objects
    $(full_selector).live(event_name, callback);
  },
  initialize_elements: function(){
    var view = this;
    $.each(this.node.next('.elements').children(), function(){
      var template = view[($(this)[0].className)] = $(this);
      template.render_with = function(data) {
        var new_node = this.clone();
        //The text inside node with a class that matches the name of a key in 'data' will be set to the corresponding value
        //If the node is an img, then the src attribute will be set to the value, if a link, href will be set to the value
        data = data || {};
        $.each(data, function(key, value){
         $('.'+ key, new_node).each(function(){
           var node_name = $(this)[0].nodeName;
           switch (node_name) {
             case "IMG":
              $(this).attr("src", value);
              break;
             case "A":
              $(this).attr("href", value);
              break;
             default:
              $(this).text(value);              
           }           
         }); 
        });        
        return new_node;
      };     
    });
  },
  initialize_loader: function(){
    this.loader = $('.loader', this.node).hide();
  },
  show_loader: function(){
    this.loader.show();
  },
  hide_loader: function(){
    this.loader.hide();
  },
  count_requests: function(){
    return Kiwi.Parser.get_object_length(this.current_requests);
  }
};

//For jQuery feel
var $k = Kiwi;
var $m = Kiwi.m;
var $v = Kiwi.v;
var $c = Kiwi.c;