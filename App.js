Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
//Add this when using external mode
//           requires: ['Extensible'],
    items: [{
        xtype: 'container',
        id: 'feedbacktext',
        html: 'Fetching data....'
    }],

    rallyTaskStore: null,
    rallyStoryStore: null,
    calendarPanel: null,

    //Remember Rally names get prefixed with "c_"
    rallyCustomFieldPrefix: "c_",

    rallyRequiredCustomFields : [
        {
            'CalName': 'StartDate',
            'RallyName': 'c_StartDate',
            'Type': 'Date'
        },
        {
            'CalName': 'EndDate',
            'RallyName': 'c_EndDate',
            'Type': 'Date'
        },
        {
            'CalName': 'Colour',
            'RallyName': 'c_CoachState',
            'Type': 'Integer'
        }
    ],

    _getRallyName: function (name) {
        return  _.result(_.findWhere(this.rallyRequiredCustomFields, { 'CalName': name }), 'RallyName');
    },

    launch: function() {

        var app = this;
//           debugger;

           //Let's get some things from Rally

           // We expect that we are placed in a spot with the Team members nodes underneath.
           // If not, we will have to assume we are in a single calendar for this node. We must also
           // make sure that we are scoping down the project hierarchy


        var myCtxt = Rally.environment.getContext();
        var myProj = myCtxt.getProject();

        if (myProj.Children.Count > 0)
        {
            app.TeamPresent = true;
        }

        Ext.getCmp('feedbacktext').destroy();

        app.rallyTaskStore = Ext.data.StoreManager.lookup('eventStorage');

        if (!app.rallyTaskStore){
            app.rallyTaskStore = Ext.create('Rally.data.wsapi.Store' ,{
                storeId: 'taskStorage',
                model: 'task',
                autoLoad: true,
                listeners: {
                    'load' : app._tasksLoaded,
                    scope: app
                },
                filters: [
                    {
                        property: 'State',
                        operator: '<',
                        value: 'Completed'
                    }
                ],
                fetch: true

            });
            Ext.util.Observable.capture( app.rallyTaskStore, function(event) { console.log('store', event, arguments);});
        }
    },

    //When the Rally tasks are in from the server, make a local store to hold them. When any updates are done,
    // we trap them and apply changes to the Rally Task Store

    _tasksLoaded: function(){

        var app = this;

        var eventStore = Ext.create('Extensible.calendar.data.EventStore' ,{
            storeId: 'eventStorage',
            data: app._convertToEventStore(app, app.rallyTaskStore.getRecords()),
            model: 'Extensible.calendar.data.EventModel',
            proxy: {
                type: 'memory',
                storeId: 'eventStorage'
            },
            autoLoad: false,
            listeners: {
                'add': app._newEvent,
                'update': app._updateEvent,
                scope: app
            },
            scope: app
        });

        Ext.util.Observable.capture( eventStore, function(event) { console.log(event, arguments);});

        this._createCalendarStore(this, eventStore);
           
    },

           //Calendar fires this event on adding a new event. It also fires the update shortly afterwards
           //Due to the current complete incompatability between eventStore and Rally store, we have to do
           //the changes in both.

    _newEvent: function (store, records, index, eOpts) {

        _.each(records, function(rec) {
                //Custom field in Rally start with 'c_'
                //Standard Rally fields are: Name, WorkProduct, Project, etc., etc.
            var rsd = this._getRallyName('StartDate');
            var red = this._getRallyName('EndDate');

            var newRecord =     {
                'Name' : rec.get('Title'),
                'WorkProduct': rec.get('CalendarId'),
                'Project': Rally.environment.getContext().getProject()
            };

            var inst = this.rallyTaskStore.add( newRecord );

            if ( rec.get('IsAllDay') === true)
            {
                inst[0].set( rsd, Ext.Date.clearTime(rec.get('StartDate')));
                inst[0].set( red, Ext.Date.clearTime(rec.get('EndDate')));
            }
            else
            {
                inst[0].set( rsd, rec.get('StartDate'));
                inst[0].set( red, rec.get('EndDate'));
            }

            this.rallyTaskStore.sync().then({
                success: function(){
                    console.log ('Create success', arguments);
                },
                failure: function(){
                    console.log ('Create failed', arguments);
                }
            });
        }, this );

    },

        //Calendar fires this when the EventDetails window is closed after modifying an event.
    _updateEvent: function (store, rec, oper, modifiedList, eOpts) {
           //debugger;

           //If nothing modified (caused by a new event for some reason)
        if (! modifiedList ) return;

        //The contents of modified list comes from the calendar record. For each field modified,
        // change the Rally Task Store value

        var task = this.rallyTaskStore.findRecord('ObjectID', rec.get('EventId'));
        var rsd = this._getRallyName('StartDate');
        var red = this._getRallyName('EndDate');

        if (task) {

            _.each( modifiedList, function(fld) {

                // We have a specific mapping so, we can't do something generic
                switch (fld) {
                    case 'Title':
                        task.set('Name', rec.get('Title'));
                        break;

                    case 'Colour':
                        rec.set('Color', this._lookupTaskColour(rec.get('Colour'), 1));
                        task.set( 'DisplayColor', this._lookupTaskColour(rec.get('Colour'), 2));
                        task.set( this._getRallyName('Colour'), rec.get('Colour'));
                        break;

                    //Belt and braces here to clear out old invalid data
                    case 'IsAllDay':
                        rec.set('Duration', 0);
                        rec.set('StartDate',Ext.Date.clearTime(rec.get('StartDate')));
                        rec.set('EndDate',Ext.Date.clearTime(rec.get('EndDate')));
                        task.set( rsd, Ext.Date.clearTime(rec.get('StartDate')));
                        task.set( red, Ext.Date.clearTime(rec.get('EndDate')));
                        break;

                    case 'Notes':
                        task.set('Notes', rec.get('Notes'));
                        break;
                    case 'StartDate':
                    case 'EndDate':

                        //If it is an all day event, then deal with it above
                        if (_.find(modifiedList, 'IsAllDay'))
                            break;

                        var startTime = rec.get('StartDate');
                        var endTime = rec.get('EndDate');

                        //Calculate to do hours from this change
                        //If this is a multi-day event , then it is going to show as multiples of 24hours
                        //There seems to be a bug with Timezones, so we will do it the hard way.....

                        var diffTime = Ext.Date.getElapsed(startTime, Ext.Date.add(endTime, Ext.Date.MINUTE, 1)); //This is in millisecs

                        //How many days was it?

                        var days = Math.floor( diffTime / (24 * 60 * 60 * 1000));

                        var adjustedTime = Ext.Date.add(startTime, Ext.Date.MILLI, days * (24 * 60 * 60 * 1000));

                        diffTime = Ext.Date.getElapsed( adjustedTime, Ext.Date.add(endTime, Ext.Date.MINUTE, 1));

                        task.set('Estimate', (Math.floor(days) * 8) + Math.floor(diffTime/(1000 * 60 * 60)));
                        task.set(rsd, rec.get('StartDate'));
                        task.set(red, rec.get('EndDate'));
                        break;
                    default:
                        console.log("Unknown Field changed: " + fld);
                        break;
                }
            }, this);

//            task.set('Name', rec.get('Title'));
//            if ( rec.get('IsAllDay') === true)
//            {
//                task.set( rsd, Ext.Date.clearTime(rec.get('StartDate')));
//                task.set( red, Ext.Date.clearTime(rec.get('EndDate')));
//            }
//            else
//            {
//                task.set( rsd, rec.get('StartDate'));
//                task.set( red, rec.get('EndDate'));
//            }
//            task.set( 'WorkProduct',rec.get('CalendarId'));
//            task.set( 'DisplayColor', this._lookupTaskColour(rec.get('Colour'), 2));
//            task.set( this._getRallyName('Colour'), rec.get('Colour'));
//
            this.rallyTaskStore.sync().then({
                        success: function(){
                            console.log ('Update success', arguments);
                        },
                        failure: function(){
                            console.log ('Update failed', arguments);
                        }
            }, this);
        }
        else { console.log("Failed to find event" + rec.get('Title'));}

//        rec.dirty = true;
    },

    _removeEvent: function( store, rec, index, isMove, eOpts ) {
//           debugger;

           //We don't have the 'get' routines for deleting.
        var task = this.rallyTaskStore.findRecord('ObjectID', Ext.get(rec).elements[0].get('EventId'));

        task.destroy(). then({
            success: function(task){
                console.log ('Delete success', arguments);
            },
            failure: function(){
                console.log ('Delete failed', arguments);
            }
        }, this);


    },

    // The Colour is stored in Rally as a hash-hex value. This needs to relate directly to the hash-hex
    // values in the CSS file. We have to take a value of a field from Rally, look it up here and get a
    // number that is used to add to the CSS class string '.x-cal-' + number + '-ad'
    //The list here relates to the ones in the ColorPicker in Rally up to 9 and then I fudged it.

    _lookupTaskColour: function(colour, mode) {

        var result = null;
        var defaultVal = null;

        var colours = [

            {  value: '#105cab', Title: 'No Travel', Colour: 1 },     //Dark Blue
            {  value: '#ff1010', Title: 'Committed', Colour: 2 },     //Red
            {  value: '#107c1e', Title: 'Available', Colour: 3 },     //Dark Green
            {  value: '#4a1d7e', Title: 'Sales', Colour: 4 },         //Purple
            {  value: '#df1a7b', Title: 'Other', Colour: 5 },         //Cerise
            {  value: '#ee6c19', Title: 'Tentative', Colour: 6 },     //Burnt Orange
            {  value: '#f9a814', Title: 'Unused1', Colour: 7 },       //Light Orange
            {  value: '#fce205', Title: 'Travel', Colour: 8 },        //Yellow
            {  value: '#848689', Title: 'PTO', Colour: 9 },           //Grey
            {  value: '#21a2e0', Title: 'Planning', Colour: 10 },     //Light Blue
            {  value: '#202020', Title: 'Unavailable', Colour: 11 }          //Black
        ];

        switch(mode){
            case 0:
                result = _.result(_.findWhere(colours, { 'value': colour }), 'Colour');
                defaultVal = 3;
                break;
            case 1:
                result = _.result(_.findWhere(colours, { 'Title': colour }), 'Colour');
                defaultVal = 3;
                break;
            case 2:
                result = _.result(_.findWhere(colours, { 'Title': colour }), 'value');
                defaultVal = '#107c1e';
                break;
            case 3:
                result = _.result(_.findWhere(colours, { 'Colour': colour }), 'Title');
                defaultVal = 'Available';
                break;
            default:
                //No need for a default as we pick up a non-set value below
                break;
        }

        return result ? result : defaultVal;

    },
           // The Colour is stored in Rally as a hash-hex value. This needs to relate directly to the hash-hex
           // values in the CSS file. So, we have to take the default values from Rally, look them up here and get a
           // number that is used to add to the CSS class string '.x-cal-' + number + '-ad'

    _lookupStoryColour: function(colourString) {

        var colours = [

            {  value: '#105cab', Title: 'Initial Contact', Colour: 1 },     //Dark Blue
            {  value: '#21a2e0', Title: 'Prospect', Colour: 2 },            //Light Blue
            {  value: '', Title: 'Unavailable', Colour: 11 }                //Black
        ];
           
        return _.result(_.findWhere(colours, { 'value': colourString }), 'Colour');
           
    },

    _convertToEventStore: function( app, data ){
           
        var evts = [];
        var rsd = null, red = null;
           
        _.each(data, function(rec) {

            //Check to see if start and end dates are OK. If not, put them as today

            rsd = rec.get(app._getRallyName('StartDate'));
            red = rec.get(app._getRallyName('EndDate'));

            if ( !red & !rsd )
            {
               Rally.ui.notify.Notifier.showError({ message: 'Overriding Dates to today for ' + rec.get('FormattedID') + ': '+ rec.get('Name')});
            }

            if ( rsd && !red)
            {
                Rally.ui.notify.Notifier.showWarning({ message: 'Please set End Date for ' + rec.get('FormattedID') + ': '+ rec.get('Name')});
                red = Ext.Date.clone(rsd);
            }

            if (red && !rsd )
            {
                Rally.ui.notify.Notifier.showWarning({ message: 'Please set Start Date for ' + rec.get('FormattedID') + ': '+ rec.get('Name')});
                rsd = Ext.Date.clone(red);
            }

            rsd = rsd ? rsd : new Date(Ext.Date.now());
            red = red ? red : new Date(Ext.Date.now());

            var OwnerName = '';

            //Collect all the tags into a space separated string
            _.each(rec.get('Tags')._tagsNameArray, function(tag) {
                OwnerName = OwnerName + tag.Name + ' ';
            });

            if (OwnerName.length >1)
                OwnerName += ': ';

            //Choose whether we are to take the subnode name or the tags
            var title = app.TeamPresent ? rec.get('Project')._refObjectName + ': ' + rec.get('Name') : OwnerName + rec.get('Name');

            evts.push( new Extensible.calendar.data.EventModel({
                "CalendarId": rec.get('WorkProduct')._ref,
                "EventId": rec.get('ObjectID'),
                 "Title": title,
                 "StartDate" : rsd,
                 "EndDate" : red,
                 "Color" : app._lookupTaskColour(rec.get(app._getRallyName('Colour')), 1), //Drawing colour
                 "Colour" : rec.get(app._getRallyName('Colour')),   //Virtual 'colour' field (based on a state field)
                 "Url" :  Rally.util.Ref.getUrl(rec.get('_ref')),
                 "Notes" : rec.get('Notes'),
                 "Location" : OwnerName,

                 //"Colour" : app._lookupTaskColour(rec.get('DisplayColor'), false),
                 //"Color" : app._lookupTaskColour(rec.get('DisplayColor'), false),
                 //Tasks have to be less than one day to show individually
                 "IsAllDay" : Ext.Date.isEqual(rsd, red) || (Ext.Date.getDayOfYear(rsd) != Ext.Date.getDayOfYear(red))
            }));
        });
           
        return evts ;
           //		return { "evts" : [] };
    },
           
           // Rally tasks are used for individual day activities. The User Story is the Calendar for each activity 
           // for a Company. That way, we can have an Initiative in Rally, which is the Company. There might be a User
           // Story for a particular SOW, or PoC.
           
           // If we do this, then the Rally project node can be used for the consultant. And a number of consultant nodes 
           // under a node is automatically handled by the calendar to give a 'team' view.
           
    _createCalendarStore: function( app, eventStore ){
           
           //Get user stories and then create calendar on success
           app.rallyStoryStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'userstory',
                autoLoad: true,
                fetch: true,
                filters: [
                    {
                        property: 'ScheduleState',
                        operator: '<',
                        value: 'Accepted'
                    }
                ],
                listeners: {
                    load: function(store, data, success) {
                        //Create the store for the calendar
                        if (success) {
                            var cals = [];
                            _.each(data, function(rec) {
                                cals.push( new Extensible.calendar.data.CalendarModel({
                                    "CalendarId": rec.get('_ref'),
                                    "Title": rec.get('Name'),
                                    "Description": rec.get('FormattedID'),
                                    "Notes": rec.get('Description'),
                                    "Color" : app._lookupStoryColour(rec.get('DisplayColor'))
                                }));
                            });
                                        
                            var calendarStore = Ext.create('Extensible.calendar.data.MemoryCalendarStore', {
                                data: cals
                            });
                                        
                            //Create Calendar and add it.
                            app.calendarPanel = Ext.create('Extensible.calendar.CalendarPanel', {
                                calendarStore: calendarStore,
                                monitorResize: true,
                                eventStore: eventStore,
                                id: app.id + '-cal-pnl',
                                title: 'Activities',
                                frame: true,
                                width: 1120,    //Max size for Mac screen, Chrome, full screen with split column for key (Custom HTML panel)
                                height: 800
                            });
                                        
                            app.add(app.calendarPanel);
                        }
                    }
                }
                                            //						Ext.util.Observable.capture( app.calendarPanel, function() { console.log( 'CalPal', arguments);});
                                            
            });
            Ext.util.Observable.capture( app.rallyStoryStore, function(event) { console.log('stories', event, arguments);});
           
        }
    });

