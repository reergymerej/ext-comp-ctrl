Ext.Component.override({

	/**
	* @cfg {mvc.controller.ComponentController}
	*/
	controller: undefined,

    constructor: function (config) {
        var controller,
        	app;

        if (config && config.controllerName) {
        	if (!config.id) {
        		console.error('Components with controllers must have an id.');
        	}

        	app = mvc.getApplication();

            this.controller = Ext.create(config.controllerName, {
                application: app,
                id: config.controllerName + config.id,
                component: this,
                componentId: config.id
            });

            app.controllers.add(this.controller);
            this.controller.doInit();
        }

        this.callParent(arguments);
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
    		text: 'hello',
    		handler: function () {
    			this.up().fireEvent('donkey');
    		}
    	}
    ],

    update: function (str) {
        this.body.setHTML(str);
    }
});

Ext.define('mvc.view.BusHrs1', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.bushours1',
    title: 'business hours',
    items: [
        {
            xtype: 'button',
            text: 'trigger change',
            handler: function () {
                this.up('bushours1').fireEvent('change');
            }
        }
    ]
});

Ext.define('mvc.view.BusHrs2', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.bushours2',
    title: 'business hours',
    items: [
        {
            xtype: 'textfield'
        },

        {
            xtype: 'textfield'
        }
    ]
});


// =========================================
// CONTROLLERS

/**
* A controller that can be bound to a component.
*/
Ext.define('mvc.controller.ComponentController', {
    extend: 'Ext.app.Controller',

    constructor: function (config) {
    	// Rewrite the refs to localize to this component.
    	var refs = Ext.clone(this.refs);

    	Ext.Array.each(refs, function (ref, index, refs) {
    		refs[index].selector = '#' + config.componentId + ' ' + refs[index].selector;
    	});
    	config.refs = refs;
    	this.callParent(arguments);
    },

    /**
    * Override the basic control to localize
    * selectors to this component.
    * @param {Object} selectors
    */
    control: function (selectors) {
    	var me = this;

    	// Prepend component ID to each selector to ensure
    	// the EventBus only relays events for the bound component.
    	Ext.Object.each(selectors, function (scope, listeners) {
    		if (scope === 'root') {
    			selectors['#' + me.componentId] = listeners;
    		} else {
    			selectors['#' + me.componentId + ' ' + scope] = listeners;
    		}

    		delete selectors[scope];
    	});

    	this.callParent(arguments);
    },

    /**
    * Remove this controller from the event bus.
    */
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
        },

        {
            ref: 'innerPanel',
            selector: 'panel'
        }
    ],

    init: function() {
        this.control({
        	// root indicates the scope is the 
        	// TODO: Consider using '' instead to simplify the ComponentController.
        	'root': {
        		donkey: this.onDonkey
        	},
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
        var innerPanel;
        innerPanel = this.getInnerPanel();
        if (innerPanel) {
            innerPanel.update('The foo was clicked.');
        } else {
            console.log('clicked foo');
        }
    },

    onSomeFunkyEvent: function () {
        console.log('onSomeFunkyEvent');
    },

    onDonkey: function () {
    	console.log('donkey happened');
    }
});


/**
* Business Hours Controller
*/
Ext.define('mvc.controller.BusinessHoursController', {
    extend: 'mvc.controller.ComponentController',
    refs: [
    ],

    model: null,

    init: function () {
        this.control({
            'root': {
                change: this.onChange
            },
            'textfield': {
                change: this.onTextChange
            }
        }); 

        this.model = Ext.create('Nm.core.models.BusinessHours', {});
    },

    onChange: function () {
        console.log('onChange');
    },

    onTextChange: function (field, newValue, oldValue) {
        // this.onChange(newValue);
        console.log('onTextChange');
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
                xtype: 'bushours1',
                id: 'bus1',
                controllerName: 'mvc.controller.BusinessHoursController'
            },

            {
                xtype: 'bushours2',
                id: 'bus2',
                controllerName: 'mvc.controller.BusinessHoursController'
            }
		]
	});

})(nm, {});