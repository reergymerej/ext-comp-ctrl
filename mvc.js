Ext.Component.override({
    constructor: function (config) {
        var controller;

        if (config && config.controllerName) {
            this.controller = Ext.create(config.controllerName, {
                application: mvc.getApplication(),
                id: config.controllerName + config.id,
                component: this
            });
        }

        this.callParent(arguments);
    },

    initComponent: function () {
    	this.callParent(arguments);

    	if (this.controller) {
    		this.controller.getApplication().controllers.add(this.controller);
    		this.controller.doInit();
    	}
    },

    destroy: function () {
    	if (this.controller) {
    		this.controller.destroy();
    	}
    	this.callParent();
    }
});

Ext.application({
	name: 'mvc',
	autoCreateViewport: false
});


// =========================================
// VIEWS

Ext.define('mvc.view.FooView', {
    extend: 'Ext.panel.Panel',
    // extend: 'Ext.button.Button',
    alias: 'widget.fooview',
    // html: 'I am a FooView.',
    title: 'a foo',
    items: [
    	{
    		xtype: 'button',
    		text: 'hello'
    	}
    ]
});


// =========================================
// CONTROLLERS

// This controller can be inserted into a component
// so it only handles events within the scope of the component.
Ext.define('mvc.controller.ComponentController', {
    extend: 'Ext.app.Controller',

    listeners: {},

    constructor: function (config) {
    	// TODO: rewrite the refs to localize to this component
    	this.callParent(arguments);
    },

    // override the basic control to localize
    // listeners to this component
    /**
    * @param {Object} selectors
    */
    control: function (selectors) {
    	var me = this;

    	// Prepend component ID to each selector to ensure
    	// the EventBus only relays events for the bound component.
    	Ext.Object.each(selectors, function (scope, listeners) {
    		if (scope === 'root') {
    			selectors['#' + me.component.id] = listeners;
    		} else {
    			selectors['#' + me.component.id + ' ' + scope] = listeners;
    		}

    		delete selectors[scope];
    	});

    	this.callParent(arguments);
    },

    destroy: function () {
    	var me = this,
    		app = this.getApplication(),
    		bus = app.eventbus.domains.component.bus;

    	// TODO: Can this be optimized?
    	Ext.Object.each(bus, function (eventName, selector) {
			Ext.Object.each(selector, function(query, events) {
				if (events.hasOwnProperty(me.id)) {
					delete events[me.id];
					return false;
				}
			});
    	});

    	// remove from app
    	app.controllers.removeAtKey(this.id);

    	this.callParent(arguments);
    }
});

Ext.define('mvc.controller.FooController', {
    extend: 'mvc.controller.ComponentController',

    refs: [
        {
            ref: 'fooView',
            selector: 'fooview'
        }
    ],

    init: function() {
        this.control({
            'button': {
                click: this.onFooClick,
                'some-funky-event': this.onSomeFunkyEvent
            },
            'another-thing': {
            	foo: Ext.emptyFn
            }
        });
        
        this.application.on({
            stationstart: Ext.emptyFn,
            scope: this
        });
    },
        
    onFooClick: function () {
        console.log('clicked foo', this);
    },

    onSomeFunkyEvent: function () {
        console.log('onSomeFunkyEvent');
    }
});


(function (nm, nmParams) {
	var id = 'MVC';

	

	nm.AddPanel({
		id: id,
		nmParams: nmParams,
		title: id,
		layout: {
			type: 'hbox',
			align: 'stretch'
		},
		defaults: {
			flex: 1,
			frame: true
		},
		items: [
			{
				id: 'a',
				xtype: 'fooview',
				controllerName: 'mvc.controller.FooController'
			},
			{
				title: 'another thing',
				items: [
					{
						id: 'b',
						xtype: 'fooview',
						controllerName: 'mvc.controller.FooController'
					}
				]
			}
		]
	});

})(nm, {});