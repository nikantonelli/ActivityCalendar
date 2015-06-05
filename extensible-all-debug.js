/*!
 * Extensible 1.6.0-rc.1
 * Copyright(c) 2010-2013 Extensible, LLC
 * licensing@ext.ensible.com
 * http://ext.ensible.com
 */
/**
 * Extensible core utilities and functions.
 */
Ext.define('Extensible', {
    
    singleton: true,
    
    /**
     * The version of the Extensible framework
     * @type String
     */
    version: '1.6.0-rc.1',
    /**
     * The version of the framework, broken out into its numeric parts. This returns an
     * object that contains the following integer properties: major, minor and patch.
     * @type Object
     */
    versionDetails: {
        major: 1,
        minor: 6,
        patch: 0
    },
    /**
     * The minimum version of Ext required to work with this version of Extensible, currently
     * 4.0.1. Note that the 4.0.0 Ext JS release is not compatible.
     * @type String
     */
    extVersion: '4.0.1',

    hasBorderRadius: Ext.supports.CSS3BorderRadius,

    log: function(s) {
        //console.log(s);
    },

    getScrollWidth: function() {
        return Ext.getScrollbarSize ? Ext.getScrollbarSize().width : Ext.getScrollBarWidth();
    },

    constructor: function() {
        // Have to make sure the body is ready since we are modifying it below
        Ext.onReady(function() {
            if (this.getScrollWidth() < 3) {
                // OSX Lion introduced dynamic scrollbars that do not take up space in the
                // body. Since certain aspects of the layout are calculated and rely on
                // scrollbar width, we add this class if needed so that we can apply
                // static style rules rather than recalculate sizes on each resize.
                // We check for less than 3 because the Ext scrollbar measurement gets
                // slightly padded (not sure the reason), so it's never returned as 0.
                Ext.getBody().addCls('x-no-scrollbar');
            }
            if (Ext.isWindows) {
                // There are a few Extensible-specific CSS fixes required only on Windows
                Ext.getBody().addCls('x-win');
            }
            if (Ext.getVersion('extjs').isLessThan('4.1')) {
                // Unfortunately some styling changed in 4.1 that requires version-specific
                // CSS differences to handle properly across versions. Ugh.
                Ext.getBody().addCls('x-4-0');
            }
        }, this);
    },

   /**
    * @class Extensible.Date
    * @extends Object
    * Contains utility date functions used by the calendar components.
    * @singleton
    */
    Date: {
        /**
         * Determines whether times used throughout all Extensible components should be displayed as
         * 12 hour times with am/pm (default) or 24 hour / military format. Note that some locale files
         * may override this value by default.
         * @type Boolean
         * @property use24HourTime
         */
        use24HourTime: false,
        
        /**
         * Returns the time duration between two dates in the specified units. For finding the number of
         * calendar days (ignoring time) between two dates use {@link Extensible.Date.diffDays diffDays} instead.
         * @param {Date} start The start date
         * @param {Date} end The end date
         * @param {String} unit (optional) The time unit to return. Valid values are 'millis' (the default),
         * 'seconds', 'minutes' or 'hours'.
         * @return {Number} The time difference between the dates in the units specified by the unit param,
         * rounded to the nearest even unit via Math.round().
         */
        diff: function(start, end, unit) {
            var denom = 1,
                diff = end.getTime() - start.getTime();
            
            if (unit === 's' || unit === 'seconds') {
                denom = 1000;
            }
            else if (unit === 'm' || unit === 'minutes') {
                denom = 1000*60;
            }
            else if (unit === 'h' || unit === 'hours') {
                denom = 1000*60*60;
            }
            return Math.round(diff / denom);
        },
        
        /**
         * Calculates the number of calendar days between two dates, ignoring time values.
         * A time span that starts at 11pm (23:00) on Monday and ends at 1am (01:00) on Wednesday is
         * only 26 total hours, but it spans 3 calendar days, so this function would return 2. For the
         * exact time difference, use {@link Extensible.Date.diff diff} instead.
         * 
         * NOTE that the dates passed into this function are expected to be in local time matching the
         * system timezone. This does not work with timezone-relative or UTC dates as the exact date
         * boundaries can shift with timezone shifts, affecting the output. If you need precise control
         * over the difference, use {@link Extensible.Date.diff diff} instead.
         * 
         * @param {Date} start The start date
         * @param {Date} end The end date
         * @return {Number} The number of calendar days difference between the dates
         */
        diffDays: function(start, end) {
            // All calculations are in milliseconds
            var day = 1000 * 60 * 60 * 24,
                clear = Ext.Date.clearTime,
                timezoneOffset = (start.getTimezoneOffset() - end.getTimezoneOffset()) * 60 * 1000,
                diff = clear(end, true).getTime() - clear(start, true).getTime() + timezoneOffset,
                days = Math.round(diff / day);
            
            return days;
        },
        
        /**
         * Copies the time value from one date object into another without altering the target's
         * date value. This function returns a new Date instance without modifying either original value.
         * @param {Date} fromDt The original date from which to copy the time
         * @param {Date} toDt The target date to copy the time to
         * @return {Date} The new date/time value
         */
        copyTime: function(fromDt, toDt) {
            var dt = Ext.Date.clone(toDt);
            
            dt.setHours(
                fromDt.getHours(),
                fromDt.getMinutes(),
                fromDt.getSeconds(),
                fromDt.getMilliseconds());
            
            return dt;
        },
        
        /**
         * Compares two dates and returns a value indicating how they relate to each other.
         * @param {Date} dt1 The first date
         * @param {Date} dt2 The second date
         * @param {Boolean} precise (optional) If true, the milliseconds component is included in the comparison,
         * else it is ignored (the default).
         * @return {Number} The number of milliseconds difference between the two dates. If the dates are equal
         * this will be 0.  If the first date is earlier the return value will be positive, and if the second date
         * is earlier the value will be negative.
         */
        compare: function(dt1, dt2, precise) {
            var d1 = dt1, d2 = dt2;
            
            if (precise !== true) {
                d1 = Ext.Date.clone(dt1);
                d1.setMilliseconds(0);
                d2 = Ext.Date.clone(dt2);
                d2.setMilliseconds(0);
            }
            return d2.getTime() - d1.getTime();
        },

        // helper fn
        maxOrMin: function(max) {
            var dt = max ? 0: Number.MAX_VALUE,
                i = 0,
                args = arguments[1],
                ln = args.length;
            
            for (; i < ln; i++) {
                dt = Math[max ? 'max': 'min'](dt, args[i].getTime());
            }
            return new Date(dt);
        },
        
        /**
         * Returns the maximum date value passed into the function. Any number of date
         * objects can be passed as separate params.
         * @param {Date} dt1 The first date
         * @param {Date} dt2 The second date
         * @param {Date} dtN (optional) The Nth date, etc.
         * @return {Date} A new date instance with the latest date value that was passed to the function
         */
		max: function() {
            return this.maxOrMin.apply(this, [true, arguments]);
        },
        
        /**
         * Returns the minimum date value passed into the function. Any number of date
         * objects can be passed as separate params.
         * @param {Date} dt1 The first date
         * @param {Date} dt2 The second date
         * @param {Date} dtN (optional) The Nth date, etc.
         * @return {Date} A new date instance with the earliest date value that was passed to the function
         */
		min: function() {
            return this.maxOrMin.apply(this, [false, arguments]);
        },
        
        isInRange: function(dt, rangeStart, rangeEnd) {
            return  (dt >= rangeStart && dt <= rangeEnd);
        },
        
        /**
         * Returns true if two date ranges overlap (either one starts or ends within the other, or one completely
         * overlaps the start and end of the other), else false if they do not.
         * @param {Date} start1 The start date of range 1
         * @param {Date} end1   The end date of range 1
         * @param {Date} start2 The start date of range 2
         * @param {Date} end2   The end date of range 2
         * @return {Booelan} True if the ranges overlap, else false
         */
        rangesOverlap: function(start1, end1, start2, end2) {
            var startsInRange = (start1 >= start2 && start1 <= end2),
                endsInRange = (end1 >= start2 && end1 <= end2),
                spansRange = (start1 <= start2 && end1 >= end2);
            
            return (startsInRange || endsInRange || spansRange);
        },
        
        /**
         * Returns true if the specified date is a Saturday or Sunday, else false.
         * @param {Date} dt The date to test
         * @return {Boolean} True if the date is a weekend day, else false
         */
        isWeekend: function(dt) {
            return dt.getDay() % 6 === 0;
        },
        
        /**
         * Returns true if the specified date falls on a Monday through Friday, else false.
         * @param {Date} dt The date to test
         * @return {Boolean} True if the date is a week day, else false
         */
        isWeekday: function(dt) {
            return dt.getDay() % 6 !== 0;
        },
        
        /**
         * Returns true if the specified date's time component equals 00:00, ignoring
         * seconds and milliseconds.
         * @param {Object} dt The date to test
         * @return {Boolean} True if the time is midnight, else false
         */
        isMidnight: function(dt) {
            return dt.getHours() === 0 && dt.getMinutes() === 0;
        },
        
        /**
         * Returns true if the specified date is the current browser-local date, else false.
         * @param {Object} dt The date to test
         * @return {Boolean} True if the date is today, else false
         */
        isToday: function(dt) {
            return this.diffDays(dt, this.today()) === 0;
        },
        
        /**
         * Convenience method to get the current browser-local date with no time value.
         * @return {Date} The current date, with time 00:00
         */
        today: function() {
            return Ext.Date.clearTime(new Date());
        },
        
        /**
         * Add time to the specified date and returns a new Date instance as the result (does not
         * alter the original date object). Time can be specified in any combination of milliseconds
         * to years, and the function automatically takes leap years and daylight savings into account.
         * Some syntax examples:
         *		var now = new Date();
         *		// Add 24 hours to the current date/time:
         *		var tomorrow = Extensible.Date.add(now, { days: 1 });
         *		// More complex, returning a date only with no time value:
         *		var futureDate = Extensible.Date.add(now, {
         *			weeks: 1,
         *			days: 5,
         *			minutes: 30,
         *			clearTime: true
         *		});
         * 
         * @param {Date} dt The starting date to which to add time
         * @param {Object} o A config object that can contain one or more of the following
         * properties, each with an integer value:
         *
         *	* millis
         *	* seconds
         *	* minutes
         *	* hours
         *	* days
         *	* weeks
         *	* months
         *	* years
         * 
         * You can also optionally include the property "clearTime: true" which will perform all of the
         * date addition first, then clear the time value of the final date before returning it.
         * @return {Date} A new date instance containing the resulting date/time value
         */
        add: function(dt, o) {
            if (!o) {
                return dt;
            }
            var ExtDate = Ext.Date,
                dateAdd = ExtDate.add,
                newDt = ExtDate.clone(dt);
            
            if (o.years) {
                newDt = dateAdd(newDt, ExtDate.YEAR, o.years);
            }
            if (o.months) {
                newDt = dateAdd(newDt, ExtDate.MONTH, o.months);
            }
            if (o.weeks) {
                o.days = (o.days || 0) + (o.weeks * 7);
            }
            if (o.days) {
                newDt = dateAdd(newDt, ExtDate.DAY, o.days);
            }
            if (o.hours) {
                newDt = dateAdd(newDt, ExtDate.HOUR, o.hours);
            }
            if (o.minutes) {
                newDt = dateAdd(newDt, ExtDate.MINUTE, o.minutes);
            }
            if (o.seconds) {
                newDt = dateAdd(newDt, ExtDate.SECOND, o.seconds);
            }
            if (o.millis) {
                newDt = dateAdd(newDt, ExtDate.MILLI, o.millis);
            }
             
            return o.clearTime ? ExtDate.clearTime(newDt): newDt;
        },
        
        clearTime: function(dt, clone) {
            return Ext.Date.clearTime(dt, clone);
        }
    }
});


/* =========================================================
 * @private
 * Ext overrides required by Extensible components
 * =========================================================
 */
Ext.require([
    'Ext.picker.Color',
    'Ext.form.Basic',
    'Ext.data.proxy.Memory'
]);

Extensible.applyOverrides = function() {

    var extVersion = Ext.getVersion('extjs');
    
    // This was fixed in Ext 4.0.5:
    if (Ext.layout.container.AbstractCard) {
        Ext.layout.container.AbstractCard.override({
            renderChildren: function () {
                // added check to honor deferredRender when rendering children
                if (!this.deferredRender) {
                    this.getActiveItem();
                    this.callParent();
                }
            }
        });
    }
    
    // This was fixed in Ext 4.0.4?
    Ext.Component.override({
        getId: function() {
            var me = this,
                xtype;
            
            if (!me.id) {
                xtype = me.getXType();
                xtype = xtype ? xtype.replace(/[\.,\s]/g, '-'): 'ext-comp';
                me.id = xtype + '-' + me.getAutoId();
            }
            return me.id;
        }
    });
    
    if (Ext.picker && Ext.picker.Color) {
        Ext.picker.Color.override({
            constructor: function() {
                // use an existing renderTpl if specified
                this.renderTpl = this.renderTpl || Ext.create('Ext.XTemplate', '<tpl for="colors"><a href="#" ' +
                    'class="color-{.}" hidefocus="on"><em><span style="background:#{.}" ' +
                    'unselectable="on">&#160;</span></em></a></tpl>');
    
                this.callParent(arguments);
            }
        });
    }
    
    if (extVersion.isLessThan('4.1')) {
        if (Ext.data && Ext.data.reader && Ext.data.reader.Reader) {
            Ext.data.reader.Reader.override({
                extractData: function(root) {
                    var me = this,
                        values  = [],
                        records = [],
                        Model   = me.model,
                        i       = 0,
                        length  = root.length,
                        node, id, record;
                        
                    if (!root.length && Ext.isObject(root)) {
                        root = [root];
                        length = 1;
                    }
            
                    for (; i < length; i++) {
                        node   = root[i];
                        values = me.extractValues(node);
                        
                        // Assuming that the idProperty is intended to use the id mapping, if
                        // available, getId() should read from the mapped values not the raw values.
                        // Using the non-mapped id causes updates later to silently fail since
                        // the updated data is replaced by id.
                        //id = me.getId(node);
                        id = me.getId(values);
                        
                        record = new Model(values, id, node);
                        records.push(record);
                            
                        if (me.implicitIncludes) {
                            me.readAssociated(record, node);
                        }
                    }
            
                    return records;
                }
            });
        }
    }
    
    if (Ext.form && Ext.form.Basic) {
        Ext.form.Basic.override({
            reset: function() {
                var me = this;
                // This causes field events to be ignored. This is a problem for the
                // DateTimeField since it relies on handling the all-day checkbox state
                // changes to refresh its layout. In general, this batching is really not
                // needed -- it was an artifact of pre-4.0 performance issues and can be removed.
                //me.batchLayouts(function() {
                    me.getFields().each(function(f) {
                        f.reset();
                    });
                //});
                return me;
            }
        });
    }

    // Currently MemoryProxy really only functions for read-only data. Since we want
    // to simulate CRUD transactions we have to at the very least allow them to be
    // marked as completed and successful, otherwise they will never filter back to the
    // UI components correctly.
    if (Ext.data && Ext.data.proxy && Ext.data.proxy.Memory) {
        Ext.data.proxy.Memory.override({
            updateOperation: function(operation, callback, scope) {
                Ext.each(operation.records, function(rec) {
                    rec.commit();
                });
                operation.setCompleted();
                operation.setSuccessful();
                Ext.callback(callback, scope || this, [operation]);
            },
            create: function() {
                this.updateOperation.apply(this, arguments);
            },
            update: function() {
                this.updateOperation.apply(this, arguments);
            },
            destroy: function() {
                this.updateOperation.apply(this, arguments);
            }
        });
    }
    
    // In Ext 4.0.x, CheckboxGroup's resetOriginalValue uses a defer hack that was removed
    // in 4.1. Unfortunately that defer hack causes a runtime error in certain situations
    // and is not really needed, so we'll replace any 4.0.x version with the new fixed version.
    if (extVersion.isLessThan('4.1') && Ext.form && Ext.form.CheckboxGroup) {
        Ext.form.CheckboxGroup.override({
            resetOriginalValue: function() {
                var me = this;
                
                me.eachBox(function(box) {
                    box.resetOriginalValue();
                });
                me.originalValue = me.getValue();
                me.checkDirty();
            }
        });
    }
};

Ext.onReady(Extensible.applyOverrides);/*
 * 
 */
Ext.define('Extensible.lang.Number', {
    statics: {
        getOrdinalSuffix: function(num) {
            if (!Ext.isNumber(num)) {
                return '';
            }
            switch (num) {
                case 1:
                case 21:
                case 31:
                    return "st";
                case 2:
                case 22:
                    return "nd";
                case 3:
                case 23:
                    return "rd";
                default:
                    return "th";
            }
        }
    }
}, function() {
    Extensible.Number = Extensible.lang.Number;
});
/**
 * The base Model class used by Extensible
 */
Ext.define('Extensible.data.Model', {
    extend: 'Ext.data.Model',
    
    requires: [
        'Ext.util.MixedCollection'
    ],
    
    // *Must* be defined by subclasses
    mappingClass: null,
    
    // Should be defined by subclasses, or will default to the default Model id property
    mappingIdProperty: null,
    
    inheritableStatics: {
        /**
         * Reconfigures the default model definition based on the current
         * {@link #mappingClass Mappings} class.
         * @method reconfigure
         * @static
         * @return {Function} The updated constructor function
         */
        reconfigure: function() {
            var proto = this.prototype,
                mappings = Ext.ClassManager.get(proto.mappingClass || ''),
                idProperty = proto.mappingIdProperty,
                prop,
                fields = [],
                i = 0,
                len = 0;
            
            if (!mappings) {
                throw 'The mappingClass for ' + this.$className + ' is undefined or invalid';
            }
            // TODO: Add this as a compile-time warning:
            //if (!idProperty) {
                // idProperty should usually be defined at this point, so make sure it's not missing
            //}
            
            // It is critical that the id property mapping is updated in case it changed, since it
            // is used elsewhere in the data package to match records on CRUD actions:
            proto.idProperty = idProperty || proto.idProperty || 'id';
            
            for (prop in mappings) {
                if(mappings.hasOwnProperty(prop)) {
                    fields.push(mappings[prop]);
                }
            }

            proto.fields.clear();
            len = fields.length;
            
            for (; i < len; i++) {
                proto.fields.add(Ext.create('Ext.data.Field', fields[i]));
            }
            return this;
        }
    },
    
    /**
     * Returns a new instance of this Model with the `data` property deep-copied from the
     * original record. By default the {@link #idProperty} value will be deleted to avoid returning
     * the cloned record with a duplicate id, but you can optionally preserve the id by passing `true`.
     *
     * The behavior is different than the default {@link Ext.data.Model#copy} (which preserves the
     * existing id by default and performs a shallow copy of the data) and is better-suited
     * to the typical default desired behavior when duplicating a record.
     *
     * @param {Boolean} [preserveId=false] True to preserve the record's data {@link idProperty id},
     * false to delete it in the returned clone
     * @return {Extensible.data.Model} The cloned record
     */
    clone: function(preserveId) {
        var copy = Ext.create(this.$className),
            dataProp = this.persistenceProperty;
        
        copy[dataProp] = Ext.Object.merge({}, this[dataProp]);
        
        if (preserveId !== true) {
            delete copy[dataProp][this.idProperty];
        }
        return copy;
    }
});/**
 * Represents an iCalendar recurrence rule and parses recurrence rule strings
 * to generate a textual description of each recurrence rule for human readability.
 *
 * Note that currently only a subset of the iCalendar recurrence rule attributes are supported.
 * They are `FREQ`, `INTERVAL`, `BYDAY`, `BYMONTHDAY`, `BYMONTH`, `COUNT` and `UNTIL`.
 *
 * Portions of this implementation were inspired by the recurrence rule parser of [Vincent Romagnoli][1].
 *
 * Reference documentation is at [http://www.ietf.org/rfc/rfc2445.txt][2],
 * although a more practical guide can be found at [http://www.kanzaki.com/docs/ical/rrule.html][3].
 * 
 * Authored by [Gabriel Sidler][4]
 * 
 * [1]: https://github.com/skyporter/rrule_parser
 * [2]: http://www.ietf.org/rfc/rfc2445.txt
 * [3]: http://www.kanzaki.com/docs/ical/rrule.html
 * [4]: http://teamup.com
 * 
 * @author Gabriel Sidler
 */
Ext.define('Extensible.form.recurrence.Rule', {
    config: {
        /**
         * @cfg {String} dateValueFormat
         * The date string format to return in the RRULE (defaults to 'Ymd\\THis\\Z'). This is the standard
         * ISO-style iCalendar date format (e.g. January 31, 2012, 14:00 would be formatted as: "20120131T140000Z")
         * and should not typically be changed. Note that per the iCal specification, date values should always be
         * specified in UTC time format, which is why the format string ends with 'Z'.
         */
        dateValueFormat: 'Ymd\\THis\\Z',
        /**
         * @cfg {String} rule
         * A recurrence rule string conforming to the standard iCalendar RRULE/EXRULE format, e.g.
         * "FREQ=WEEKLY;INTERVAL=2;COUNT=10;" (default is null).
         */
        rule: null,
        /**
         * @cfg {Date/String} startDate
         * Optional start date for the recurrence rule (default is null). Not required just to parse the RRULE
         * values, but it is required in conjunction with the RRULE to calculate specific recurring date instances,
         * or to provide accurate textual descriptions for certain rules when calling {@link #getDescription}.
         * May be provided as a Date object, or as a string that can be parsed as a valid date.
         */
        startDate: null,
        /**
         * @cfg {Number} frequency
         * The value of the FREQ attribute of the recurrence rule, or null if no recurrence rule has been set
         * (default is null). Supported string values are "DAILY", "WEEKLY", "MONTHLY" and "YEARLY".
         */
        frequency: null,
        /**
         * @cfg {Number} count
         * The value of the COUNT attribute of the recurrence rule, or null if the recurrence rule has no COUNT
         * attribute or if no recurrence rule has been set (default is null). Supported values are any integer >= 1.
         */
        count: null,
        /**
         * @cfg {Date} until
         * The value of the UNTIL attribute of the recurrence rule as a Date object, or null if the recurrence
         * rule has no UNTIL attribute or if no recurrence rule has been set (default is null).
         * Note that per the iCal specification, this date should always be specified in UTC time format (which
         * is why the {@link #dateValueFormat} always ends with 'Z').
         */
        until: null,
        /**
         * @cfg {Number} interval
         * The value of the INTERVAL attribute of the recurrence rule, defaults to 1. Supported values are
         * any integer >= 1.
         */
        interval: 1,
        /**
         * @cfg {String} byDay
         * The value of the BYDAY attribute of the recurrence rule, or null if the recurrence rule has no
         * BYDAY attribute or if no recurrence rule has been set (default is null).
         *
         * The BYDAY attribute can contain 3 different types of values:
         *
         *	* A comma-delimited string of 2-character weekday abbreviations, e.g. 'MO,TU,FR,SU'
         *	* A numbered weekday abbreviation that can be positive or negative, e.g. '4TH' or '-1FR'
         *	* An integer day offset from the start or end of the period, e.g. 3, 20 or -10.
         *
         * See also {@link #byDayWeekdays} and {@link #byDayNumberedWeekday} for more
         * information about how these values are used.
         */
        byDay: null,
        /**
         * @cfg {String} byDayWeekdays
         * A comma separated list of abbreviated weekday names representing the days of the week on which
         * the recurrence pattern should repeat (e.g. ['TU', 'TH', 'FR']), or null if not applicable (default).
         */
        byDayWeekdays: null,
        /**
         * @cfg {Number} byMonthDay
         * The value of the BYMONTHDAY attribute of the recurrence rule or null if the recurrence rule has no
         * BYMONTHDAY attribute, or if no recurrence rule has been set (default is null). This value is an integer
         * relative offset from the start or end of the month (e.g. 10 means "the 10th day of the month", or -5
         * means "the 5th to last day of the month"). Supported values are between 1 and 31, or between -31 and -1.
         */
        byMonthDay: null,
        /**
         * @cfg {Number} byMonth
         * The value of the BYMONTH attribute of the recurrence rule or null if the recurrence rule has no
         * BYMONTH attribute, or if no recurrence rule has been set (default is null). Supported values are
         * integers between 1 and 12 corresponding to the months of the year from January to December.
         */
        byMonth: null,
        /**
         * @cfg {Object} strings
         * Strings used to generate plain text descriptions of the recurrence rule. There are a lot of strings and
         * they are not individually documented since typically they will be defined in locale files, and not
         * overridden as typical configs (though you could also do that). For complete details see the source code
         * or look at the locale files.
         */
        strings: {
            dayNamesShort: {
                SU: 'Sun',
                MO: 'Mon',
                TU: 'Tue',
                WE: 'Wed',
                TH: 'Thu',
                FR: 'Fri',
                SA: 'Sat'
            },

            dayNamesShortByIndex: {
                0: 'Sun',
                1: 'Mon',
                2: 'Tue',
                3: 'Wed',
                4: 'Thu',
                5: 'Fri',
                6: 'Sat'
            },

            dayNamesLong: {
                SU: 'Sunday',
                MO: 'Monday',
                TU: 'Tuesday',
                WE: 'Wednesday',
                TH: 'Thursday',
                FR: 'Friday',
                SA: 'Saturday'
            },
            
            ordinals: {
                1: 'first',
                2: 'second',
                3: 'third',
                4: 'fourth',
                5: 'fifth',
                6: 'sixth'
            },
            
            frequency: {
                none: 'Does not repeat',
                daily: 'Daily',
                weekly: 'Weekly',
                weekdays: 'Every weekday (Mon-Fri)',
                monthly: 'Monthly',
                yearly: 'Yearly'
            },
            
            every: 'Every',       // e.g. Every 2 days
            days: 'days',
            weeks: 'weeks',
            weekdays: 'weekdays',
            months: 'months',
            years: 'years',
            time: 'time',        // e.g. Daily, 1 time
            times: 'times',      // e.g. Daily, 5 times
            until: 'until',      // e.g. Daily, until Dec, 31 2012
            untilFormat: 'M j, Y', // e.g. Dec 10, 2012
            and: 'and',          // e.g. Weekly on Tuesday and Friday
            on: 'on',            // e.g. Weekly on Thursday
            onDay: 'on day',     // e.g. Monthly on day 23
            onDayPostfix: '',    // In some languages a postfix is need for the onDay term,
                                 // for example in German: 'Monatlich am 23.'
                                 // Here the postfix would be '.'
            onThe: 'on the',     // e.g. Monthly on the first Thursday
            onTheLast: 'on the last', // e.g. Monthly on the last Friday
            onTheLastDay: 'on the last day', // e.g. Monthly on the last day
            of: 'of',            // e.g. Annually on the last day of November
            monthFormat: 'F',    // e.g. November
            monthDayFormat: 'F j' // e.g. November 10
        }
    },
    
    /**
     * @private
     * @property byDayNames
     * @type Array[String]
     * The abbreviated day names used in "by*Day" recurrence rules. These values are used when creating
     * the RRULE strings and should not be modified (they are not used for localization purposes).
     */
    byDayNames: [ "SU", "MO", "TU", "WE", "TH", "FR", "SA" ],
    
    /**
     * @private
     */
    constructor: function(config) {
        // Have to do this manually since we are not extending Ext.Component, otherwise
        // the configs will never get initialized:
        return this.initConfig(config);
    },

    /**
     * Initializes recurrence rule and attributes
     */
    init: function()  {
        var me = this;

        me.startDate = null;
        me.frequency = null;
        me.count = null;
        me.until = null;
        me.interval = 1;
        me.byDay = null;
        me.byDayWeekdays = null;
        me.byDayNthWeekday = null;
        me.byMonthDay = null;
        me.byMonth = null;
    },

    /**
     * @private
     */
    applyStartDate: function(dt) {
        this.startDate = new Date(dt);
    },
    
    /**
     * @private
     */
    applyFrequency: function(freq) {
        this.init();
        this.frequency = freq;
    },

    /**
     * @private
     */
    applyCount: function(count) {
        // Only one of UNTIL and COUNT are allowed. Therefore need to clear UNTIL attribute.
        this.until = null;
        this.count = count;
    },
    
    /**
     * @private
     * Transforms the string value of the UNTIL attribute to a Date object if needed.
     * @param {Date/String} until A Date object or a string in the standard ISO-style iCalendar
     * date format, e.g. January 31, 2012, 14:00 would be formatted as: "20120131T140000Z". See section 4.3.5 in
     * the iCalendar specification at http://www.ietf.org/rfc/rfc2445.txt.
     */
    applyUntil: function(until) {
        // Only one of UNTIL and COUNT are allowed. Therefore, clear COUNT attribute.
        this.count = this.until = null;

        if (Ext.isDate(until)) {
            this.until = until;
        }
        else if (typeof until === 'string') {
            this.until = this.parseDate(until);
        }
    },
    
    /**
     * Parses a date string in {@link #dateValueFormat iCal format} and returns a Date object if possible. This
     * method is the inverse of {@link #formatDate}.
     * @param {String} dateString A date string in {@link #dateValueFormat iCal format}
     * @param {Object} options An optional options object. This can contain:
     *
     *	A String <tt>format</tt> property to override the default {@link #dateValueFormat} used when parsing the string (not recommended)
     *	A Boolean <tt>strict</tt> property that gets passed to the {@link Ext.Date.parse} method to determine whether or not strict date parsing should be used (defaults to false)
     *	A Date <tt>defaultValue</tt> property to be used in case the string cannot be parsed as a valid date (defaults to the current date)
     *
     * @returns {Date} The corresponding Date object
     */
    parseDate: function(dateString, options) {
        options = options || {};
        
        try {
            var date = Ext.Date.parse(dateString, options.format || this.dateValueFormat, options.strict);
            if (date) {
                return date;
            }
        }
        catch(ex) {}
        
        return options.defaultValue || new Date();
    },
    
    /**
     * Formats a Date object into a date string in {@link #dateValueFormat iCal format}. This method is the
     * inverse of {@link #parseDate}.
     * @param {Date} date The Date object to format
     * @returns {String} The corresponding date string
     */
    formatDate: function(date) {
        return Ext.Date.format(date, this.dateValueFormat);
    },

    /**
     * @private
     * Applies the value of the BYDAY attribute to the underlying RRULE.
     * @param {String/Array/Object} byDay The new value of the BYDAY attribute. There are three ways to pass a
     * parameter value:
     * 
     *	1. As a string, e.g. 'MO,TU,WE' or '3TH' or '-1FR'
     *	2. As an array of weekday identifiers, e.g. ['MO', 'TU', 'WE']. 
     *	3. As an object with two attributes *number* and *weekday*, e.g. 
     *		
     *			{ number: 4, weekday:'TH' }
     * 
     *	or
     *  
     *			{ number: -1, weekday:'WE' }
     */
    applyByDay: function(byDay) {
        var me = this;
        // Only one of BYDAY and BYMONTHDAY are allowed. Clear BYMONTHDAY.
        me.byMonthDay = null;

        // Reset derived attributes
        me.byDayWeekdays = null;
        me.byDayNthWeekday = null;

        if (typeof byDay === 'string') {
            me.byDay = byDay;

            // There are three cases to consider.
            var n = parseInt(byDay, 10);
            
            if (Ext.isNumber(n)) {
                if (n === -1 ) {
                    // The last weekday of period was specified, e.g. -1SU, -1MO, ... -1SA.
                    me.byDayNthWeekday = {number: n, weekday: byDay.substr(2, 2)};
                }
                else {
                    // A numbered weekday was specified, e.g. 1SU, 2SU, ... 5SA
                    me.byDayNthWeekday = {number: n, weekday: byDay.substr(1, 2)};
                }
            }
            else {
                // A comma separated list of weekdays was specified, e.g. MO,TU,FR
                me.byDayWeekdays = byDay.split(",");
            }
        }
        else if (Array.isArray(byDay)) {
            // byDay is an array with a list of weekdays, e.g. ['MO', 'TU', 'FR']
            me.byDay = byDay.join(',');
            me.byDayWeekdays = byDay;
        }
        else if (Ext.isObject(byDay)) {
            // byDay is an object with two properties number and weekday, e.g. {number: 4, weekday: 'TH'}
            me.byDay = byDay.number + byDay.weekday;
            me.byDayNthWeekday = byDay;
        }
    },

    /**
     * If attribute BYDAY of the recurrence rule holds a numbered weekday following iCal relative syntax
     * (e.g. '4TU' meaning "the fourth Tuesday of the month") then this function returns an Object with two
     * attributes *number* and *weekday* (e.g. {number: 4, weekday: 'TU'}), otherwise this method
     * returns null. This object is provided as a convenience when accessing the individual parts of the value.
     * For iCal RRULE representation the {@link #getByDay BYDAY} string should always be used instead.
     * Use function {@link #setByDay} to set the underlying values.
     */
    getByDayNthWeekday: function() {
        return this.byDayNthWeekday;
    },

    /**
     * @private
     * Sets the value of the BYMONTHDAY attribute of the RRULE.
     * @param {int} day Supported values are -1 and 1 to 31.
     */
    applyByMonthDay: function(day) {
        // Only one of BYDAY and BYMONTHDAY are allowed. Clear BYDAY and derived attributes.
        this.byDay = null;
        this.byDayWeekdays = null;
        this.byDayNthWeekday = null;
        this.byMonthDay = day;
    },
    
    /**
     * Returns a textual representation of the underlying rules in [iCal RRULE format](http://www.kanzaki.com/docs/ical/rrule.html), 
     * e.g. "FREQ=WEEKLY;INTERVAL=2;". This is the standard format that is typically 
     * used to store and transmit recurrence rules between systems.
     * @returns {String} The iCal-formatted RRULE string, or empty string if a valid RRULE cannot be returned
     */
    getRule: function() {
        var rule = [],
            me = this;
        
        if (!me.frequency) {
            return '';
        }
        rule.push('FREQ=' + me.frequency);
        
        if (me.interval !== 1) {
            rule.push('INTERVAL=' + me.interval);
        }
        if (me.byDay) {
            rule.push('BYDAY=' + me.byDay);
        }
        if (me.byMonthDay) {
            rule.push('BYMONTHDAY=' + me.byMonthDay);
        }
        if (me.byMonth) {
            rule.push('BYMONTH=' + me.byMonth);
        }
        if (me.count) {
            rule.push('COUNT=' + me.count);
        }
        if (me.until) {
            rule.push('UNTIL=' + Ext.Date.format(me.until, me.dateValueFormat));
        }
        return rule.join(';') + ';';
    },

    /**
     * @private
     * Parses a recurrence rule string conforming to the iCalendar standard. Note that currently only the following
     * recurrence rule attributes are supported: FREQ, INTERVAL, BYDAY, BYMONTHDAY, BYMONTH, COUNT and UNTIL.
     *
     * This function can be used to set a new rule or update an existing rule. If rule attribute FREQ is present
     * in the passed recurrence rule string, then the rule is initialized first before rule properties are set. If
     * rule attribute FREQ is not present, then the rule properties are updated without first initializing the rule.
     *
     * @param {String} rRule iCalendar recurrence rule as a text string. E.g. "FREQ=WEEKLY;INTERVAL=2;"
     */
    applyRule: function(rRule) {
        var rrParams, nbParams, p, v,
            i = 0,
            me = this;
        
        if (!rRule) {
            this.init();
            return;
        }
        rrParams = rRule.split(";");
        nbParams = rrParams.length;

        // Process the FREQ attribute first because this initializes the rule.
        for (; i < nbParams; i++) {
            p = rrParams[i].split("=");
            if (p[0] === "FREQ") {
                me.setFrequency(p[1]); // This will initialize the rule.
                break;
            }
        }

        // Now process all attributes except the FREQ attribute.
        for (i = 0; i < nbParams; i++) {
            p = rrParams[i].split("=");
            v = p[1];
            
            switch (p[0]) {
                case 'INTERVAL':
                    me.setInterval(parseInt(v, 10));
                    break;
                case 'COUNT':
                    me.setCount(parseInt(v, 10));
                    break;
                case 'UNTIL':
                    me.setUntil(v);
                    break;
                case 'BYDAY':
                    me.setByDay(v);
                    break;
                case 'BYMONTHDAY':
                    me.setByMonthDay(parseInt(v, 10));
                    break;
                case 'BYMONTH':
                    me.setByMonth(parseInt(v, 10));
                    break;
            }
        }
    },

    /**
     * Return a textual description of the iCalendar recurrence rule. E.g. the rule "FREQ=DAILY;INTERVAL=2;COUNT=5"
     * is returned as the text "Every 2 days, 5 times".
     * @param {Date} [startDate] Optional start date of the event series, only required for certain rule types
     * (e.g., any rule that is specified as date-relative like "BYDAY=-1FR" can only be represented relative
     * to a specific start date).
     * @return {String} The textual description
     */
    getDescription: function(startDate) {
        var me = this,
            desc = [],
            freq = me.frequency ? Ext.String.capitalize(me.frequency.toLowerCase()) : '';

        startDate = startDate || this.startDate;
        
        if (freq && me['getDescription' + freq]) {
            me['getDescription' + freq](desc, startDate);
        }
        me.getDescriptionCount(desc, startDate);
        me.getDescriptionUntil(desc, startDate);

        return desc.join('');
    },
    
    /**
     * @protected
     * Returns the description if the rule is of type "FREQ=DAILY".
     * May be overridden to customize the output strings, especially for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionDaily: function(desc, startDate) {
        var me = this,
            strings = me.strings;
        
        if (me.interval === 1) {
            // E.g. Daily
            desc.push(strings.frequency.daily);
        }
        else {
            // E.g. Every 2 days
            desc.push(strings.every, ' ', me.interval, ' ', strings.days);
        }
    },
    
    /**
     * @protected
     * Returns the description if the rule is of type "FREQ=WEEKLY".
     * May be overridden to customize the output strings, especially for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionWeekly: function(desc, startDate) {
        var me = this,
            strings = me.strings;
        
        if (me.interval === 1) {
            // E.g. Weekly
            desc.push(strings.frequency.weekly);
        }
        else {
            // E.g. Every 2 weeks
            desc.push(strings.every, ' ', me.interval, ' ', strings.weeks);
        }

        // Have specific weekdays been specified? E.g. Weekly on Tuesday, Wednesday and Thursday
        if (me.byDayWeekdays) {
            var len = me.byDayWeekdays.length;
            
            desc.push(' ', strings.on, ' ');
            
            for (var i=0; i < len; i++) {
                if (i > 0 && i < len-1) {
                    desc.push(', ');
                }
                else if (len > 1 && i === len-1) {
                    desc.push(' ', strings.and, ' ');
                }
                // If more than 2 weekdays have been specified, use short day names, otherwise long day names.
                if (len > 2) {
                    desc.push(strings.dayNamesShort[me.byDayWeekdays[i]]);
                }
                else {
                    desc.push(strings.dayNamesLong[me.byDayWeekdays[i]]);
                }
            }
        }
        else if (startDate) {
            // No weekdays are specified. Use weekday of parameter startDate as the weekday. E.g. Weekly on Monday
            desc.push(' ', strings.on, ' ', strings.dayNamesLong[me.byDayNames[startDate.getDay()]]);
        }
    },
    
    /**
     * @protected
     * Returns the description if the rule is of type "FREQ=WEEKDAYS". Note that WEEKDAYS is not
     * part of the iCal standard -- it is a special frequency value supported by Extensible as a shorthand
     * that is commonly used in applications. May be overridden to customize the output strings, especially
     * for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionWeekdays: function(desc, startDate) {
        if (this.interval === 1) {
            desc.push(this.strings.frequency.weekdays);
        }
        else {
            // E.g. Every two weekdays
            desc.push(this.strings.every, ' ', this.interval, ' ', this.strings.weekdays);
        }
    },
    
    /**
     * @protected
     * Returns the description if the rule is of type "FREQ=MONTHLY".
     * May be overridden to customize the output strings, especially for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionMonthly: function(desc, startDate) {
        var me = this,
            strings = me.strings;
        
        if (me.interval === 1) {
            // E.g. Monthly
            desc.push(strings.frequency.monthly);
        }
        else {
            // E.g. Every 2 months
            desc.push(strings.every, ' ', me.interval, ' ', strings.months);
        }

        if (me.byMonthDay > 0) {
            // A specific month day has been selected, e.g. Monthly on day 23.
            desc.push(' ' + strings.onDay + ' ' + me.byMonthDay + strings.onDayPostfix);
        }
        else if (me.byMonthDay === -1) {
            // The last day of the month has been selected, e.g. Monthly on the last day.
            desc.push(' ' + strings.onTheLastDay);
        }
        else if (me.byDayNthWeekday) {
            // A numbered weekday of the month has been selected, e.g. Monthly on the first Monday
            if (me.byDayNthWeekday.number > 0) {
                desc.push(' ', strings.onThe, ' ', strings.ordinals[me.byDayNthWeekday.number], ' ',
                    strings.dayNamesLong[me.byDayNthWeekday.weekday]);
            }
            else {
                // Last weekday of the month has been selected, e.g. Monthly on the last Sunday
                desc.push(' ' + strings.onTheLast + ' ' + strings.dayNamesLong[me.byDayNthWeekday.weekday]);
            }
        }
    },
    
    /**
     * @protected
     * Returns the description if the rule is of type "FREQ=YEARLY".
     * May be overridden to customize the output strings, especially for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionYearly: function(desc, startDate) {
        var me = this,
            strings = me.strings;
        
        if (me.interval === 1) {
            // E.g. Yearly
            desc.push(strings.frequency.yearly);
        }
        else {
            // E.g. Every two years
            desc.push(strings.every, ' ', me.interval, ' ', strings.years);
        }
        
        if (!startDate) {
            // StartDate is required for formatting beyond this point
            return;
        }
        
        if (me.byMonthDay === -1) {
            // The last day of the month, e.g. Annually on the last day of November.
            desc.push(' ', strings.onTheLastDay, ' ', strings.of, ' ', Ext.Date.format(startDate, strings.monthFormat));
        }
        else if (me.byDayNthWeekday) {
            // A numbered weekday of the month has been selected, e.g. Monthly on the first Monday
            if (me.byDayNthWeekday.number > 0) {
                // A numbered weekday of the month, e.g. Annually on the second Wednesday of November.
                desc.push(' ', strings.onThe, ' ', strings.ordinals[me.byDayNthWeekday.number], ' ',
                    strings.dayNamesLong[me.byDayNthWeekday.weekday], ' ', strings.of, ' ',
                    Ext.Date.format(startDate, strings.monthFormat));
            }
            else {
                // Last weekday of the month, e.g. Annually on the last Sunday of November
                desc.push(' ', strings.onTheLast, ' ', strings.dayNamesLong[me.byDayNthWeekday.weekday], ' ',
                    strings.of, ' ', Ext.Date.format(startDate, strings.monthFormat));
            }
        }
        else {
            // Yearly on the current start date of the current start month, e.g. Annually on November 27
            desc.push(' ', strings.on, ' ', Ext.Date.format(startDate, strings.monthDayFormat));
        }
    },
    
    /**
     * @protected
     * Returns the description only for the "COUNT=5" portion of the rule (e.g., "5 times").
     * May be overridden to customize the output strings, especially for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionCount: function(desc, startDate) {
        if (this.count) {
            // E.g. Daily, 5 times
            desc.push(', ', this.count, ' ', (this.count === 1 ? this.strings.time : this.strings.times));
        }
    },
    
    /**
     * @protected
     * Returns the description only for the "UNTIL" portion of the rule.
     * May be overridden to customize the output strings, especially for localization.
     * @param {Array[String]} desc An array of strings representing the rule description parts collected
     * so far. This array is passed around, and each method should typically append any needed strings to
     * it. After all logic is complete, the array will be joined and the final description returned.
     * @param {Date} [startDate] The start date of the recurring series (optional).
     */
    getDescriptionUntil: function(desc, startDate) {
        if (this.until) {
            // E.g. Daily, until December 31, 2012
            desc.push(', ', this.strings.until, ' ', Ext.Date.format(this.until, this.strings.untilFormat));
        }
    }
});
/**
 * A global instance of Extensible.form.recurrence.Rule.
 * 
 */
Ext.define('Extensible.form.recurrence.Parser', {
    extend: 'Extensible.form.recurrence.Rule',
    singleton: true
});
/**
 * The abstract base class for all of the recurrence option widgets. Intended to be subclassed.
 * 
 * @private
 */
Ext.define('Extensible.form.recurrence.AbstractOption', {
    
    // TODO: Create Extensible.form.recurrence.Parser and factor all
    //       rrule value getting/setting out of these option classes
    //       and into the parser.
    
    extend: 'Ext.form.FieldContainer',
    
    requires: [
        'Extensible.form.recurrence.Rule'
    ],
    
    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    layout: 'hbox',
    
    defaults: {
        margins: '0 5 0 0'
    },
    
    /**
     * @cfg {Extensible.form.recurrence.Rule} rrule
     * The {@link Extensible.form.recurrence.Rule recurrence Rule} instance underlying this recurrence
     * option widget. This is typically set by the parent {@link Extensible.form.recurrence.Fieldset fieldset}
     * so that the same instance is shared across option widgets.
     */
    rrule: undefined,
    /**
     * @cfg {Date} startDate
     * The start date of the underlying recurrence series. This is not always required, depending on the specific
     * recurrence rules in effect, and will default to the current date if required and not supplied. Like the
     * {@link #rrule} config, this is typically set by the parent {@link Extensible.form.recurrence.Fieldset fieldset}.
     */
    startDate: undefined,
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default).
     * Used anytime a calendar or date picker is displayed within the recurrence options.
     */
    startDay: 0,
    /**
     * Maximum end date allowed when choosing dates from date fields (defaults to 12/31/9999).
     */
    maxEndDate: new Date('12/31/9999'),
    
    key: undefined,
    
    optionDelimiter: ';', //TODO: remove
    
    initComponent: function() {
        var me = this;
        
        me.addEvents(
            /**
             * @event change
             * Fires when a user-initiated change is detected in the value of the field.
             * @param {Extensible.form.recurrence.AbstractOption} this
             * @param {Mixed} newValue The new value
             * @param {Mixed} oldValue The old value
             */
            'change'
        );
        
        me.initRRule();
        me.items = me.getItemConfigs();
        
        me.callParent(arguments);
        
        me.initRefs();
        me.initField();
    },
    
    initRRule: function() {
        var me = this;
        
        me.rrule = me.rrule || Ext.create('Extensible.form.recurrence.Rule');
        me.startDate = me.startDate || me.rrule.startDate || Extensible.Date.today();
        
        if (!me.rrule.startDate) {
            me.rrule.setStartDate(me.startDate);
        }
    },
    
    afterRender: function() {
        this.callParent(arguments);
        this.updateLabel();
    },
    
    initRefs: Ext.emptyFn,
    
    setFrequency: function(freq) {
        this.frequency = freq;
    },
    
    setStartDate: function(dt) {
        this.startDate = dt;
        return this;
    },
    
    getStartDate: function() {
        return this.startDate || Extensible.Date.today();
    },
    
    getDefaultValue: function() {
        return '';
    },
    
    preSetValue: function(v, readyField) {
        var me = this;
        
        if (!v) {
            v = me.getDefaultValue();
        }
        if (!readyField) {
            me.on('afterrender', function() {
                me.setValue(v);
            }, me, {single: true});
            return false;
        }
        
        me.value = v;
        
        return true;
    }
});/**
 * The widget that represents the duration portion of an RRULE.
 */
Ext.define('Extensible.form.recurrence.option.Duration', {
    extend: 'Extensible.form.recurrence.AbstractOption',
    alias: 'widget.extensible.recurrence-duration',
    
    requires: [
        'Ext.form.Label',
        'Ext.form.field.ComboBox',
        'Ext.form.field.Number',
        'Ext.form.field.Date'
    ],
    
    /**
     * Minimum number of recurring instances to allow when the "for" option is selected (defaults to 1).
     */
    minOccurrences: 1,
    /**
     * Maximum number of recurring instances to allow when the "for" option is selected (defaults to 999).
     */
    maxOccurrences: 999,
    /**
     * @cfg {Number} defaultEndDateOffset
     * The unit of time after the start date to set the end date field when no end date is specified in the
     * recurrence rule (defaults to 5). The specific date value depends on the recurrence frequency
     * (selected in the {@link Extensible.form.recurrence.FrequencyCombo FrequencyCombo}) which is the
     * unit by which this setting is multiplied to calculate the default date. For example, if recurrence
     * frequency is daily, then the resulting date would be 5 days after the start date. However, if
     * frequency is monthly, then the date would be 5 months after the start date.
     */
    defaultEndDateOffset: 5,
    /**
     * @cfg {Number} minDateOffset
     * The number of days after the start date to set as the minimum allowable end date
     * (defaults to 1).
     */
    minDateOffset: 1,
    /**
     * Width in pixels of the duration end date field (defaults to 120)
     */
    endDateWidth: 120,
    
    strings: {
        andContinuing: 'and continuing',
        occurrences: 'occurrences',
        forever: 'forever',
        forText: 'for',
        until: 'until'
    },
    
    cls: 'extensible-recur-duration',
    
    //endDateFormat: null, // inherit by default
    
    getItemConfigs: function() {
        var me = this;
        
        return [
            me.getContinuingLabelConfig(),
            me.getDurationComboConfig(),
            me.getDurationDateFieldConfig(),
            me.getDurationNumberFieldConfig(),
            me.getOccurrencesLabelConfig()
        ];
    },
    
    getContinuingLabelConfig: function() {
        return {
            xtype: 'label',
            text: this.strings.andContinuing
        };
    },
    
    getDurationComboConfig: function() {
        var me = this;
        
        return {
            xtype: 'combo',
            itemId: me.id + '-duration-combo',
            mode: 'local',
            width: 85,
            triggerAction: 'all',
            forceSelection: true,
            value: me.strings.forever,
            
            store: [
                me.strings.forever,
                me.strings.forText,
                me.strings.until
            ],
            
            listeners: {
                'change': Ext.bind(me.onComboChange, me)
            }
        };
    },
    
    getDurationDateFieldConfig: function() {
        var me = this,
            startDate = me.getStartDate();
        
        return {
            xtype: 'datefield',
            itemId: me.id + '-duration-date',
            showToday: false,
            width: me.endDateWidth,
            format: me.endDateFormat || Ext.form.field.Date.prototype.format,
            startDay: this.startDay,
            maxValue: me.maxEndDate,
            allowBlank: false,
            hidden: true,
            minValue: Ext.Date.add(startDate, Ext.Date.DAY, me.minDateOffset),
            value: me.getDefaultEndDate(startDate),
            
            listeners: {
                'change': Ext.bind(me.onEndDateChange, me)
            }
        };
    },
    
    getDurationNumberFieldConfig: function() {
        var me = this;
        
        return {
            xtype: 'numberfield',
            itemId: me.id + '-duration-num',
            value: 5,
            width: 55,
            minValue: me.minOccurrences,
            maxValue: me.maxOccurrences,
            allowBlank: false,
            hidden: true,
            
            listeners: {
                'change': Ext.bind(me.onOccurrenceCountChange, me)
            }
        };
    },
    
    getOccurrencesLabelConfig: function() {
        return {
            xtype: 'label',
            itemId: this.id + '-duration-num-label',
            text: this.strings.occurrences,
            hidden: true
        };
    },
    
    initRefs: function() {
        var me = this;
        me.untilCombo = me.down('#' + me.id + '-duration-combo');
        me.untilDateField = me.down('#' + me.id + '-duration-date');
        me.untilNumberField = me.down('#' + me.id + '-duration-num');
        me.untilNumberLabel = me.down('#' + me.id + '-duration-num-label');
    },
    
    onComboChange: function(combo, value) {
        this.toggleFields(value);
        this.checkChange();
    },
    
    toggleFields: function(toShow) {
        var me = this;
        
        me.untilCombo.setValue(toShow);
        
        if (toShow === me.strings.until) {
            if (!me.untilDateField.getValue()) {
                me.initUntilDate();
            }
            me.untilDateField.show();
        }
        else {
            me.untilDateField.hide();
            me.untilDateIsSet = false;
        }
        
        if (toShow === me.strings.forText) {
            me.untilNumberField.show();
            me.untilNumberLabel.show();
        }
        else {
            // recur forever
            me.untilNumberField.hide();
            me.untilNumberLabel.hide();
        }
    },
    
    onOccurrenceCountChange: function(field, value, oldValue) {
        this.checkChange();
    },
    
    onEndDateChange: function(field, value, oldValue) {
        this.checkChange();
    },
    
    setStartDate: function(dt) {
        var me = this,
            value = me.getValue();
        
        if (dt.getTime() !== me.startDate.getTime()) {
            me.callParent(arguments);
            me.untilDateField.setMinValue(dt);
            
            if (!value || me.untilDateField.getValue() < dt) {
                me.initUntilDate(dt);
            }
        }
        return me;
    },
    
    setFrequency: function() {
        this.callParent(arguments);
        this.initUntilDate();
        
        return this;
    },
    
    initUntilDate: function(startDate) {
        if (!this.untilDateIsSet) {
            this.untilDateIsSet = true;
            var endDate = this.getDefaultEndDate(startDate || this.getStartDate());
            this.untilDateField.setValue(endDate);
        }
        return this;
    },
    
    getDefaultEndDate: function(startDate) {
        var options = {},
            unit;
        
        switch (this.frequency) {
            case 'WEEKLY':
            case 'WEEKDAYS':
                unit = 'weeks';
                break;
            
            case 'MONTHLY':
                unit = 'months';
                break;
            
            case 'YEARLY':
                unit = 'years';
                break;
            
            default:
                unit = 'days';
        }
        
        options[unit] = this.defaultEndDateOffset;
        
        return Extensible.Date.add(startDate, options);
    },
    
    getValue: function() {
        var me = this;
        
        // sanity check that child fields are available first
        if (me.untilCombo) {
            if (me.untilNumberField.isVisible()) {
                return 'COUNT=' + me.untilNumberField.getValue();
            }
            if (me.untilDateField.isVisible()) {
                return 'UNTIL=' + me.rrule.formatDate(this.adjustUntilDateValue(me.untilDateField.getValue()));
            }
        }
        return '';
    },
    
    /**
     * If a recurrence UNTIL date is specified, it must be inclusive of all times on that date. By default
     * the returned date value is incremented by one day minus one second to ensure that.
     * @param {Object} untilDate The raw UNTIL date value returned from the untilDateField
     * @return {Date} The adjusted Date object
     */
    adjustUntilDateValue: function(untilDate) {
        return Extensible.Date.add(untilDate, {days: 1, seconds: -1});
    },
    
    setValue: function(v) {
        var me = this;
        
        if (!me.preSetValue(v, me.untilCombo)) {
            return me;
        }
        if (!v) {
            me.toggleFields(me.strings.forever);
            return me;
        }
        var options = Ext.isArray(v) ? v : v.split(me.optionDelimiter),
            didSetValue = false,
            parts;

        Ext.each(options, function(option) {
            parts = option.split('=');
            
            if (parts[0] === 'COUNT') {
                me.untilNumberField.setValue(parts[1]);
                me.toggleFields(me.strings.forText);
                didSetValue = true;
                return;
            }
            if (parts[0] === 'UNTIL') {
                me.untilDateField.setValue(me.rrule.parseDate(parts[1]));
                // If the min date is updated before this new value gets set it can sometimes
                // lead to a false validation error showing even though the value is valid. This
                // is a simple hack to essentially refresh the min value validation now:
                me.untilDateField.validate();
                me.toggleFields(me.strings.until);
                didSetValue = true;
                return;
            }
        }, me);
        
        if (!didSetValue) {
            me.toggleFields(me.strings.forever);
        }
        
        return me;
    }
});
/**
 * The widget that represents the interval portion of an RRULE.
 */
Ext.define('Extensible.form.recurrence.option.Interval', {
    extend: 'Extensible.form.recurrence.AbstractOption',
    alias: 'widget.extensible.recurrence-interval',
    
    dateLabelFormat: 'l, F j',
    unit: 'day',
    minValue: 1,
    maxValue: 999,
    startDateWidth: 120,
    
    strings: {
        repeatEvery: 'Repeat every',
        beginning: 'beginning',
        day: 'day',
        days: 'days',
        week: 'week',
        weeks: 'weeks',
        month: 'month',
        months: 'months',
        year: 'year',
        years: 'years'
    },
    
    cls: 'extensible-recur-interval',
    
    initComponent: function() {
        this.addEvents(
            /**
             * @event startchange
             * Fires when the start date of the recurrence series is changed
             * @param {Extensible.form.recurrence.option.Interval} this
             * @param {Date} newDate The new start date
             * @param {Date} oldDate The previous start date
             */
            'startchange'
        );
        this.callParent(arguments);
    },
    
    getItemConfigs: function() {
        return [
            this.getRepeatEveryLabelConfig(),
            this.getIntervalComboConfig(),
            this.getBeginDateLabelConfig(),
            this.getBeginDateFieldConfig()
        ];
    },
    
    getRepeatEveryLabelConfig: function() {
        return {
            xtype: 'label',
            text: this.strings.repeatEvery
        };
    },
    
    getIntervalComboConfig: function() {
        var me = this;
        
        return {
            xtype: 'numberfield',
            itemId: me.id + '-interval',
            value: 1,
            width: 55,
            minValue: me.minValue,
            maxValue: me.maxValue,
            allowBlank: false,
            enableKeyEvents: true,
            listeners: {
                'change': Ext.bind(me.onIntervalChange, me)
            }
        };
    },
    
    getBeginDateLabelConfig: function() {
        return {
            xtype: 'label',
            itemId: this.id + '-date-label'
        };
    },
    
    getBeginDateFieldConfig: function() {
        var me = this,
            startDate = me.getStartDate();
        
        return {
            xtype: 'datefield',
            itemId: me.id + '-start-date',
            width: me.startDateWidth,
            // format: me.endDateFormat || Ext.form.field.Date.prototype.format,
            startDay: this.startDay,
            maxValue: me.maxEndDate,
            allowBlank: false,
            value: startDate,
            
            listeners: {
                'change': Ext.bind(me.onStartDateChange, me)
            }
        };
    },
    
    initRefs: function() {
        var me = this;
        me.intervalField = me.down('#' + me.id + '-interval');
        me.dateLabel = me.down('#' + me.id + '-date-label');
        me.startDateField = me.down('#' + me.id + '-start-date');
    },
    
    onIntervalChange: function(field, value, oldValue) {
        this.checkChange();
        this.updateLabel();
    },
    
    onStartDateChange: function(field, value, oldValue) {
        this.checkChange();
        this.fireEvent('startchange', this, value, oldValue);
    },
    
    getValue: function() {
        if (this.intervalField) {
            return 'INTERVAL=' + this.intervalField.getValue();
        }
        return '';
    },
    
    setValue: function(v) {
        var me = this;
        
        if (!me.preSetValue(v, me.intervalField)) {
            return me;
        }
        if (!v) {
            me.intervalField.setValue(me.minValue);
            return me;
        }
        var options = Ext.isArray(v) ? v : v.split(me.optionDelimiter),
            parts;

        Ext.each(options, function(option) {
            parts = option.split('=');
            
            if (parts[0] === 'INTERVAL') {
                me.intervalField.setValue(parts[1]);
                me.updateLabel();
                return;
            }
        }, me);
        
        return me;
    },
    
    setStartDate: function(dt) {
        this.startDate = dt;
        this.startDateField.setValue(dt);
        return this;
    },
    
    setUnit: function(unit) {
        this.unit = unit;
        this.updateLabel();
        return this;
    },
    
    updateLabel: function(unit) {
        var me = this;
        
        if (me.intervalField) {
            // TODO: Change this to support locale text
            var s = me.intervalField.getValue() === 1 ? '' : 's';
            me.unit = unit ? unit.toLowerCase() : me.unit || 'day';
            
            if (me.dateLabel) {
                me.dateLabel.update(me.strings[me.unit + s] + ' ' + me.strings.beginning);
            }
        }
        return me;
    }
});
/**
 * The widget that represents the monthly recurrence options of an RRULE.
 */
Ext.define('Extensible.form.recurrence.option.Monthly', {
    extend: 'Extensible.form.recurrence.AbstractOption',
    alias: 'widget.extensible.recurrence-monthly',
    
    requires: [
        'Ext.form.field.ComboBox',
        'Extensible.lang.Number'
    ],
    
    cls: 'extensible-recur-monthly',
    
    nthComboWidth: 150,
    
    strings: {
        // E.g. "on the 15th day of each month/year"
        onThe: 'on the',
        ofEach: 'of each',
        inText: 'in',
        day: 'day',
        month: 'month',
        year: 'year',
        last: 'last',
        lastDay: 'last day',
        monthDayDateFormat: 'jS',
        nthWeekdayDateFormat: 'S' // displays the ordinal postfix, e.g. th for 5th.
    },
    
    afterRender: function() {
        this.callParent(arguments);
        this.initNthCombo();
    },
    
    getItemConfigs: function() {
        return [
            this.getOnTheLabelConfig(),
            this.getNthComboConfig(),
            this.getOfEachLabelConfig()
        ];
    },
    
    getOnTheLabelConfig: function() {
        return {
            xtype: 'label',
            text: this.strings.onThe
        };
    },
    
    getNthComboConfig: function() {
        return {
            xtype: 'combobox',
            itemId: this.id + '-nth-combo',
            queryMode: 'local',
            width: this.nthComboWidth,
            triggerAction: 'all',
            forceSelection: true,
            displayField: 'text',
            valueField: 'value',
            store: Ext.create('Ext.data.ArrayStore', {
                fields: ['text', 'value'],
                idIndex: 0,
                data: []
            }),
            listeners: {
                'change': Ext.bind(this.onComboChange, this)
            }
        };
    },
    
    getPeriodString: function() {
        // Overridden in the Yearly option class
        return this.strings.month;
    },
    
    getOfEachLabelConfig: function() {
        return {
            xtype: 'label',
            text: this.strings.ofEach + ' ' + this.getPeriodString()
        };
    },
    
    initRefs: function() {
        this.nthCombo = this.down('#' + this.id + '-nth-combo');
    },
    
    onComboChange: function(combo, value) {
        this.checkChange();
    },
    
    setStartDate: function(dt) {
        if (dt.getTime() !== this.startDate.getTime()) {
            this.callParent(arguments);
            this.initNthCombo();
        }
        return this;
    },
    
    initNthCombo: function() {
        if (!this.rendered) {
            return;
        }
        var me = this,
            combo = me.nthCombo,
            store = combo.store,
            dt = me.getStartDate(),
            
            // e.g. 30 (for June):
            lastDayOfMonth = Ext.Date.getLastDateOfMonth(dt).getDate(),
            // e.g. "28th day":
            monthDayText = Ext.Date.format(dt, me.strings.monthDayDateFormat) + ' ' + me.strings.day,
            // e.g. 28:
            dayNum = dt.getDate(),
            // index in the month, e.g. 4 for the 4th Tuesday
            dayIndex = Math.ceil(dayNum / 7),
            // e.g. "TU":
            dayNameAbbreviated = Extensible.form.recurrence.Parser.byDayNames[dt.getDay()],

            // e.g. "4th Tuesday":
            tempDate = new Date(2000, 0, dayIndex),
            dayOfWeekText = dayIndex + Ext.Date.format(tempDate, me.strings.nthWeekdayDateFormat) + Ext.Date.format(dt, ' l'),

            // year-specific additions to the resulting value string, used if we are currently
            // executing from within the Yearly option subclass.
            // e.g. "in 2012":
            yearlyText = me.isYearly ? ' ' + me.strings.inText +' ' + Ext.Date.format(dt, 'F') : '',
            // e.g. "BYMONTH=2;":
            byMonthValue = me.isYearly ? 'BYMONTH=' + Ext.Date.format(dt, 'n') : '',
            // only use this if yearly:
            delimiter = me.isYearly ? me.optionDelimiter : '',
            
            // the first two combo items, which are always included:
            data = [
                [monthDayText + yearlyText, me.isYearly ? byMonthValue : 'BYMONTHDAY=' + dayNum],
                [dayOfWeekText + yearlyText, byMonthValue + delimiter +
                    'BYDAY=' + dayIndex + dayNameAbbreviated]
            ],
            
            // the currently selected index, which we will try to restore after refreshing the combo:
            idx = store.find('value', combo.getValue());

        if (lastDayOfMonth - dayNum < 7) {
            // the start date is the last of a particular day (e.g. last Tuesday) for the month
            data.push([me.strings.last + ' ' + Ext.Date.format(dt, 'l') + yearlyText,
                byMonthValue + delimiter + 'BYDAY=-1' + dayNameAbbreviated]);
        }
        if (lastDayOfMonth === dayNum) {
            // the start date is the last day of the month
            data.push([me.strings.lastDay + yearlyText, byMonthValue + delimiter + 'BYMONTHDAY=-1']);
        }
        
        store.removeAll();
        combo.clearValue();
        store.loadData(data);
        
        if (idx > data.length - 1) {
            // if the previously-selected index is now greater than the number of items in the
            // combo default to the last item in the new list
            idx = data.length - 1;
        }
        
        combo.setValue(store.getAt(idx > -1 ? idx : 0).data.value);
        
        return me;
    },
    
    getValue: function() {
        var me = this;
        
        if (me.nthCombo) {
            return me.nthCombo.getValue();
        }
        return '';
    },
    
    setValue: function(v) {
        var me = this;
        
        if (!me.preSetValue(v, me.nthCombo)) {
            return me;
        }
        if (!v) {
            var defaultItem = me.nthCombo.store.getAt(0);
            if (defaultItem) {
                me.nthCombo.setValue(defaultItem.data.value);
            }
            return me;
        }
        var options = Ext.isArray(v) ? v : v.split(me.optionDelimiter),
            parts,
            values = [];

        Ext.each(options, function(option) {
            parts = option.split('=');
            if (parts[0] === 'BYMONTH') {
                // if BYMONTH is present make sure it goes to the beginning of the value
                // string since that's the order the combo sets it in and they must match
                values.unshift(option);
            }
            if (parts[0] === 'BYMONTHDAY' || parts[0] === 'BYDAY') {
                // these go to the back of the value string
                values.push(option);
            }
        }, me);
        
        if (values.length) {
            me.nthCombo.setValue(values.join(me.optionDelimiter));
        }
        
        return me;
    }
});
/**
 * The widget that represents the weekly recurrence options of an RRULE.
 */
Ext.define('Extensible.form.recurrence.option.Weekly', {
    extend: 'Extensible.form.recurrence.AbstractOption',
    alias: 'widget.extensible.recurrence-weekly',
    
    requires: [
        'Ext.form.field.Checkbox', // should be required by CheckboxGroup but isn't
        'Ext.form.CheckboxGroup',
        'Extensible.form.recurrence.Parser'
    ],

    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,

    dayValueDelimiter: ',',
    
    cls: 'extensible-recur-weekly',

    strings: {
        on: 'on'
    },

    /**
     * Creates the item configuration for the checkbox group. Takes into account the week start day.
     * For example:
     *		[
     *			{ boxLabel: 'Sun', name: 'SU', id: this.id + '-SU' },
     *			{ boxLabel: 'Mon', name: 'MO', id: this.id + '-MO' },
     *			{ boxLabel: 'Tue', name: 'TU', id: this.id + '-TU' },
     *			{ boxLabel: 'Wed', name: 'WE', id: this.id + '-WE' },
     *			{ boxLabel: 'Thu', name: 'TH', id: this.id + '-TH' },
     *			{ boxLabel: 'Fri', name: 'FR', id: this.id + '-FR' },
     *			{ boxLabel: 'Sat', name: 'SA', id: this.id + '-SA' }
     *		];
     * @return {Array}
     */
    getCheckboxGroupItems: function() {
        var weekdaysId = Extensible.form.recurrence.Parser.byDayNames,
            weekdaysText = Extensible.form.recurrence.Parser.strings.dayNamesShortByIndex,
            checkboxArray = [],
            i = this.startDay;

        for (var n=0; n<7; n++) {
            checkboxArray[n] = {boxLabel: weekdaysText[i], name: weekdaysId[i], id: this.id + '-' + weekdaysId[i]};
            i = i === 6 ? 0 : i+1;
        }
        return checkboxArray;
    },


    getItemConfigs: function() {
        var id = this.id;

        return [{
            xtype: 'label',
            text: this.strings.on + ':'
        },{
            xtype: 'checkboxgroup',
            itemId: id + '-days',
            flex: 1,
            items: this.getCheckboxGroupItems(),
            listeners: {
                'change': Ext.bind(this.onSelectionChange, this)
            }
        }];
    },
    
    initValue: function() {
        this.callParent(arguments);
        
        if (!this.value) {
            this.selectByDate();
        }
    },
    
    initRefs: function() {
        this.daysCheckboxGroup = this.down('#' + this.id + '-days');
    },
    
    onSelectionChange: function(field, value, oldValue) {
        this.checkChange();
        this.updateLabel();
    },
    
    selectByDate: function(dt) {
        var day = Ext.Date.format(dt || this.getStartDate(), 'D').substring(0,2).toUpperCase();
        this.setValue('BYDAY=' + day);
    },
    
    clearValue: function() {
        this.value = undefined;
        
        if (this.daysCheckboxGroup) {
            this.daysCheckboxGroup.setValue({
                SU:0, MO:0, TU:0, WE:0, TH:0, FR:0, SA:0
            });
        }
    },
    
    getValue: function() {
        var me = this;
        
        if (me.daysCheckboxGroup) {
            // Checkbox group value will look like {MON:"on", TUE:"on", FRI:"on"}
            var fieldValue = me.daysCheckboxGroup.getValue(),
                days = [],
                property;
            
            for (property in fieldValue) {
                if (fieldValue.hasOwnProperty(property)) {
                    // Push the name ('MON') not the value ('on')
                    days.push(property);
                }
            }
            return days.length > 0 ? 'BYDAY=' + days.join(me.dayValueDelimiter) : '';
        }
        return '';
    },
    
    setValue: function(v) {
        var me = this;
        
        if (!me.preSetValue(v, me.daysCheckboxGroup)) {
            return me;
        }
        // Clear all checkboxes
        me.daysCheckboxGroup.setValue(null);
        if (!v) {
            return me;
        }
        var options = Ext.isArray(v) ? v : v.split(me.optionDelimiter),
            compositeValue = {},
            parts, days;

        Ext.each(options, function(option) {
            parts = option.split('=');
            
            if (parts[0] === 'BYDAY') {
                days = parts[1].split(me.dayValueDelimiter);
                    
                Ext.each(days, function(day) {
                    compositeValue[day] = true;
                }, me);
                
                me.daysCheckboxGroup.setValue(compositeValue);
                return;
            }
        }, me);
        
        return me;
    }
});/**
 * The widget that represents the yearly recurrence options of an RRULE.
 */
Ext.define('Extensible.form.recurrence.option.Yearly', {
    extend: 'Extensible.form.recurrence.option.Monthly',
    alias: 'widget.extensible.recurrence-yearly',
    
    cls: 'extensible-recur-yearly',
    
    nthComboWidth: 200,
    
    isYearly: true,
    
    getPeriodString: function() {
        return this.strings.year;
    }
});/**
 * The widget used to choose the frequency of recurrence. While this could be created
 * as a standalone widget, it is typically created automatically as part of a
 * Extensible.form.recurrence.Fieldset and does not normally need to be configured directly.
 */
Ext.define('Extensible.form.recurrence.FrequencyCombo', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.extensible.recurrence-frequency',
    
    requires: [
        'Ext.data.ArrayStore',
        'Extensible.form.recurrence.Parser'
    ],
    
    fieldLabel: 'Repeats',
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    displayField: 'pattern',
    valueField: 'id',
    cls: 'extensible-recur-frequency',
    
    initComponent: function() {
        var me = this;
        
        /**
         * @event frequencychange
         * Fires when a frequency list item is selected.
         * @param {Extensible.form.recurrence.Combo} combo This combo box
         * @param {String} value The selected frequency value (one of the names
         * from {@link #frequencyOptions}, e.g. 'DAILY')
         */
        me.addEvents('frequencychange');
        
        var freq = Extensible.form.recurrence.Parser.strings.frequency;
        
        /**
         * @cfg {Array} frequencyOptions
         * An array of arrays, each containing the name/value pair that defines a recurring
         * frequency option supported by the frequency combo. This array is bound to the underlying
         * {@link Ext.data.ArrayStore store} to provide the combo list items. The string descriptions
         * are defined in the {@link Extensible.form.recurrence.Parser#strings} config.
         * Defaults to:
         *
         *		[
         *			['NONE', 'Does not repeat'],
         *			['DAILY', 'Daily'],
         *			['WEEKDAYS', 'Every weekday (Mon-Fri)'],
         *			['WEEKLY', 'Weekly'],
         *			['MONTHLY', 'Monthly'],
         *			['YEARLY', 'Yearly']
         *		]
         */
        me.frequencyOptions = me.frequencyOptions || [
            ['NONE',     freq.none],
            ['DAILY',    freq.daily],
            ['WEEKDAYS', freq.weekdays],
            ['WEEKLY',   freq.weekly],
            ['MONTHLY',  freq.monthly],
            ['YEARLY',   freq.yearly]
        ];
        
        me.store = me.store || Ext.create('Ext.data.ArrayStore', {
            fields: ['id', 'pattern'],
            idIndex: 0,
            data: me.frequencyOptions
        });
        
        me.on('select', me.onSelect, me);
        
        me.callParent(arguments);
    },
    
    onSelect: function(combo, records) {
        this.fireEvent('frequencychange', records[0].data.id);
    }
});/**
 * The widget that represents a single recurrence rule field in the UI.
 * In reality, it is made up of many constituent
 * {@link #Extensible.form.recurrence.AbstractOption option widgets} internally.
 */
Ext.define('Extensible.form.recurrence.Fieldset', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.extensible.recurrencefield',
    
    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    requires: [
        'Ext.form.Label',
        'Extensible.form.recurrence.Rule',
        'Extensible.form.recurrence.FrequencyCombo',
        'Extensible.form.recurrence.option.Interval',
        'Extensible.form.recurrence.option.Weekly',
        'Extensible.form.recurrence.option.Monthly',
        'Extensible.form.recurrence.option.Yearly',
        'Extensible.form.recurrence.option.Duration'
    ],

    /**
     * @cfg {Extensible.form.recurrence.Rule} rrule
     * The {@link Extensible.form.recurrence.Rule recurrence Rule} instance underlying this component and
     * shared by all child recurrence option widgets. If not supplied a default instance will be created.
     */
    rrule: undefined,

    /**
     * @cfg {Date} startDate
     * The start date of the underlying recurrence series. This is not always required, depending on the specific
     * recurrence rules in effect, and will default to the current date if required and not supplied.
     */
    startDate: undefined,

    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,

    //TODO: implement code to use this config.
    // Maybe use xtypes instead for dynamic loading of custom options?
    // Include secondly/minutely/hourly, plugins for M-W-F, T-Th, weekends
    options: [
        'daily', 'weekly', 'weekdays', 'monthly', 'yearly'
    ],
    
    //TODO: implement
    displayStyle: 'field', // or 'dialog'
    
    fieldLabel: 'Repeats',
    fieldContainerWidth: 400,
    
    //enableFx: true,
    monitorChanges: true,
    cls: 'extensible-recur-field',
    
    frequencyWidth: null, // defaults to the anchor value
    
    layout: 'anchor',
    defaults: {
        anchor: '100%'
    },
    
    initComponent: function() {
        var me = this;
        
        if (!me.height || me.displayStyle === 'field') {
            delete me.height;
            me.autoHeight = true;
        }
        
        this.addEvents(
            /**
             * @event startchange
             * Fires when the start date of the recurrence series is changed
             * @param {Extensible.form.recurrence.option.Interval} this
             * @param {Date} newDate The new start date
             * @param {Date} oldDate The previous start date
             */
            'startchange'
        );
        
        me.initRRule();
        
        me.items = [{
            xtype: 'extensible.recurrence-frequency',
            hideLabel: true,
            width: this.frequencyWidth,
            itemId: this.id + '-frequency',
            
            listeners: {
                'frequencychange': {
                    fn: this.onFrequencyChange,
                    scope: this
                }
            }
        },{
            xtype: 'container',
            itemId: this.id + '-inner-ct',
            cls: 'extensible-recur-inner-ct',
            autoHeight: true,
            layout: 'anchor',
            hideMode: 'offsets',
            hidden: true,
            width: this.fieldContainerWidth,
            
            defaults: {
                hidden: true,
                rrule: me.rrule
            },
            items: [{
                xtype: 'extensible.recurrence-interval',
                itemId: this.id + '-interval'
            },{
                xtype: 'extensible.recurrence-weekly',
                itemId: this.id + '-weekly',
                startDay: this.startDay
            },{
                xtype: 'extensible.recurrence-monthly',
                itemId: this.id + '-monthly'
            },{
                xtype: 'extensible.recurrence-yearly',
                itemId: this.id + '-yearly'
            },{
                xtype: 'extensible.recurrence-duration',
                itemId: this.id + '-duration',
                startDay: this.startDay
            }]
        }];
        
        me.callParent(arguments);
        
        me.initField();
    },
    
    initRRule: function() {
        var me = this;
        
        me.rrule = me.rrule || Ext.create('Extensible.form.recurrence.Rule');
        me.startDate = me.startDate || me.rrule.startDate || Extensible.Date.today();
        
        if (!me.rrule.startDate) {
            me.rrule.setStartDate(me.startDate);
        }
    },
    
    afterRender: function() {
        this.callParent(arguments);
        this.initRefs();
    },
    
    initRefs: function() {
        var me = this,
            id = me.id;
        
        me.innerContainer = me.down('#' + id + '-inner-ct');
        me.frequencyCombo = me.down('#' + id + '-frequency');
        me.intervalField = me.down('#' + id + '-interval');
        me.weeklyField = me.down('#' + id + '-weekly');
        me.monthlyField = me.down('#' + id + '-monthly');
        me.yearlyField = me.down('#' + id + '-yearly');
        me.durationField = me.down('#' + id + '-duration');
        
        me.initChangeEvents();
    },
    
    initChangeEvents: function() {
        var me = this;
        
        me.intervalField.on('startchange', me.onStartDateChange, me);
        
        me.intervalField.on('change', me.onChange, me);
        me.weeklyField.on('change', me.onChange, me);
        me.monthlyField.on('change', me.onChange, me);
        me.yearlyField.on('change', me.onChange, me);
        me.durationField.on('change', me.onChange, me);
    },
    
    onStartDateChange: function(interval, newDate, oldDate) {
        this.fireEvent('startchange', this, newDate, oldDate);
    },
    
    onChange: function() {
        this.fireEvent('change', this, this.getValue());
    },
    
    onFrequencyChange: function(freq) {
        this.setFrequency(freq);
        this.onChange();
    },

    initValue: function() {
        var me = this;

        me.originalValue = me.lastValue = me.value;

        // Set the initial value - prevent validation on initial set
        me.suspendCheckChange++;
        
        me.setStartDate(me.startDate);
        
        if (me.value !== undefined) {
            me.setValue(me.value);
        }
        else if (me.frequency !== undefined) {
            me.setValue('FREQ=' + me.frequency);
        }
        else{
            me.setValue('');
        }
        me.suspendCheckChange--;
        
        Ext.defer(me.doLayout, 1, me);
        me.onChange();
    },
    
    /**
     * Sets the start date of the recurrence pattern
     * @param {Date} The new start date
     * @return {Extensible.form.recurrence.Fieldset} this
     */
    setStartDate: function(dt) {
        var me = this;
        
        me.startDate = dt;
        
        if (me.innerContainer) {
            me.innerContainer.items.each(function(item) {
                if (item.setStartDate) {
                    item.setStartDate(dt);
                }
            });
        }
        else {
            me.on('afterrender', function() {
                me.setStartDate(dt);
            }, me, {single: true});
        }
        return me;
    },
    
    /**
     * Returns the start date of the recurrence pattern (defaults to the current date
     * if not explicitly set via {@link #setStartDate} or the constructor).
     * @return {Date} The recurrence start date
     */
    getStartDate: function() {
        return this.startDate;
    },
    
    /**
     * Return true if the fieldset currently has a recurrence value set, otherwise returns false.
     */
    isRecurring: function() {
        return this.getValue() !== '';
    },
    
    getValue: function() {
        if (!this.innerContainer) {
            return this.value;
        }
        if (this.frequency === 'NONE') {
            return '';
        }
        
        var values,
            itemValue;
        
        if (this.frequency === 'WEEKDAYS') {
            values = ['FREQ=WEEKLY','BYDAY=MO,TU,WE,TH,FR'];
        }
        else {
            values = ['FREQ=' + this.frequency];
        }
        
        this.innerContainer.items.each(function(item) {
            if(item.isVisible() && item.getValue) {
                itemValue = item.getValue();
                if (this.includeItemValue(itemValue)) {
                    values.push(itemValue);
                }
            }
        }, this);
        
        return values.length > 1 ? values.join(';') : values[0];
    },
    
    includeItemValue: function(value) {
        if (value) {
            if (value === 'INTERVAL=1') {
                // Interval is assumed to be 1 in the spec by default, no need to include it
                return false;
            }
            var day = Ext.Date.format(this.startDate, 'D').substring(0,2).toUpperCase();
            if (value === ('BYDAY=' + day)) {
                // BYDAY is only required if different from the pattern start date
                return false;
            }
            return true;
        }
        return false;
    },
    
    getDescription: function() {
        // TODO: Should not have to set value here
        return this.rrule.setRule(this.getValue()).getDescription();
    },
    
    setValue: function(value) {
        var me = this;
        
        me.value = (!value || value === 'NONE' ? '' : value);
        
        if (!me.frequencyCombo || !me.innerContainer) {
            me.on('afterrender', function() {
                me.setValue(value);
            }, me, {
                single: true
            });
            return;
        }

        var parts = me.value.split(';');
        
        if (me.value === '') {
            me.setFrequency('NONE');
        }
        else {
            Ext.each(parts, function(part) {
                if (part.indexOf('FREQ') > -1) {
                    var freq = part.split('=')[1];
                    me.setFrequency(freq);
                    me.checkChange();
                    return;
                }
            }, me);
        }
        
        me.innerContainer.items.each(function(item) {
            if (item.setValue) {
                item.setValue(me.value);
            }
        });
        
        me.checkChange();
        
        return me;
    },
    
    setFrequency: function(freq) {
        var me = this;
        
        me.frequency = freq;
        
        if (me.frequencyCombo) {
            me.frequencyCombo.setValue(freq);
            me.showOptions(freq);
            
            this.innerContainer.items.each(function(item) {
                item.setFrequency(freq);
            });
        }
        else {
            me.on('afterrender', function() {
                me.frequencyCombo.setValue(freq);
                me.showOptions(freq);
            }, me, {single: true});
        }
        return me;
    },
    
    showOptions: function(freq) {
        var me = this,
            unit = 'day';
        
        if (freq === 'NONE') {
            // me.innerContainer.items.each(function(item) {
                // item.hide();
            // });
            me.innerContainer.hide();
        }
        else {
            me.intervalField.show();
            me.durationField.show();
            me.innerContainer.show();
        }
        
        switch(freq) {
            case 'DAILY':
            case 'WEEKDAYS':
                me.weeklyField.hide();
                me.monthlyField.hide();
                me.yearlyField.hide();
                
                if (freq === 'WEEKDAYS') {
                    unit = 'week';
                }
                break;
            
            case 'WEEKLY':
                me.weeklyField.show();
                me.monthlyField.hide();
                me.yearlyField.hide();
                unit = 'week';
                break;
            
            case 'MONTHLY':
                me.monthlyField.show();
                me.weeklyField.hide();
                me.yearlyField.hide();
                unit = 'month';
                break;
            
            case 'YEARLY':
                me.yearlyField.show();
                me.weeklyField.hide();
                me.monthlyField.hide();
                unit = 'year';
                break;
        }

        me.intervalField.updateLabel(unit);
    }
});/**
 * This panel is used during recurrence editing. It enables the user to indicate which
 * style of edit is currently being performed on a recurring series. The types currently
 * supported are:
 * 
 * - Edit a single instance
 * - Edit the current and future instances (past instances are unchanged)
 * - Edit all instances in the series
 * 
 * Typically this panel is created implicitly by the Extensible.form.recurrence.RangeEditWindow
 * and should not typically be instantiated directly.
 * 
 * @protected
 */
Ext.define('Extensible.form.recurrence.RangeEditPanel', {
    extend: 'Ext.form.Panel',
    alias: 'widget.extensible.recurrence-rangeeditpanel',
    
    cls: 'extensible-recur-edit-options',
    
    headerText: 'There are multiple events in this series. How would you like your changes applied?',
    optionSingleButtonText: 'Single',
    optionSingleDescription: 'Apply to this event only. No other events in the series will be affected.',
    optionFutureButtonText: 'Future',
    optionFutureDescription: 'Apply to this and all following events only. Past events will be unaffected.',
    optionAllButtonText: 'All Events',
    optionAllDescription: 'Apply to every event in this series.',
    
    editModes: {
        SINGLE: 'single',
        FUTURE: 'future',
        ALL: 'all'
    },
    
    border: false,
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    initComponent: function() {
        var me = this;
        
        me.editMode = me.editMode || me.editModes.ALL;
        
        me.items = [
            me.getHeaderConfig(),
            me.getOptionPanelConfig(),
            me.getSummaryConfig()
        ];
        me.callParent(arguments);
    },
    
    getHeaderConfig: function() {
        return {
            xtype: 'component',
            html: this.headerText,
            height: 55,
            padding: 15
        };
    },
    
    getSummaryConfig: function() {
        return {
            xtype: 'component',
            itemId: this.id + '-summary',
            html: this.optionAllDescription,
            flex: 1,
            padding: 15
        };
    },
    
    getOptionPanelConfig: function() {
        return {
            xtype: 'panel',
            border: false,
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            items: this.getOptionButtonConfigs()
        };
    },
    
    getOptionButtonConfigs: function() {
        var me = this,
            defaultConfig = {
                xtype: 'button',
                iconAlign: 'top',
                enableToggle: true,
                scale: 'large',
                width: 80,
                toggleGroup: 'recur-toggle',
                toggleHandler: me.onToggle,
                scope: me
        },
        items = [Ext.apply({
            itemId: me.id + '-single',
            text: me.optionSingleButtonText,
            iconCls: 'recur-edit-single',
            pressed: me.editMode === me.editModes.SINGLE
        }, defaultConfig),
        Ext.apply({
            itemId: me.id + '-future',
            text: me.optionFutureButtonText,
            iconCls: 'recur-edit-future',
            pressed: me.editMode === me.editModes.FUTURE
        }, defaultConfig),
        Ext.apply({
            itemId: me.id + '-all',
            text: me.optionAllButtonText,
            iconCls: 'recur-edit-all',
            pressed: me.editMode === me.editModes.ALL
        }, defaultConfig)];
        
        return items;
    },
    
    getEditMode: function() {
        return this.editMode;
    },
    
    showEditModes: function(modes) {
        modes = modes || [];
        
        var me = this,
            i = 0,
            btn,
            len = modes.length;
        
        // If modes were passed in hide all by default so we can only show the
        // passed ones, otherwise if nothing was passed in show all
        me.down('#' + me.id + '-single')[len ? 'hide' : 'show']();
        me.down('#' + me.id + '-future')[len ? 'hide' : 'show']();
        me.down('#' + me.id + '-all')[len ? 'hide' : 'show']();
        
        for (; i < len; i++) {
            btn = me.down('#' + me.id + '-' + modes[i]);
            if (btn) {
                btn.show();
            }
        }
    },
    
    onToggle: function(btn) {
        var me = this,
            summaryEl = me.getComponent(me.id + '-summary').getEl();
        
        if (btn.itemId === me.id + '-single') {
            summaryEl.update(me.optionSingleDescription);
            me.editMode = me.editModes.SINGLE;
        }
        else if (btn.itemId === me.id + '-future') {
            summaryEl.update(me.optionFutureDescription);
            me.editMode = me.editModes.FUTURE;
        }
        else {
            summaryEl.update(me.optionAllDescription);
            me.editMode = me.editModes.ALL;
        }
    }
});/**
 * This window contains an instance of Extensible.form.recurrence.RangeEditPanel and,
 * by default, is displayed to the user anytime a recurring event is edited. This window
 * allows the user to indicate which style of edit is being performed on the recurring series.
 * See the RangeEditPanel docs for additional information on supported edit types.
 * 
 * This window is created automatically by Extensible and should not typically be
 * instantiated directly.
 * 
 * @protected
 */
Ext.define('Extensible.form.recurrence.RangeEditWindow', {
    extend: 'Ext.window.Window',
    alias: 'widget.extensible.recurrence-rangeeditwindow',
    id: 'ext-cal-rangeeditwin',

    requires: [
        'Extensible.form.recurrence.RangeEditPanel'
    ],
    
    // Locale configs
    title: 'Recurring Event Options',
    width: 350,
    height: 240,
    saveButtonText: 'Save',
    cancelButtonText: 'Cancel',
    
    // General configs
    closeAction: 'hide',
    modal: true,
    resizable: false,
    constrain: true,
    buttonAlign: 'right',
    layout: 'fit',
    
    formPanelConfig: {
        border: false
    },
    
    initComponent: function() {
        this.items = [{
            xtype: 'extensible.recurrence-rangeeditpanel',
            itemId: this.id + '-recur-panel'
        }];
        this.fbar = this.getFooterBarConfig();
        
        this.callParent(arguments);
    },
    
    getRangeEditPanel: function() {
        return this.down('#' + this.id + '-recur-panel');
    },
    
    /**
     * Configure the window and show it
     * @param {Object} options Valid properties: editModes[], callback, scope
     */
    prompt: function(o) {
        this.callbackFunction = Ext.bind(o.callback, o.scope || this);
        this.getRangeEditPanel().showEditModes(o.editModes);
        this.show();
    },
    
    getFooterBarConfig: function() {
        var cfg = ['->', {
                text: this.saveButtonText,
                itemId: this.id + '-save-btn',
                disabled: false,
                handler: this.onSaveAction,
                scope: this
            },{
                text: this.cancelButtonText,
                itemId: this.id + '-cancel-btn',
                disabled: false,
                handler: this.onCancelAction,
                scope: this
            }];
        
        return cfg;
    },
    
    onSaveAction: function() {
        var mode = this.getComponent(this.id + '-recur-panel').getEditMode();
        this.callbackFunction(mode);
        this.close();
    },
    
    onCancelAction: function() {
        this.callbackFunction(false);
        this.close();
    }
});/**
 * @class Extensible.calendar.data.EventMappings
 * @extends Object
 * A simple object that provides the field definitions for
 * {@link Extensible.calendar.EventRecord EventRecord}s so that they can be easily overridden.
 *
 * There are several ways of overriding the default Event record mappings to customize how
 * Ext records are mapped to your back-end data model. If you only need to change a handful
 * of field properties you can directly modify the EventMappings object as needed and then
 * reconfigure it. The simplest approach is to only override specific field attributes:
 * 
 *		var M = Extensible.calendar.data.EventMappings;
 *			M.Title.mapping = 'evt_title';
 *			M.Title.name = 'EventTitle';
 *			Extensible.calendar.EventRecord.reconfigure();
 *
 * You can alternately override an entire field definition using object-literal syntax, or
 * provide your own custom field definitions (as in the following example). Note that if you do
 * this, you **MUST** include a complete field definition, including the <tt>type</tt> attribute
 * if the field is not the default type of <tt>string</tt>.
 * 
 *		// Add a new field that does not exist in the default EventMappings:
 *		Extensible.calendar.data.EventMappings.Timestamp = {
 *			name: 'Timestamp',
 *			mapping: 'timestamp',
 *			type: 'date'
 *		};
 *		Extensible.calendar.EventRecord.reconfigure();
 *
 * If you are overriding a significant number of field definitions it may be more convenient
 * to simply redefine the entire EventMappings object from scratch. The following example
 * redefines the same fields that exist in the standard EventRecord object but the names and
 * mappings have all been customized. Note that the name of each field definition object
 * (e.g., 'EventId') should **NOT** be changed for the default EventMappings fields as it
 * is the key used to access the field data programmatically.
 * 
 *		Extensible.calendar.data.EventMappings = {
 *			EventId:     {name: 'ID', mapping:'evt_id', type:'int'},
 *			CalendarId:  {name: 'CalID', mapping: 'cal_id', type: 'int'},
 *			Title:       {name: 'EvtTitle', mapping: 'evt_title'},
 *			StartDate:   {name: 'StartDt', mapping: 'start_dt', type: 'date', dateFormat: 'c'},
 *			EndDate:     {name: 'EndDt', mapping: 'end_dt', type: 'date', dateFormat: 'c'},
 *			RRule:       {name: 'RecurRule', mapping: 'recur_rule'},
 *			Location:    {name: 'Location', mapping: 'location'},
 *			Notes:       {name: 'Desc', mapping: 'full_desc'},
 *			Url:         {name: 'LinkUrl', mapping: 'link_url'},
 *			IsAllDay:    {name: 'AllDay', mapping: 'all_day', type: 'boolean'},
 *			Reminder:    {name: 'Reminder', mapping: 'reminder'},
 *       // We can also add some new fields that do not exist in the standard EventRecord:
 *			CreatedBy:   {name: 'CreatedBy', mapping: 'created_by'},
 *			IsPrivate:   {name: 'Private', mapping:'private', type:'boolean'}
 *		};
 *		// Don't forget to reconfigure!
 *		Extensible.calendar.EventRecord.reconfigure();
 *
 * **NOTE:** Any record reconfiguration you want to perform must be done **PRIOR to**
 * initializing your data store, otherwise the changes will not be reflected in the store's records.
 *
 * Another important note is that if you alter the default mapping for <tt>EventId</tt>, make sure to add
 * that mapping as the <tt>idProperty</tt> of your data reader, otherwise it won't recognize how to
 * access the data correctly and will treat existing records as phantoms. Here's an easy way to make sure
 * your mapping is always valid:
 * 
 *		var reader = new Ext.data.reader.Json({
 *			totalProperty: 'total',
 *			successProperty: 'success',
 *          root: 'data',
 *          messageProperty: 'message',
 *       // read the id property generically, regardless of the mapping:
 *			idProperty: Extensible.calendar.data.EventMappings.EventId.mapping  || 'id',
 *       // this is also a handy way to configure your reader's fields generically:
 *			fields: Extensible.calendar.EventRecord.prototype.fields.getRange()
 *		});
 */
Ext.ns('Extensible.calendar.data');

// @define Extensible.calendar.data.EventMappings
Extensible.calendar.data.EventMappings = {
    EventId: {
        name:    'EventId',
        mapping: 'id',
        type:    'string'
    },
    CalendarId: {
        name:    'CalendarId',
        mapping: 'cid',
        type:    'string'
    },
    Title: {
        name:    'Title',
        mapping: 'title',
        type:    'string'
    },
    StartDate: {
        name:       'StartDate',
        mapping:    'start',
        type:       'date',
        dateFormat: 'c'
    },
    EndDate: {
        name:       'EndDate',
        mapping:    'end',
        type:       'date',
        dateFormat: 'c'
    },
    Location: {
        name:    'Location',
        mapping: 'loc',
        type:    'string'
    },
    Notes: {
        name:    'Notes',
        mapping: 'notes',
        type:    'string'
    },
    Url: {
        name:    'Url',
        mapping: 'url',
        type:    'string'
    },
    IsAllDay: {
        name:    'IsAllDay',
        mapping: 'ad',
        type:    'boolean'
    },
    Reminder: {
        name:    'Reminder',
        mapping: 'rem',
        type:    'string'
    },
    Colour: {
        name:    'Colour',
        mapping: 'colour',
        type:    'string'
    },
    Color: {
        name:    'Color',
        mapping: 'color',
        type:    'int'
    },
// ----- Recurrence properties -----

    // NOTE: Only RRule and Duration need to be persisted. The other properties
    // do need to be mapped as they are used on the back end, but typically they
    // are transient properties only used during processing of requests and do
    // not need to be stored in a DB.
    
    // The iCal-formatted RRULE (recurrence rule) pattern.
    // (See: http://www.kanzaki.com/docs/ical/rrule.html)
    // While technically recurrence could be implemented in other custom
    // ways, the iCal format is the de facto industry standard, offers
    // interoperability with other calendar apps (e.g. Google Calendar,
    // Apple iCal, etc.) and provides a compact storage format. You could
    // choose to provide a custom implementation, but out of the box only
    // the iCal RRULE format is handled by the components.
    RRule: {
        name:    'RRule',
        mapping: 'rrule',
        type:    'string',
        useNull: true
    },
    
    // When using recurrence, the standard EndDate value will be the end date
    // of the _recurrence series_, not the end date of the "event". In fact,
    // with recurrence there is no single "event", only a pattern that generates
    // event instances, each of which has a separate start and end date.
    // Because of this we also store the duration of the event when using
    // recurrence so that the end date of each event instance can be
    // properly calculated.
    Duration: {
        name:         'Duration',
        mapping:      'duration',
        defaultValue: -1,   // the standard int default of 0 is actually a valid duration
        useNull:      true, // Without this, the null returned from the server is coerced to 0
        type:         'int'
    },
    
    // This is used to associate recurring event instances back to their
    // original master events when sending edit requests to the server. This
    // is required since each individual event instance will have a unique id
    // (required by Ext stores) which is not guaranteed to be a real PK since
    // typically these will be generated from the RRULE pattern, not real events
    // that exist in the DB.
    OriginalEventId: {
        name:    'OriginalEventId',
        mapping: 'origid',
        type:    'string',
        useNull: true
    },
    
    // The start date for the recurring series.
    RSeriesStartDate: {
        name:       'RSeriesStartDate',
        mapping:    'rsstart',
        type:       'date',
        dateFormat: 'c',
        useNull:    true
    },
    
    // If the start date of a recurring event instance is changed and then saved
    // using the "single" instance case (or if you drag an event instance and drop
    // it on a different date) the server has to create an exception for that instance
    // in the series. Since the instance being sent to the server by default only has
    // the updated start date, you need a way to pass the original unedited start date
    // to be used as the exception date, which is what this instance start date is for.
    RInstanceStartDate: {
        name:       'RInstanceStartDate',
        mapping:    'ristart',
        type:       'date',
        dateFormat: 'c',
        useNull:    true
    },
    
    // Recurrence edit mode ('single', 'future' or 'all'). This is transient data
    // and would typically not be persisted (it's ignored by the calendar for
    // display purposes), but it's kept on the record for ease of transmission to
    // the server, and because multiple batched events could have different edit modes.
    REditMode: {
        name:    'REditMode',
        mapping: 'redit',
        type:    'string',
        useNull: true
    }
};/**
 * @class Extensible.calendar.data.CalendarMappings
 * @extends Object
 * A simple object that provides the field definitions for
 * {@link Extensible.calendar.data.CalendarModel CalendarRecord}s so that they can be easily overridden.
 *
 * There are several ways of overriding the default Calendar record mappings to customize how
 * Ext records are mapped to your back-end data model. If you only need to change a handful
 * of field properties you can directly modify the CalendarMappings object as needed and then
 * reconfigure it. The simplest approach is to only override specific field attributes:
 * 
 *		var M = Extensible.calendar.data.CalendarMappings;
 *			M.Title.mapping = 'cal_title';
 *			M.Title.name = 'CalTitle';
 *		Extensible.calendar.data.CalendarModel.reconfigure();
 *
 * You can alternately override an entire field definition using object-literal syntax, or
 * provide your own custom field definitions (as in the following example). Note that if you do
 * this, you **MUST** include a complete field definition, including the <tt>type</tt> attribute
 * if the field is not the default type of <tt>string</tt>.
 * 
 *		// Add a new field that does not exist in the default CalendarMappings:
 *		Extensible.calendar.data.CalendarMappings.Owner = {
 *			name: 'Owner',	
 *			mapping: 'owner',
 *			type: 'string'
 *		};
 *		Extensible.calendar.data.CalendarModel.reconfigure();
 *
 * If you are overriding a significant number of field definitions it may be more convenient
 * to simply redefine the entire CalendarMappings object from scratch. The following example
 * redefines the same fields that exist in the standard CalendarRecord object but the names and
 * mappings have all been customized. Note that the name of each field definition object
 * (e.g., 'CalendarId') should **NOT** be changed for the default CalendarMappings fields as it
 * is the key used to access the field data programmatically.
 * 
 *		Extensible.calendar.data.CalendarMappings = {
 *			CalendarId:   {name:'ID', mapping: 'id', type: 'int'},
 *			Title:        {name:'CalTitle', mapping: 'title', type: 'string'},
 *			Description:  {name:'Desc', mapping: 'desc', type: 'string'},
 *			ColorId:      {name:'Color', mapping: 'color', type: 'int'},
 *			IsHidden:     {name:'Hidden', mapping: 'hidden', type: 'boolean'},
 *       // We can also add some new fields that do not exist in the standard CalendarRecord:
 *			Owner:        {name: 'Owner', mapping: 'owner'}
 *		};
 *		// Don't forget to reconfigure!
 *		Extensible.calendar.data.CalendarModel.reconfigure();
 *
 * **NOTE:** Any record reconfiguration you want to perform must be done **PRIOR to**
 * initializing your data store, otherwise the changes will not be reflected in the store's records.
 *
 * Another important note is that if you alter the default mapping for <tt>CalendarId</tt>, make sure to add
 * that mapping as the <tt>idProperty</tt> of your data reader, otherwise it won't recognize how to
 * access the data correctly and will treat existing records as phantoms. Here's an easy way to make sure
 * your mapping is always valid:
 * 
 *		var reader = new Ext.data.reader.Json({
 *			totalProperty: 'total',
 *			successProperty: 'success',
 *			root: 'data',
 *			messageProperty: 'message',
 *          read the id property generically, regardless of the mapping:
 *			idProperty: Extensible.calendar.data.CalendarMappings.CalendarId.mapping  || 'id',
 *          this is also a handy way to configure your reader's fields generically:
 *			fields: Extensible.calendar.data.CalendarModel.prototype.fields.getRange()
 *		});
 */
Ext.ns('Extensible.calendar.data');

// @define Extensible.calendar.data.CalendarMappings
Extensible.calendar.data.CalendarMappings = {
    CalendarId: {
        name:    'CalendarId',
        mapping: '_ref',
        type:    'string'
    },
    Title: {
        name:    'Title',
        mapping: 'Name',
        type:    'string'
    },
    Description: {
        name:    'Description',
        mapping: 'Desription',
        type:    'string'
    },
    ColorId: {
        name:    'ColorId',
        mapping: 'DisplayColor',
        type:    'int'
    },
    IsHidden: {
        name:    'IsHidden',
        mapping: 'hidden',
        type:    'boolean'
    }
};/**
 * This is the template used to render calendar views based on small day boxes within a non-scrolling container
 * (currently the {@link Extensible.calendar.view.Month MonthView} and the all-day headers for
 * {@link Extensible.calendar.view.Day DayView} and {@link Extensible.calendar.view.Week WeekView}. This template
 * is automatically bound to the underlying event store by the calendar components and expects records of type
 * {@link Extensible.calendar.data.EventModel}.
 */
Ext.define('Extensible.calendar.template.BoxLayout', {
    extend: 'Ext.XTemplate',
    
    requires: ['Ext.Date'],
    
    /**
     * @cfg {String} firstWeekDateFormat
     * The date format used for the day boxes in the first week of the view only (subsequent weeks
     * use the {@link #otherWeeksDateFormat} config). Defaults to 'D j'. Note that if the day names header is displayed
     * above the first row (e.g., {@link Extensible.calendar.view.Month#showHeader MonthView.showHeader} = true)
     * then this value is ignored and {@link #otherWeeksDateFormat} will be used instead.
     */
    firstWeekDateFormat: 'D j',
    /**
     * @cfg {String} otherWeeksDateFormat
     * The date format used for the date in day boxes (other than the first week, which is controlled by
     * {@link #firstWeekDateFormat}). Defaults to 'j'.
     */
    otherWeeksDateFormat: 'j',
    /**
     * @cfg {String} singleDayDateFormat
     * The date format used for the date in the header when in single-day view (defaults to 'l, F j, Y').
     */
    singleDayDateFormat: 'l, F j, Y',
    /**
     * @cfg {String} multiDayFirstDayFormat
     * The date format used for the date in the header when more than one day are visible (defaults to 'M j, Y').
     */
    multiDayFirstDayFormat: 'M j, Y',
    /**
     * @cfg {String} multiDayMonthStartFormat
     * The date format to use for the first day in a month when more than one day are visible (defaults to 'M j').
     * Note that if this day falls on the first day within the view, {@link #multiDayFirstDayFormat} takes precedence.
     */
    multiDayMonthStartFormat: 'M j',

    constructor: function(config) {
        
        Ext.apply(this, config);
    
        var weekLinkTpl = this.showWeekLinks ? '<div id="{weekLinkId}" class="ext-cal-week-link">{weekNum}</div>' : '';
        
        Extensible.calendar.template.BoxLayout.superclass.constructor.call(this,
            '<tpl for="weeks">',
                '<div id="{[this.id]}-wk-{[xindex-1]}" class="ext-cal-wk-ct" style="top:{[this.getRowTop(xindex, xcount)]}%; height:{[this.getRowHeight(xcount)]}%;">',
                    weekLinkTpl,
                    '<table class="ext-cal-bg-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tr>',
                                '<tpl for=".">',
                                     '<td id="{[this.id]}-day-{date:date("Ymd")}" class="{cellCls}">&#160;</td>',
                                '</tpl>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                    '<table class="ext-cal-evt-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tr>',
                                '<tpl for=".">',
                                    '<td id="{[this.id]}-ev-day-{date:date("Ymd")}" class="{titleCls}"><div>{title}</div></td>',
                                '</tpl>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            '</tpl>', {
                getRowTop: function(i, ln) {
                    return ((i-1)*(100/ln));
                },
                getRowHeight: function(ln) {
                    return 100/ln;
                }
            }
        );
    },

    applyTemplate: function(o) {
        
        Ext.apply(this, o);
        
        var w = 0,
            title = '',
            first = true,
            isToday = false,
            showMonth = false,
            prevMonth = false,
            nextMonth = false,
            isWeekend = false,
            weekendCls = o.weekendCls,
            prevMonthCls = o.prevMonthCls,
            nextMonthCls = o.nextMonthCls,
            todayCls = o.todayCls,
            weeks = [[]],
            today = Extensible.Date.today(),
            dt = Ext.Date.clone(this.viewStart),
            thisMonth = this.startDate.getMonth();
        
        for (; w < this.weekCount || this.weekCount === -1; w++) {
            if(dt > this.viewEnd) {
                break;
            }
            weeks[w] = [];
            
            for (var d = 0; d < this.dayCount; d++) {
                isToday = dt.getTime() === today.getTime();
                showMonth = first || (dt.getDate() === 1);
                prevMonth = (dt.getMonth() < thisMonth) && this.weekCount === -1;
                nextMonth = (dt.getMonth() > thisMonth) && this.weekCount === -1;
                isWeekend = dt.getDay() % 6 === 0;
                
                if(dt.getDay() === 1) {
                    // The ISO week format 'W' is relative to a Monday week start. If we
                    // make this check on Sunday the week number will be off.
                    weeks[w].weekNum = this.showWeekNumbers ? Ext.Date.format(dt, 'W') : '&#160;';
                    weeks[w].weekLinkId = 'ext-cal-week-'+Ext.Date.format(dt, 'Ymd');
                }
                
                if(showMonth) {
                    if(isToday) {
                        title = this.getTodayText();
                    }
                    else{
                        title = Ext.Date.format(dt, this.dayCount === 1 ? this.singleDayDateFormat :
                                (first ? this.multiDayFirstDayFormat : this.multiDayMonthStartFormat));
                    }
                }
                else{
                    var dayFmt = (w === 0 && this.showHeader !== true) ? this.firstWeekDateFormat : this.otherWeeksDateFormat;
                    title = isToday ? this.getTodayText() : Ext.Date.format(dt, dayFmt);
                }
                
                weeks[w].push({
                    title: title,
                    date: Ext.Date.clone(dt),
                    
                    titleCls: 'ext-cal-dtitle ' + (isToday ? ' ext-cal-dtitle-today' : '') +
                        (w === 0 ? ' ext-cal-dtitle-first' : '') +
                        (prevMonth ? ' ext-cal-dtitle-prev' : '') +
                        (nextMonth ? ' ext-cal-dtitle-next' : ''),
                    
                    cellCls: 'ext-cal-day ' + (isToday ? ' ' + todayCls : '') +
                        (d === 0 ? ' ext-cal-day-first' : '') +
                        (prevMonth ? ' ' + prevMonthCls : '') +
                        (nextMonth ? ' ' + nextMonthCls : '') +
                        (isWeekend && weekendCls ? ' ' + weekendCls : '')
                });
                
                dt = Extensible.Date.add(dt, {days: 1});
                first = false;
            }
        }
        
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.BoxLayout.superclass.applyTemplate.call(this, {
                weeks: weeks
            });
        }
        else {
            return this.applyOut({
                weeks: weeks
            }, []).join('');
        }
    },

    getTodayText: function() {
        var timeFmt = Extensible.Date.use24HourTime ? 'G:i ' : 'g:ia ',
            todayText = this.showTodayText !== false ? this.todayText : '',
            timeText = this.showTime !== false ? ' <span id="' + this.id +
                '-clock" class="ext-cal-dtitle-time" aria-live="off">' +
                Ext.Date.format(new Date(), timeFmt) + '</span>' : '',
            separator = todayText.length > 0 || timeText.length > 0 ? ' &#8212; ' : ''; // &#8212; == &mdash;
        
        if(this.dayCount === 1) {
            return Ext.Date.format(new Date(), this.singleDayDateFormat) + separator + todayText + timeText;
        }
        var fmt = this.weekCount === 1 ? this.firstWeekDateFormat : this.otherWeeksDateFormat;
        return todayText.length > 0 ? todayText + timeText : Ext.Date.format(new Date(), fmt) + timeText;
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});/**
 * This is the template used to render the all-day event container used in
 * {@link Extensible.calendar.view.Day DayView} and {@link Extensible.calendar.view.Week WeekView}. Internally
 * the majority of the layout logic is deferred to an instance of {@link Extensible.calendar.template.BoxLayout}.
 * 
 * This template is automatically bound to the underlying event store by the calendar components and expects
 * records of type {@link Extensible.calendar.data.EventModel}.
 * 
 * Note that this template would not normally be used directly. Instead you would use the
 * {@link Extensible.calendar.view.DayTemplate} that internally creates an instance of this template along with
 * a {@link Extensible.calendar.template.DayBody}.
 */
Ext.define('Extensible.calendar.template.DayHeader', {
    extend: 'Ext.XTemplate',
    
    requires: ['Extensible.calendar.template.BoxLayout'],
    
    constructor: function(config) {
        
        Ext.apply(this, config);
    
        this.allDayTpl = Ext.create('Extensible.calendar.template.BoxLayout', config);
        this.allDayTpl.compile();
        
        Extensible.calendar.template.DayHeader.superclass.constructor.call(this,
            '<div class="ext-cal-hd-ct">',
                '<table class="ext-cal-hd-days-tbl" cellspacing="0" cellpadding="0">',
                    '<tbody>',
                        '<tr>',
                            '<td class="ext-cal-gutter"></td>',
                            '<td class="ext-cal-hd-days-td"><div class="ext-cal-hd-ad-inner">{allDayTpl}</div></td>',
                            '<td class="ext-cal-gutter-rt"></td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            '</div>'
        );
    },
    
    applyTemplate: function(o) {
        var templateConfig = {
            allDayTpl: this.allDayTpl.apply(o)
        };
         
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.DayHeader.superclass.applyTemplate.call(this, templateConfig);
        }
        else {
            return this.applyOut(templateConfig, []).join('');
        }
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});/**
 * This is the template used to render the scrolling body container used in
 * {@link Extensible.calendar.view.Day DayView} and {@link Extensible.calendar.view.Week WeekView}. This template
 * is automatically bound to the underlying event store by the calendar components and expects records of type
 * {@link Extensible.calendar.data.EventModel}.
 * 
 * Note that this template would not normally be used directly. Instead you would use the
 * {@link Extensible.calendar.view.DayTemplate} that internally creates an instance of this template along
 * with a {@link Extensible.calendar.DayHeaderTemplate}.
 */
Ext.define('Extensible.calendar.template.DayBody', {
    extend: 'Ext.XTemplate',

    constructor: function(config) {
        
        Ext.apply(this, config);
    
        Extensible.calendar.template.DayBody.superclass.constructor.call(this,
            '<table class="ext-cal-bg-tbl" cellspacing="0" cellpadding="0" style="height:{dayHeight}px;">',
                '<tbody>',
                    '<tr height="1">',
                        '<td class="ext-cal-gutter"></td>',
                        '<td colspan="{dayCount}">',
                            '<div class="ext-cal-bg-rows">',
                                '<div class="ext-cal-bg-rows-inner">',
                                    '<tpl for="times">',
                                        '<div class="ext-cal-bg-row ext-row-{[xindex]}" style="height:{parent.hourHeight}px;">',
                                            '<div class="ext-cal-bg-row-div {parent.hourSeparatorCls}" style="height:{parent.hourSeparatorHeight}px;"></div>',
                                        '</div>',
                                    '</tpl>',
                                '</div>',
                            '</div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="ext-cal-day-times">',
                            '<tpl for="times">',
                                '<div class="ext-cal-bg-row" style="height:{parent.hourHeight}px;">',
                                    '<div class="ext-cal-day-time-inner"  style="height:{parent.hourHeight-1}px;">{.}</div>',
                                '</div>',
                            '</tpl>',
                        '</td>',
                        '<tpl for="days">',
                            '<td class="ext-cal-day-col">',
                                '<div class="ext-cal-day-col-inner">',
                                    '<div id="{[this.id]}-day-col-{.:date("Ymd")}" class="ext-cal-day-col-gutter" style="height:{parent.dayHeight}px;"></div>',
                                '</div>',
                            '</td>',
                        '</tpl>',
                    '</tr>',
                '</tbody>',
            '</table>'
        );
    },

    applyTemplate: function(o) {
        this.today = Extensible.Date.today();
        this.dayCount = this.dayCount || 1;
        
        var i = 0, days = [],
            dt = Ext.Date.clone(o.viewStart);
            
        for (; i<this.dayCount; i++) {
            days[i] = Extensible.Date.add(dt, {days: i});
        }

        var times = [],
            start = this.viewStartHour,
            end = this.viewEndHour,
            mins = this.hourIncrement,
            dayHeight = this.hourHeight * (end - start),
            fmt = Extensible.Date.use24HourTime ? 'G:i' : 'ga',
            templateConfig;
        
        // use a fixed DST-safe date so times don't get skipped on DST boundaries
        dt = Extensible.Date.add(new Date('5/26/1972'), {hours: start});
        
        for (i=start; i<end; i++) {
            times.push(Ext.Date.format(dt, fmt));
            dt = Extensible.Date.add(dt, {minutes: mins});
        }

        templateConfig = {
            days: days,
            dayCount: days.length,
            times: times,
            hourHeight: this.hourHeight,
            hourSeparatorCls: this.showHourSeparator ? '' : 'no-sep', // the class suppresses the default separator
            dayHeight: dayHeight,
            hourSeparatorHeight: (this.hourHeight / 2)
        };
         
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.DayBody.superclass.applyTemplate.call(this, templateConfig);
        }
        else {
            return this.applyOut(templateConfig, []).join('');
        }
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});/**
 * This is the template used to render the {@link Extensible.calendar.view.Month MonthView}. Internally this class defers to an
 * instance of {@link Extensible.calendar.template.BoxLayout} to handle the inner layout rendering and adds containing elements around
 * that to form the month view.
 * 
 * This template is automatically bound to the underlying event store by the
 * calendar components and expects records of type {@link Extensible.calendar.data.EventModel}.
 */
Ext.define('Extensible.calendar.template.Month', {
    extend: 'Ext.XTemplate',
    
    requires: ['Extensible.calendar.template.BoxLayout'],
    
    /**
     * @cfg {String} dayHeaderFormat
     * The date format to use for day headers, if used (defaults to 'D', e.g. 'Mon' for Monday)
     */
    dayHeaderFormat: 'D',
    /**
     * @cfg {String} dayHeaderTitleFormat
     * The date format to use for the day header's HTML title attribute displayed on mouseover
     * (defaults to 'l, F j, Y', e.g. 'Monday, December 27, 2010')
     */
    dayHeaderTitleFormat: 'l, F j, Y',
    
    constructor: function(config) {
        
        Ext.apply(this, config);
    
        this.weekTpl = Ext.create('Extensible.calendar.template.BoxLayout', config);
        this.weekTpl.compile();
        
        var weekLinkTpl = this.showWeekLinks ? '<div class="ext-cal-week-link-hd">&#160;</div>' : '';
        
        Extensible.calendar.template.Month.superclass.constructor.call(this,
            '<div class="ext-cal-inner-ct {extraClasses}">',
                '<div class="ext-cal-hd-ct ext-cal-month-hd">',
                    weekLinkTpl,
                    '<table class="ext-cal-hd-days-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tr>',
                                '<tpl for="days">',
                                    '<th class="ext-cal-hd-day{[xindex==1 ? " ext-cal-day-first" : ""]}" title="{title}">{name}</th>',
                                '</tpl>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
                '<div class="ext-cal-body-ct">{weeks}</div>',
            '</div>'
        );
    },
    
    applyTemplate: function(o) {
        var days = [],
            weeks = this.weekTpl.apply(o),
            dt = o.viewStart,
            D = Extensible.Date,
            templateConfig;
        
        for (var i = 0; i < 7; i++) {
            var d = D.add(dt, {days: i});
            days.push({
                name: Ext.Date.format(d, this.dayHeaderFormat),
                title: Ext.Date.format(d, this.dayHeaderTitleFormat)
            });
        }
        
        var extraClasses = this.showHeader === true ? '' : 'ext-cal-noheader';
        if(this.showWeekLinks) {
            extraClasses += ' ext-cal-week-links';
        }
        
        templateConfig = {
            days: days,
            weeks: weeks,
            extraClasses: extraClasses
        };
         
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            return Extensible.calendar.template.Month.superclass.applyTemplate.call(this, templateConfig);
        }
        else {
            return this.applyOut(templateConfig, []).join('');
        }
    }
},
function() {
    this.createAlias('apply', 'applyTemplate');
});/**
 * This is included only as an override to fix the original class provided by Ext.
 * Unfortunately as a singleton there's no easier way to patch it.
 * 
 * @private
 */
Ext.define('Ext.dd.ScrollManager', {
    singleton: true,
    requires: [
        'Ext.dd.DragDropManager'
    ],

    constructor: function() {
        var ddm = Ext.dd.DragDropManager;
        ddm.fireEvents = Ext.Function.createSequence(ddm.fireEvents, this.onFire, this);
        ddm.stopDrag = Ext.Function.createSequence(ddm.stopDrag, this.onStop, this);
        this.doScroll = Ext.Function.bind(this.doScroll, this);
        this.ddmInstance = ddm;
        this.els = {};
        this.dragEl = null;
        this.proc = {};
    },

    onStop: function(e) {
//        var sm = Ext.dd.ScrollManager;
//        sm.dragEl = null;
//        sm.clearProc();
        this.dragEl = null;
        this.clearProc();
    },

    triggerRefresh: function() {
        if (this.ddmInstance.dragCurrent) {
            this.ddmInstance.refreshCache(this.ddmInstance.dragCurrent.groups);
        }
    },

    doScroll: function() {
        if (this.ddmInstance.dragCurrent) {
            var proc   = this.proc,
                procEl = proc.el,
                ddScrollConfig = proc.el.ddScrollConfig,
                inc = ddScrollConfig ? ddScrollConfig.increment : this.increment;

            if (!this.animate) {
                if (procEl.scroll(proc.dir, inc)) {
                    this.triggerRefresh();
                }
            } else {
                procEl.scroll(proc.dir, inc, true, this.animDuration, this.triggerRefresh);
            }
        }
    },

    clearProc: function() {
        var proc = this.proc;
        if (proc.id) {
            clearInterval(proc.id);
        }
        proc.id = 0;
        proc.el = null;
        proc.dir = "";
    },

    startProc: function(el, dir) {
        this.clearProc();
        this.proc.el = el;
        this.proc.dir = dir;
        var group = el.ddScrollConfig ? el.ddScrollConfig.ddGroup : undefined,
            freq  = (el.ddScrollConfig && el.ddScrollConfig.frequency) ?
                el.ddScrollConfig.frequency : this.frequency;

        if (group === undefined || this.ddmInstance.dragCurrent.ddGroup === group) {
            this.proc.id = setInterval(this.doScroll, freq);
        }
    },

    onFire: function(e, isDrop) {
        if (isDrop || !this.ddmInstance.dragCurrent) {
            return;
        }
        if (!this.dragEl || this.dragEl !== this.ddmInstance.dragCurrent) {
            this.dragEl = this.ddmInstance.dragCurrent;
            // refresh regions on drag start
            this.refreshCache();
        }

        var xy = e.getXY(),
            pt = e.getPoint(),
            proc = this.proc,
            els = this.els;

        for (var id in els) {
            var el = els[id], r = el._region;
            var c = el.ddScrollConfig ? el.ddScrollConfig : this;
            if (r && r.contains(pt) && el.isScrollable()) {
                if (r.bottom - pt.y <= c.vthresh) {
                    if(proc.el !== el) {
                        this.startProc(el, "down");
                    }
                    return;
                }else if (r.right - pt.x <= c.hthresh) {
                    if (proc.el !== el) {
                        this.startProc(el, "left");
                    }
                    return;
                } else if(pt.y - r.top <= c.vthresh) {
                    if (proc.el !== el) {
                        this.startProc(el, "up");
                    }
                    return;
                } else if(pt.x - r.left <= c.hthresh) {
                    if (proc.el !== el) {
                        this.startProc(el, "right");
                    }
                    return;
                }
            }
        }
        this.clearProc();
    },

    /**
     * Registers new overflow element(s) to auto scroll
     * @param {Mixed/Array} el The id of or the element to be scrolled or an array of either
     */
    register: function(el) {
        if (Ext.isArray(el)) {
            for (var i = 0, len = el.length; i < len; i++) {
                    this.register(el[i]);
            }
        } else {
            el = Ext.get(el);
            this.els[el.id] = el;
        }
    },

    /**
     * Unregisters overflow element(s) so they are no longer scrolled
     * @param {Mixed/Array} el The id of or the element to be removed or an array of either
     */
    unregister: function(el) {
        if(Ext.isArray(el)) {
            for (var i = 0, len = el.length; i < len; i++) {
                this.unregister(el[i]);
            }
        }else{
            el = Ext.get(el);
            delete this.els[el.id];
        }
    },

    /**
     * The number of pixels from the top or bottom edge of a container the pointer needs to be to
     * trigger scrolling (defaults to 25)
     * @type Number
     */
    vthresh: 25,
    /**
     * The number of pixels from the right or left edge of a container the pointer needs to be to
     * trigger scrolling (defaults to 25)
     * @type Number
     */
    hthresh: 25,

    /**
     * The number of pixels to scroll in each scroll increment (defaults to 100)
     * @type Number
     */
    increment: 100,

    /**
     * The frequency of scrolls in milliseconds (defaults to 500)
     * @type Number
     */
    frequency: 500,

    /**
     * True to animate the scroll (defaults to true)
     * @type Boolean
     */
    animate: true,

    /**
     * The animation duration in seconds -
     * MUST BE less than Ext.dd.ScrollManager.frequency! (defaults to .4)
     * @type Number
     */
    animDuration: 0.4,

    /**
     * The named drag drop {@link Ext.dd.DragSource#ddGroup group} to which this container belongs (defaults to undefined).
     * If a ddGroup is specified, then container scrolling will only occur when a dragged object is in the same ddGroup.
     * @type String
     */
    ddGroup: undefined,

    /**
     * Manually trigger a cache refresh.
     */
    refreshCache: function() {
        var els = this.els,
            id;
        for (id in els) {
            if(typeof els[id] === 'object') { // for people extending the object prototype
                els[id]._region = els[id].getRegion();
            }
        }
    }
});
/**
 * A specialized drag proxy that supports a drop status icon, {@link Ext.dom.Layer} styles and auto-repair. It also
 * contains a calendar-specific drag status message containing details about the dragged event's target drop date range.
 * This is the default drag proxy used by all calendar views.
 * @private
 */
Ext.define('Extensible.calendar.dd.StatusProxy', {
    extend: 'Ext.dd.StatusProxy',
    
    /**
     * @cfg {String} moveEventCls
     * The CSS class to apply to the status element when an event is being dragged (defaults to 'ext-cal-dd-move').
     */
    moveEventCls: 'ext-cal-dd-move',
    /**
     * @cfg {String} addEventCls
     * The CSS class to apply to the status element when drop is not allowed (defaults to 'ext-cal-dd-add').
     */
    addEventCls: 'ext-cal-dd-add',

    // Overridden to add a separate message element inside the ghost area.
    // Applies only to Ext 4.1 and above, see notes in constructor
    renderTpl: [
        '<div class="' + Ext.baseCSSPrefix + 'dd-drop-icon"></div>',
        '<div class="ext-dd-ghost-ct">',
            '<div id="{id}-ghost" class="' + Ext.baseCSSPrefix + 'dd-drag-ghost"></div>',
            '<div id="{id}-message" class="ext-dd-msg"></div>',
        '</div>'
    ],
    
    // applies only to Ext 4.1 and above, see notes in constructor
    childEls: [
        'ghost',
        'message'
    ],
    
    constructor: function(config) {
        // In Ext 4.0.x StatusProxy was a plain class that did not inherit from Component,
        // and all of its els were rendered inside the constructor. Unfortunately, because
        // of this none of the standard Component lifecycle methods apply and so we are left
        // with manually overriding the entire constructor function to inject our custom
        // markup and set up our references.
        //
        // In 4.1 StatusProxy was switched to inherit from Component, so the renderTpl and
        // renderSelectors configs will kick in and generate the proper elements and refs
        // automagically, and will be ignored by 4.0.x.
        if (Ext.getVersion('extjs').isLessThan('4.1')) {
            this.preComponentConstructor(config);
        }
        else {
            this.callParent(arguments);
        }
    },
    
    // applies only to Ext <4.1, see notes in constructor
    preComponentConstructor: function(config) {
        var me = this;
        
        Ext.apply(me, config);
        
        me.id = me.id || Ext.id();
        me.proxy = Ext.createWidget('component', {
            floating: true,
            id: me.id || Ext.id(),
            html: me.renderTpl.join(''),
            cls: Ext.baseCSSPrefix + 'dd-drag-proxy ' + me.dropNotAllowed,
            shadow: !config || config.shadow !== false,
            renderTo: document.body
        });
 
        me.el = me.proxy.el;
        me.el.show();
        me.el.setVisibilityMode(Ext.Element.VISIBILITY);
        me.el.hide();
 
        me.ghost = Ext.get(me.el.dom.childNodes[1].childNodes[0]);
        me.message = Ext.get(me.el.dom.childNodes[1].childNodes[1]);
        me.dropStatus = me.dropNotAllowed;
    },
    
    /**
     * @protected 
     */
    update: function(html) {
        this.callParent(arguments);
        
        // If available, set the ghosted event el to autoHeight for visual consistency
        var el = this.ghost.dom.firstChild;
        if(el) {
            Ext.fly(el).setHeight('auto');
        }
    },
    
    /* @private
     * Update the calendar-specific drag status message without altering the ghost element.
     * @param {String} msg The new status message
     */
    updateMsg: function(msg) {
        this.message.update(msg);
    }
});/**
 * Internal drag zone implementation for the calendar components. This provides base functionality
 * and is primarily for the month view -- DayViewDD adds day/week view-specific functionality.
 * @private
 */
Ext.define('Extensible.calendar.dd.DragZone', {
    extend: 'Ext.dd.DragZone',
    
    requires: [
        'Ext.util.Point',
        'Extensible.calendar.dd.StatusProxy',
        'Extensible.calendar.data.EventMappings'
    ],
    
    ddGroup: 'CalendarDD',
    eventSelector: '.ext-cal-evt',
    eventSelectorDepth: 10,
    
    constructor: function(el, config) {
        if(!Extensible.calendar._statusProxyInstance) {
            Extensible.calendar._statusProxyInstance = Ext.create('Extensible.calendar.dd.StatusProxy');
        }
        this.proxy = Extensible.calendar._statusProxyInstance;
        this.callParent(arguments);
    },
    
    getDragData: function(e) {
        // Check whether we are dragging on an event first
        var t = e.getTarget(this.eventSelector, this.eventSelectorDepth);
        if(t) {
            var rec = this.view.getEventRecordFromEl(t);
            if(!rec) {
                // if rec is null here it usually means there was a timing issue between drag
                // start and the browser reporting it properly. Simply ignore and it will
                // resolve correctly once the browser catches up.
                return;
            }
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Extensible.calendar.data.EventMappings.StartDate.name],
                eventEnd: rec.data[Extensible.calendar.data.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }
        
        // If not dragging an event then we are dragging on the calendar to add a new event
        t = this.view.getDayAt(e.getX(), e.getY());
        if(t.el) {
            return {
                type: 'caldrag',
                start: t.date,
                proxy: this.proxy
            };
        }
        return null;
    },
    
    onInitDrag: function(x, y) {
        if(this.dragData.ddel) {
            var ghost = this.dragData.ddel.cloneNode(true),
                child = Ext.fly(ghost).down('dl');
            
            Ext.fly(ghost).setWidth('auto');
            
            if(child) {
                // for IE/Opera
                child.setHeight('auto');
            }
            this.proxy.update(ghost);
            this.onStartDrag(x, y);
        }
        else if(this.dragData.start) {
            this.onStartDrag(x, y);
        }
        this.view.onInitDrag();
        return true;
    },
    
    afterRepair: function() {
        if(Ext.enableFx && this.dragData.ddel) {
            Ext.fly(this.dragData.ddel).highlight(this.hlColor || 'c3daf9');
        }
        this.dragging = false;
    },
    
    getRepairXY: function(e) {
        if(this.dragData.ddel) {
            return Ext.fly(this.dragData.ddel).getXY();
        }
    },
    
    afterInvalidDrop: function(e, id) {
        Ext.select('.ext-dd-shim').hide();
    },
    
    destroy: function() {
        this.callParent(arguments);
        delete Extensible.calendar._statusProxyInstance;
    }
});/**
 * Internal drop zone implementation for the calendar components. This provides base functionality
 * and is primarily for the month view -- DayViewDD adds day/week view-specific functionality.
 * @private
 */
Ext.define('Extensible.calendar.dd.DropZone', {
    extend: 'Ext.dd.DropZone',
    
    requires: [
        'Ext.Layer',
        'Extensible.calendar.data.EventMappings'
    ],
    
    ddGroup: 'CalendarDD',
    eventSelector: '.ext-cal-evt',
    dateRangeFormat: '{0}-{1}',
    dateFormat: 'n/j',
    
    shims: [],
    
    getTargetFromEvent: function(e) {
        var dragOffset = this.dragOffset || 0,
            y = e.getPageY() - dragOffset,
            d = this.view.getDayAt(e.getPageX(), y);
        
        return d.el ? d: null;
    },
    
    onNodeOver: function(n, dd, e, data) {
        var D = Extensible.Date,
            eventDragText = (e.ctrlKey || e.altKey) ? this.copyText: this.moveText,
            start = data.type === 'eventdrag' ? n.date: D.min(data.start, n.date),
            end = data.type === 'eventdrag' ? D.add(n.date, {days: D.diffDays(data.eventStart, data.eventEnd)}) :
                D.max(data.start, n.date);
        
        if (!this.dragStartDate || !this.dragEndDate || (D.diffDays(start, this.dragStartDate) !== 0) ||
                (D.diffDays(end, this.dragEndDate) !== 0)) {
            this.dragStartDate = start;
            this.dragEndDate = D.add(end, {days: 1, millis: -1, clearTime: true});
            this.shim(start, end);
            
            var range = Ext.Date.format(start, this.dateFormat);
                
            if (D.diffDays(start, end) > 0) {
                end = Ext.Date.format(end, this.dateFormat);
                range = Ext.String.format(this.dateRangeFormat, range, end);
            }
            this.currentRange = range;
        }
                
        data.proxy.updateMsg(Ext.String.format(data.type === 'eventdrag' ? eventDragText :
            this.createText, this.currentRange));
            
        return this.dropAllowed;
    },
    
    shim: function(start, end) {
        this.DDMInstance.notifyOccluded = true;
        this.currWeek = -1;
        
        var dt = Ext.Date.clone(start),
            i = 0,
            shim,
            box,
            D = Extensible.Date,
            cnt = D.diffDays(dt, end) + 1;
        
        Ext.each(this.shims, function(shim) {
            if (shim) {
                shim.isActive = false;
            }
        });
        
        while (i++ < cnt) {
            var dayEl = this.view.getDayEl(dt);
            
            // if the date is not in the current view ignore it (this
            // can happen when an event is dragged to the end of the
            // month so that it ends outside the view)
            if (dayEl) {
                var wk = this.view.getWeekIndex(dt);
                
                shim = this.shims[wk];
            
                if (!shim) {
                    shim = this.createShim();
                    this.shims[wk] = shim;
                }
                if (wk !== this.currWeek) {
                    shim.boxInfo = dayEl.getBox();
                    this.currWeek = wk;
                }
                else {
                    box = dayEl.getBox();
                    shim.boxInfo.right = box.right;
                    shim.boxInfo.width = box.right - shim.boxInfo.x;
                }
                shim.isActive = true;
            }
            dt = D.add(dt, {days: 1});
        }
        
        Ext.each(this.shims, function(shim) {
            if (shim) {
                if (shim.isActive) {
                    shim.show();
                    shim.setBox(shim.boxInfo);
                }
                else if (shim.isVisible()) {
                    shim.hide();
                }
            }
        });
    },
    
    createShim: function() {
        var owner = this.view.ownerCalendarPanel ? this.view.ownerCalendarPanel: this.view;
        
        if (!this.shimCt) {
            this.shimCt = Ext.get('ext-dd-shim-ct-'+owner.id);
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext-dd-shim-ct-'+owner.id;
                owner.getEl().parent().appendChild(this.shimCt);
            }
        }
        var el = document.createElement('div');
        el.className = 'ext-dd-shim';
        this.shimCt.appendChild(el);
        
        return Ext.create('Ext.Layer', {
            shadow: false, 
            useDisplay: true, 
            constrain: false
        }, el);
    },
    
    clearShims: function() {
        Ext.each(this.shims, function(shim) {
            if (shim) {
                shim.hide();
            }
        });
        this.DDMInstance.notifyOccluded = false;
    },
    
    onContainerOver: function(dd, e, data) {
        return this.dropAllowed;
    },
    
    onCalendarDragComplete: function() {
        delete this.dragStartDate;
        delete this.dragEndDate;
        this.clearShims();
    },
    
    onNodeDrop: function(n, dd, e, data) {
        if (n && data) {
            if (data.type === 'eventdrag') {
                var rec = this.view.getEventRecordFromEl(data.ddel),
                    dt = Extensible.Date.copyTime(rec.data[Extensible.calendar.data.EventMappings.StartDate.name], n.date);
                    
                this.view.onEventDrop(rec, dt, (e.ctrlKey || e.altKey) ? 'copy': 'move');
                this.onCalendarDragComplete();
                return true;
            }
            if (data.type === 'caldrag') {
                if (!this.dragEndDate) {
                    // this can occur on a long click where drag starts but onNodeOver is never executed
                    this.dragStartDate = Ext.Date.clearTime(data.start);
                    this.dragEndDate = Extensible.Date.add(this.dragStartDate, {days: 1, millis: -1, clearTime: true});
                }
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate,
                    Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    },
    
    onContainerDrop: function(dd, e, data) {
        this.onCalendarDragComplete();
        return false;
    },
    
    destroy: function() {
        Ext.each(this.shims, function(shim) {
            if (shim) {
                Ext.destroy(shim);
            }
        });
        
        Ext.removeNode(this.shimCt);
        delete this.shimCt;
        this.shims.length = 0;
    }
});

/**
 * Internal drag zone implementation for the calendar day and week views.
 * @private
 */
Ext.define('Extensible.calendar.dd.DayDragZone', {
    extend: 'Extensible.calendar.dd.DragZone',
    
    ddGroup: 'DayViewDD',
    resizeSelector: '.ext-evt-rsz',
    
    getDragData: function(e) {
        var target = e.getTarget(this.resizeSelector, 2, true),
            rec,
            parent;
        
        if (target) {
            parent = target.parent(this.eventSelector);
            rec = this.view.getEventRecordFromEl(parent);
            
            if (!rec) {
                // if rec is null here it usually means there was a timing issue between drag
                // start and the browser reporting it properly. Simply ignore and it will
                // resolve correctly once the browser catches up.
                return;
            }
            return {
                type: 'eventresize',
                xy: e.getXY(),
                ddel: parent.dom,
                eventStart: rec.data[Extensible.calendar.data.EventMappings.StartDate.name],
                eventEnd: rec.data[Extensible.calendar.data.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }
        
        target = e.getTarget(this.eventSelector, this.eventSelectorDepth);
        
        if (target) {
            rec = this.view.getEventRecordFromEl(target);
            
            if (!rec) {
                // if rec is null here it usually means there was a timing issue between drag
                // start and the browser reporting it properly. Simply ignore and it will
                // resolve correctly once the browser catches up.
                return;
            }
            return {
                type: 'eventdrag',
                xy: e.getXY(),
                ddel: target,
                eventStart: rec.data[Extensible.calendar.data.EventMappings.StartDate.name],
                eventEnd: rec.data[Extensible.calendar.data.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }
        
        // If not dragging/resizing an event then we are dragging on the calendar to add a new event
        target = this.view.getDayAt(e.getX(), e.getY());
        
        if (target.el) {
            return {
                type: 'caldrag',
                dayInfo: target,
                proxy: this.proxy
            };
        }
        return null;
    }
});/**
 * Internal drop zone implementation for the calendar day and week views.
 * @private
 */
Ext.define('Extensible.calendar.dd.DayDropZone', {
    extend: 'Extensible.calendar.dd.DropZone',

    ddGroup: 'DayViewDD',
    dateRangeFormat: '{0}-{1}',
    dateFormat: 'n/j',
    
    onNodeOver: function(n, dd, e, data) {
        var dt,
            box,
            diff,
            curr,
            text = this.createText,
            timeFormat = Extensible.Date.use24HourTime ? 'G:i' : 'g:ia';
            
        if(data.type === 'caldrag') {
            if(!this.dragStartMarker) {
                // Since the container can scroll, this gets a little tricky.
                // There is no el in the DOM that we can measure by default since
                // the box is simply calculated from the original drag start (as opposed
                // to dragging or resizing the event where the orig event box is present).
                // To work around this we add a placeholder el into the DOM and give it
                // the original starting time's box so that we can grab its updated
                // box measurements as the underlying container scrolls up or down.
                // This placeholder is removed in onNodeDrop.
                this.dragStartMarker = n.el.parent().createChild({
                    style: 'position:absolute;'
                });
                // use the original dayInfo values from the drag start
                this.dragStartMarker.setBox(data.dayInfo.timeBox);
                this.dragCreateDt = data.dayInfo.date;
            }
            var endDt;
            box = this.dragStartMarker.getBox();
            box.height = Math.ceil(Math.abs(e.getY() - box.y) / n.timeBox.height) * n.timeBox.height;
            
            if(e.getY() < box.y) {
                box.height += n.timeBox.height;
                box.y = box.y - box.height + n.timeBox.height;
                endDt = Extensible.Date.add(this.dragCreateDt, {minutes: this.ddIncrement});
            }
            else{
                n.date = Extensible.Date.add(n.date, {minutes: this.ddIncrement});
            }
            this.shim(this.dragCreateDt, box);
            
            diff = Extensible.Date.diff(this.dragCreateDt, n.date);
            curr = Extensible.Date.add(this.dragCreateDt, {millis: diff});
                
            this.dragStartDate = Extensible.Date.min(this.dragCreateDt, curr);
            this.dragEndDate = endDt || Extensible.Date.max(this.dragCreateDt, curr);
                
            dt = Ext.String.format(this.dateRangeFormat,
                Ext.Date.format(this.dragStartDate, timeFormat),
                Ext.Date.format(this.dragEndDate, timeFormat));
        }
        else{
            var evtEl = Ext.get(data.ddel),
                dayCol = evtEl.parent().parent();
            
            box = evtEl.getBox();
            box.width = dayCol.getWidth();
            
            if(data.type === 'eventdrag') {
                if(this.dragOffset === undefined) {
                    // on fast drags there is a lag between the original drag start xy position and
                    // that first detected within the drop zone's getTargetFromEvent method (which is
                    // where n.timeBox comes from). to avoid a bad offset we calculate the
                    // timeBox based on the initial drag xy, not the current target xy.
                    var initialTimeBox = this.view.getDayAt(data.xy[0], data.xy[1]).timeBox;
                    this.dragOffset = initialTimeBox.y - box.y;
                }
                else{
                    box.y = n.timeBox.y;
                }
                dt = Ext.Date.format(n.date, (this.dateFormat + ' ' + timeFormat));
                box.x = n.el.getLeft();
                
                this.shim(n.date, box);
                text = (e.ctrlKey || e.altKey) ? this.copyText : this.moveText;
            }
            if(data.type === 'eventresize') {
                if(!this.resizeDt) {
                    this.resizeDt = n.date;
                }
                box.x = dayCol.getLeft();
                box.height = Math.ceil(Math.abs(e.getY() - box.y) / n.timeBox.height) * n.timeBox.height;
                if(e.getY() < box.y) {
                    box.y -= box.height;
                }
                else{
                    n.date = Extensible.Date.add(n.date, {minutes: this.ddIncrement});
                }
                this.shim(this.resizeDt, box);
                
                diff = Extensible.Date.diff(this.resizeDt, n.date);
                curr = Extensible.Date.add(this.resizeDt, {millis: diff});
                
                var start = Extensible.Date.min(data.eventStart, curr),
                    end = Extensible.Date.max(data.eventStart, curr),
                    startDateName = Extensible.calendar.data.EventMappings.StartDate.name,
                    endDateName = Extensible.calendar.data.EventMappings.EndDate.name;
                    
                data.resizeDates = {};
                data.resizeDates[startDateName] = start;
                data.resizeDates[endDateName] = end;
                
                
                dt = Ext.String.format(this.dateRangeFormat,
                    Ext.Date.format(start, timeFormat),
                    Ext.Date.format(end, timeFormat));
                    
                text = this.resizeText;
            }
        }
        
        data.proxy.updateMsg(Ext.String.format(text, dt));
        return this.dropAllowed;
    },
    
    shim: function(dt, box) {
        this.DDMInstance.notifyOccluded = true;
        
        Ext.each(this.shims, function(shim) {
            if(shim) {
                shim.isActive = false;
                shim.hide();
            }
        });
        
        var shim = this.shims[0];
        if(!shim) {
            shim = this.createShim();
            this.shims[0] = shim;
        }
        
        shim.isActive = true;
        shim.show();
        shim.setBox(box);
    },
    
    onNodeDrop: function(n, dd, e, data) {
        if(n && data) {
            var rec;
            
            if(data.type === 'eventdrag') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventDrop(rec, n.date, (e.ctrlKey || e.altKey) ? 'copy' : 'move');
                this.onCalendarDragComplete();
                delete this.dragOffset;
                return true;
            }
            if(data.type === 'eventresize') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventResize(rec, data.resizeDates);
                this.onCalendarDragComplete();
                delete this.resizeDt;
                return true;
            }
            if(data.type === 'caldrag') {
                Ext.destroy(this.dragStartMarker);
                delete this.dragStartMarker;
                delete this.dragCreateDt;
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate,
                    Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    }
});
/**
 * This is the {@link Ext.data.Model Model} specification for calendar event data used by the
 * {@link Extensible.calendar.CalendarPanel CalendarPanel}'s underlying store. It can be overridden as
 * necessary to customize the fields supported by events, although the existing field definition names
 * should not be altered. If your model fields are named differently you should update the **mapping**
 * configs accordingly.
 * 
 * The only required fields when creating a new event record instance are <tt>StartDate</tt> and
 * <tt>EndDate</tt>.  All other fields are either optional or will be defaulted if blank.
 * 
 * Here is a basic example for how to create a new record of this type:
 *		rec = new Extensible.calendar.data.EventModel({
 *			StartDate: '2101-01-12 12:00:00',
 *			EndDate: '2101-01-12 13:30:00',
 *			Title: 'My cool event',
 *			Notes: 'Some notes'
 *		});
 *  
 * If you have overridden any of the record's data mappings via the {@link Extensible.calendar.data.EventMappings EventMappings} object
 * you may need to set the values using this alternate syntax to ensure that the field names match up correctly:
 *		var M = Extensible.calendar.data.EventMappings,
 *		rec = new Extensible.calendar.data.EventModel();
 *			rec.data[M.StartDate.name] = '2101-01-12 12:00:00';
 *			rec.data[M.EndDate.name] = '2101-01-12 13:30:00';
 *			rec.data[M.Title.name] = 'My cool event';
 *			rec.data[M.Notes.name] = 'Some notes';
 */
Ext.define('Extensible.calendar.data.EventModel', {
    extend: 'Extensible.data.Model',

    requires: [
        'Extensible.calendar.data.EventMappings'
    ],
    
    mappingClass: 'Extensible.calendar.data.EventMappings',
    
    mappingIdProperty: 'EventId',
    
    // Experimental, not currently used:
    // associations: [{
        // type: 'hasMany',
        // model: 'Extensible.calendar.data.EventModel',
        // primaryKey: 'EventId',
        // foreignKey: 'ParentId',
        // autoLoad: true
    // },{
        // type: 'belongsTo',
        // model: 'Extensible.calendar.data.EventModel',
        // primaryKey: 'EventId',
        // foreignKey: 'ParentId'
    // }],

    inheritableStatics: {
        /**
         * The minimum time unit supported by events (defaults to 'minutes'). Other valid
         * values would be 'seconds' or 'millis'. This is used primarily in calculating date
         * ranges and event duration.  For example, an all-day event will be saved with a start time
         * of 0:00:00-00 and an end time of 0:00:00-00 the next day minus 1 unit as specified by this
         * resolution setting (1 minute by default, resulting in an end time of 23:59:00-00). This
         * setting could be changed to provide greater resolution, e.g. 'seconds' would result in an
         * all-day end time of 23:59:59-00 instead (although, by default, this would not result in
         * any visible display difference unless the calendar views were also customized).
         */
        resolution: 'minutes'
    },
    
    isRecurring: function() {
        var RRule = Extensible.calendar.data.EventMappings.RRule;
        
        if (RRule) {
            return !!this.get(RRule.name);
        }
        return false;
    },
    
    getStartDate: function() {
        return this.get(Extensible.calendar.data.EventMappings.StartDate.name);
    },
    
    getEndDate: function() {
        var EventMappings = Extensible.calendar.data.EventMappings,
            duration = EventMappings.Duration ? this.get(EventMappings.Duration.name) : null;
        
        if (duration !== null && duration > -1) {
            var durationObj = {};
            durationObj[Extensible.calendar.data.EventModel.resolution] = duration;
            return Extensible.Date.add(this.getStartDate(), durationObj);
        }
        return this.get(EventMappings.EndDate.name);
    },
    
    clearRecurrence: function() {
        var me = this,
            EventMappings = Extensible.calendar.data.EventMappings;
        
        delete me.data[EventMappings.OriginalEventId.name];
        delete me.data[EventMappings.RRule.name];
        delete me.data[EventMappings.RInstanceStartDate.name];
        delete me.data[EventMappings.REditMode.name];
        
        return me;
    },
    
    // Sencha broke getId() for mapped ids in 4.2. Mappings are required by Extensible and this method
    // began returning undefined for the record ids in 4.2. This override is here simply
    // to reinstate the 4.1.x version that still works as expected:
    getId: function() {
        return this.get(this.idProperty);
    }
},
function() {
    this.reconfigure();
});/*
 *
 */
Ext.define('Extensible.calendar.data.EventStore', {
    extend: 'Ext.data.Store',
    model: 'Extensible.calendar.data.EventModel',
    
    constructor: function(config) {
        config = config || {};
        
        // By default autoLoad will cause the store to load itself during the
        // constructor, before the owning calendar view has a chance to set up
        // the initial date params to use during loading.  We replace autoLoad
        // with a deferLoad property that the view can check for and use to set
        // up default params as needed, then call the load itself.
        this.deferLoad = config.autoLoad;
        config.autoLoad = false;
        
        //this._dateCache = [];
        
        this.callParent(arguments);
    },
    
    load: function(o) {
        Extensible.log('store load');
        o = o || {};
        
        // if params are passed delete the one-time defaults
        if(o.params) {
            delete this.initialParams;
        }
        // this.initialParams will only be set if the store is being loaded manually
        // for the first time (autoLoad = false) so the owning calendar view set
        // the initial start and end date params to use. Every load after that will
        // have these params set automatically during normal UI navigation.
        if(this.initialParams) {
            o.params = o.params || {};
            Ext.apply(o.params, this.initialParams);
            delete this.initialParams;
        }
        
        this.callParent(arguments);
    }
});/**
 * This is the {@link Ext.data.Model Model} specification for calendar items used by the
 * {@link Extensible.calendar.CalendarPanel CalendarPanel}'s calendar store. If your model fields
 * are named differently you should update the **mapping** configs accordingly.
 * 
 * The only required fields when creating a new calendar record instance are CalendarId and
 * Title.  All other fields are either optional or will be defaulted if blank.
 * 
 * Here is a basic example for how to create a new record of this type:
 *		rec = new Extensible.calendar.data.CalendarModel({
 *			CalendarId: 5,
 *			Title: 'My Holidays',
 *			Description: 'My personal holiday schedule',
 *			ColorId: 3
 *      });
 * 
 * If you have overridden any of the record's data mappings via the {@link Extensible.calendar.data.CalendarMappings CalendarMappings} object,
 * you may need to set the values using this alternate syntax to ensure that the fields match up correctly:
 *		var M = Extensible.calendar.data.CalendarMappings;
 *			rec = new Extensible.calendar.data.CalendarModel();
 *			rec.data[M.CalendarId.name] = 5;
 *			rec.data[M.Title.name] = 'My Holidays';
 *			rec.data[M.Description.name] = 'My personal holiday schedule';
 *			rec.data[M.ColorId.name] = 3;
 */
Ext.define('Extensible.calendar.data.CalendarModel', {
    extend: 'Extensible.data.Model',
    
    requires: [
        'Extensible.calendar.data.CalendarMappings'
    ],
    
    mappingClass: 'Extensible.calendar.data.CalendarMappings',
    
    mappingIdProperty: 'CalendarId'
    
},
function() {
    this.reconfigure();
});/*
 * A simple reusable store that loads static calendar field definitions into memory
 * and can be bound to the CalendarCombo widget and used for calendar color selection.
 */
Ext.define('Extensible.calendar.data.MemoryCalendarStore', {
    extend: 'Ext.data.Store',
    model: 'Extensible.calendar.data.CalendarModel',
    
    requires: [
        'Ext.data.proxy.Memory',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'Extensible.calendar.data.CalendarModel',
        'Extensible.calendar.data.CalendarMappings'
    ],
    
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'calendars'
        },
        writer: {
            type: 'json'
        }
    },

    autoLoad: true,
    
    initComponent: function() {
        this.sorters = this.sorters || [{
            property: Extensible.calendar.data.CalendarMappings.Title.name,
            direction: 'ASC'
        }];
        
        this.idProperty = this.idProperty || Extensible.calendar.data.CalendarMappings.CalendarId.name || 'id';
        
        this.fields = Extensible.calendar.data.CalendarModel.prototype.fields.getRange();
        
        this.callParent(arguments);
    }
});/*
 * This is a simple in-memory store implementation that is ONLY intended for use with
 * calendar samples running locally in the browser with no external data source. Under
 * normal circumstances, stores that use a MemoryProxy are read-only and intended only
 * for displaying data read from memory. In the case of the calendar, it's still quite
 * useful to be able to deal with in-memory data for sample purposes (as many people
 * may not have PHP set up to run locally), but by default, updates will not work since the
 * calendar fully expects all CRUD operations to be supported by the store (and in fact
 * will break, for example, if phantom records are not removed properly). This simple
 * class gives us a convenient way of loading and updating calendar event data in memory,
 * but should NOT be used outside of the local samples.
 *
 * For a real-world store implementation see the remote sample (remote.js).
 */
Ext.define('Extensible.calendar.data.MemoryEventStore', {
    extend: 'Ext.data.Store',
    model: 'Extensible.calendar.data.EventModel',

    requires: [
        'Ext.data.proxy.Memory',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'Extensible.calendar.data.EventModel',
        'Extensible.calendar.data.EventMappings'
    ],

    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'evts'
        },
        writer: {
            type: 'json'
        }
    },
    
    // Since we are faking persistence in memory, we also have to fake our primary
    // keys for things to work consistently. This starting id value will be auto-
    // incremented as records are created:
    idSeed: 2000,

    // private
    constructor: function(config) {
        config = config || {};

        this.callParent(arguments);

        this.sorters = this.sorters || [{
            property: Extensible.calendar.data.EventMappings.StartDate.name,
            direction: 'ASC'
        }];

        this.idProperty = this.idProperty || Extensible.calendar.data.EventMappings.EventId.mapping || 'id';

        this.fields = Extensible.calendar.data.EventModel.prototype.fields.getRange();

        // By default this shared example store will monitor its own CRUD events and
        // automatically show a page-level message for each event. This is simply a shortcut
        // so that each example doesn't have to provide its own messaging code, but this pattern
        // of handling messages at the store level could easily be implemented in an application
        // (see the source of test-app.js for an example of this). The autoMsg config is provided
        // to turn off this automatic messaging in any case where this store is used but the
        // default messaging is not desired.
        if (config.autoMsg !== false) {
            // Note that while the store provides individual add, update and remove events, those only
            // signify that records were added to the store, NOT that your changes were actually
            // persisted correctly in the back end (in remote scenarios). While this isn't an issue
            // with the MemoryProxy since everything is local, it's still harder to work with the
            // individual CRUD events since they have different APIs and quirks (notably the add and
            // update events both fire during record creation and it's difficult to differentiate a true
            // update from an update caused by saving the PK into a newly-added record). Because of all
            // this, in general the 'write' event is the best option for generically messaging after
            // CRUD persistance has actually succeeded.
            this.on('write', this.onWrite, this);
        }

        this.autoMsg = config.autoMsg;
        this.onCreateRecords = Ext.Function.createInterceptor(this.onCreateRecords, this.interceptCreateRecords);
        this.initRecs();
    },

    // private - override to make sure that any records added in-memory
    // still get a unique PK assigned at the data level
    interceptCreateRecords: function(records, operation, success) {
        if (success) {
            var i = 0,
                rec,
                len = records.length;

            for (; i < len; i++) {
                records[i].data[Extensible.calendar.data.EventMappings.EventId.name] = this.idSeed++;
            }
        }
    },

    // If the store started with preloaded inline data, we have to make sure the records are set up
    // properly as valid "saved" records otherwise they may get "added" on initial edit.
    initRecs: function() {
        this.each(function(rec) {
            rec.store = this;
            rec.phantom = false;
        }, this);
    },

    // private
    onWrite: function(store, operation) {
        var me = this;

        if (Extensible.example && Extensible.example.msg) {
            var success = operation.wasSuccessful(),
                rec = operation.records[0],
                title = rec.data[Extensible.calendar.data.EventMappings.Title.name];

            switch (operation.action) {
                case 'create':
                    Extensible.example.msg('Add', 'Added "' + Ext.value(title, '(No title)') + '"');
                    break;
                case 'update':
                    Extensible.example.msg('Update', 'Updated "' + Ext.value(title, '(No title)') + '"');
                    break;
                case 'destroy':
                    Extensible.example.msg('Delete', 'Deleted "' + Ext.value(title, '(No title)') + '"');
                    break;
            }
        }
    },

    // private - override the default logic for memory storage
    onProxyLoad: function(operation) {
        var me = this,
            successful = operation.wasSuccessful(),
            resultSet = operation.getResultSet(),
            records = [];

        if (me.data && me.data.length > 0) {
            // this store has already been initially loaded, so do not reload
            // and lose updates to the store, just use store's latest data
            me.totalCount = me.data.length;
            records = me.data.items;
        }
        else {
            // this is the initial load, so defer to the proxy's result
            if (resultSet) {
                records = resultSet.records;
                me.totalCount = resultSet.total;
            }
            if (successful) {
                me.loadRecords(records, operation);
            }
        }

        me.loading = false;
        me.fireEvent('load', me, records, successful);
    }
});/**
 * This is an internal helper class for the calendar views and should not be overridden.
 * It is responsible for the base event rendering logic underlying all views based on a
 * box-oriented layout that supports day spanning (MonthView, MultiWeekView, DayHeaderView).
 * 
 * @private
 */
Ext.define('Extensible.calendar.util.WeekEventRenderer', {
    
    requires: ['Ext.DomHelper'],
    
    statics: {
        /**
         * Retrieve the event layout table row for the specified week and row index. If
         * the row does not already exist it will get created and appended to the DOM.
         * This method does not check against the max allowed events -- it is the responsibility
         * of calling code to ensure that an event row at the specified index is really needed.
         */
        getEventRow: function(viewId, weekIndex, rowIndex) {
            var indexOffset = 1, //skip the first row with date #'s
                weekRow = Ext.get(viewId + '-wk-' + weekIndex),
                eventRow,
                weekTable;
            
            if (weekRow) {
                weekTable = weekRow.child('.ext-cal-evt-tbl', true);
                eventRow = weekTable.tBodies[0].childNodes[rowIndex + indexOffset];
                
                if (!eventRow) {
                    eventRow = Ext.DomHelper.append(weekTable.tBodies[0], '<tr></tr>');
                }
            }
            return Ext.get(eventRow);
        },
        
        /**
         * Render an individual event
         * @private
         */
        renderEvent: function(event, weekIndex, dayIndex, eventIndex, dayCount, currentDate, renderConfig) {
            var eventMappings = Extensible.calendar.data.EventMappings,
                eventData = event.data || event.event.data,
                startOfWeek = Ext.Date.clone(currentDate),
                endOfWeek = Extensible.Date.add(startOfWeek, {days: dayCount - dayIndex, millis: -1}),
                eventRow = this.getEventRow(renderConfig.viewId, weekIndex, eventIndex),
                eventEndDate = (event.event || event).getEndDate(),
                daysToEventEnd = Extensible.Date.diffDays(currentDate, eventEndDate) + 1,
                // Restrict the max span to the current week only since this is for the cuurent week's markup
                colspan = Math.min(daysToEventEnd, dayCount - dayIndex);
            
            // The view passes a template function to use when rendering the events.
            // These are special data values that get passed back to the template.
            eventData._weekIndex = weekIndex;
            eventData._renderAsAllDay = eventData[eventMappings.IsAllDay.name] || event.isSpanStart;
            eventData.spanLeft = eventData[eventMappings.StartDate.name].getTime() < startOfWeek.getTime();
            eventData.spanRight = eventEndDate.getTime() > endOfWeek.getTime();
            eventData.spanCls = (eventData.spanLeft ? (eventData.spanRight ?
                'ext-cal-ev-spanboth' : 'ext-cal-ev-spanleft') : (eventData.spanRight ? 'ext-cal-ev-spanright' : ''));
            
            var cellConfig = {
                tag: 'td',
                cls: 'ext-cal-ev',
                // This is where the passed template gets processed and the markup returned
                cn: renderConfig.tpl.apply(renderConfig.templateDataFn(eventData))
            };
            
            if (colspan > 1) {
                cellConfig.colspan = colspan;
            }
            Ext.DomHelper.append(eventRow, cellConfig);
        },
        
        /**
         * Events are collected into a big multi-dimensional array in the view, then passed here
         * for rendering. The event grid consists of an array of weeks (1-n), each of which contains an
         * array of days (1-7), each of which contains an array of events and span placeholders (0-n).
         * @param {Object} o An object containing all of the supported config options (see
         * Extensible.calendar.view.Month.renderItems() to see what gets passed).
         * @private
         */
        render: function(config) {
            // var-apalooza ;) since we're looping a lot, minimize initial declarations
            var me = this,
                spaceChar = '&#160;',
                weekIndex = 0,
                eventGrid = config.eventGrid,
                currentDate = Ext.Date.clone(config.viewStart),
                currentDateString = '',
                eventTpl = config.tpl,
                maxEventsPerDay = config.maxEventsPerDay !== undefined ? config.maxEventsPerDay : 999,
                weekCount = config.weekCount < 1 ? 6 : config.weekCount,
                dayCount = config.weekCount === 1 ? config.dayCount : 7,
                eventRow,
                dayIndex,
                weekGrid,
                eventIndex,
                skippedEventCount,
                dayGrid,
                eventCount,
                currentEvent,
                cellConfig,
                eventData;
            
            // Loop through each week in the overall event grid
            for (; weekIndex < weekCount; weekIndex++) {
                dayIndex = 0;
                weekGrid = eventGrid[weekIndex];
                
                // Loop through each day in the current week grid
                for (; dayIndex < dayCount; dayIndex++) {
                    currentDateString = Ext.Date.format(currentDate, 'Ymd');
                    
                    // Make sure there is actually a day to process events for first
                    if (weekGrid && weekGrid[dayIndex]) {
                        eventIndex = 0;
                        skippedEventCount = 0;
                        dayGrid = weekGrid[dayIndex];
                        eventCount = dayGrid.length;
                        
                        // Loop through each event in the current day grid. Note that this grid can
                        // also contain placeholders representing segments of spanning events, though
                        // for simplicity's sake these will all be referred to as "events" in comments.
                        for (; eventIndex < eventCount; eventIndex++) {
                            if (!dayGrid[eventIndex]) {
                                // There is no event at the current index
                                if (eventIndex >= maxEventsPerDay) {
                                    // We've already hit the max count of displayable event rows, so
                                    // skip adding any additional empty row markup. In this case, since
                                    // there is no event we don't track it as a skipped event as below.
                                    continue;
                                }
                                // Insert an empty TD since there is no event at this index
                                eventRow = me.getEventRow(config.viewId, weekIndex, eventIndex);
                                Ext.DomHelper.append(eventRow, {
                                    tag: 'td',
                                    cls: 'ext-cal-ev',
                                    html: spaceChar,
                                    //style: 'outline: 1px solid red;', // helpful for debugging
                                    id: config.viewId + '-empty-' + eventCount + '-day-' + currentDateString
                                });
                            }
                            else {
                                if (eventIndex >= maxEventsPerDay) {
                                    // We've hit the max count of displayable event rows, but since there
                                    // is an event at the current index we have to track the count of events
                                    // that aren't being rendered so that we can provide the proper count
                                    // when displaying the "more events" link below.
                                    skippedEventCount++;
                                    continue;
                                }
                                currentEvent = dayGrid[eventIndex];
                                
                                // We only want to insert the markup for an event that does not span days, or
                                // if it does span, only for the initial instance (not any of its placeholders
                                // in the event grid, which are there only to reserve the space in the layout).
                                if (!currentEvent.isSpan || currentEvent.isSpanStart) {
                                    me.renderEvent(currentEvent, weekIndex, dayIndex, eventIndex,
                                        dayCount, currentDate, config);
                                }
                            }
                        }
                        
                        // We're done processing all of the events for the current day. Time to insert the
                        // "more events" link or the last empty TD for the day, if needed.
                        
                        if (skippedEventCount > 0) {
                            // We hit one or more events in the grid that could not be displayed since the max
                            // events per day count was exceeded, so add the "more events" link.
                            eventRow = me.getEventRow(config.viewId, weekIndex, maxEventsPerDay);
                            Ext.DomHelper.append(eventRow, {
                                tag: 'td',
                                cls: 'ext-cal-ev-more',
                                //style: 'outline: 1px solid blue;', // helpful for debugging
                                id: 'ext-cal-ev-more-' + Ext.Date.format(currentDate, 'Ymd'),
                                cn: {
                                    tag: 'a',
                                    html: Ext.String.format(config.getMoreText(skippedEventCount), skippedEventCount)
                                }
                            });
                        }
                        else if (eventCount < config.evtMaxCount[weekIndex]) {
                            // We did NOT hit the max event count, meaning that we are now left with a gap in
                            // the layout table which we need to fill with one last empty TD.
                            eventRow = me.getEventRow(config.viewId, weekIndex, eventCount);
                            if (eventRow) {
                                cellConfig = {
                                    tag: 'td',
                                    cls: 'ext-cal-ev',
                                    html: spaceChar,
                                    //style: 'outline: 1px solid green;', // helpful for debugging
                                    id: config.viewId + '-empty-' + (eventCount + 1) + '-day-' + currentDateString
                                };
                                
                                // It's easy to determine at this point how many extra rows are needed, so
                                // just add a rowspan rather than multiple dummy TDs if needed.
                                var rowspan = config.evtMaxCount[weekIndex] - eventCount;
                                if (rowspan > 1) {
                                    cellConfig.rowspan = rowspan;
                                }
                                Ext.DomHelper.append(eventRow, cellConfig);
                            }
                        }
                        // Else the event count for the current day equals the max event count, so the current
                        // day is completely filled up with no additional placeholder markup needed.
                    }
                    else {
                        // There are no events for the current day, so no need to go through all the logic
                        // above -- simply append an empty TD spanning the total row count for the week.
                        eventRow = me.getEventRow(config.viewId, weekIndex, 0);
                        if (eventRow) {
                            cellConfig = {
                                tag: 'td',
                                cls: 'ext-cal-ev',
                                html: spaceChar,
                                //style: 'outline: 1px solid purple;', // helpful for debugging
                                id: config.viewId + '-empty-day-' + currentDateString
                            };
                            
                            if (config.evtMaxCount[weekIndex] > 1) {
                                cellConfig.rowspan = config.evtMaxCount[weekIndex];
                            }
                            Ext.DomHelper.append(eventRow, cellConfig);
                        }
                    }
                    
                    // Move to the next date and restart the loop
                    currentDate = Extensible.Date.add(currentDate, {days: 1});
                }
            }
        }
    }
});/**
 * A custom combo used for choosing from the list of available calendars to assign an event to. You must
 * pass a populated calendar store as the store config or the combo will not work.
 * 
 * This is pretty much a standard combo that is simply pre-configured for the options needed by the
 * calendar components. The default configs are as follows:
 *		fieldLabel: 'Calendar',
 *		triggerAction: 'all',
 *		queryMode: 'local',
 *		forceSelection: true,
 *		width: 200
 */
Ext.define('Extensible.calendar.form.field.CalendarCombo', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.extensible.calendarcombo',
    
    requires: ['Extensible.calendar.data.CalendarMappings'],
    
    fieldLabel: 'Calendar',
    triggerAction: 'all',
    queryMode: 'local',
    forceSelection: true,
    selectOnFocus: true,
    
    defaultCls: 'x-cal-default',
    hiddenCalendarCls: 'ext-cal-hidden',
    
    initComponent: function() {
        this.valueField = Extensible.calendar.data.CalendarMappings.CalendarId.name;
        this.displayField = Extensible.calendar.data.CalendarMappings.Title.name;
    
        this.listConfig = Ext.apply(this.listConfig || {}, {
            getInnerTpl: this.getListItemTpl
        });
        
        this.store.on('update', this.refreshColorCls, this);
        
        this.callParent(arguments);
    },
    
    getListItemTpl: function(displayField) {
        return '<div class="x-combo-list-item x-cal-{' + Extensible.calendar.data.CalendarMappings.ColorId.name +
                '}"><div class="ext-cal-picker-icon">&#160;</div>{' + displayField + '}</div>';
    },
    
    afterRender: function() {
        this.callParent(arguments);
        
        this.wrap = this.el.down('.x-form-item-body');
        this.wrap.addCls('ext-calendar-picker');
        
        this.icon = Ext.core.DomHelper.append(this.wrap, {
            tag: 'div', cls: 'ext-cal-picker-icon ext-cal-picker-mainicon'
        });
    },
    
    /* @private
     * Refresh the color CSS class based on the current field value
     */
    refreshColorCls: function() {
        var me = this,
            calendarMappings = Extensible.calendar.data.CalendarMappings,
            colorCls = '',
            value = me.getValue();
        
        if (!me.wrap) {
            return me;
        }
        if (me.currentStyleClss !== undefined) {
            me.wrap.removeCls(me.currentStyleClss);
        }
        
        if (!Ext.isEmpty(value)) {
            if (Ext.isArray(value)) {
                value = value[0];
            }
            if (!value.data) {
                // this is a calendar id, need to get the record first then use its color
                value = this.store.findRecord(calendarMappings.CalendarId.name, value);
            }
            colorCls = 'x-cal-' + (value.data ? value.data[calendarMappings.ColorId.name] : value);
        }
        
        me.currentStyleClss = colorCls;
        
//        if (value && value.data && value.data[calendarMappings.IsHidden.name] === true) {
//            colorCls += ' ' + me.hiddenCalendarCls;
//        }
        me.wrap.addCls(colorCls);
        
        return me;
    },
    
    /**
     * @protected 
     */
    setValue: function(value) {
        if (!value && this.store.getCount() > 0) {
            // ensure that a valid value is always set if possible
            value = this.store.getAt(0).data[Extensible.calendar.data.CalendarMappings.CalendarId.name];
        }
        
        this.callParent(arguments);
        
        this.refreshColorCls();
    }
});/**
 * A combination field that includes start and end dates and times, as well as an optional all-day checkbox.
 */
Ext.define('Extensible.form.field.DateRange', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.extensible.daterangefield',
    
    requires: [
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.Label',
        'Ext.form.field.Checkbox'
    ],
    
    /**
     * @cfg {String} toText
     * The text to display in between the date/time fields (defaults to 'to')
     */
    toText: 'to',
    /**
     * @cfg {String} allDayText
     * The text to display as the label for the all day checkbox (defaults to 'All day')
     */
    allDayText: 'All day',
    /**
     * @cfg {String/Boolean} singleLine
     * <tt>true</tt> to render the fields all on one line, <tt>false</tt> to break the start
     * date/time and end date/time into two stacked rows of fields to preserve horizontal space
     * (defaults to <tt>true</tt>).
     */
    singleLine: true,
    /*
     * @cfg {Number} singleLineMinWidth -- not currently used
     * If {@link singleLine} is set to 'auto' it will use this value to determine whether to render the field on one
     * line or two. This value is the approximate minimum width required to render the field on a single line, so if
     * the field's container is narrower than this value it will automatically be rendered on two lines.
     */
    //singleLineMinWidth: 490,
    /**
     * @cfg {String} dateFormat
     * The date display format used by the date fields (defaults to 'n/j/Y')
     */
    dateFormat: 'j/n/y',
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,

    fieldLayout: {
        type: 'hbox',
        defaultMargins: { top: 0, right: 5, bottom: 0, left: 0 }
    },
    
    initComponent: function() {
        var me = this;
        /**
         * @cfg {String} timeFormat
         * The time display format used by the time fields. By default the DateRange uses the
         * {@link Extensible.Date.use24HourTime} setting and sets the format to 'g:i A' for 12-hour time (e.g., 1:30 PM)
         * or 'G:i' for 24-hour time (e.g., 13:30). This can also be overridden by a static format string if desired.
         */
        me.timeFormat = me.timeFormat || (Extensible.Date.use24HourTime ? 'G:i' : 'g:i A');
        
        me.addCls('ext-dt-range');
        
        if (me.singleLine) {
            me.layout = me.fieldLayout;
            me.items = me.getFieldConfigs();
        }
        else {
            me.items = [{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getStartDateConfig(),
                    me.getStartTimeConfig(),
                    me.getDateSeparatorConfig()
                ]
            },{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getEndDateConfig(),
                    me.getEndTimeConfig(),
                    me.getAllDayConfig()
                ]
            }];
        }
        
        me.callParent(arguments);
        me.initRefs();
    },
    
    initRefs: function() {
        var me = this;
        me.startDate = me.down('#' + me.id + '-start-date');
        me.startTime = me.down('#' + me.id + '-start-time');
        me.endTime = me.down('#' + me.id + '-end-time');
        me.endDate = me.down('#' + me.id + '-end-date');
        me.allDay = me.down('#' + me.id + '-allday');
        me.toLabel = me.down('#' + me.id + '-to-label');
    },
    
    getFieldConfigs: function() {
        var me = this;
        return [
            me.getStartDateConfig(),
            me.getStartTimeConfig(),
            me.getDateSeparatorConfig(),
            me.getEndTimeConfig(),
            me.getEndDateConfig(),
            me.getAllDayConfig()
        ];
    },
    
    getLayoutItems: function(singleLine) {
        var me = this;
        return singleLine ? me.items.items : [[
            me.startDate, me.startTime, me.toLabel
        ],[
            me.endDate, me.endTime, me.allDay
        ]];
    },
    
    getStartDateConfig: function() {
        return {
            xtype: 'datefield',
            id: this.id + '-start-date',
            format: this.dateFormat,
            width: 100,
            startDay: this.startDay,
            listeners: {
                'change': {
                    fn: function() {
                        this.onFieldChange('date', 'start');
                    },
                    scope: this
                }
            }
        };
    },
    
    getStartTimeConfig: function() {
        return {
            xtype: 'timefield',
            id: this.id + '-start-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            width: 90,
            format: this.timeFormat,
            listeners: {
                'select': {
                    fn: function() {
                        this.onFieldChange('time', 'start');
                    },
                    scope: this
                }
            }
        };
    },
    
    getEndDateConfig: function() {
        return {
            xtype: 'datefield',
            id: this.id + '-end-date',
            format: this.dateFormat,
            hideLabel: true,
            width: 100,
            startDay: this.startDay,
            listeners: {
                'change': {
                    fn: function() {
                        this.onFieldChange('date', 'end');
                    },
                    scope: this
                }
            }
        };
    },
    
    getEndTimeConfig: function() {
        return {
            xtype: 'timefield',
            id: this.id + '-end-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            width: 90,
            format: this.timeFormat,
            listeners: {
                'select': {
                    fn: function() {
                        this.onFieldChange('time', 'end');
                    },
                    scope: this
                }
            }
        };
    },
    
    getAllDayConfig: function() {
        return {
            xtype: 'checkbox',
            id: this.id + '-allday',
            hidden: this.showTimes === false || this.showAllDay === false,
            boxLabel: this.allDayText,
            margins: { top: 2, right: 5, bottom: 0, left: 0 },
            handler: this.onAllDayChange,
            scope: this
        };
    },
    
    onAllDayChange: function(chk, checked) {
        this.startTime.setVisible(!checked);
        this.endTime.setVisible(!checked);
    },
    
    getDateSeparatorConfig: function() {
        return {
            xtype: 'label',
            id: this.id + '-to-label',
            text: this.toText,
            margins: { top: 4, right: 5, bottom: 0, left: 0 }
        };
    },
    
    isSingleLine: function() {
        var me = this;
        
        if (me.calculatedSingleLine === undefined) {
            if(me.singleLine === 'auto') {
                var ownerCtEl = me.ownerCt.getEl(),
                    w = me.ownerCt.getWidth() - ownerCtEl.getPadding('lr'),
                    el = ownerCtEl.down('.x-panel-body');
                    
                if(el) {
                    w -= el.getPadding('lr');
                }
                
                el = ownerCtEl.down('.x-form-item-label');
                
                if(el) {
                    w -= el.getWidth() - el.getPadding('lr');
                }
                me.calculatedSingleLine = w <= me.singleLineMinWidth ? false : true;
            }
            else {
                me.calculatedSingleLine = me.singleLine !== undefined ? me.singleLine : true;
            }
        }
        return me.calculatedSingleLine;
    },
    
    onFieldChange: function(type, startend) {
        this.checkDates(type, startend);
        this.fireEvent('change', this, this.getValue());
    },
        
    checkDates: function(type, startend) {
        var me = this,
            typeCap = type === 'date' ? 'Date' : 'Time',
            startField = this['start' + typeCap],
            endField = this['end' + typeCap],
            startValue = me.getDT('start'),
            endValue = me.getDT('end');

        if(startValue > endValue) {
            if(startend === 'start') {
                endField.setValue(startValue);
            }else{
                startField.setValue(endValue);
                me.checkDates(type, 'start');
            }
        }
        if(type === 'date') {
            me.checkDates('time', startend);
        }
    },
    
    /**
     * Returns an array containing the following values in order:
     * 
     *	* **<tt>DateTime</tt>**
     *		* The start date/time
     *	* **<tt>DateTime</tt>**
     *		* The end date/time
     *	* **<tt>Boolean</tt>**
     *		* True if the dates are all-day, false if the time values should be used
     * @return {Array} The array of return values
     */
    getValue: function() {
        return [
            this.getDT('start'),
            this.getDT('end'),
            this.allDay.getValue()
        ];
    },
    
    // getValue helper
    getDT: function(startend) {
        var time = this[startend+'Time'].getValue(),
            dt = this[startend+'Date'].getValue();
            
        if(Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, this[startend + 'Date'].format);
        }
        else{
            return null;
        }
        
        if(time && time !== '') {
            time = Ext.Date.format(time, this[startend+'Time'].format);
            var val = Ext.Date.parseDate(dt + ' ' + time, this[startend+'Date'].format + ' ' + this[startend+'Time'].format);
            return val;
            //return Ext.Date.parseDate(dt+' '+time, this[startend+'Date'].format+' '+this[startend+'Time'].format);
        }
        return Ext.Date.parseDate(dt, this[startend+'Date'].format);
        
    },
    
    /**
     * Sets the values to use in the date range.
     * @param {Array/Date/Object} v The value(s) to set into the field. Valid types are as follows:
     * 
     *	* **<tt>Array</tt>**
     *		* An array containing, in order, a start date, end date, and all-day flag. This array should exactly match the return type as specified by {@link #getValue}.
     *	* **<tt>DateTime</tt>**
     *		* A single Date object, which will be used for both the start and end dates in the range. The all-day flag will be defaulted to false.
     *	* **<tt>Object</tt>**
     *		* An object containing properties for StartDate, EndDate and IsAllDay as defined in {@link Extensible.calendar.data.EventMappings}.
     */
    setValue: function(v) {
        if(!v) {
            return;
        }
        var me = this,
            eventMappings = Extensible.calendar.data.EventMappings,
            startDateName = eventMappings.StartDate.name;
            
        if(Ext.isArray(v)) {
            me.setDT(v[0], 'start');
            me.setDT(v[1], 'end');
            me.allDay.setValue(!!v[2]);
        }
        else if(Ext.isDate(v)) {
            me.setDT(v, 'start');
            me.setDT(v, 'end');
            me.allDay.setValue(false);
        }
        else if(v[startDateName]) { //object
            me.setDT(v[startDateName], 'start');
            if(!me.setDT(v[eventMappings.EndDate.name], 'end')) {
                me.setDT(v[startDateName], 'end');
            }
            me.allDay.setValue(!!v[eventMappings.IsAllDay.name]);
        }
    },
    
    // setValue helper
    setDT: function(dt, startend) {
        if(dt && Ext.isDate(dt)) {
            this[startend + 'Date'].setValue(dt);
            this[startend + 'Time'].setValue(Ext.Date.format(dt, this[startend + 'Time'].format));
            return true;
        }
    },
    
    /**
     * @protected 
     */
    isDirty: function() {
        var dirty = false;
        if(this.rendered && !this.disabled) {
            this.items.each(function(item) {
                if (item.isDirty()) {
                    dirty = true;
                    return false;
                }
            });
        }
        return dirty;
    },
    
    /**
     * @protected 
     */
    reset: function() {
        this.delegateFn('reset');
    },
    
    delegateFn: function(fn) {
        this.items.each(function(item) {
            if (item[fn]) {
                item[fn]();
            }
        });
    },
    
    beforeDestroy: function() {
        Ext.destroy(this.fieldCt);
        this.callParent(arguments);
    },
    
    /**
     * @method getRawValue
     * @hide
     */
    getRawValue: Ext.emptyFn,
    /**
     * @method setRawValue
     * @hide
     */
    setRawValue: Ext.emptyFn
});/**
 * A custom combo used for choosing a reminder setting for an event.
 * 
 * This is pretty much a standard combo that is simply pre-configured for the options needed by the
 * calendar components. The default configs are as follows:
 *		width: 200,
 *		fieldLabel: 'Reminder',
 *		queryMode: 'local',
 *		triggerAction: 'all',
 *		forceSelection: true,
 *		displayField: 'desc',
 *		valueField: 'value',
 *		noneText: 'None',
 *		atStartTimeText: 'At start time',
 *		reminderValueFormat: '{0} {1} before start'
 * To customize the descriptions in the dropdown list override the following methods:
 * {@link #getMinutesText}, {@link #getHoursText}, {@link #getDaysText} and {@link #getWeeksText}.
 */
Ext.define('Extensible.calendar.form.field.ReminderCombo', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.extensible.remindercombo',
    
    requires: ['Ext.data.ArrayStore'],
    
    fieldLabel: 'Reminder',
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    displayField: 'desc',
    valueField: 'value',
    noneText: 'None',
    atStartTimeText: 'At start time',
    reminderValueFormat: '{0} {1} before start',
    
    // the following are all deprecated in favor of the corresponding get* template methods.
    // they are still here only for backwards-compatibility and will be removed in a future release.
    minutesText: 'minutes',
    hourText: 'hour',
    hoursText: 'hours',
    dayText: 'day',
    daysText: 'days',
    weekText: 'week',
    weeksText: 'weeks',
    
    initComponent: function() {
        this.store = this.store || Ext.create('Ext.data.ArrayStore', {
            fields: ['value', 'desc'],
            idIndex: 0,
            data: this.getValueList()
        });
        
        this.callParent(arguments);
    },
    
    /**
     * Returns the list of reminder values used as the contents of the combo list. This method is provided so that
     * the value list can be easily overridden as needed.
     * @return {Array} A 2-dimensional array of type [{String}, {String}] which contains the value and description
     * respectively of each item in the combo list. By default the value is the number of minutes for the selected
     * time value (e.g., value 120 == '2 hours') with empty string for no value, but these can be set to anything.
     */
    getValueList: function() {
        var me = this,
            fmt = me.reminderValueFormat,
            stringFormat = Ext.String.format;
            
        return [
            ['', me.noneText],
            ['0', me.atStartTimeText],
            ['5', stringFormat(fmt, '5', me.getMinutesText(5))],
            ['15', stringFormat(fmt, '15', me.getMinutesText(15))],
            ['30', stringFormat(fmt, '30', me.getMinutesText(30))],
            ['60', stringFormat(fmt, '1', me.getHoursText(1))],
            ['90', stringFormat(fmt, '1.5', me.getHoursText(1.5))],
            ['120', stringFormat(fmt, '2', me.getHoursText(2))],
            ['180', stringFormat(fmt, '3', me.getHoursText(3))],
            ['360', stringFormat(fmt, '6', me.getHoursText(6))],
            ['720', stringFormat(fmt, '12', me.getHoursText(12))],
            ['1440', stringFormat(fmt, '1', me.getDaysText(1))],
            ['2880', stringFormat(fmt, '2', me.getDaysText(2))],
            ['4320', stringFormat(fmt, '3', me.getDaysText(3))],
            ['5760', stringFormat(fmt, '4', me.getDaysText(4))],
            ['7200', stringFormat(fmt, '5', me.getDaysText(5))],
            ['10080', stringFormat(fmt, '1', me.getWeeksText(1))],
            ['20160', stringFormat(fmt, '2', me.getWeeksText(2))]
        ];
    },
    
    /**
     * Returns the unit text to use for a reminder that has a specified number of minutes
     * prior to the due time (defaults to 'minute' when the passed value === 1, else 'minutes').
     * @param {Number} numMinutes The number of minutes prior to the due time
     * @return {String} The unit text
     */
    getMinutesText: function(numMinutes) {
        return numMinutes === 1 ? this.minuteText : this.minutesText;
    },
    /**
     * Returns the unit text to use for a reminder that has a specified number of hours
     * prior to the due time (defaults to 'hour' when the passed value === 1, else 'hours').
     * @param {Number} numHours The number of hours prior to the due time
     * @return {String} The unit text
     */
    getHoursText: function(numHours) {
        return numHours === 1 ? this.hourText : this.hoursText;
    },
    /**
     * Returns the unit text to use for a reminder that has a specified number of days
     * prior to the due time (defaults to 'day' when the passed value === 1, else 'days').
     * @param {Number} numDays The number of days prior to the due time
     * @return {String} The unit text
     */
    getDaysText: function(numDays) {
        return numDays === 1 ? this.dayText : this.daysText;
    },
    /**
     * Returns the unit text to use for a reminder that has a specified number of weeks
     * prior to the due time (defaults to 'week' when the passed value === 1, else 'weeks').
     * @param {Number} numWeeks The number of weeks prior to the due time
     * @return {String} The unit text
     */
    getWeeksText: function(numWeeks) {
        return numWeeks === 1 ? this.weekText : this.weeksText;
    },
    
    /**
     * @protected 
     */
    initValue: function() {
        if(this.value !== undefined) {
            this.setValue(this.value);
        }
        else{
            this.setValue('');
        }
        this.originalValue = this.getValue();
    }
});/**
 * Simple color picker class for choosing colors specifically for calendars. This is a lightly modified version
 * of the default Ext color picker that is based on calendar ids rather than hex color codes so that the colors
 * can be easily modified via CSS and automatically applied to calendars. The specific colors used by default are
 * also chosen to provide good color contrast when displayed in calendars.
 */
Ext.define('Extensible.calendar.util.ColorPicker', {
    extend: 'Ext.picker.Color',
    alias: 'widget.extensible.calendarcolorpicker',
    
    requires: ['Ext.XTemplate'],
    
    colorCount: 32,
    
    /**
     * @cfg {Function} handler
     * Optional. A function that will handle the select event of this color picker.
     * The handler is passed the following parameters:
     * 
     *	* picker : *ColorPicker* 
     *		* The picker instance.
     *	* colorId : *String* 
     *		* The id that identifies the selected color and relates it to a calendar.
     */
    
    constructor: function() {
        this.renderTpl = [
            '<tpl for="colors">',
                '<a href="#" class="x-cal-{.}" hidefocus="on">',
                    '<em><span unselectable="on">&#160;</span></em>',
                '</a>',
            '</tpl>'
        ];
        
        this.callParent(arguments);
    },
    
    initComponent: function() {
        this.callParent(arguments);
        
        this.addCls('x-calendar-palette');
            
        if(this.handler) {
            this.on('select', this.handler, this.scope || this, {
                delegate: 'a'
            });
        }
        
        this.colors = [];
        for (var i=1; i<=this.colorCount; i++) {
            this.colors.push(i);
        }
    },
    
    handleClick: function(e, target) {
        e.preventDefault();
        
        var classNames = target.className.split(' '),
            colorId;
        
        Ext.each(classNames, function(className) {
            if (className.indexOf('x-cal-') > -1) {
                colorId = className.split('x-cal-')[1];
                return false;
            }
        });
        if (colorId) {
            this.select(colorId);
        }
    },
    
    /**
     * Selects the specified color in the palette (fires the {@link #select} event)
     * @param {Number} colorId The id that identifies the selected color and relates it to a calendar
     * @param {Boolean} suppressEvent (optional) True to stop the select event from firing. Defaults to <tt>false</tt>.
     */
    select: function(colorId, suppressEvent) {
        var me = this,
            selectedCls = me.selectedCls,
            value = me.value;
            
        if (!me.rendered) {
            me.value = colorId;
            return;
        }
        
        if (colorId !== value || me.allowReselect) {
            var el = me.el;

            if (me.value) {
                el.down('.x-cal-' + value).removeCls(selectedCls);
            }
            el.down('.x-cal-' + colorId).addCls(selectedCls);
            me.value = colorId;
            
            if (suppressEvent !== true) {
                me.fireEvent('select', me, colorId);
            }
        }
    }
});/**
 * A menu containing a {@link Extensible.calendar.util.ColorPicker color picker} for choosing
 * calendar colors, as well as other calendar-specific options.
 * 
 * @private
 */
Ext.define('Extensible.calendar.gadget.CalendarListMenu', {
    extend: 'Ext.menu.Menu',
    alias: 'widget.extensible.calendarlistmenu',
    
    requires: ['Extensible.calendar.util.ColorPicker'],
    
    /**
     * @cfg {Boolean} hideOnClick
     * False to continue showing the menu after a color is selected, defaults to true.
     */
    hideOnClick: true,
    /**
     * @cfg {Boolean} ignoreParentClicks
     * True to ignore clicks on any item in this menu that is a parent item (displays a submenu)
     * so that the submenu is not dismissed when clicking the parent item (defaults to true).
     */
    ignoreParentClicks: true,
    /**
     * @cfg {String} displayOnlyThisCalendarText
     * The text to display for the 'Display only this calendar' option in the menu.
     */
    displayOnlyThisCalendarText: 'Display only this calendar',
    /**
     * @cfg {Number} calendarId
     * The id of the calendar to be associated with this menu. This calendarId will be passed
     * back with any events from this menu to identify the calendar to be acted upon. The calendar
     * id can also be changed at any time after creation by calling {@link setCalendar}.
     */
    
    /**
     * @cfg {Boolean} enableScrolling
     * @hide
     */
    enableScrolling: false,
    /**
     * @cfg {Number} maxHeight
     * @hide
     */
    /**
     * @cfg {Number} scrollIncrement
     * @hide
     */
    /**
     * @event click
     * @hide
     */
    /**
     * @event itemclick
     * @hide
     */
    
    /**
     * @property palette
     * @type ColorPicker
     * The {@link Extensible.calendar.util.ColorPicker ColorPicker} instance for this CalendarListMenu
     */
    
    initComponent: function() {
        this.addEvents(
            'showcalendar',
            'hidecalendar',
            'radiocalendar',
            'colorchange'
        );
        
        Ext.apply(this, {
            plain: true,
            items: [{
                text: this.displayOnlyThisCalendarText,
                iconCls: 'extensible-cal-icon-cal-show',
                handler: Ext.bind(this.handleRadioCalendarClick, this)
            }, '-', {
                xtype: 'extensible.calendarcolorpicker',
                id: this.id + '-calendar-color-picker',
                handler: Ext.bind(this.handleColorSelect, this)
            }]
        });
        
        this.addClass('x-calendar-list-menu');
        this.callParent(arguments);
    },
    
    afterRender: function() {
        this.callParent(arguments);
        
        this.palette = this.down('#' + this.id + '-calendar-color-picker');
        
        if(this.colorId) {
            this.palette.select(this.colorId, true);
        }
    },
    
    handleRadioCalendarClick: function(e, t) {
        this.fireEvent('radiocalendar', this, this.calendarId);
    },
    
    handleColorSelect: function(cp, selColorId) {
        this.fireEvent('colorchange', this, this.calendarId, selColorId, this.colorId);
        this.colorId = selColorId;
        this.menuHide();
    },
    
    /**
     * Sets the calendar id and color id to be associated with this menu. This should be called each time the
     * menu is shown relative to a new calendar.
     * @param {Number} calendarId The id of the calendar to be associated
     * @param {Number} colorId The id of the color to be pre-selected in the color palette
     * @return {Extensible.calendar.gadget.CalendarListMenu} this
     */
    setCalendar: function(id, cid) {
        this.calendarId = id;
        this.colorId = cid;
        
        if(this.rendered) {
            this.palette.select(cid, true);
        }
        return this;
    },

    menuHide: function() {
        if(this.hideOnClick) {
            this.hide();
        }
    }
});/**
 * This is a {@link Ext.Panel panel} subclass that renders a list of available calendars.
 * It is not part of the Extensible.calendar.CalendarPanel component, but is instead meant
 * to be displayed somewhere else inside of an application layout.
 */
Ext.define('Extensible.calendar.gadget.CalendarListPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.extensible.calendarlist',
    
    requires: [
        'Ext.XTemplate',
        'Extensible.calendar.gadget.CalendarListMenu'
    ],
    
    title: 'Calendars',
    collapsible: true,
    autoHeight: true,
    layout: 'fit',
    menuSelector: 'em',
    width: 100, // this should be overridden by this container's layout
    
    /**
     * @cfg {Ext.data.Store} store
     * A {@link Ext.data.Store store} containing records of type {@link Extensible.calendar.data.CalendarModel CalendarRecord}.
     * This is a required config and is used to populate the calendar list.  The CalendarList widget will also listen for events from
     * the store and automatically refresh iteself in the event that the underlying calendar records in the store change.
     */
    
    initComponent: function() {
        this.addCls('x-calendar-list');
        this.callParent(arguments);
    },
    
    afterRender: function(ct, position) {
        this.callParent(arguments);
        
        if(this.store) {
            this.setStore(this.store, true);
        }
        this.refresh();
        
        this.body.on('click', this.onClick, this);
        this.body.on('mouseover', this.onMouseOver, this, {delegate: 'li'});
        this.body.on('mouseout', this.onMouseOut, this, {delegate: 'li'});
    },
    
    getListTemplate: function() {
        if(!this.tpl) {
            this.tpl = !(Ext.isIE || Ext.isOpera) ?
                Ext.create('Ext.XTemplate',
                    '<ul class="x-unselectable"><tpl for=".">',
                        '<li id="{cmpId}" class="ext-cal-evr {colorCls} {hiddenCls}">{title}<em>&#160;</em></li>',
                    '</tpl></ul>'
                )
                : Ext.create('Ext.XTemplate',
                    '<ul class="x-unselectable"><tpl for=".">',
                        '<li id="{cmpId}" class="ext-cal-evo {colorCls} {hiddenCls}">',
                            '<div class="ext-cal-evm">',
                                '<div class="ext-cal-evi">{title}<em>&#160;</em></div>',
                            '</div>',
                        '</li>',
                    '</tpl></ul>'
                );
            this.tpl.compile();
        }
        return this.tpl;
    },
    
    /**
     * Sets the store used to display the available calendars. It should contain
     * records of type {@link Extensible.calendar.data.CalendarModel CalendarRecord}.
     * @param {Ext.data.Store} store
     */
    setStore: function(store, initial) {
        if(!initial && this.store) {
            this.store.un("load", this.refresh, this);
            this.store.un("add", this.refresh, this);
            this.store.un("remove", this.refresh, this);
            this.store.un("update", this.onUpdate, this);
            this.store.un("clear", this.refresh, this);
        }
        if(store) {
            store.on("load", this.refresh, this);
            store.on("add", this.refresh, this);
            store.on("remove", this.refresh, this);
            store.on("update", this.onUpdate, this);
            store.on("clear", this.refresh, this);
        }
        this.store = store;
    },
    
    onUpdate: function(ds, rec, operation) {
        // ignore EDIT notifications, only refresh after a commit
        if(operation === Ext.data.Record.COMMIT) {
            this.refresh();
        }
    },
    
    /**
     * Refreshes the calendar list so that it displays based on the most current state of
     * the underlying calendar store. Usually this method does not need to be called directly
     * as the control is automatically bound to the store's events, but it is available in the
     * event that a manual refresh is ever needed.
     */
    refresh: function() {
        if(this.skipRefresh) {
            return;
        }
        var data = [], i = 0, o = null,
            CM = Extensible.calendar.data.CalendarMappings,
            recs = this.store.getRange(),
            len = recs.length;
            
        for (; i < len; i++) {
            o = {
                cmpId: this.id + '__' + recs[i].data[CM.CalendarId.name],
                title: recs[i].data[CM.Title.name],
                colorCls: this.getColorCls(recs[i].data[CM.ColorId.name])
            };
            if(recs[i].data[CM.IsHidden.name] === true) {
                o.hiddenCls = 'ext-cal-hidden';
            }
            data[data.length] = o;
        }
        this.getListTemplate().overwrite(this.body, data);
    },
    
    getColorCls: function(colorId) {
        return 'x-cal-'+colorId+'-ad';
    },
    
    toggleCalendar: function(id, commit) {
        var rec = this.store.findRecord(Extensible.calendar.data.CalendarMappings.CalendarId.name, id),
            CM = Extensible.calendar.data.CalendarMappings,
            isHidden = rec.data[CM.IsHidden.name];
        
        rec.set(CM.IsHidden.name, !isHidden);
        
        if(commit !== false) {
            rec.commit();
        }
    },
    
    showCalendar: function(id, commit) {
        var rec = this.store.findRecord(Extensible.calendar.data.CalendarMappings.CalendarId.name, id);
        if(rec.data[Extensible.calendar.data.CalendarMappings.IsHidden.name] === true) {
            this.toggleCalendar(id, commit);
        }
    },
    
    hideCalendar: function(id, commit) {
        var rec = this.store.findRecord(Extensible.calendar.data.CalendarMappings.CalendarId.name, id);
        if(rec.data[Extensible.calendar.data.CalendarMappings.IsHidden.name] !== true) {
            this.toggleCalendar(id, commit);
        }
    },
    
    radioCalendar: function(id) {
        var i = 0, recId,
            calendarId = Extensible.calendar.data.CalendarMappings.CalendarId.name,
            recs = this.store.getRange(),
            len = recs.length;
            
        for (; i < len; i++) {
            recId = recs[i].data[calendarId];
            // make a truthy check so that either numeric or string ids can match
            if(recId === id) {
                this.showCalendar(recId, false);
            }
            else{
                this.hideCalendar(recId, false);
            }
        }
        
        // store.commitChanges() just loops over each modified record and calls rec.commit(),
        // which in turns fires an update event that would cause a full refresh for each record.
        // To avoid this we simply set a flag and make sure we only refresh once per commit set.
        this.skipRefresh = true;
        this.store.sync();
        delete this.skipRefresh;
        this.refresh();
    },

    onMouseOver: function(e, t) {
        Ext.fly(t).addCls('hover');
    },

    onMouseOut: function(e, t) {
        Ext.fly(t).removeCls('hover');
    },

    getCalendarId: function(el) {
        return el.id.split('__')[1];
    },

    getCalendarItemEl: function(calendarId) {
        return Ext.get(this.id+'__'+calendarId);
    },

    onClick: function(e, t) {
        var el = e.getTarget(this.menuSelector, 3, true);
        
        if (el) {
            this.showEventMenu(el, e.getXY());
        }
        else {
            el = e.getTarget('li', 3, true);
            
            if (el) {
                this.toggleCalendar(this.getCalendarId(el));
            }
        }
    },

    handleColorChange: function(menu, id, colorId, origColorId) {
        var rec = this.store.findRecord(Extensible.calendar.data.CalendarMappings.CalendarId.name, id);
        rec.data[Extensible.calendar.data.CalendarMappings.ColorId.name] = colorId;
        rec.commit();
    },

    handleRadioCalendar: function(menu, id) {
        this.radioCalendar(id);
    },

    showEventMenu: function(el, xy) {
        var id = this.getCalendarId(el.parent('li')),
            rec = this.store.findRecord(Extensible.calendar.data.CalendarMappings.CalendarId.name, id),
            colorId = rec.data[Extensible.calendar.data.CalendarMappings.ColorId.name];
            
        if(!this.menu) {
            this.menu = Ext.create('Extensible.calendar.gadget.CalendarListMenu');
            this.menu.on('colorchange', this.handleColorChange, this);
            this.menu.on('radiocalendar', this.handleRadioCalendar, this);
        }
        this.menu.setCalendar(id, colorId);
        this.menu.showAt(xy);
    }
});/**
 * The context menu displayed for events in any Extensible.calendar.view.AbstractCalendar subclass.
 */
Ext.define('Extensible.calendar.menu.Event', {
    extend: 'Ext.menu.Menu',
    alias: 'widget.extensible.eventcontextmenu',
    
    requires: ['Ext.menu.DatePicker'],
    
    /**
     * @cfg {Boolean} hideOnClick
     * False to continue showing the menu after a color is selected, defaults to true.
     */
    hideOnClick: true,
    /**
     * @cfg {Boolean} ignoreParentClicks
     * True to ignore clicks on any item in this menu that is a parent item (displays a submenu)
     * so that the submenu is not dismissed when clicking the parent item (defaults to true).
     */
    ignoreParentClicks: true,
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,
    /**
     * @cfg {String} editDetailsText
     * The text to display for the 'Edit Details' option in the menu.
     */
    editDetailsText: 'Edit Details',
    /**
     * @cfg {String} deleteText
     * The text to display for the 'Delete' option in the menu.
     */
    deleteText: 'Delete',
    /**
     * @cfg {String} moveToText
     * The text to display for the 'Move to...' option in the menu.
     */
    moveToText: 'Move to...',
    /**
     * @cfg {String} copyToText
     * The text to display for the copy option in the menu
     */
    copyToText: 'Copy to...',
    /**
     * @cfg {Boolean} enableScrolling
     * @hide
     */
    enableScrolling: false,
    /**
     * @cfg {Number} maxHeight
     * @hide
     */
    /**
     * @cfg {Number} scrollIncrement
     * @hide
     */
    /**
     * @event click
     * @hide
     */
    /**
     * @event itemclick
     * @hide
     */
    /**
     * @cfg ownerCalendarPanel
     * @type Extensible.calendar.CalendarPanel
     * If this menu is hosted inside a {@link Extensible.calendar.CalendarPanel CalendarPanel} this property will reference
     * it. If the menu was created directly outside of a CalendarPanel this property will be null. Read-only.
     */
    ownerCalendarPanel: {},

    initComponent: function() {
        this.addEvents(
            /**
             * @event editdetails
             * Fires when the user selects the option to edit the event details
             * (by default, in an instance of {@link Extensible.calendar.form.EventDetails}. Handling code should
             * transfer the current event record to the appropriate instance of the detailed form by showing
             * the form and calling {@link Extensible.calendar.form.EventDetails#loadRecord loadRecord}.
             * @param {Extensible.calendar.menu.Event} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} that is currently being edited
             * @param {Ext.Element} el The element associated with this context menu
             */
            'editdetails',
            /**
             * @event eventdelete
             * Fires after the user selectes the option to delete an event. Note that this menu does not actually
             * delete the event from the data store. This is simply a notification that the menu option was
             * selected -- it is the responsibility of handling code to perform the deletion and any clean
             * up required.
             * @param {Extensible.calendar.menu.Event} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event to be deleted
             * @param {Ext.Element} el The element associated with this context menu
             */
            'eventdelete',
            /**
             * @event eventmove
             * Fires after the user selects a date in the calendar picker under the "move event" menu option.
             * Note that this menu does not actually update the event in the data store. This is simply a
             * notification that the menu option was selected -- it is the responsibility of handling code
             * to perform the move action and any clean up required.
             * @param {Extensible.calendar.menu.Event} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event to be moved
             * @param {Date} dt The new start date for the event (the existing event start time will be preserved)
             */
            'eventmove',
            /**
             * @event eventcopy
             * Fires after the user selects a date in the calendar picker under the "copy event" menu option.
             * Note that this menu does not actually update the event in the data store. This is simply a
             * notification that the menu option was selected -- it is the responsibility of handling code
             * to perform the copy action.
             * @param {Extensible.calendar.menu.Event} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event to be copied
             * @param {Date} dt The start date for the event copy (the existing event start time will
             * be preserved)
             */
            'eventcopy'
        );
        
        this.buildMenu();
        this.callParent(arguments);
    },
    
    /**
     * Overrideable method intended for customizing the menu items. This should only to be used for overriding
     * or called from a subclass and should not be called directly from application code.
     */
    buildMenu: function() {
        var me = this;
        
        if(me.rendered) {
            return;
        }
        me.dateMenu = Ext.create('Ext.menu.DatePicker', {
            scope: me,
            startDay: me.startDay,
            handler: me.onEventMoveSelected
        });
        me.copyMenu = Ext.create('Ext.menu.DatePicker', {
            scope: me,
            startDay: me.startDay,
            handler: me.onEventCopySelected
        });
        
        Ext.apply(me, {
            items: [{
                text: me.editDetailsText,
                iconCls: 'extensible-cal-icon-evt-edit',
                scope: me,
                handler: function() {
                    me.fireEvent('editdetails', me, me.rec, me.ctxEl);
                }
            },{
                text: me.deleteText,
                iconCls: 'extensible-cal-icon-evt-del',
                scope: me,
                handler: function() {
                    me.fireEvent('eventdelete', me, me.rec, me.ctxEl);
                }
            },'-',{
                text: me.moveToText,
                iconCls: 'extensible-cal-icon-evt-move',
                menu: me.dateMenu
            },{
                text: me.copyToText,
                iconCls: 'extensible-cal-icon-evt-copy',
                menu: me.copyMenu
            }]
        });
    },
    
    onEventMoveSelected: function(datePicker, selectedDate) {
        this.doCopyOrMove(selectedDate, 'move');
    },
    
    onEventCopySelected: function(datePicker, selectedDate) {
        this.doCopyOrMove(selectedDate, 'copy');
    },
    
    doCopyOrMove: function(selectedDate, mode) {
        selectedDate = Extensible.Date.copyTime(
            this.rec.data[Extensible.calendar.data.EventMappings.StartDate.name], selectedDate);
        
        this.fireEvent('event' + mode, this, this.rec, selectedDate);
    },
    
    /**
     * Shows the specified event at the given XY position.
     * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
     * record} for the event
     * @param {Ext.Element} el The element associated with this context menu
     * @param {Array} xy The X & Y [x, y] values for the position at which to show the menu (coordinates
     * are page-based)
     */
    showForEvent: function(rec, el, xy) {
        var me = this,
            startDate = rec.data[Extensible.calendar.data.EventMappings.StartDate.name];
        
        me.rec = rec;
        me.ctxEl = el;
        me.dateMenu.picker.setValue(startDate);
        me.copyMenu.picker.setValue(startDate);
        me.showAt(xy);
    },

    onHide: function() {
        this.callParent(arguments);
    },

    onDestroy: function() {
        delete this.ctxEl;
        this.callParent(arguments);
    }
});/**
 * A custom form used for detailed editing of events.
 * 
 * This is pretty much a standard form that is simply pre-configured for the options needed by the
 * calendar components. It is also configured to automatically bind records of type
 * {@link Extensible.calendar.data.EventModel EventModel} to and from the form.
 * 
 * This form also provides custom events specific to the calendar so that other calendar components can be easily
 * notified when an event has been edited via this component.
 * 
 * The default configs are as follows:
 *		labelWidth: 65,
 *		labelWidthRightCol: 65,
 *		colWidthLeft: '.9',
 *		colWidthRight: '.1',
 *		title: 'Event Form',
 *		titleTextAdd: 'Add Event',
 *		titleTextEdit: 'Edit Event',
 *		titleLabelText: 'Title',
 *		datesLabelText: 'When',
 *		reminderLabelText: 'Reminder',
 *		notesLabelText: 'Notes',
 *		locationLabelText: 'Owner',
 *		webLinkLabelText: 'Web Link',
 *		calendarLabelText: 'Calendar',
 *		repeatsLabelText: 'Repeats',
 *		saveButtonText: 'Save',
 *		deleteButtonText: 'Delete',
 *		cancelButtonText: 'Cancel',
 *		bodyStyle: 'padding:20px 20px 10px;',
 *		border: false,
 *		buttonAlign: 'center',
 *		autoScroll: true,
 *		recurrence: false
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.form.EventDetails', {
    extend: 'Ext.form.Panel',
    alias: 'widget.extensible.eventeditform',
    requires: [
        'Extensible.form.field.DateRange',
        'Extensible.calendar.form.field.ReminderCombo',
        'Extensible.calendar.data.EventMappings',
        'Extensible.calendar.form.field.CalendarCombo',
        'Extensible.form.recurrence.Fieldset',
        'Ext.layout.container.Column',
        'Extensible.form.recurrence.RangeEditWindow'
    ],
    labelWidth: 65,
    labelWidthRightCol: 65,
    colWidthLeft: '.95',
    colWidthRight: '.05',
    fieldAnchor: '100%',
    title: 'Event Form',
    titleTextAdd: 'Add Event',
    titleTextEdit: 'Edit Event',
    titleLabelText: 'Title',
    datesLabelText: 'When',
    reminderLabelText: 'Reminder',
    notesLabelText: 'Notes',
    locationLabelText: 'Owner',
    webLinkLabelText: 'Web Link',
    calendarLabelText: 'Program',
    colourLabelText: 'State',
    repeatsLabelText: 'Repeats',
    saveButtonText: 'Save',
    goToRallyText: 'Go to Rally',
    deleteButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    bodyStyle: 'padding:20px 20px 10px;',
    border: false,
    buttonAlign: 'center',
    autoScroll: true,
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,
    /**
     * @cfg {Boolean} recurrence
     * @since 1.6.0
     * True to show the recurrence field, false to hide it (default). Note that recurrence requires
     * something on the server-side that can parse the iCal RRULE format in order to generate the
     * instances of recurring events to display on the calendar, so this field should only be enabled
     * if the server supports it.
     */
    recurrence: false,
    /**
     * @cfg {Boolean} allowDefaultAdd
     * @since 1.6.0
     * True to allow the user to save the initial default record displayed in the form while in Add mode
     * and the record is not dirty (default). If false, the form save action will be treated as a cancel action
     * if no editing was performed while in Add mode and the record will not be added. Note that this setting
     * does not apply when in Edit mode. The save action will always be treated as cancel in Edit mode if
     * the form is not dirty.
     *
     * When this option is true any blank or default field values should be allowed by the back end
     * system handling the operation. For example, by default if the event title is blank the calendar views
     * will substitute the value of {@link Extensible.calendar.view.AbstractCalendar#defaultEventTitleText
     * defaultEventTitleText} when displaying it. Any custom fields might require similar custom handling.
     */
    allowDefaultAdd: true,
    //private properties    
    layout: 'column',
    initComponent: function() {

        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added
             * @param {Extensible.calendar.form.EventDetails} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Extensible.calendar.form.EventDetails} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted
             * @param {Extensible.calendar.form.EventDetails} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was deleted
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Extensible.calendar.form.EventDetails} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was canceled
             */
            eventcancel: true
        });

        this.titleField = Ext.create('Ext.form.field.Text', {
            fieldLabel: this.titleLabelText,
            name: Extensible.calendar.data.EventMappings.Title.name,
            anchor: this.fieldAnchor
        });
        this.dateRangeField = Ext.create('Extensible.form.field.DateRange', {
            fieldLabel: this.datesLabelText,
            singleLine: false,
            anchor: this.fieldAnchor,
            startDay: this.startDay,
            listeners: {
                'change': Ext.bind(this.onDateChange, this)
            }
        });
        this.reminderField = Ext.create('Extensible.calendar.form.field.ReminderCombo', {
            name: Extensible.calendar.data.EventMappings.Reminder.name,
            fieldLabel: this.reminderLabelText,
            anchor: this.fieldAnchor
        });
        this.notesField = Ext.create('Ext.form.field.TextArea', {
            fieldLabel: this.notesLabelText,
            name: Extensible.calendar.data.EventMappings.Notes.name,
            grow: true,
            growMax: 150,
            anchor: this.fieldAnchor
        });

        //Hijacked to show owner of the activity
        this.locationField = Ext.create('Ext.form.field.Text', {
            readOnly: true,
            fieldLabel: this.locationLabelText,
            name: Extensible.calendar.data.EventMappings.Location.name,
            anchor: this.fieldAnchor
        });

        this.urlField = Ext.create('Ext.form.field.Text', {
            fieldLabel: this.webLinkLabelText,
            readOnly: true,
            inputType: 'url',
            name: Extensible.calendar.data.EventMappings.Url.name,
            anchor: this.fieldAnchor
        });

        // var leftFields = [this.titleField, this.dateRangeField, this.reminderField],
        // rightFields = [this.notesField, this.locationField, this.urlField];

        var rightFields = [],
                leftFields = [this.titleField, this.dateRangeField, this.reminderField,
                    this.notesField, this.locationField, this.urlField];
//                    this.notesField, this.urlField];

        if (this.recurrence) {
            this.recurrenceField = Ext.create('Extensible.form.recurrence.Fieldset', {
                recurrenceOptions: this.recurrence,
                name: Extensible.calendar.data.EventMappings.RRule.name,
                fieldLabel: this.repeatsLabelText,
                startDay: this.startDay,
                anchor: this.fieldAnchor,
                listeners: {
                    'startchange': Ext.bind(this.onRecurrenceStartChange, this)
                }
            });
            leftFields.splice(2, 0, this.recurrenceField);
        }

        if (this.calendarStore) {
            this.calendarField = Ext.create('Extensible.calendar.form.field.CalendarCombo', {
                store: this.calendarStore,
                fieldLabel: this.calendarLabelText,
                name: Extensible.calendar.data.EventMappings.CalendarId.name,
                anchor: this.fieldAnchor
            });
            leftFields.splice(2, 0, this.calendarField);
        }

        this.colourField = Ext.create('Rally.ui.combobox.FieldValueComboBox', {
                useNullForNoEntryValue: true,   //Will go to 'default' setting
                model: 'task',
                fieldLabel: this.colourLabelText,
                field: 'c_CoachState',
                name: 'Colour'
        });

        leftFields.splice(2,0, this.colourField);

        // Now that all fields are in one column by default, make sure we use
        // the largest configured label width for all fields:
        var labelWidth = Math.max(this.labelWidthRightCol, this.labelWidth);

        this.items = [{
                id: this.id + '-left-col',
                columnWidth: this.colWidthLeft,
                layout: 'anchor',
                fieldDefaults: {
                    labelWidth: labelWidth
                },
                border: false,
                items: leftFields
            }, {
                id: this.id + '-right-col',
                columnWidth: this.colWidthRight,
                layout: 'anchor',
                fieldDefaults: {
                    labelWidth: labelWidth
                },
                border: false,
                items: rightFields
            }];

        this.fbar = [{
                text: this.goToRallyText, scope: this, handler: this.openRally
            }, {
                text: this.saveButtonText, scope: this, handler: this.onSave
            }, {
                itemId: this.id + '-del-btn', text: this.deleteButtonText, scope: this, handler: this.onDelete
            }, {
                text: this.cancelButtonText, scope: this, handler: this.onCancel
            }];

        this.addCls('ext-evt-edit-form');

        Ext.apply(this.initialConfig, {
            trackResetOnLoad: true
        });

        this.callParent(arguments);
    },
    onDateChange: function(dateRangeField, val) {
        if (this.recurrenceField) {
            this.recurrenceField.setStartDate(val[0]);
        }
    },
    onRecurrenceStartChange: function(recurrenceFieldset, startDate, oldDate) {
        this.dateRangeField.setValue(startDate);
    },
    /**
     * @protected 
     */
    loadRecord: function(rec) {
        var me = this,
                EventMappings = Extensible.calendar.data.EventMappings;

        me.form.reset().loadRecord.apply(me.form, arguments);
        me.activeRecord = rec;
        me.dateRangeField.setValue(rec.data);

        if (me.recurrenceField) {
            var recurrenceStart = rec.get(EventMappings.RSeriesStartDate.name) ||
                    rec.get(EventMappings.StartDate.name);

            // Prevent a loop since the two start date fields sync on change
            me.recurrenceField.suspendEvents();
            me.recurrenceField.setStartDate(recurrenceStart);
            me.recurrenceField.setValue(rec.get(EventMappings.RRule.name));
            me.recurrenceField.resumeEvents();

            if (!rec.data[EventMappings.RInstanceStartDate.name]) {
                // If the record is new we have to set the instance start date explicitly to match the
                // field's default so that it does not show up later as dirty if it is not edited:
                rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            }
        }


        //Set the Rally dropdown to the right value
        me.colourField.setValue(rec.data[EventMappings.Colour.name]);

        if (me.calendarField) {
            me.calendarField.setValue(rec.data[EventMappings.CalendarId.name]);
        }

        if (rec.phantom) {
            me.setTitle(me.titleTextAdd);
            me.down('#' + me.id + '-del-btn').hide();
        }
        else {
            me.setTitle(me.titleTextEdit);
            me.down('#' + me.id + '-del-btn').show();
        }

        // Using setValue() results in dirty fields, so we reset the field state
        // after loading the form so that the current values are the "original" values
        me.form.getFields().each(function(item) {
            item.resetOriginalValue();
        });

        me.titleField.focus();
    },

    openRally: function() {
        var me = this;

        me.onSave(),
        Rally.nav.Manager.showDetail( Rally.util.Ref.getRefObject( me.urlField.getValue()));

    },

    updateRecord: function(record) {
        var fields = record.fields,
                values = this.getForm().getValues(),
                EventMappings = Extensible.calendar.data.EventMappings,
                name,
                obj = {};

        fields.each(function(f) {
            name = f.name;
            if (name in values) {
                obj[name] = values[name];
            }
        });

        var dates = this.dateRangeField.getValue(),
                allday = obj[EventMappings.IsAllDay.name] = dates[2],
                // Clear times for all day events so that they are stored consistently
                startDate = allday ? Extensible.Date.clearTime(dates[0]) : dates[0],
                endDate = allday ? Extensible.Date.clearTime(dates[1]) : dates[1],
                singleDayDurationConfig = {days: 1};

        // The full length of a day based on the minimum event time resolution:
        singleDayDurationConfig[Extensible.calendar.data.EventModel.resolution] = -1;

        obj[EventMappings.StartDate.name] = startDate;

        // If the event is all day, calculate the end date as midnight of the day after the end
        // date minus 1 unit based on the EventModel resolution, e.g. 23:59:00 on the end date
        obj[EventMappings.EndDate.name] = allday ?
                Extensible.Date.add(endDate, singleDayDurationConfig) : endDate;

        if (EventMappings.Duration) {
            obj[EventMappings.Duration.name] = Extensible.Date.diff(startDate, obj[EventMappings.EndDate.name],
                    Extensible.calendar.data.EventModel.resolution);
        }

        record.set(obj);

        return record.dirty || (record.phantom && this.allowDefaultAdd);
    },
    onCancel: function() {
        this.cleanup(true);
        this.fireEvent('eventcancel', this, this.activeRecord);
    },
    cleanup: function(hide) {
        if (this.activeRecord) {
            this.activeRecord.reject();
        }
        delete this.activeRecord;

        if (this.form.isDirty()) {
            this.form.reset();
        }
    },
    onSave: function() {
        var me = this,
                originalHasRecurrence = me.activeRecord.isRecurring();

        if (!me.form.isValid() && !me.allowDefaultAdd) {
            return;
        }

        if (!me.updateRecord(me.activeRecord)) {
            me.onCancel();
            return;
        }

        if (me.activeRecord.phantom) {
            me.fireEvent('eventadd', me, me.activeRecord);
        }
        else {
            if (originalHasRecurrence && me.activeRecord.isRecurring()) {
                // We only need to prompt when editing an event that was recurring before being edited and is
                // still recurring after being edited. If a normal event is edited to make it recurring or a
                // recurring event is edited to make it normal just do a standard update.
                me.onRecurrenceUpdate();
            }
            else {
                me.fireEvent('eventupdate', me, me.activeRecord);
            }
        }
    },
    onRecurrenceUpdate: function() {
        this.rangeEditWin = this.rangeEditWin || Ext.WindowMgr.get('ext-cal-rangeeditwin');
        if (!this.rangeEditWin) {
            this.rangeEditWin = new Extensible.form.recurrence.RangeEditWindow();
        }
        this.rangeEditWin.prompt({
            callback: this.onRecurrenceEditModeSelected,
            scope: this
        });
    },
    onRecurrenceEditModeSelected: function(editMode) {
        var me = this;

        if (editMode) {
            me.activeRecord.data[Extensible.calendar.data.EventMappings.REditMode.name] = editMode;
            me.fireEvent('eventupdate', me, me.activeRecord, me.animateTarget);
        }
    },
    onDelete: function() {
        this.fireEvent('eventdelete', this, this.activeRecord);
    }
});/**
 * A custom window containing a basic edit form used for quick editing of events.
 * 
 * This window also provides custom events specific to the calendar so that other calendar components can be easily
 * notified when an event has been edited via this component.
 * 
 * The default configs are as follows:
 *		// Locale configs
 *		titleTextAdd: 'Add Event',
 *		titleTextEdit: 'Edit Event',
 *		width: 600,
 *		labelWidth: 65,
 *		detailsLinkText: 'Edit Details...',
 *		savingMessage: 'Saving changes...',
 *		deletingMessage: 'Deleting event...',
 *		saveButtonText: 'Save',
 *		deleteButtonText: 'Delete',
 *		cancelButtonText: 'Cancel',
 *		titleLabelText: 'Title',
 *		datesLabelText: 'When',
 *		calendarLabelText: 'Calendar',
 *		
 *		// General configs
 *		closeAction: 'hide',
 *		modal: false,
 *		resizable: false,
 *		constrain: true,
 *		buttonAlign: 'left',
 *		editDetailsLinkClass: 'edit-dtl-link',
 *		enableEditDetails: true,
 *		bodyStyle: 'padding: 8px 10px 5px;',
 *		layout: 'fit'
 * @constructor
 * @param {Object} config The config object
 */
Ext.define('Extensible.calendar.form.EventWindow', {
    extend: 'Ext.window.Window',
    alias: 'widget.extensible.eventeditwindow',
    
    requires: [
        'Ext.form.Panel',
        'Extensible.calendar.data.EventModel',
        'Extensible.calendar.data.EventMappings',
        'Extensible.form.recurrence.RangeEditWindow'
    ],
    
    // Locale configs
    titleTextAdd: 'Add Event',
    titleTextEdit: 'Edit Event',
    width: 600,
    labelWidth: 65,
    detailsLinkText: 'Edit Details...',
    savingMessage: 'Saving changes...',
    deletingMessage: 'Deleting event...',
    saveButtonText: 'Save',
    deleteButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    titleLabelText: 'Title',
    datesLabelText: 'When',
    calendarLabelText: 'Program',
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,

    // General configs
    closeAction: 'hide',
    modal: false,
    resizable: false,
    constrain: true,
    buttonAlign: 'left',
    editDetailsLinkClass: 'edit-dtl-link',
    enableEditDetails: true,
    layout: 'fit',
    
    formPanelConfig: {
        border: false
    },
    
    /**
     * @cfg {Boolean} allowDefaultAdd
     * @since 1.6.0
     * True to allow the user to save the initial default record displayed in the form while in Add mode
     * and the record is not dirty (default). If false, the form save action will be treated as a cancel action
     * if no editing was performed while in Add mode and the record will not be added. Note that this setting
     * does not apply when in Edit mode. The save action will always be treated as cancel in Edit mode if
     * the form is not dirty.
     *
     * When this option is true any blank or default field values should be allowed by the back end
     * system handling the operation. For example, by default if the event title is blank the calendar views
     * will substitute the value of {@link Extensible.calendar.view.AbstractCalendar#defaultEventTitleText
     * defaultEventTitleText} when displaying it. Any custom fields might require similar custom handling.
     */
    allowDefaultAdd: true,
    
    initComponent: function() {
        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added
             * @param {Extensible.calendar.form.EventWindow} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was added
             * @param {Ext.Element} el The target element
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Extensible.calendar.form.EventWindow} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was updated
             * @param {Ext.Element} el The target element
             */
            eventupdate: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted
             * @param {Extensible.calendar.form.EventWindow} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was deleted
             * @param {Ext.Element} el The target element
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Extensible.calendar.form.EventWindow} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel
             * record} that was canceled
             * @param {Ext.Element} el The target element
             */
            eventcancel: true,
            /**
             * @event editdetails
             * Fires when the user selects the option in this window to continue editing in the detailed edit form
             * (by default, an instance of {@link Extensible.calendar.form.EventDetails}. Handling code should hide
             * this window and transfer the current event record to the appropriate instance of the detailed form by
             * showing it and calling {@link Extensible.calendar.form.EventDetails#loadRecord loadRecord}.
             * @param {Extensible.calendar.form.EventWindow} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record}
             * that is currently being edited
             * @param {Ext.Element} el The target element
             */
            editdetails: true
        });
        
        this.fbar = this.getFooterBarConfig();
        
        this.callParent(arguments);
    },
    
    getFooterBarConfig: function() {
        var cfg = ['->', {
                text: this.saveButtonText,
                itemId: this.id + '-save-btn',
                disabled: false,
                handler: this.onSave,
                scope: this
            },{
                text: this.deleteButtonText,
                itemId: this.id + '-delete-btn',
                disabled: false,
                handler: this.onDelete,
                scope: this,
                hideMode: 'offsets' // IE requires this
            },{
                text: this.cancelButtonText,
                itemId: this.id + '-cancel-btn',
                disabled: false,
                handler: this.onCancel,
                scope: this
            }];
        
        if(this.enableEditDetails !== false) {
            cfg.unshift({
                xtype: 'tbtext',
                itemId: this.id + '-details-btn',
                text: '<a href="#" class="' + this.editDetailsLinkClass + '">' + this.detailsLinkText + '</a>'
            });
        }
        return cfg;
    },
    
    onRender : function(ct, position){        
        this.formPanel = Ext.create('Ext.form.Panel', Ext.applyIf({
            fieldDefaults: {
                labelWidth: this.labelWidth
            },
            items: this.getFormItemConfigs()
        }, this.formPanelConfig));
        
        this.add(this.formPanel);
        
        this.callParent(arguments);
    },
    
    getFormItemConfigs: function() {
        var items = [{
            xtype: 'textfield',
            itemId: this.id + '-title',
            name: Extensible.calendar.data.EventMappings.Title.name,
            fieldLabel: this.titleLabelText,
            anchor: '100%'
        },{
            xtype: 'extensible.daterangefield',
            itemId: this.id + '-dates',
            name: 'dates',
            anchor: '95%',
            singleLine: true,
            startDay: this.startDay,
            fieldLabel: this.datesLabelText
        }];
        
        if(this.calendarStore) {
            items.push({
                xtype: 'extensible.calendarcombo',
                itemId: this.id + '-calendar',
                name: Extensible.calendar.data.EventMappings.CalendarId.name,
                anchor: '100%',
                fieldLabel: this.calendarLabelText,
                store: this.calendarStore
            });
        }
        
        return items;
    },

    afterRender: function() {
        this.callParent(arguments);
        
        this.el.addCls('ext-cal-event-win');
        
        this.initRefs();
        
        // This junk spacer item gets added to the fbar by Ext (fixed in 4.0.2)
        var junkSpacer = this.getDockedItems('toolbar')[0].items.items[0];
        if (junkSpacer.el.hasCls('x-component-default')) {
            Ext.destroy(junkSpacer);
        }
    },
    
    initRefs: function() {
        // toolbar button refs
        this.saveButton = this.down('#' + this.id + '-save-btn');
        this.deleteButton = this.down('#' + this.id + '-delete-btn');
        this.cancelButton = this.down('#' + this.id + '-cancel-btn');
        this.detailsButton = this.down('#' + this.id + '-details-btn');
        
        if (this.detailsButton) {
            this.detailsButton.getEl().on('click', this.onEditDetailsClick, this);
        }
        
        // form item refs
        this.titleField = this.down('#' + this.id + '-title');
        this.dateRangeField = this.down('#' + this.id + '-dates');
        this.calendarField = this.down('#' + this.id + '-calendar');
        this.colourField = this.down('#' + this.id + '-colour');
    },
    
    onEditDetailsClick: function(e) {
        e.stopEvent();
        this.updateRecord(this.activeRecord, true);
        this.fireEvent('editdetails', this, this.activeRecord, this.animateTarget);
    },
    
    /**
     * Shows the window, rendering it first if necessary, or activates it and brings it to front if hidden.
     * @param {Ext.data.Record/Object} o Either a {@link Ext.data.Record} if showing the form
     * for an existing event in edit mode, or a plain object containing a StartDate property (and
     * optionally an EndDate property) for showing the form in add mode.
     * @param {String/Element} animateTarget (optional) The target element or id from which the window should
     * animate while opening (defaults to null with no animation)
     * @return {Ext.Window} this
     */
    show: function(o, animateTarget) {
        var me = this,
            EventMappings = Extensible.calendar.data.EventMappings,
            form, rec;
        
        // Work around the CSS day cell height hack needed for initial render in IE8/strict:
        me.animateTarget = (Ext.isIE8 && Ext.isStrict) ? null : animateTarget;

        me.callParent([me.animateTarget, function() {
            me.titleField.focus(false, 100);
        }, me]);
        
        form = me.formPanel.form;
        
        // Only show the delete button if the data includes an EventID, otherwise
        // we're adding a new record
        me.deleteButton[o.data && o.data[EventMappings.EventId.name] ? 'show' : 'hide']();
        
        if (o.data) {
            rec = o;
            me.setTitle(rec.phantom ? me.titleTextAdd : me.titleTextEdit);
            form.loadRecord(rec);
        }
        else {
            me.setTitle(me.titleTextAdd);

            var start = o[EventMappings.StartDate.name] || new Date( Ext.Date.now()),
                end = o[EventMappings.EndDate.name] || Extensible.Date.add(start, {hours: 1});
                
            rec = Ext.create('Extensible.calendar.data.EventModel');
            
            rec.data[EventMappings.Title.name] = o[EventMappings.Title.name]; // in case it's set
            rec.data[EventMappings.StartDate.name] = start;
            rec.data[EventMappings.EndDate.name] = end;
            
            rec.data[EventMappings.IsAllDay.name] = !!o[EventMappings.IsAllDay.name] ||
                (start.getDate() !== Extensible.Date.add(end, {millis: 1}).getDate());
            
            rec.data[EventMappings.CalendarId.name] = me.calendarStore ?
                    me.calendarStore.getAt(0).data[Extensible.calendar.data.CalendarMappings.CalendarId.name] : '';
            
            if (EventMappings.Duration) {
                rec.data[EventMappings.Duration.name] = Extensible.Date.diff(start, end,
                    Extensible.calendar.data.EventModel.resolution);
            }
            
            form.reset();
            form.loadRecord(rec);
        }
        
        if (EventMappings.RInstanceStartDate) {
            rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
        }
        
        me.dateRangeField.setValue(rec.data);
        me.activeRecord = rec;
        
        // Using setValue() results in dirty fields, so we reset the field state
        // after loading the form so that the current values are the "original" values
        form.getFields().each(function(item) {
            item.resetOriginalValue();
        });
        
        return me;
    },

    roundTime: function(dt, incr) {
        incr = incr || 15;
        var m = parseInt(dt.getMinutes(), 10);
        return dt.add('mi', incr - (m % incr));
    },

    onCancel: function() {
        this.cleanup(true);
        this.fireEvent('eventcancel', this, this.activeRecord, this.animateTarget);
    },

    cleanup: function(hide) {
        if (this.activeRecord) {
            this.activeRecord.reject();
        }
        delete this.activeRecord;
        
        if (hide===true) {
            // Work around the CSS day cell height hack needed for initial render in IE8/strict:
            //var anim = afterDelete || (Ext.isIE8 && Ext.isStrict) ? null : this.animateTarget;
            this.hide();
        }
    },
    
    updateRecord: function(record, keepEditing) {
        var fields = record.fields,
            values = this.formPanel.getForm().getValues(),
            EventMappings = Extensible.calendar.data.EventMappings,
            name,
            obj = {},
            modified;

        fields.each(function(f) {
            name = f.name;
            if (name in values) {
                obj[name] = values[name];
            }
        });
        
        var dates = this.dateRangeField.getValue(),
            allday = obj[EventMappings.IsAllDay.name] = dates[2],
            // Clear times for all day events so that they are stored consistently
            startDate = allday ? Extensible.Date.clearTime(dates[0]) : dates[0],
            endDate = allday ? Extensible.Date.clearTime(dates[1]) : dates[1],
            singleDayDurationConfig = { days: 1 };
        
        // The full length of a day based on the minimum event time resolution:
        singleDayDurationConfig[Extensible.calendar.data.EventModel.resolution] = -1;
        
        obj[EventMappings.StartDate.name] = startDate;
        
        // If the event is all day, calculate the end date as midnight of the day after the end
        // date minus 1 unit based on the EventModel resolution, e.g. 23:59:00 on the end date
        obj[EventMappings.EndDate.name] = allday ?
            Extensible.Date.add(endDate, singleDayDurationConfig) : endDate;
        
        if (EventMappings.Duration) {
            obj[EventMappings.Duration.name] = Extensible.Date.diff(startDate, obj[EventMappings.EndDate.name],
                Extensible.calendar.data.EventModel.resolution);
        }

        record.beginEdit();
        record.set(obj);
        
        if (!keepEditing || !modified) {
            record.endEdit();
        }

        return record.dirty || (record.phantom && this.allowDefaultAdd);
    },

    onSave: function() {
        var me = this,
            form = me.formPanel.form,
            originalHasRecurrence = me.activeRecord.isRecurring();
        
        if (!form.isDirty() && !me.allowDefaultAdd) {
            me.onCancel();
            return;
        }
        if (!form.isValid()) {
            return;
        }
        
        if (!me.updateRecord(me.activeRecord)) {
            me.onCancel();
            return;
        }
        
        if (me.activeRecord.phantom) {
            me.fireEvent('eventadd', me, me.activeRecord, me.animateTarget);
        }
        else {
            if (originalHasRecurrence && me.activeRecord.isRecurring()) {
                // We only need to prompt when editing an event that was recurring before being edited and is
                // still recurring after being edited. If a normal event is edited to make it recurring or a
                // recurring event is edited to make it normal just do a standard update.
                me.onRecurrenceUpdate();
            }
            else {
                me.fireEvent('eventupdate', me, me.activeRecord, me.animateTarget);
            }
        }
    },

    onRecurrenceUpdate: function() {
        this.rangeEditWin = this.rangeEditWin || Ext.WindowMgr.get('ext-cal-rangeeditwin');
        if (!this.rangeEditWin) {
            this.rangeEditWin = new Extensible.form.recurrence.RangeEditWindow();
        }
        this.rangeEditWin.prompt({
            callback: this.onRecurrenceEditModeSelected,
            scope: this
        });
    },

    onRecurrenceEditModeSelected: function(editMode) {
        var me = this;
        
        if (editMode) {
            me.activeRecord.data[Extensible.calendar.data.EventMappings.REditMode.name] = editMode;
            me.fireEvent('eventupdate', me, me.activeRecord, me.animateTarget);
        }
    },

    onDelete: function() {
        this.fireEvent('eventdelete', this, this.activeRecord, this.animateTarget);
    }
});/**
 * This is an abstract class that serves as the base for other calendar views. This class is not
 * intended to be directly instantiated.
 * 
 * When extending this class to create a custom calendar view, you must provide an implementation
 * for the <tt>renderItems</tt> method, as there is no default implementation for rendering events
 * The rendering logic is totally dependent on how the UI structures its data, which
 * is determined by the underlying UI template (this base class does not have a template).
 */
Ext.define('Extensible.calendar.view.AbstractCalendar', {
    extend: 'Ext.Component',
    
    requires: [
        'Ext.CompositeElement',
        'Extensible.calendar.form.EventDetails',
        'Extensible.calendar.form.EventWindow',
        'Extensible.calendar.menu.Event',
        'Extensible.calendar.dd.DragZone',
        'Extensible.calendar.dd.DropZone',
        'Extensible.form.recurrence.RangeEditWindow'
    ],

    /**
     * @cfg {Ext.data.Store} eventStore
     * The {@link Ext.data.Store store} which is bound to this calendar and contains {@link Extensible.calendar.data.EventModel EventRecords}.
     * Note that this is an alias to the default {@link #store} config (to differentiate that from the optional {@link #calendarStore}
     * config), and either can be used interchangeably.
     */
    /**
     * @cfg {Ext.data.Store} calendarStore
     * The {@link Ext.data.Store store} which is bound to this calendar and contains {@link Extensible.calendar.data.CalendarModel CalendarRecords}.
     * This is an optional store that provides multi-calendar (and multi-color) support. If available an additional field for selecting the
     * calendar in which to save an event will be shown in the edit forms. If this store is not available then all events will simply use
     * the default calendar (and color).
     */
    /*
     * @cfg {Boolean} recurrence
     * True to show the recurrence field, false to hide it (default). Note that recurrence requires
     * something on the server-side that can parse the iCal RRULE format in order to generate the
     * instances of recurring events to display on the calendar, so this field should only be enabled
     * if the server supports it.
     */
    recurrence: false,
    
    // @private
    // At the moment these are used, but not required to be modified. In the future, these may be used
    // for customizing how recurrence data is requested and processed.
    recurrenceOptions: {
        expansionMode: 'remote',
        expansionParam: {
            name: 'singleEvents',
            value: true
        }
    },

    /**
     * @cfg {Boolean} readOnly
     * True to prevent clicks on events or the view from providing CRUD capabilities, false to enable CRUD (the default).
     */
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,
    /**
     * @cfg {Boolean} spansHavePriority
     * Allows switching between two different modes of rendering events that span multiple days. When true,
     * span events are always sorted first, possibly at the expense of start dates being out of order (e.g.,
     * a span event that starts at 11am one day and spans into the next day would display before a non-spanning
     * event that starts at 10am, even though they would not be in date order). This can lead to more compact
     * layouts when there are many overlapping events. If false (the default), events will always sort by start date
     * first which can result in a less compact, but chronologically consistent layout.
     */
    spansHavePriority: false,
    /**
     * @cfg {Boolean} trackMouseOver
     * Whether or not the view tracks and responds to the browser mouseover event on contained elements (defaults to
     * true). If you don't need mouseover event highlighting you can disable this.
     */
    trackMouseOver: true,
    /**
     * @cfg {Boolean} enableFx
     * Determines whether or not visual effects for CRUD actions are enabled (defaults to true). If this is false
     * it will override any values for {@link #enableAddFx}, {@link #enableUpdateFx} or {@link enableRemoveFx} and
     * all animations will be disabled.
     */
    enableFx: true,
    /**
     * @cfg {Boolean} enableAddFx
     * True to enable a visual effect on adding a new event (the default), false to disable it. Note that if
     * {@link #enableFx} is false it will override this value. The specific effect that runs is defined in the
     * {@link #doAddFx} method.
     */
    enableAddFx: true,
    /**
     * @cfg {Boolean} enableUpdateFx
     * True to enable a visual effect on updating an event, false to disable it (the default). Note that if
     * {@link #enableFx} is false it will override this value. The specific effect that runs is defined in the
     * {@link #doUpdateFx} method.
     */
    enableUpdateFx: false,
    /**
     * @cfg {Boolean} enableRemoveFx
     * True to enable a visual effect on removing an event (the default), false to disable it. Note that if
     * {@link #enableFx} is false it will override this value. The specific effect that runs is defined in the
     * {@link #doRemoveFx} method.
     */
    enableRemoveFx: true,
    /**
     * @cfg {Boolean} enableDD
     * True to enable drag and drop in the calendar view (the default), false to disable it
     */
    enableDD: true,
    /**
     * @cfg {Boolean} enableContextMenus
     * True to enable automatic right-click context menu handling in the calendar views (the default), false to disable
     * them. Different context menus are provided when clicking on events vs. the view background.
     */
    enableContextMenus: true,
    /**
     * @cfg {Boolean} suppressBrowserContextMenu
     * When {@link #enableContextMenus} is true, the browser context menu will automatically be suppressed whenever a
     * custom context menu is displayed. When this option is true, right-clicks on elements that do not have a custom
     * context menu will also suppress the default browser context menu (no menu will be shown at all). When false,
     * the browser context menu will still show if the right-clicked element has no custom menu (this is the default).
     */
    suppressBrowserContextMenu: false,
    /**
     * @cfg {Boolean} monitorResize
     * True to monitor the browser's resize event (the default), false to ignore it. If the calendar view is rendered
     * into a fixed-size container this can be set to false. However, if the view can change dimensions (e.g., it's in
     * fit layout in a viewport or some other resizable container) it is very important that this config is true so that
     * any resize event propagates properly to all subcomponents and layouts get recalculated properly.
     */
    monitorResize: true,
    /**
     * @cfg {String} todayText
     * The text to display in the current day's box in the calendar when {@link #showTodayText} is true (defaults to 'Today')
     */
    todayText: 'Today',
    /**
     * @cfg {String} ddCreateEventText
     * The text to display inside the drag proxy while dragging over the calendar to create a new event (defaults to
     * 'Create event for {0}' where {0} is a date range supplied by the view)
     */
    ddCreateEventText: 'Create event for {0}',
    /**
     * @cfg {String} ddCopyEventText
     * The text to display inside the drag proxy while alt-dragging an event to copy it (defaults to
     * 'Copy event to {0}' where {0} is the updated event start date/time supplied by the view)
     */
    ddCopyEventText: 'Copy event to {0}',
    /**
     * @cfg {String} ddMoveEventText
     * The text to display inside the drag proxy while dragging an event to reposition it (defaults to
     * 'Move event to {0}' where {0} is the updated event start date/time supplied by the view)
     */
    ddMoveEventText: 'Move event to {0}',
    /**
     * @cfg {String} ddResizeEventText
     * The string displayed to the user in the drag proxy while dragging the resize handle of an event (defaults to
     * 'Update event to {0}' where {0} is the updated event start-end range supplied by the view). Note that
     * this text is only used in views
     * that allow resizing of events.
     */
    ddResizeEventText: 'Update event to {0}',
    /**
     * @cfg {String} defaultEventTitleText
     * The default text to display as the title of an event that has a null or empty string title value (defaults to '(No title)')
     */
    defaultEventTitleText: '(No title)',
    /**
     * @cfg {String} dateParamStart
     * The param name representing the start date of the current view range that's passed in requests to retrieve events
     * when loading the view (defaults to 'startDate').
     */
    dateParamStart: 'startDate',
    /**
     * @cfg {String} dateParamEnd
     * The param name representing the end date of the current view range that's passed in requests to retrieve events
     * when loading the view (defaults to 'endDate').
     */
    dateParamEnd: 'endDate',
    /**
     * @cfg {String} dateParamFormat
     * The format to use for date parameters sent with requests to retrieve events for the calendar (defaults to 'Y-m-d', e.g. '2010-10-31')
     */
    dateParamFormat: 'Y-m-d',
    /**
     * @cfg {Boolean} editModal
     * True to show the default event editor window modally over the entire page, false to allow user interaction with the page
     * while showing the window (the default). Note that if you replace the default editor window with some alternate component this
     * config will no longer apply.
     */
    editModal: false,
    /**
     * @cfg {Boolean} enableEditDetails
     * True to show a link on the event edit window to allow switching to the detailed edit form (the default), false to remove the
     * link and disable detailed event editing.
     */
    enableEditDetails: true,
    /**
     * @cfg {String} weekendCls
     * A CSS class to apply to weekend days in the current view (defaults to 'ext-cal-day-we' which highlights weekend days in light blue).
     * To disable this styling set the value to null or ''.
     */
    weekendCls: 'ext-cal-day-we',
    /**
     * @cfg {String} prevMonthCls
     * A CSS class to apply to any days that fall in the month previous to the current view's month (defaults to 'ext-cal-day-prev' which
     * highlights previous month days in light gray). To disable this styling set the value to null or ''.
     */
    prevMonthCls: 'ext-cal-day-prev',
    /**
     * @cfg {String} nextMonthCls
     * A CSS class to apply to any days that fall in the month after the current view's month (defaults to 'ext-cal-day-next' which
     * highlights next month days in light gray). To disable this styling set the value to null or ''.
     */
    nextMonthCls: 'ext-cal-day-next',
    /**
     * @cfg {String} todayCls
     * A CSS class to apply to the current date when it is visible in the current view (defaults to 'ext-cal-day-today' which
     * highlights today in yellow). To disable this styling set the value to null or ''.
     */
    todayCls: 'ext-cal-day-today',
    /**
     * @cfg {String} hideMode
     * How this component should be hidden. Supported values are <tt>'visibility'</tt>
     * (css visibility), <tt>'offsets'</tt> (negative offset position) and <tt>'display'</tt>
     * (css display).
     * 
     * **Note:** For calendar views the default is 'offsets' rather than the Ext JS default of
     * 'display' in order to preserve scroll position after hiding/showing a scrollable view like Day or Week.
     */
    hideMode: 'offsets',
    /**
     * @cfg {String} notifyOnExceptionTitle
     * @since 1.6.0
     * The notification title used by the {@link #notifyOnException} method when a server error occurs
     * (defaults to "Server Error").
     */
    notifyOnExceptionTitle: 'Server Error',
    /**
     * @cfg {String} notifyOnExceptionText
     * @since 1.6.0
     * The notification starting text used by the {@link #notifyOnException} method when a server error occurs
     * (defaults to "The action failed with the following response:"). The text of the error is appended.
     */
    notifyOnExceptionText: 'The action failed with the following response:',
    /**
     * @cfg {String} notifyOnExceptionDefaultMessage
     * @since 1.6.0
     * The default notification message text used by the {@link #notifyOnException} method when a server error occurs
     * and no error message is returned from the server (defaults to "An unknown error occurred").
     */
    notifyOnExceptionDefaultMessage: 'An unknown error occurred',
    
    /**
     * @property ownerCalendarPanel
     * @type Extensible.calendar.CalendarPanel
     * If this view is hosted inside a {@link Extensible.calendar.CalendarPanel CalendarPanel} this property will reference
     * it. If the view was created directly outside of a CalendarPanel this property will be null. Read-only.
     */

    //private properties -- do not override:
    weekCount: 1,
    dayCount: 1,
    eventSelector: '.ext-cal-evt',
    eventSelectorDepth: 10,
    eventOverClass: 'ext-evt-over',
    eventElIdDelimiter: '-evt-',
    dayElIdDelimiter: '-day-',
    recurringInstanceIdDelimiter: '-rid-',

    /**
     * Returns a string of HTML template markup to be used as the body portion of the event template created
     * by {@link #getEventTemplate}. This provides the flexibility to customize what's in the body without
     * having to override the entire XTemplate. This string can include any valid {@link Ext.Template} code, and
     * any data tokens accessible to the containing event template can be referenced in this string.
     * @return {String} The body template string
     */
    getEventBodyMarkup: Ext.emptyFn, // must be implemented by a subclass

    /**
     * Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Extensible.calendar.data.EventModel}) to populate the calendar views with events. Internally this method
     * by default generates different markup for browsers that support CSS border radius and those that don't.
     * This method can be overridden as needed to customize the markup generated.
     * 
     * Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provides the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your
     * overridden version also does the same.
     * @return {Ext.XTemplate} The event XTemplate
     */
    getEventTemplate: Ext.emptyFn, // must be implemented by a subclass

    /**
     * This is undefined by default, but can be implemented to allow custom CSS classes and template data to be
     * conditionally applied to events during rendering. This function will be called with the parameter list shown
     * below and is expected to return the CSS class name (or empty string '' for none) that will be added to the
     * event element's wrapping div. To apply multiple class names, simply return them space-delimited within the
     * string (e.g., 'my-class another-class'). Example usage, applied in a CalendarPanel config:
     *		// This example assumes a custom field of 'IsHoliday' has been added to EventRecord
     *		viewConfig: {
     *			getEventClass: function(rec, allday, templateData, store) {
     *				if (rec.data.IsHoliday) {
     *				templateData.iconCls = 'holiday';
     *				return 'evt-holiday';
     *			}
     *			templateData.iconCls = 'plain';
     *			return '';
     *			},
     *			getEventBodyMarkup: function() {
     *			// This is simplified, but shows the symtax for how you could add a
     *			// custom placeholder that maps back to the templateData property created
     *			// in getEventClass. Note that this is standard Ext template syntax.
     *				if (!this.eventBodyMarkup) {
     *					this.eventBodyMarkup = '&lt;span class="{iconCls}">&lt;/span> {Title}';
     *				}
     *			return this.eventBodyMarkup;
     *			}
     *		}
     * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} being rendered
     * @param {Boolean} isAllDay A flag indicating whether the event will be *rendered* as an all-day event. Note that this
     * will not necessarily correspond with the value of the <tt>EventRecord.IsAllDay</tt> field &mdash; events that span multiple
     * days will be rendered using the all-day event template regardless of the field value. If your logic for this function
     * needs to know whether or not the event will be rendered as an all-day event, this value should be used.
     * @param {Object} templateData A plain JavaScript object that is empty by default. You can add custom properties
     * to this object that will then be passed into the event template for the specific event being rendered. If you have
     * overridden the default event template and added custom data placeholders, you can use this object to pass the data
     * into the template that will replace those placeholders.
     * @param {Ext.data.Store} store The Event data store in use by the view
     * @method getEventClass
     * @return {String} A space-delimited CSS class string (or '')
     */

    initComponent: function() {
        this.setStartDate(this.startDate || new Date());

        this.callParent(arguments);

        if (this.readOnly === true) {
            this.addCls('ext-cal-readonly');
        }

        this.addEvents({
            /**
             * @event eventsrendered
             * Fires after events are finished rendering in the view
             * @param {Extensible.calendar.view.AbstractCalendar} this
             */
            eventsrendered: true,
            /**
             * @event eventclick
             * Fires after the user clicks on an event element. This is a cancelable event, so returning false from a
             * handler will cancel the click without displaying the event editor view. This could be useful for
             * validating the rules by which events should be editable by the user.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} for the event that was clicked on
             * @param {HTMLNode} el The DOM node that was clicked on
             */
            eventclick: true,
            /**
             * @event eventover
             * Fires anytime the mouse is over an event element
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} for the event that the cursor is over
             * @param {HTMLNode} el The DOM node that is being moused over
             */
            eventover: true,
            /**
             * @event eventout
             * Fires anytime the mouse exits an event element
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} for the event that the cursor exited
             * @param {HTMLNode} el The DOM node that was exited
             */
            eventout: true,
            /**
             * @event beforedatechange
             * Fires before the start date of the view changes, giving you an opportunity to save state or anything else you may need
             * to do prior to the UI view changing. This is a cancelable event, so returning false from a handler will cancel both the
             * view change and the setting of the start date.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Date} startDate The current start date of the view (as explained in {@link #getStartDate}
             * @param {Date} newStartDate The new start date that will be set when the view changes
             * @param {Date} viewStart The first displayed date in the current view
             * @param {Date} viewEnd The last displayed date in the current view
             */
            beforedatechange: true,
            /**
             * @event datechange
             * Fires after the start date of the view has changed. If you need to cancel the date change you should handle the
             * {@link #beforedatechange} event and return false from your handler function.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Date} startDate The start date of the view (as explained in {@link #getStartDate}
             * @param {Date} viewStart The first displayed date in the view
             * @param {Date} viewEnd The last displayed date in the view
             */
            datechange: true,
            /**
             * @event rangeselect
             * Fires after the user drags on the calendar to select a range of dates/times in which to create an event. This is a
             * cancelable event, so returning false from a handler will cancel the drag operation and clean up any drag shim elements
             * without displaying the event editor view. This could be useful for validating that a user can only create events within
             * a certain range.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Object} dates An object containing the start (StartDate property) and end (EndDate property) dates selected
             * @param {Function} callback A callback function that MUST be called after the event handling is complete so that
             * the view is properly cleaned up (shim elements are persisted in the view while the user is prompted to handle the
             * range selection). The callback is already created in the proper scope, so it simply needs to be executed as a standard
             * function call (e.g., callback()).
             */
            rangeselect: true,
            /**
             * @event beforeeventcopy
             * Fires before an existing event is duplicated by the user via the "copy" command. This is a
             * cancelable event, so returning false from a handler will cancel the copy operation.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that will be copied
             * @param {Date} dt The new start date to be set in the copy (the end date will be automaticaly
             * adjusted to match the original event duration)
             */
            beforeeventcopy: true,
            /**
             * @event eventcopy
             * Fires after an event has been duplicated by the user via the "copy" command. If you need to
             * cancel the copy operation you should handle the {@link #beforeeventcopy} event and return
             * false from your handler function.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that was copied (with updated start and end dates)
             */
            eventcopy: true,
            /**
             * @event beforeeventmove
             * Fires after an event element has been dragged by the user and dropped in a new position, but before
             * the event record is updated with the new dates, providing a hook for canceling the update.
             * To cancel the move, return false from a handling function. This could be useful for validating
             * that a user can only move events within a certain date range, for example.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record}
             * for the event that will be moved. Start and end dates will be the original values before the move started.
             * @param {Date} dt The new start date to be set (the end date will be automaticaly calculated to match
             * based on the event duration)
             */
            beforeeventmove: true,
            /**
             * @event eventmove
             * Fires after an event element has been moved to a new position and its data updated. If you need to
             * cancel the move operation you should handle the {@link #beforeeventmove} event and return false
             * from your handler function.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record}
             * for the event that was moved with updated start and end dates
             */
            eventmove: true,
            /**
             * @event initdrag
             * Fires when a drag operation is initiated in the view
             * @param {Extensible.calendar.view.AbstractCalendar} this
             */
            initdrag: true,
            /**
             * @event dayover
             * Fires while the mouse is over a day element
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Date} dt The date that is being moused over
             * @param {Ext.Element} el The day Element that is being moused over
             */
            dayover: true,
            /**
             * @event dayout
             * Fires when the mouse exits a day element
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Date} dt The date that is exited
             * @param {Ext.Element} el The day Element that is exited
             */
            dayout: true,
            /**
             * @event editdetails
             * Fires when the user selects the option in this window to continue editing in the detailed edit form
             * (by default, an instance of {@link Extensible.calendar.form.EventDetails}. Handling code should hide this window
             * and transfer the current event record to the appropriate instance of the detailed form by showing it
             * and calling {@link Extensible.calendar.form.EventDetails#loadRecord loadRecord}.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} that is currently being edited
             * @param {Ext.Element} el The target element
             */
            editdetails: true,
            /**
             * @event eventadd
             * Fires after a new event has been added to the underlying store
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event has been updated
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel record} that was updated
             */
            eventupdate: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation has been canceled by the user and no store update took place
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The new {@link Extensible.calendar.data.EventModel record} that was canceled
             */
            eventcancel: true,
            /**
             * @event beforeeventdelete
             * Fires before an event is deleted by the user. This is a cancelable event, so returning false from a handler
             * will cancel the delete operation.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} for the event that was deleted
             * @param {Ext.Element} el The target element
             */
            beforeeventdelete: true,
            /**
             * @event eventdelete
             * Fires after an event has been deleted by the user. If you need to cancel the delete operation you should handle the
             * {@link #beforeeventdelete} event and return false from your handler function.
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record} for the event that was deleted
             * @param {Ext.Element} el The target element
             */
            eventdelete: true,
            /**
             * @event eventexception
             * Fires after an event has been processed via an Ext proxy and returned with an exception. This
             * could be because of a server error, or because the data returned <tt>success: false</tt>.
             *
             * The view provides default handling via the overrideable {@link #notifyOnException} method. If
             * any function handling this event returns false, the notifyOnException method will not be called.
             *
             * Note that only Server proxy and subclasses (including Ajax proxy) will raise this event.
             *
             * @param {Extensible.calendar.view.AbstractCalendar} this
             * @param {Object} response The raw response object returned from the server
             * @param {Ext.data.Operation} operation The operation that was processed
             * @since 1.6.0
             */
            eventexception: true
        });
    },

    afterRender: function() {
        this.callParent(arguments);

        this.renderTemplate();

        if (this.store) {
            this.setStore(this.store, true);
            if (this.store.deferLoad) {
                this.reloadStore(this.store.deferLoad);
                delete this.store.deferLoad;
            }
            else {
                this.store.initialParams = this.getStoreParams();
            }
        }
        if (this.calendarStore) {
            this.setCalendarStore(this.calendarStore, true);
        }

        this.on('resize', this.onResize, this);

        this.el.on({
            'mouseover': this.onMouseOver,
            'mouseout': this.onMouseOut,
            'click': this.onClick,
            //'resize': this.onResize,
            scope: this
        });

        // currently the context menu only contains CRUD actions so do not show it if read-only
        if (this.enableContextMenus && this.readOnly !== true) {
            this.el.on('contextmenu', this.onContextMenu, this);
        }

        this.el.unselectable();

        if (this.enableDD && this.readOnly !== true && this.initDD) {
            this.initDD();
        }

        this.on('eventsrendered', this.onEventsRendered);

        Ext.defer(this.forceSize, 100, this);
    },

    /**
     * Returns an object containing the start and end dates to be passed as params in all calls
     * to load the event store. The param names are customizable using {@link #dateParamStart}
     * and {@link #dateParamEnd} and the date format used in requests is defined by {@link #dateParamFormat}.
     * If you need to add additional parameters to be sent when loading the store see {@link #getStoreParams}.
     * @return {Object} An object containing the start and end dates
     */
    getStoreDateParams: function() {
        var o = {};
        o[this.dateParamStart] = Ext.Date.format(this.viewStart, this.dateParamFormat);
        o[this.dateParamEnd] = Ext.Date.format(this.viewEnd, this.dateParamFormat);
        return o;
    },

    /**
     * Returns an object containing all key/value params to be passed when loading the event store.
     * By default the returned object will simply be the same object returned by {@link #getStoreDateParams},
     * but this method is intended to be overridden if you need to pass anything in addition to start and end dates.
     * See the inline code comments when overriding for details.
     * @return {Object} An object containing all params to be sent when loading the event store
     */
    getStoreParams: function() {
        // This is needed if you require the default start and end dates to be included
        var params = this.getStoreDateParams();

        // Here is where you can add additional custom params, e.g.:
        // params.now = Ext.Date.format(new Date(), this.dateParamFormat);
        // params.foo = 'bar';
        // params.number = 123;

        return params;
    },

    /**
     * Reloads the view's underlying event store using the params returned from {@link #getStoreParams}.
     * Reloading the store is typically managed automatically by the view itself, but the method is
     * available in case a manual reload is ever needed.
     * @param {Object} options (optional) An object matching the format used by Store's {@link Ext.data.Store#load load} method
     */
    reloadStore: function(o) {
        Extensible.log('reloadStore');

        var recurrenceOptions = this.recurrenceOptions;

        o = Ext.isObject(o) ? o : {};
        o.params = o.params || {};

        Ext.apply(o.params, this.getStoreParams());

        if (this.recurrence && recurrenceOptions.expansionParam && recurrenceOptions.expansionMode === 'remote') {
            o.params[recurrenceOptions.expansionParam.name] = recurrenceOptions.expansionParam.value;
        }

        this.store.load(o);
    },

    onEventsRendered: function() {
        this.forceSize();
    },

    forceSize: function() {
        var el = this.el;
        
        if (el && el.down) {
            var hd = el.down('.ext-cal-hd-ct'),
                bd = el.down('.ext-cal-body-ct');

            if (!bd || !hd) {
                return;
            }

            var headerHeight = hd.getHeight(),
                sz = el.parent().getSize();

            bd.setHeight(sz.height - headerHeight);
        }
    },

    /**
     * Refresh the current view, optionally reloading the event store also. While this is normally
     * managed internally on any navigation and/or CRUD action, there are times when you might want
     * to refresh the view manually (e.g., if you'd like to reload using different {@link #getStoreParams params}).
     * @param {Boolean} reloadData True to reload the store data first, false to simply redraw the view using current
     * data (defaults to false)
     */
    refresh: function(reloadData) {
        if (!this.isActiveView()) {
            Extensible.log('refresh (AbstractCalendar), skipped for non-active view (' + this.id + ')');
            return;
        }
        Extensible.log('refresh (AbstractCalendar), reload = ' + reloadData);

        if (reloadData === true) {
            this.reloadStore();
        }
        else {
            this.prepareData();
            this.renderTemplate();
            this.renderItems();
        }
    },

    getWeekCount: function() {
        var days = Extensible.Date.diffDays(this.viewStart, this.viewEnd);
        return Math.ceil(days / this.dayCount);
    },
    
    prepareData: function() {
        var lastInMonth = Ext.Date.getLastDateOfMonth(this.startDate),
            w = 0,
            d = 0,
            row = 0,
            currentDt = Ext.Date.clone(this.viewStart),
            weeks = this.weekCount < 1 ? 6 : this.weekCount;

        this.eventGrid = [[]];
        this.allDayGrid = [[]];
        this.evtMaxCount = [];

        var evtsInView = this.store.queryBy(function(rec) {
            return this.isEventVisible(rec.data);
        }, this);
        
        var filterFn = function(rec) {
            var EventMappings = Extensible.calendar.data.EventMappings,
                startDt = Ext.Date.clearTime(rec.data[EventMappings.StartDate.name], true),
                startsOnDate = currentDt.getTime() === startDt.getTime(),
                spansFromPrevView = (w === 0 && d === 0 && (currentDt > rec.data[EventMappings.StartDate.name]));
    
            return startsOnDate || spansFromPrevView;
        };

        for (; w < weeks; w++) {
            this.evtMaxCount[w] = this.evtMaxCount[w] || 0;
            
            if (this.weekCount === -1 && currentDt > lastInMonth) {
                //current week is fully in next month so skip
                break;
            }
            this.eventGrid[w] = this.eventGrid[w] || [];
            this.allDayGrid[w] = this.allDayGrid[w] || [];

            for (d = 0; d < this.dayCount; d++) {
                if (evtsInView.getCount() > 0) {
                    var evts = evtsInView.filterBy(filterFn, this);

                    this.sortEventRecordsForDay(evts);
                    this.prepareEventGrid(evts, w, d);
                }
                currentDt = Extensible.Date.add(currentDt, {days: 1});
            }
        }
        this.currentWeekCount = w;
    },

    prepareEventGrid: function(evts, w, d) {
        var me = this,
            row = 0,
            dt = Ext.Date.clone(me.viewStart),
            maxEventsForDay;

        evts.each(function(evt) {
            var M = Extensible.calendar.data.EventMappings;

            if (Extensible.Date.diffDays(evt.data[M.StartDate.name], evt.data[M.EndDate.name]) > 0) {
                var daysInView = Extensible.Date.diffDays(
                    Extensible.Date.max(me.viewStart, evt.data[M.StartDate.name]),
                    Extensible.Date.min(me.viewEnd, evt.data[M.EndDate.name])) + 1;

                me.prepareEventGridSpans(evt, me.eventGrid, w, d, daysInView);
                me.prepareEventGridSpans(evt, me.allDayGrid, w, d, daysInView, true);
            }
            else {
                row = me.findEmptyRowIndex(w,d);
                me.eventGrid[w][d] = me.eventGrid[w][d] || [];
                me.eventGrid[w][d][row] = evt;

                if (evt.data[M.IsAllDay.name]) {
                    row = me.findEmptyRowIndex(w,d, true);
                    me.allDayGrid[w][d] = me.allDayGrid[w][d] || [];
                    me.allDayGrid[w][d][row] = evt;
                }
            }
            
            me.setMaxEventsForDay(w, d);

            return true;
        }, me);
    },
    
    setMaxEventsForDay: function(weekIndex, dayIndex) {
        var max = (this.maxEventsPerDay + 1) || 999;
        
        // If calculating the max event count for the day/week view header, use the allDayGrid
        // so that only all-day events displayed in that area get counted, otherwise count all events.
        var maxEventsForDay = this[this.isHeaderView ? 'allDayGrid' : 'eventGrid'][weekIndex][dayIndex] || [];
        
        this.evtMaxCount[weekIndex] = this.evtMaxCount[weekIndex] || 0;
        
        if (maxEventsForDay.length && this.evtMaxCount[weekIndex] < maxEventsForDay.length) {
            this.evtMaxCount[weekIndex] = Math.min(max, maxEventsForDay.length);
        }
    },

    prepareEventGridSpans: function(evt, grid, w, d, days, allday) {
        // this event spans multiple days/weeks, so we have to preprocess
        // the events and store special span events as placeholders so that
        // the render routine can build the necessary TD spans correctly.
        var w1 = w,
            d1 = d,
            row = this.findEmptyRowIndex(w,d,allday),
            dt = Ext.Date.clone(this.viewStart);

        var start = {
            event: evt,
            isSpan: true,
            isSpanStart: true,
            spanLeft: false,
            spanRight: (d === 6)
        };
        
        grid[w][d] = grid[w][d] || [];
        grid[w][d][row] = start;
        
        this.setMaxEventsForDay(w, d);
        
        while (--days) {
            dt = Extensible.Date.add(dt, {days: 1});
            
            if (dt > this.viewEnd) {
                break;
            }
            if (++d1 > 6) {
                // reset counters to the next week
                d1 = 0; w1++;
                row = this.findEmptyRowIndex(w1,0);
            }
            grid[w1] = grid[w1] || [];
            grid[w1][d1] = grid[w1][d1] || [];

            grid[w1][d1][row] = {
                event: evt,
                isSpan: true,
                isSpanStart: (d1 === 0),
                spanLeft: (w1 > w) && (d1 % 7 === 0),
                spanRight: (d1 === 6) && (days > 1)
            };
            
            // In this loop we are pre-processing empty span placeholders. In the case
            // where a given week might only contain such spans, we have to make this
            // max event check on each iteration to make sure that our empty placeholder
            // divs get created correctly even without "real" events:
            this.setMaxEventsForDay(w1, d1);
        }
    },

    findEmptyRowIndex: function(w, d, allday) {
        var grid = allday ? this.allDayGrid : this.eventGrid,
            day = grid[w] ? grid[w][d] || [] : [],
            i = 0,
            len = day.length;

        for (; i < len; i++) {
            if (!day[i]) {
                return i;
            }
        }
        return len;
    },

    renderTemplate: function() {
        if (this.tpl) {
            this.tpl.overwrite(this.el, this.getTemplateParams());
            this.lastRenderStart = Ext.Date.clone(this.viewStart);
            this.lastRenderEnd = Ext.Date.clone(this.viewEnd);
        }
    },

    getTemplateParams: function() {
        return {
            viewStart: this.viewStart,
            viewEnd: this.viewEnd,
            startDate: this.startDate,
            dayCount: this.dayCount,
            weekCount: this.weekCount,
            weekendCls: this.weekendCls,
            prevMonthCls: this.prevMonthCls,
            nextMonthCls: this.nextMonthCls,
            todayCls: this.todayCls
        };
    },

    /**
     * Disable store event monitoring within this view. Note that if you do this the view will no longer
     * refresh itself automatically when CRUD actions occur. To enable store events see {@link #enableStoreEvents}.
     * @return {CalendarView} this
     */
    disableStoreEvents: function() {
        this.monitorStoreEvents = false;
        return this;
    },

    /**
     * Enable store event monitoring within this view if disabled by {@link #disbleStoreEvents}.
     * @return {CalendarView} this
     */
    enableStoreEvents: function(refresh) {
        this.monitorStoreEvents = true;
        if (refresh === true) {
            this.refresh();
        }
        return this;
    },

    onResize: function() {
        this.refresh(false);
    },

    onInitDrag: function() {
        this.fireEvent('initdrag', this);
    },

    onEventDrop: function(rec, dt, mode) {
        this[(mode || 'move') + 'Event'](rec, dt);
    },

    onCalendarEndDrag: function(start, end, onComplete) {
        // set this flag for other event handlers that might conflict while we're waiting
        this.dragPending = true;

        var dates = {},
            boundOnComplete = Ext.bind(this.onCalendarEndDragComplete, this, [onComplete]);

        dates[Extensible.calendar.data.EventMappings.StartDate.name] = start;
        dates[Extensible.calendar.data.EventMappings.EndDate.name] = end;

        if (this.fireEvent('rangeselect', this, dates, boundOnComplete) !== false) {
            this.showEventEditor(dates, null);
            
            if (this.editWin) {
                this.editWin.on('hide', boundOnComplete, this, {single:true});
            }
            else {
                boundOnComplete();
            }
        }
        else {
            // client code canceled the selection so clean up immediately
            this.onCalendarEndDragComplete(boundOnComplete);
        }
    },

    onCalendarEndDragComplete: function(onComplete) {
        // callback for the drop zone to clean up
        onComplete();
        // clear flag for other events to resume normally
        this.dragPending = false;
    },

    /**
     * Refresh the view. Determine if a store reload is required after a given CRUD operation.
     * @param {String} action One of 'create', 'update' or 'delete'
     * @param {Ext.data.Operation} operation The affected operation
     */
    refreshAfterEventChange: function(action, operation) {
        // Determine if a store reload is needed. A store reload is needed if the event is recurring after being
        // edited or was recurring before being edited AND an event store reload has not been triggered already for
        // this operation. If an event is not currently recurring (isRecurring = false) but still has an instance
        // start date set, then it must have been recurring and edited to no longer recur.
        var RInstanceStartDate = Extensible.calendar.data.EventMappings.RInstanceStartDate,
            isInstance = RInstanceStartDate && !!operation.records[0].get(RInstanceStartDate.name),
            reload = (operation.records[0].isRecurring() || isInstance) && !operation.wasStoreReloadTriggered;

        if (reload) {
            // For calendar views with a body and a header component (e.g. weekly view, day view), this function is
            // called twice. Ensure that a store reload is triggered only once for the same operation.
            operation.wasStoreReloadTriggered = true;
        }
        this.refresh(reload);
    },

    onUpdate: function(store, operation, updateType) {
        if (this.hidden === true || this.ownerCt.hidden === true || this.monitorStoreEvents === false) {
            // Hidden calendar view don't need to be refreshed. For views composed of header and body (for example
            // Extensible.calendar.view.Day or Extensible.calendar.view.Week) we need to check the ownerCt to find out
            // if a view is hidden.
            return;
        }
        if (updateType === Ext.data.Record.COMMIT) {
            Extensible.log('onUpdate');
            this.dismissEventEditor();

            this.refreshAfterEventChange('update', operation);

            var rec = operation.records[0];

            if (this.enableFx && this.enableUpdateFx) {
                this.doUpdateFx(this.getEventEls(rec.data[Extensible.calendar.data.EventMappings.EventId.name]), {
                    scope: this
                });
            }
        }
    },

    /**
     * Provides the element effect(s) to run after an event is updated. The method is passed a {@link Ext.CompositeElement}
     * that contains one or more elements in the DOM representing the event that was updated. The default
     * effect is {@link Ext.Element#highlight highlight}. Note that this method will only be called when
     * {@link #enableUpdateFx} is true (it is false by default).
     * @param {Ext.CompositeElement} el The {@link Ext.CompositeElement} representing the updated event
     * @param {Object} options An options object to be passed through to any Element.Fx methods. By default this
     * object only contains the current scope (<tt>{scope:this}</tt>) but you can also add any additional fx-specific
     * options that might be needed for a particular effect to this object.
     */
    doUpdateFx: function(els, o) {
        this.highlightEvent(els, null, o);
    },

    onAdd: function(store, operation) {
        var rec = operation.records[0];

        if (this.hidden === true || this.ownerCt.hidden === true || this.monitorStoreEvents === false) {
            // Hidden calendar view don't need to be refreshed. For views composed of header and body (for example
            // Extensible.calendar.view.Day or Extensible.calendar.view.Week) we need to check the ownerCt to find out
            // if a view is hidden.
            return;
        }
        // if (rec._deleting) {
            // delete rec._deleting;
            // return;
        // }

        Extensible.log('onAdd');

        this.dismissEventEditor();
        //this.tempEventId = rec.id;

        this.refreshAfterEventChange('create', operation);

        // if (this.enableFx && this.enableAddFx) {
            // this.doAddFx(this.getEventEls(rec.data[Extensible.calendar.data.EventMappings.EventId.name]), {
                // scope: this
            // });
        // }
    },

    /**
     * Provides the element effect(s) to run after an event is added. The method is passed a {@link Ext.CompositeElement}
     * that contains one or more elements in the DOM representing the event that was added. The default
     * effect is {@link Ext.Element#fadeIn fadeIn}. Note that this method will only be called when
     * {@link #enableAddFx} is true (it is true by default).
     * @param {Ext.CompositeElement} el The {@link Ext.CompositeElement} representing the added event
     * @param {Object} options An options object to be passed through to any Element.Fx methods. By default this
     * object only contains the current scope (<tt>{scope:this}</tt>) but you can also add any additional fx-specific
     * options that might be needed for a particular effect to this object.
     */
    doAddFx: function(els, o) {
        els.fadeIn(Ext.apply(o, { duration: 2000 }));
    },

    onRemove: function(store, operation) {
        if (this.hidden === true || this.ownerCt.hidden === true || this.monitorStoreEvents === false) {
            // Hidden calendar view don't need to be refreshed. For views composed of header and body (for example
            // Extensible.calendar.view.Day or Extensible.calendar.view.Week) we need to check the ownerCt to find out
            // if a view is hidden.
            return;
        }

        Extensible.log('onRemove');
        this.dismissEventEditor();

        var rec = operation.records[0];

        if (this.enableFx && this.enableRemoveFx) {
            this.doRemoveFx(this.getEventEls(rec.data[Extensible.calendar.data.EventMappings.EventId.name]), {
                remove: true,
                scope: this,
                callback: Ext.bind(this.refreshAfterEventChange, this, ['delete', operation])
            });
        }
        else {
            this.getEventEls(rec.data[Extensible.calendar.data.EventMappings.EventId.name]).remove();
            this.refreshAfterEventChange('delete', operation);
        }
    },

    /**
     * Provides the element effect(s) to run after an event is removed. The method is passed a {@link Ext.CompositeElement}
     * that contains one or more elements in the DOM representing the event that was removed. The default
     * effect is {@link Ext.Element#fadeOut fadeOut}. Note that this method will only be called when
     * {@link #enableRemoveFx} is true (it is true by default).
     * @param {Ext.CompositeElement} el The {@link Ext.CompositeElement} representing the removed event
     * @param {Object} options An options object to be passed through to any Element.Fx methods. By default this
     * object contains the following properties:
     *		{
     *			remove: true, // required by fadeOut to actually remove the element(s)
     *			scope: this,  // required for the callback
     *			callback: fn  // required to refresh the view after the fx finish
     *		}
     * While you can modify this options object as needed if you change the effect used, please note that the
     * callback method (and scope) MUST still be passed in order for the view to refresh correctly after the removal.
     * Please see the inline code comments before overriding this method.
     */
    doRemoveFx: function(els, o) {
        // Please make sure you keep this entire code block or removing events might not work correctly!
        // Removing is a little different because we have to wait for the fx to finish, then we have to actually
        // refresh the view AFTER the fx are run (this is different than add and update).
        if (els.getCount() === 0 && Ext.isFunction(o.callback)) {
            // if there are no matching elements in the view make sure the callback still runs.
            // this can happen when an event accessed from the "more" popup is deleted.
            o.callback.call(o.scope || this);
        }
        else {
            // If you'd like to customize the remove fx do so here. Just make sure you
            // DO NOT override the default callback property on the options object, and that
            // you still pass that object in whatever fx method you choose.
            els.fadeOut(o);
        }
    },

    /**
     * Visually highlights an event using {@link Ext.Fx#highlight} config options.
     * @param {Ext.CompositeElement} els The element(s) to highlight
     * @param {Object} color (optional) The highlight color. Should be a 6 char hex
     * color without the leading # (defaults to yellow: 'ffff9c')
     * @param {Object} o (optional) Object literal with any of the {@link Ext.Fx} config
     * options. See {@link Ext.Fx#highlight} for usage examples.
     */
    highlightEvent: function(els, color, o) {
        if (this.enableFx) {
            if (Ext.isIE || Ext.isOpera) {
                // Fun IE/Opera handling:
                var highlightEl;
                
                els.each(function(el) {
                    el.highlight(color, Ext.applyif ({attr:'color'}, o));
                    var highlightEl = el.down('.ext-cal-evm');
                    
                    if (highlightEl) {
                        highlightEl.highlight(color, o);
                    }
                }, this);
            }
            else {
                els.highlight(color, o);
            }
        }
    },

    /**
     * Retrieve an Event object's id from its corresponding node in the DOM.
     * @param {String/Element/HTMLElement} el An {@link Ext.Element}, DOM node or id
     */
    getEventIdFromEl: function(el) {
        el = Ext.get(el);
        var parts, id = '', cls, classes = el.dom.className.split(' ');

        Ext.each(classes, function(cls) {
            parts = cls.split(this.eventElIdDelimiter);
            if (parts.length > 1) {
                id = parts[1];
                return false;
            }
        }, this);

        return id;
    },

    getEventId: function(eventId) {
        if (eventId === undefined && this.tempEventId) {
            // temp record id assigned during an add, will be overwritten later
            eventId = this.tempEventId;
        }
        return eventId;
    },

    /**
     *
     * @param {String} eventId
     * @param {Boolean} forSelect
     * @return {String} The selector class
     */
    getEventSelectorCls: function(eventId, forSelect) {
        var prefix = forSelect ? '.' : '',
            id = this.getEventId(eventId),
            cls = prefix + this.id + this.eventElIdDelimiter + id;

        return cls;
    },

    /**
     *
     * @param {String} eventId
     * @return {Ext.dom.CompositeElement} The matching CompositeElement of nodes
     * that comprise the rendered event.  Any event that spans across a view
     * boundary will contain more than one internal Element.
     */
    getEventEls: function(eventId) {
        var els = this.el.select(this.getEventSelectorCls(this.getEventId(eventId), true), false);
        return Ext.create('Ext.CompositeElement', els);
    },

    /**
     * Returns true if the view is currently displaying today's date, else false.
     * @return {Boolean} True or false
     */
    isToday: function() {
        var today = Ext.Date.clearTime(new Date()).getTime();
        return this.viewStart.getTime() <= today && this.viewEnd.getTime() >= today;
    },

    isEventVisible: function(evt) {
        var eventMappings = Extensible.calendar.data.EventMappings,
            calendarMappings = Extensible.calendar.data.CalendarMappings,
            data = evt.data || evt,
            calRec = this.calendarStore ? this.calendarStore.findRecord(calendarMappings.CalendarId.name,
                evt[eventMappings.CalendarId.name]) : null;

        if (calRec && calRec.data[calendarMappings.IsHidden.name] === true) {
            // if the event is on a hidden calendar then no need to test the date boundaries
            return false;
        }

        var start = this.viewStart.getTime(),
            end = this.viewEnd.getTime(),
            evStart = data[eventMappings.StartDate.name].getTime(),
            evEnd = data[eventMappings.EndDate.name].getTime();

        return Extensible.Date.rangesOverlap(start, end, evStart, evEnd);
    },

    isOverlapping: function(evt1, evt2) {
        var ev1 = evt1.data ? evt1.data : evt1,
            ev2 = evt2.data ? evt2.data : evt2,
            M = Extensible.calendar.data.EventMappings,
            start1 = ev1[M.StartDate.name].getTime(),
            end1 = Extensible.Date.add(ev1[M.EndDate.name], {seconds: -1}).getTime(),
            start2 = ev2[M.StartDate.name].getTime(),
            end2 = Extensible.Date.add(ev2[M.EndDate.name], {seconds: -1}).getTime(),
            startDiff = Extensible.Date.diff(ev1[M.StartDate.name], ev2[M.StartDate.name], 'm');

            if (end1<start1) {
                end1 = start1;
            }
            if (end2<start2) {
                end2 = start2;
            }

//            var ev1startsInEv2 = (start1 >= start2 && start1 <= end2),
//            ev1EndsInEv2 = (end1 >= start2 && end1 <= end2),
//            ev1SpansEv2 = (start1 < start2 && end1 > end2),
            var evtsOverlap = Extensible.Date.rangesOverlap(start1, end1, start2, end2),
                minimumMinutes = this.minEventDisplayMinutes || 0, // applies in day/week body view only for vertical overlap
                ev1MinHeightOverlapsEv2 = minimumMinutes > 0 && (startDiff > -minimumMinutes && startDiff < minimumMinutes);

        //return (ev1startsInEv2 || ev1EndsInEv2 || ev1SpansEv2 || ev1MinHeightOverlapsEv2);
        return (evtsOverlap || ev1MinHeightOverlapsEv2);
    },

    isEventSpanning: function(evt) {
        var M = Extensible.calendar.data.EventMappings,
            data = evt.data || evt,
            diff;

        diff = Extensible.Date.diffDays(data[M.StartDate.name], data[M.EndDate.name]);

        //TODO: Prevent 00:00 end time from causing a span. This logic is OK, but
        //      other changes are still needed for it to work fully. Deferring for now.
//        if (diff <= 1 && Extensible.Date.isMidnight(data[M.EndDate.name])) {
//            return false;
//        }
        return diff > 0;
    },

    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    /**
     * Returns the start date of the view, as set by {@link #setStartDate}. Note that this may not
     * be the first date displayed in the rendered calendar -- to get the start and end dates displayed
     * to the user use {@link #getViewBounds}.
     * @return {Date} The start date
     */
    getStartDate: function() {
        return this.startDate;
    },

    /**
     * Sets the start date used to calculate the view boundaries to display. The displayed view will be the
     * earliest and latest dates that match the view requirements and contain the date passed to this function.
     * @param {Date} dt The date used to calculate the new view boundaries
     */
    setStartDate: function(start, /*private*/reload) {
        var me = this;

        Extensible.log('setStartDate (base) '+Ext.Date.format(start, 'Y-m-d'));

        var cloneDt = Ext.Date.clone,
            cloneStartDate = me.startDate ? cloneDt(me.startDate) : null,
            cloneStart = cloneDt(start),
            cloneViewStart = me.viewStart ? cloneDt(me.viewStart) : null,
            cloneViewEnd = me.viewEnd ? cloneDt(me.viewEnd) : null;

        if (me.fireEvent('beforedatechange', me, cloneStartDate, cloneStart, cloneViewStart, cloneViewEnd) !== false) {
            me.startDate = Ext.Date.clearTime(start);
            me.setViewBounds(start);

            if (me.ownerCalendarPanel && me.ownerCalendarPanel.startDate !== me.startDate) {
                // Sync the owning CalendarPanel's start date directly, not via CalendarPanel.setStartDate(),
                // since that would in turn call this method again.
                me.ownerCalendarPanel.startDate = me.startDate;
            }

            if (me.rendered) {
                me.refresh(reload);
            }
            me.fireEvent('datechange', me, cloneDt(me.startDate), cloneDt(me.viewStart), cloneDt(me.viewEnd));
        }
    },

    setViewBounds: function(startDate) {
        var me = this,
            start = startDate || me.startDate,
            offset = start.getDay() - me.startDay,
            Dt = Extensible.Date;

        if (offset < 0) {
            // if the offset is negative then some days will be in the previous week so add a week to the offset
            offset += 7;
        }
        switch(this.weekCount) {
            case 0:
            case 1:
                me.viewStart = me.dayCount < 7 && !me.startDayIsStatic ?
                    start: Dt.add(start, {days: -offset, clearTime: true});
                me.viewEnd = Dt.add(me.viewStart, {days: me.dayCount || 7, seconds: -1});
                return;

            case -1:
                // auto by month
                start = Ext.Date.getFirstDateOfMonth(start);
                offset = start.getDay() - me.startDay;
                if (offset < 0) {
                    // if the offset is negative then some days will be in the previous week so add a week to the offset
                    offset += 7;
                }
                me.viewStart = Dt.add(start, {days: -offset, clearTime: true});

                // start from current month start, not view start:
                var end = Dt.add(start, {months: 1, seconds: -1});

                // fill out to the end of the week:
                offset = me.startDay;
                if (offset > end.getDay()) {
                    // if the offset is larger than the end day index then the last row will be empty so skip it
                    offset -= 7;
                }

                me.viewEnd = Dt.add(end, {days: 6 - end.getDay() + offset});
                return;

            default:
                me.viewStart = Dt.add(start, {days: -offset, clearTime: true});
                me.viewEnd = Dt.add(me.viewStart, {days: me.weekCount * 7, seconds: -1});
        }
    },

    /**
     * Returns the start and end boundary dates currently displayed in the view. The method
     * returns an object literal that contains the following properties:
     *
     *	* **start** Date: The start date of the view
     *	* **end** Date: The end date of the view
     * 
     * For example:
     *		var bounds = view.getViewBounds();
     *		alert('Start: '+bounds.start);
     *		alert('End: '+bounds.end);
     * @return {Object} An object literal containing the start and end values
     */
    getViewBounds: function() {
        return {
            start: this.viewStart,
            end: this.viewEnd
        };
    },

    /* private
     * Sort events for a single day for display in the calendar.  This sorts allday
     * events first, then non-allday events are sorted either based on event start
     * priority or span priority based on the value of {@link #spansHavePriority}
     * (defaults to event start priority).
     * @param {MixedCollection} evts A {@link Ext.util.MixedCollection MixedCollection}
     * of {@link #Extensible.calendar.data.EventModel EventRecord} objects
     */
    sortEventRecordsForDay: function(evts) {
        if (evts.length < 2) {
            return;
        }
        evts.sortBy(Ext.bind(function(evtA, evtB) {
            var a = evtA.data,
                b = evtB.data,
                M = Extensible.calendar.data.EventMappings;

            // Always sort all day events before anything else
            if (a[M.IsAllDay.name]) {
                return -1;
            }
            else if (b[M.IsAllDay.name]) {
                return 1;
            }
            if (this.spansHavePriority) {
                // This logic always weights span events higher than non-span events
                // (at the possible expense of start time order). This seems to
                // be the approach used by Google calendar and can lead to a more
                // visually appealing layout in complex cases, but event order is
                // not guaranteed to be consistent.
                var diff = Extensible.Date.diffDays;
                if (diff(a[M.StartDate.name], a[M.EndDate.name]) > 0) {
                    if (diff(b[M.StartDate.name], b[M.EndDate.name]) > 0) {
                        // Both events are multi-day
                        if (a[M.StartDate.name].getTime() === b[M.StartDate.name].getTime()) {
                            // If both events start at the same time, sort the one
                            // that ends later (potentially longer span bar) first
                            return b[M.EndDate.name].getTime() - a[M.EndDate.name].getTime();
                        }
                        return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
                    }
                    return -1;
                }
                else if (diff(b[M.StartDate.name], b[M.EndDate.name]) > 0) {
                    return 1;
                }
                return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
            }
            else {
                // Doing this allows span and non-span events to intermingle but
                // remain sorted sequentially by start time. This seems more proper
                // but can make for a less visually-compact layout when there are
                // many such events mixed together closely on the calendar.
                return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
            }
        }, this));
    },

    /**
     * Updates the view to contain the passed date
     * @param {Date} dt The date to display
     */
    moveTo: function(dt, /*private*/reload) {
        if (Ext.isDate(dt)) {
            this.setStartDate(dt, reload);
            return this.startDate;
        }
        return dt;
    },

    /**
     * Updates the view to the next consecutive date(s)
     * @return {Date} The new view start date
     */
    moveNext: function(/*private*/reload) {
        return this.moveTo(Extensible.Date.add(this.viewEnd, {days: 1}), reload);
    },

    /**
     * Updates the view to the previous consecutive date(s)
     * @return {Date} The new view start date
     */
    movePrev: function(/*private*/reload) {
        var days = Extensible.Date.diffDays(this.viewStart, this.viewEnd)+1;
        return this.moveDays(-days, reload);
    },

    /**
     * Shifts the view by the passed number of months relative to the currently set date
     * @param {Number} value The number of months (positive or negative) by which to shift the view
     * @return {Date} The new view start date
     */
    moveMonths: function(value, /*private*/reload) {
        return this.moveTo(Extensible.Date.add(this.startDate, {months: value}), reload);
    },

    /**
     * Shifts the view by the passed number of weeks relative to the currently set date
     * @param {Number} value The number of weeks (positive or negative) by which to shift the view
     * @return {Date} The new view start date
     */
    moveWeeks: function(value, /*private*/reload) {
        return this.moveTo(Extensible.Date.add(this.startDate, {days: value * 7}), reload);
    },

    /**
     * Shifts the view by the passed number of days relative to the currently set date
     * @param {Number} value The number of days (positive or negative) by which to shift the view
     * @return {Date} The new view start date
     */
    moveDays: function(value, /*private*/reload) {
        return this.moveTo(Extensible.Date.add(this.startDate, {days: value}), reload);
    },

    /**
     * Updates the view to show today
     * @return {Date} Today's date
     */
    moveToday: function(/*private*/reload) {
        return this.moveTo(new Date(), reload);
    },

    /**
     * Sets the event store used by the calendar to display {@link Extensible.calendar.data.EventModel events}.
     * @param {Ext.data.Store} store
     */
    setStore: function(store, initial) {
        var currStore = this.store;

        if (!initial && currStore) {
            currStore.un("load", this.onEventStoreLoad, this);
            currStore.un("clear", this.refresh, this);
            currStore.un("write", this.onWrite, this);
            // Note that this handler is attached to the proxy's exception event. In Ext 4 the store no longer
            // raises an exception event. Store.sync() does accept a callback argument in 4.1+, but in 4.0.x
            // unfortunately the only way to handle this is directly on the proxy, so for ease of compatibility
            // that's what we're doing here.
            currStore.getProxy().un("exception", this.onException, this);
        }
        if (store) {
            store.on("load", this.onEventStoreLoad, this);
            store.on("clear", this.refresh, this);
            store.on("write", this.onWrite, this);
            store.getProxy().on("exception", this.onException, this);
        }
        this.store = store;
    },
    
    onEventStoreLoad: function(store, recs, successful) {
        Extensible.log('AbstractCalendar.onEventStoreLoad: store loaded');
        this.refresh(false);
    },
    
    // No longer used, but kept here for compatibility
    onDataChanged: this.onEventStoreLoad,

    /**
     * This method handles internal housekeeping for cleaning up unsaved records in the store, and also
     * calls {@link #notifyOnException} to provide an easily overrideable mechanism for customizing if/how
     * the user should be notified when an error occurs.
     * @private
     */
    onException: function(proxy, response, operation) {
        // Form edits are explicitly canceled, but we may not know if a drag/drop operation
        // succeeded until after a server round trip. If the server action failed for any reason we have to
        // explicitly reject the changes so that the record doesn't stick around in the store's modified list
        // if the user cancels the action without successfully persisting the change to the server.
        Ext.each(operation.records, function(rec) {
            if (rec.dirty) {
                if (rec.phantom) {
                    rec.unjoin(this.eventStore);
                }
                else {
                    rec.reject();
                }
            }
        }, this);
        
        if (this.fireEvent('eventexception', this, response, operation) !== false) {
            this.notifyOnException(response, operation);
        }
    },
    
    /**
     * Returns the message to display from {@link #notifyOnException}, generated automatically
     * from the server response and operation objects.
     * @protected
     * @since 1.6.0
     */
    getExceptionMessage: function(response, operation) {
        var msg = '';
        
        if (response.responseText) {
            msg += '<br><b>responseText</b>: ' + response.responseText;
        }
        if (response.message) {
            msg += '<br><b>message</b>: ' + response.message;
        }
        if (response.status) {
            msg += '<br><b>status</b>: ' + response.status;
        }
        if (response.statusText) {
            msg += '<br><b>statusText</b>: ' + response.statusText;
        }
        if (operation.error && operation.error.length) {
            msg += '<br><b>processing error</b>: ' + operation.error;
        }
        
        return msg || ('<br>' + this.notifyOnExceptionDefaultMessage);
    },
    
    /**
     * This is an overrideable method for notifying the user when an exception occurs while attempting to
     * process records via a proxy. The default implementation is to display a standard Ext MessageBox with
     * the returned error message, but you can override this method to provide any desired notification.
     *
     * Note that the view will also raise the {@link #eventexception} event automatically. Event handling
     * functions can return false to bypass this method if application-specific code might conditionally
     * handle exceptions, and still fall back to this method in other cases. To bypass this method globally
     * you can simply remove it like so (or you could do the same thing in a view subclass):
     *		Ext.override(Extensible.calendar.view.AbstractCalendar, {
     *			notifyOnException: Ext.emptyFn
     *		});
     * @param {Object} response The raw response object returned from the server
     * @param {Ext.data.Operation} operation The operation that was processed
     * @since 1.6.0
     */
    notifyOnException: function(response, operation) {
        Ext.Msg.alert(this.notifyOnExceptionTitle, this.notifyOnExceptionText + '<br>' +
            this.getExceptionMessage(response, operation));
    },

    /**
     * Sets the calendar store used by the calendar (contains records of type {@link Extensible.calendar.data.CalendarModel CalendarRecord}).
     * @param {Ext.data.Store} store
     */
    setCalendarStore: function(store, initial) {
        if (!initial && this.calendarStore) {
            this.calendarStore.un("datachanged", this.refresh, this);
            this.calendarStore.un("add", this.refresh, this);
            this.calendarStore.un("remove", this.refresh, this);
            this.calendarStore.un("update", this.refresh, this);
        }
        if (store) {
            store.on("datachanged", this.refresh, this);
            store.on("add", this.refresh, this);
            store.on("remove", this.refresh, this);
            store.on("update", this.refresh, this);
        }
        this.calendarStore = store;
    },

    getEventRecord: function(id) {
        var idx = this.store.find(Extensible.calendar.data.EventMappings.EventId.name, id,
            0,     // start index
            false, // match any part of string
            true,  // case sensitive
            true   // force exact match
        );
        return this.store.getAt(idx);
    },

    getEventRecordFromEl: function(el) {
        return this.getEventRecord(this.getEventIdFromEl(el));
    },

    getEventEditor: function() {
        // only create one instance of the edit window, even if there are multiple CalendarPanels
        this.editWin = this.editWin || Ext.WindowMgr.get('ext-cal-editwin');

        if (!this.editWin) {
            this.editWin = Ext.create('Extensible.calendar.form.EventWindow', {
                id: 'ext-cal-editwin',
                calendarStore: this.calendarStore,
                modal: this.editModal,
                enableEditDetails: this.enableEditDetails,
                startDay: this.startDay,

                listeners: {
                    'eventadd': {
                        fn: function(win, rec, animTarget, options) {
                            //win.hide(animTarget);
                            win.currentView.onEventEditorAdd(null, rec, options);
                        },
                        scope: this
                    },
                    'eventupdate': {
                        fn: function(win, rec, animTarget, options) {
                            //win.hide(animTarget);
                            win.currentView.onEventEditorUpdate(null, rec, options);
                        },
                        scope: this
                    },
                    'eventdelete': {
                        fn: function(win, rec, animTarget, options) {
                            //win.hide(animTarget);
                            win.currentView.onEventEditorDelete(null, rec, options);
                        },
                        scope: this
                    },
                    'editdetails': {
                        fn: function(win, rec, animTarget, view) {
                            // explicitly do not animate the hide when switching to detail
                            // view as it looks weird visually
                            win.animateTarget = null;
                            win.hide();
                            win.currentView.fireEvent('editdetails', win.currentView, rec);
                        },
                        scope: this
                    },
                    'eventcancel': {
                        fn: function(win, rec, animTarget) {
                            this.dismissEventEditor(null, animTarget);
                            win.currentView.onEventEditorCancel();
                        },
                        scope: this
                    }
                }
            });
        }

        // allows the window to reference the current scope in its callbacks
        this.editWin.currentView = this;
        return this.editWin;
    },

    /**
     * Show the currently configured event editor view (by default the shared instance of
     * {@link Extensible.calendar.form.EventWindow EventEditWindow}).
     * @param {Extensible.calendar.data.EventModel} rec The event record
     * @param {Ext.Element/HTMLNode} animateTarget The reference element that is being edited. By default this is
     * used as the target for animating the editor window opening and closing. If this method is being overridden to
     * supply a custom editor this parameter can be ignored if it does not apply.
     * @return {Extensible.calendar.view.AbstractCalendar} this
     */
    showEventEditor: function(rec, animateTarget) {
        this.getEventEditor().show(rec, animateTarget, this);
        return this;
    },

    /**
     * Dismiss the currently configured event editor view (by default the shared instance of
     * {@link Extensible.calendar.form.EventWindow EventEditWindow}, which will be hidden).
     * @param {String} dismissMethod (optional) The method name to call on the editor that will dismiss it
     * (defaults to 'hide' which will be called on the default editor window)
     * @return {Extensible.calendar.view.AbstractCalendar} this
     */
    dismissEventEditor: function(dismissMethod, /*private*/ animTarget) {
        if (this.newRecord && this.newRecord.phantom) {
            this.store.remove(this.newRecord);
        }
        delete this.newRecord;

        // grab the manager's ref so that we dismiss it properly even if the active view has changed
        var editWin = Ext.WindowMgr.get('ext-cal-editwin');
        if (editWin) {
            editWin[dismissMethod ? dismissMethod : 'hide'](animTarget);
        }
        return this;
    },

    save: function() {
        // If the store is configured as autoSync:true the record's endEdit
        // method will have already internally caused a save to execute on
        // the store. We only need to save manually when autoSync is false,
        // otherwise we'll create duplicate transactions.
        if (!this.store.autoSync) {
            this.store.sync();
        }
    },

    onWrite: function(store, operation) {
        if (operation.wasSuccessful()) {
            //var rec = operation.records[0];

            switch(operation.action) {
                case 'create':
                    this.onAdd(store, operation);
                    break;
                case 'update':
                    this.onUpdate(store, operation, Ext.data.Record.COMMIT);
                    break;
                case 'destroy':
                    this.onRemove(store, operation);
                    break;
            }
        }
    },

    onEventEditorAdd: function(form, rec) {
        this.newRecord = rec;

        if (this.store.indexOf(rec) === -1) {
            this.store.add(rec);
        }
        this.save();
        this.fireEvent('eventadd', this, rec);
    },

    onEventEditorUpdate: function(form, rec) {
        this.save();
        this.fireEvent('eventupdate', this, rec);
    },

    onEventEditorDelete: function(form, rec) {
        rec._deleting = true;
        this.deleteEvent(rec);
    },

    onEventEditorCancel: function(form, rec) {
        this.fireEvent('eventcancel', this, rec);
    },

    // called from subclasses
    onDayClick: function(dt, ad, el) {
        if (this.readOnly === true) {
            return;
        }
        if (this.fireEvent('dayclick', this, Ext.Date.clone(dt), ad, el) !== false) {
            var M = Extensible.calendar.data.EventMappings,
                data = {};

            data[M.StartDate.name] = dt;
            data[M.IsAllDay.name] = ad;

            this.showEventEditor(data, el);
        }
    },

    showEventMenu: function(el, xy) {
        var me = this;

        if (!me.eventMenu) {
            me.eventMenu = Ext.create('Extensible.calendar.menu.Event', {
                startDay: me.startDay,
                ownerCalendarPanel: me,
                listeners: {
                    'editdetails': Ext.bind(me.onEditDetails, me),
                    'eventdelete': Ext.bind(me.onDeleteEvent, me),
                    'eventmove'  : Ext.bind(me.onMoveEvent, me),
                    'eventcopy'  : Ext.bind(me.onCopyEvent, me)
                }
            });
        }

        me.eventMenu.showForEvent(me.getEventRecordFromEl(el), el, xy);
        me.menuActive = true;
    },

    onCopyEvent: function(menu, rec, newStartDate) {
        this.menuActive = false;
        this.shiftEvent(rec, newStartDate, 'copy');
    },

    onMoveEvent: function(menu, rec, newStartDate) {
        this.menuActive = false;
        this.shiftEvent(rec, newStartDate, 'move');
    },

    /**
     * Create a copy of the event with a new start date, preserving the original event duration.
     * @param {Object} rec The original event {@link Extensible.calendar.data.EventModel record}
     * @param {Object} newStartDate The new start date. The end date of the created event copy will be adjusted
     * automatically to preserve the original duration.
     */
    copyEvent: function(rec, newStartDate) {
        this.shiftEvent(rec, newStartDate, 'copy');
    },

    /**
     * Move the event to a new start date, preserving the original event duration.
     * @param {Object} rec The event {@link Extensible.calendar.data.EventModel record}
     * @param {Object} newStartDate The new start date
     */
    moveEvent: function(rec, newStartDate) {
        this.shiftEvent(rec, newStartDate, 'move');
    },

    shiftEvent: function(rec, newStartDate, moveOrCopy) {
        var me = this,
            newRec;

        if (moveOrCopy === 'move') {
            if (Extensible.Date.compare(rec.getStartDate(), newStartDate) === 0) {
                // No changes, so we aren't actually moving. Copying to the same date is OK.
                return;
            }
            newRec = rec;
        }
        else {
            newRec = rec.clone();
        }

        if (me.fireEvent('beforeevent' + moveOrCopy, me, newRec, Ext.Date.clone(newStartDate)) !== false) {
            if (newRec.isRecurring()) {
                //if (me.recurrenceOptions.editSingleOnDrag) {
                    me.onRecurrenceEditModeSelected('single', newRec, newStartDate, moveOrCopy);
                //}
                // else {
                    // Extensible.form.recurrence.RangeEditWindow.prompt({
                        // callback: Ext.bind(me.onRecurrenceEditModeSelected, me, [newRec, newStartDate, moveOrCopy], true),
                        // editModes: ['single', 'future'],
                        // scope: me
                    // });
                // }
            }
            else {
                me.doShiftEvent(newRec, newStartDate, moveOrCopy);
            }
        }
    },

    onRecurrenceEditModeSelected: function(editMode, rec, newStartDate, moveOrCopy) {
        var EventMappings = Extensible.calendar.data.EventMappings;

        if (editMode) {
            if (moveOrCopy === 'copy') {
                rec.clearRecurrence();
            }
            rec.data[EventMappings.REditMode.name] = editMode;
            rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            this.doShiftEvent(rec, newStartDate, moveOrCopy);
        }
        // else user canceled
    },

    doShiftEvent: function(rec, newStartDate, moveOrCopy) {
        var EventMappings = Extensible.calendar.data.EventMappings,
            diff = newStartDate.getTime() - rec.getStartDate().getTime(),
            updateData = {};

        updateData[EventMappings.StartDate.name] = newStartDate;
        updateData[EventMappings.EndDate.name] = Extensible.Date.add(rec.getEndDate(), {millis: diff});

        rec.set(updateData);

        if (rec.phantom) {
            this.store.add(rec);
        }

        this.save();
        this.fireEvent('event' + moveOrCopy, this, rec);
    },

    onEditDetails: function(menu, rec, el) {
        this.fireEvent('editdetails', this, rec, el);
        this.menuActive = false;
    },

    // onRecurrenceMoveModeSelected: function(editMode, rec, newStartDate) {
        // if (editMode) {
            // rec.data[Extensible.calendar.data.EventMappings.REditMode.name] = editMode;
            // rec.data[Extensible.calendar.data.EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            // this.doShiftEvent(rec, newStartDate, 'move');
        // }
        // // else user canceled
    // },

    onDeleteEvent: function(menu, rec, el) {
        rec._deleting = true;
        this.deleteEvent(rec, el);
        this.menuActive = false;
    },

    /**
     * Delete the specified event.
     * @param {Object} rec The event {@link Extensible.calendar.data.EventModel record}
     */
    deleteEvent: function(rec, /* private */el) {
        var me = this;

        if (me.fireEvent('beforeeventdelete', me, rec, el) !== false) {
            if (rec.isRecurring()) {
                this.rangeEditWin = this.rangeEditWin || Ext.WindowMgr.get('ext-cal-rangeeditwin');
                if (!this.rangeEditWin) {
                    this.rangeEditWin = new Extensible.form.recurrence.RangeEditWindow();
                }
                this.rangeEditWin.prompt({
                    callback: Ext.bind(me.onRecurrenceDeleteModeSelected, me, [rec, el], true),
                    scope: me
                });
            }
            else {
                me.doDeleteEvent(rec, el);
            }
        }
    },

    onRecurrenceDeleteModeSelected: function(editMode, rec, el) {
        if (editMode) {
            rec.data[Extensible.calendar.data.EventMappings.REditMode.name] = editMode;
            rec.data[Extensible.calendar.data.EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            this.doDeleteEvent(rec, el);
        }
        // else user canceled
    },

    doDeleteEvent: function(rec, /* private */el) {
        this.store.remove(rec);
        this.save();
        this.fireEvent('eventdelete', this, rec, el);
    },

    onContextMenu: function(e, t) {
        var el = e.getTarget(this.eventSelector, 5, true),
            match = false;

        if (el) {
            this.dismissEventEditor().showEventMenu(el, e.getXY());
            match = true;
        }

        if (match || this.suppressBrowserContextMenu === true) {
            e.preventDefault();
        }
    },

    /*
     * Shared click handling.  Each specific view also provides view-specific
     * click handling that calls this first.  This method returns true if it
     * can handle the click (and so the subclass should ignore it) else false.
     */
    onClick: function(e, t) {
        var me = this,
            el = e.getTarget(me.eventSelector, 5);

        if (me.dropZone) {
            me.dropZone.clearShims();
        }
        if (me.menuActive === true) {
            // ignore the first click if a context menu is active (let it close)
            me.menuActive = false;
            return true;
        }
        if (el) {
            var id = me.getEventIdFromEl(el),
                rec = me.getEventRecord(id);
            
            if (rec && me.fireEvent('eventclick', me, rec, el) !== false) {
                if (me.readOnly !== true) {
                    me.showEventEditor(rec, el);
                }
            }
            return true;
        }
    },

    onMouseOver: function(e, t) {
        if (this.trackMouseOver !== false && (this.dragZone === undefined || !this.dragZone.dragging)) {
            if (!this.handleEventMouseEvent(e, t, 'over')) {
                this.handleDayMouseEvent(e, t, 'over');
            }
        }
    },

    onMouseOut: function(e, t) {
        if (this.trackMouseOver !== false && (this.dragZone === undefined || !this.dragZone.dragging)) {
            if (!this.handleEventMouseEvent(e, t, 'out')) {
                this.handleDayMouseEvent(e, t, 'out');
            }
        }
    },

    handleEventMouseEvent: function(e, t, type) {
        var el = e.getTarget(this.eventSelector, this.eventSelectorDepth, true);
        
        if (el) {
            var rel = Ext.get(e.getRelatedTarget());
            
            if (el === rel || el.contains(rel)) {
                return true;
            }

            var evtId = this.getEventIdFromEl(el);

            if (this.eventOverClass !== '') {
                var els = this.getEventEls(evtId);
                els[type === 'over' ? 'addCls' : 'removeCls'](this.eventOverClass);
            }
            
            this.fireEvent('event' + type, this, this.getEventRecord(evtId), el);
            
            return true;
        }
        return false;
    },

    getDateFromId: function(id, delim) {
        var parts = id.split(delim);
        return parts[parts.length-1];
    },

    handleDayMouseEvent: function(e, t, type) {
        t = e.getTarget('td', 3);
        
        if (t) {
            if (t.id && t.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(t.id, this.dayElIdDelimiter),
                    rel = Ext.get(e.getRelatedTarget()),
                    relTD, relDate;

                if (rel) {
                    relTD = rel.is('td') ? rel : rel.up('td', 3);
                    relDate = relTD && relTD.id ? this.getDateFromId(relTD.id, this.dayElIdDelimiter) : '';
                }
                if (!rel || dt !== relDate) {
                    var el = this.getDayEl(dt);
                    
                    if (el && !Ext.isEmpty(this.dayOverClass)) {
                        el[type === 'over' ? 'addCls' : 'removeCls'](this.dayOverClass);
                    }
                    this.fireEvent('day' + type, this, Ext.Date.parseDate(dt, "Ymd"), el);
                }
            }
        }
    },

    // MUST be implemented by subclasses
    renderItems: function() {
        throw 'This method must be implemented by a subclass';
    },

    /**
     * Returns true only if this is the active view inside of an owning
     * {@link Extensible.calendar.CalendarPanel CalendarPanel}. If it is not active, or
     * not hosted inside a CalendarPanel, returns false.
     * @return {Boolean} True if this is the active CalendarPanel view, else false
     * @since 1.6.0
     */
    isActiveView: function() {
        var calendarPanel = this.ownerCalendarPanel;
        return (calendarPanel && calendarPanel.getActiveView().id === this.id);
    },

    destroy: function() {
        this.callParent(arguments);

        if (this.el) {
            this.el.un('contextmenu', this.onContextMenu, this);
        }
        Ext.destroy(
            this.editWin,
            this.eventMenu,
            this.dragZone,
            this.dropZone
        );
    }
});/**
 * This is the view used internally by the panel that displays overflow events in the
 * month view. Anytime a day cell cannot display all of its events, it automatically displays
 * a link at the bottom to view all events for that day. When clicked, a panel pops up that
 * uses this view to display the events for that day.
 */
Ext.define('Extensible.calendar.view.MonthDayDetail', {
    extend: 'Ext.Component',
    alias: 'widget.extensible.monthdaydetailview',
    
    requires: [
        'Ext.XTemplate',
        'Extensible.calendar.view.AbstractCalendar'
    ],
    
    initComponent: function() {
        this.callParent(arguments);
        
        this.addEvents({
            eventsrendered: true
        });
    },
    
    afterRender: function() {
        this.tpl = this.getTemplate();
        
        this.callParent(arguments);
        
        this.el.on({
            'click': this.view.onClick,
            'mouseover': this.view.onMouseOver,
            'mouseout': this.view.onMouseOut,
            scope: this.view
        });
    },
    
    getTemplate: function() {
        if(!this.tpl) {
            this.tpl = Ext.create('Ext.XTemplate',
                '<div class="ext-cal-mdv x-unselectable">',
                    '<table class="ext-cal-mvd-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tpl for=".">',
                                '<tr><td class="ext-cal-ev">{markup}</td></tr>',
                            '</tpl>',
                        '</tbody>',
                    '</table>',
                '</div>'
            );
        }
        this.tpl.compile();
        return this.tpl;
    },
    
    update: function(dt) {
        this.date = dt;
        this.refresh();
    },
    
    refresh: function() {
        if(!this.rendered) {
            return;
        }
        var eventTpl = this.view.getEventTemplate(),
        
            templateData = [];
            
            var evts = this.store.queryBy(function(rec) {
                var thisDt = Ext.Date.clearTime(this.date, true).getTime(),
                    M = Extensible.calendar.data.EventMappings,
                    recStart = Ext.Date.clearTime(rec.data[M.StartDate.name], true).getTime(),
                    startsOnDate = (thisDt === recStart),
                    spansDate = false,
                    calId = rec.data[M.CalendarId.name],
                    calRec = this.calendarStore ? this.calendarStore.getById(calId) : null;
                    
                if(calRec && calRec.data[Extensible.calendar.data.CalendarMappings.IsHidden.name] === true) {
                    // if the event is on a hidden calendar then no need to test the date boundaries
                    return false;
                }
                
                if(!startsOnDate) {
                    var recEnd = Ext.Date.clearTime(rec.data[M.EndDate.name], true).getTime();
                    spansDate = recStart < thisDt && recEnd >= thisDt;
                }
                return startsOnDate || spansDate;
            }, this);
        
        Extensible.calendar.view.AbstractCalendar.prototype.sortEventRecordsForDay.call(this, evts);
        
        evts.each(function(evt) {
            var item = evt.data,
                M = Extensible.calendar.data.EventMappings;
                
            item._renderAsAllDay = item[M.IsAllDay.name] || Extensible.Date.diffDays(item[M.StartDate.name], item[M.EndDate.name]) > 0;
            item.spanLeft = Extensible.Date.diffDays(item[M.StartDate.name], this.date) > 0;
            item.spanRight = Extensible.Date.diffDays(this.date, item[M.EndDate.name]) > 0;
            item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth' :
                'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright' : ''));

            templateData.push({markup: eventTpl.apply(this.getTemplateEventData(item))});
        }, this);
        
        this.tpl.overwrite(this.el, templateData);
        this.fireEvent('eventsrendered', this, this.date, evts.getCount());
    },
    
    getTemplateEventData: function(evtData) {
        var data = this.view.getTemplateEventData(evtData);
        data._elId = 'dtl-'+data._elId;
        return data;
    }
});/**
 * Displays a calendar view by month. This class does not usually need ot be used directly as you can
 * use a {@link Extensible.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once including
 * the month view.
 */
Ext.define('Extensible.calendar.view.Month', {
    extend: 'Extensible.calendar.view.AbstractCalendar',
    alias: 'widget.extensible.monthview',
    
    requires: [
        'Ext.XTemplate',
        'Ext.TaskManager',
        'Extensible.calendar.template.Month',
        'Extensible.calendar.util.WeekEventRenderer',
        'Extensible.calendar.view.MonthDayDetail'
    ],
    
    /**
     * @cfg {String} moreText
     * **Deprecated.** Please override {@link #getMoreText} instead.
     * 
     * The text to display in a day box when there are more events than can be displayed and a link is provided to
     * show a popup window with all events for that day (defaults to '+{0} more...', where {0} will be
     * replaced by the number of additional events that are not currently displayed for the day).
     * @deprecated
     */
    moreText: '+{0} more...',
    /**
     * @cfg {String} detailsTitleDateFormat
     * The date format for the title of the details panel that shows when there are hidden events and the "more" link
     * is clicked (defaults to 'F j').
     */
    detailsTitleDateFormat: 'F j',
    /**
     * @cfg {Boolean} showTime
     * True to display the current time in today's box in the calendar, false to not display it (defaults to true)
     */
    showTime: true,
    /**
     * @cfg {Boolean} showTodayText
     * True to display the {@link #todayText} string in today's box in the calendar, false to not display it
     * (defaults to true)
     */
    showTodayText: true,
    /**
     * @cfg {Boolean} showHeader
     * True to display a header beneath the navigation bar containing the week names above each week's column, false
     * not to show it and instead display the week names in the first row of days in the calendar (defaults to false).
     */
    showHeader: false,
    /**
     * @cfg {Boolean} showWeekLinks
     * True to display an extra column before the first day in the calendar that links to the
     * {@link Extensible.calendar.view.Week view} for each individual week, false to not show it (defaults to false).
     * If true, the week links can also contain the week number depending on the value of {@link #showWeekNumbers}.
     */
    showWeekLinks: false,
    /**
     * @cfg {Boolean} showWeekNumbers
     * True to show the week number for each week in the calendar in the week link column, false to show nothing
     * (defaults to false). Note that if {@link #showWeekLinks} is false this config will have no affect even if true.
     */
    showWeekNumbers: false,
    /**
     * @cfg {String} weekLinkOverClass
     * The CSS class name applied when the mouse moves over a week link element (only applies when
     * {@link #showWeekLinks} is true, defaults to 'ext-week-link-over').
     */
    weekLinkOverClass: 'ext-week-link-over',
    /**
     * @cfg {Number} morePanelMinWidth
     * When there are more events in a given day than can be displayed in the calendar view, the extra events
     * are hidden and a "{@link #getMoreText more events}" link is displayed. When clicked, the link pops up a
     * detail panel that displays all events for that day. By default the panel will be the same width as the day
     * box, but this config allows you to set the minimum width of the panel in the case where the width
     * of the day box is too narrow for the events to be easily readable (defaults to 220 pixels).
     */
    morePanelMinWidth: 220,
    
    //private properties -- do not override:
    daySelector: '.ext-cal-day',
    moreSelector: '.ext-cal-ev-more',
    weekLinkSelector: '.ext-cal-week-link',
    weekCount: -1, // defaults to auto by month
    dayCount: 7,
    moreElIdDelimiter: '-more-',
    weekLinkIdDelimiter: 'ext-cal-week-',

    initComponent: function() {
        this.callParent(arguments);
        
        this.addEvents({
            /**
             * @event dayclick
             * Fires after the user clicks within the view container and not on an event element. This is a
             * cancelable event, so returning false from a handler will cancel the click without displaying the event
             * editor view. This could be useful for validating that a user can only create events on certain days.
             * @param {Extensible.calendar.view.Month} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks
             * within the MonthView always return true for this param.
             * @param {Ext.Element} el The Element that was clicked on
             */
            dayclick: true,
            /**
             * @event weekclick
             * Fires after the user clicks within a week link (when {@link #showWeekLinks is true)
             * @param {Extensible.calendar.view.Month} this
             * @param {Date} dt The start date of the week that was clicked on
             */
            weekclick: true,
    /**
     * @protected 
     */
            dayover: true,
    /**
     * @protected 
     */
            dayout: true
        });
    },

    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            copyText: this.ddCopyEventText,
            moveText: this.ddMoveEventText,
            ddGroup: this.ddGroup || this.id+'-MonthViewDD'
        };
        
        this.dragZone = Ext.create('Extensible.calendar.dd.DragZone', this.el, cfg);
        this.dropZone = Ext.create('Extensible.calendar.dd.DropZone', this.el, cfg);
    },

    onDestroy: function() {
        Ext.destroy(this.ddSelector);
        Ext.destroy(this.dragZone);
        Ext.destroy(this.dropZone);
        
        this.callParent(arguments);
    },

    afterRender: function() {
        if(!this.tpl) {
            this.tpl = Ext.create('Extensible.calendar.template.Month', {
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                showHeader: this.showHeader,
                showWeekLinks: this.showWeekLinks,
                showWeekNumbers: this.showWeekNumbers
            });
            this.tpl.compile();
        }
        
        this.addCls('ext-cal-monthview ext-cal-ct');
        
        this.callParent(arguments);
    },

    onResize: function() {
        if (this.monitorResize) {
            this.maxEventsPerDay = this.getMaxEventsPerDay();
            this.refresh(false);
        }
    },

    forceSize: function() {
        // Compensate for the week link gutter width if visible
        if(this.showWeekLinks && this.el) {
            var hd = this.el.down('.ext-cal-hd-days-tbl'),
                bgTbl = this.el.select('.ext-cal-bg-tbl'),
                evTbl = this.el.select('.ext-cal-evt-tbl'),
                wkLinkW = this.el.down('.ext-cal-week-link').getWidth(),
                w = this.el.getWidth()-wkLinkW;
            
            hd.setWidth(w);
            bgTbl.setWidth(w);
            evTbl.setWidth(w);
        }
        this.callParent(arguments);
    },
    
    //private
    initClock: function() {
        if(Ext.fly(this.id+'-clock') !== null) {
            this.prevClockDay = new Date().getDay();
            if(this.clockTask) {
                Ext.util.TaskManager.stop(this.clockTask);
            }
            this.clockTask = Ext.util.TaskManager.start({
                run: function() {
                    var el = Ext.fly(this.id+'-clock'),
                        t = new Date();
                        
                    if(t.getDay() === this.prevClockDay) {
                        if(el) {
                            el.update(Ext.Date.format(t, Extensible.Date.use24HourTime ? 'G:i' : 'g:ia'));
                        }
                    }
                    else{
                        this.prevClockDay = t.getDay();
                        this.moveTo(t);
                    }
                },
                scope: this,
                interval: 1000
            });
        }
    },
    
    /**
     * Returns the text to display in a day box when there are more events than can be displayed and a link is
     * provided to show a popup window with all events for that day (defaults to '+{0} more...', where {0} will be
     * replaced by the number of additional events that are not currently displayed for the day).
     * @param {Integer} numEvents The number of events currently hidden from view
     * @return {String} The text to display for the "more" link
     */
    getMoreText: function(numEvents) {
        return this.moreText;
    },

    /**
     * @protected 
     */
    getEventBodyMarkup: function() {
        if(!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
                '<tpl if="_isReminder">',
                    '<i class="ext-cal-ic ext-cal-ic-rem">&#160;</i>',
                '</tpl>',
                '<tpl if="_isRecurring">',
                    '<i class="ext-cal-ic ext-cal-ic-rcr">&#160;</i>',
                '</tpl>',
                '<tpl if="spanLeft">',
                    '<i class="ext-cal-spl">&#160;</i>',
                '</tpl>',
                '<tpl if="spanRight">',
                    '<i class="ext-cal-spr">&#160;</i>',
                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },
    
    /**
     * @protected 
     */
    getEventTemplate: function() {
        if(!this.eventTpl) {
            var tpl, body = this.getEventBodyMarkup();
            
            tpl = !(Ext.isIE || Ext.isOpera) ?
                Ext.create('Ext.XTemplate',
                    '<div class="{_extraCls} {spanCls} ext-cal-evt ext-cal-evr">',
                        body,
                    '</div>'
                )
                : Ext.create('Ext.XTemplate',
                    '<tpl if="_renderAsAllDay">',
                        '<div class="{_extraCls} {spanCls} ext-cal-evt ext-cal-evo">',
                            '<div class="ext-cal-evm">',
                                '<div class="ext-cal-evi">',
                    '</tpl>',
                    '<tpl if="!_renderAsAllDay">',
                        '<div class="{_extraCls} ext-cal-evt ext-cal-evr">',
                    '</tpl>',
                    body,
                    '<tpl if="_renderAsAllDay">',
                                '</div>',
                            '</div>',
                    '</tpl>',
                        '</div>'
                );
            tpl.compile();
            this.eventTpl = tpl;
        }
        return this.eventTpl;
    },

    getTemplateEventData: function(evtData) {
        var M = Extensible.calendar.data.EventMappings,
            extraClasses = [this.getEventSelectorCls(evtData[M.EventId.name])],
            templateData = {},
            //The colorCls is a numeric number (stored in 'Color', not 'Colour')
            colorCls = 'x-cal-' + evtData[Extensible.calendar.data.EventMappings.Color.name] + '-ad',
            txtColorCls = 'r-cal-' + evtData[Extensible.calendar.data.EventMappings.Color.name] + '-evt',
            title = evtData[M.Title.name],
            fmt = Extensible.Date.use24HourTime ? 'G:i ' : 'g:ia ',
            rec;
        
        extraClasses.push(colorCls);
        extraClasses.push(txtColorCls);

        if (evtData._renderAsAllDay) {
            extraClasses.push('ext-evt-block');
        }
        
        if (this.getEventClass) {
            rec = this.getEventRecord(evtData[M.EventId.name]);
            var cls = this.getEventClass(rec, !!evtData._renderAsAllDay, templateData, this.store);
            extraClasses.push(cls);
        }
        
        templateData._extraCls = extraClasses.join(' ');
        templateData._isRecurring = M.RRule && !!evtData[M.RRule.name];
        templateData._isReminder = evtData[M.Reminder.name] && evtData[M.Reminder.name] !== '';
        templateData.Title = (evtData[M.IsAllDay.name] ? '' : Ext.Date.format(evtData[M.StartDate.name], fmt)) +
                (!title || title.length === 0 ? this.defaultEventTitleText : title);
        
        return Ext.applyIf(templateData, evtData);
    },

    refresh: function(reloadData) {
        Extensible.log('refresh (MonthView)');
        if(this.detailPanel) {
            this.detailPanel.hide();
        }
        if (!this.isHeaderView) {
            this.maxEventsPerDay = this.getMaxEventsPerDay();
        }
        this.callParent(arguments);
        
        if(this.showTime !== false) {
            this.initClock();
        }
    },

    renderItems: function() {
        Extensible.calendar.util.WeekEventRenderer.render({
            eventGrid: this.allDayOnly ? this.allDayGrid : this.eventGrid,
            viewStart: this.viewStart,
            tpl: this.getEventTemplate(),
            maxEventsPerDay: this.maxEventsPerDay,
            viewId: this.id,
            templateDataFn: Ext.bind(this.getTemplateEventData, this),
            evtMaxCount: this.evtMaxCount,
            weekCount: this.weekCount,
            dayCount: this.dayCount,
            getMoreText: Ext.bind(this.getMoreText, this)
        });
        this.fireEvent('eventsrendered', this);
    },

    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    getDayId: function(dt) {
        if(Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    getWeekIndex: function(dt) {
        var el = this.getDayEl(dt).up('.ext-cal-wk-ct');
        return parseInt(el.id.split('-wk-')[1], 10);
    },

    getDaySize: function(contentOnly) {
        var box = this.el.getBox(),
            padding = this.getViewPadding(),
            w = (box.width - padding.width) / this.dayCount,
            h = (box.height - padding.height) / this.getWeekCount();
            
        if(contentOnly) {
            // measure last row instead of first in case text wraps in first row
            var hd = this.el.select('.ext-cal-dtitle').last().parent('tr');
            h = hd ? h-hd.getHeight(true) : h;
        }
        return {height: h, width: w};
    },

    getEventHeight: function() {
        if (!this.eventHeight) {
            var evt = this.el.select('.ext-cal-evt').first();
            if(evt) {
                this.eventHeight = evt.parent('td').getHeight();
            }
            else {
                return 16; // no events rendered, so try setting this.eventHeight again later
            }
        }
        return this.eventHeight;
    },

    getMaxEventsPerDay: function() {
        var dayHeight = this.getDaySize(true).height,
            eventHeight = this.getEventHeight(),
            max = Math.max(Math.floor((dayHeight - eventHeight) / eventHeight), 0);
        
        return max;
    },

    getViewPadding: function(sides) {
        sides = sides || 'tlbr';
        
        var top = sides.indexOf('t') > -1,
            left = sides.indexOf('l') > -1,
            right = sides.indexOf('r') > -1,
            height = this.showHeader && top ? this.el.select('.ext-cal-hd-days-tbl').first().getHeight() : 0,
            width = 0;
        
        if (this.isHeaderView) {
            if (left) {
                width = this.el.select('.ext-cal-gutter').first().getWidth();
            }
            if (right) {
                width += this.el.select('.ext-cal-gutter-rt').first().getWidth();
            }
        }
        else if (this.showWeekLinks && left) {
            width = this.el.select('.ext-cal-week-link').first().getWidth();
        }
        
        return {
            height: height,
            width: width
        };
    },

    getDayAt: function(x, y) {
        var box = this.el.getBox(),
            padding = this.getViewPadding('tl'), // top/left only since we only want the xy offsets
            daySize = this.getDaySize(),
            dayL = Math.floor(((x - box.x - padding.width) / daySize.width)),
            dayT = Math.floor(((y - box.y - padding.height) / daySize.height)),
            days = (dayT * 7) + dayL,
            dt = Extensible.Date.add(this.viewStart, {days: days});
        
        return {
            date: dt,
            el: this.getDayEl(dt)
        };
    },
    
    /**
     * @protected 
     */
    moveNext: function() {
        return this.moveMonths(1, true);
    },
    
    /**
     * @protected 
     */
    movePrev: function() {
        return this.moveMonths(-1, true);
    },

    onInitDrag: function() {
        this.callParent(arguments);
        
        Ext.select(this.daySelector).removeCls(this.dayOverClass);
        if(this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    onMoreClick: function(dt) {
        if(!this.detailPanel) {
            this.detailPanel = Ext.create('Ext.Panel', {
                id: this.id+'-details-panel',
                title: Ext.Date.format(dt, this.detailsTitleDateFormat),
                layout: 'fit',
                floating: true,
                renderTo: Ext.getBody(),
                hideMode: 'offsets',
                tools: [{
                    type: 'close',
                    handler: function(e, t, p) {
                        p.ownerCt.hide();
                    }
                }],
                items: {
                    xtype: 'extensible.monthdaydetailview',
                    id: this.id+'-details-view',
                    date: dt,
                    view: this,
                    store: this.store,
                    calendarStore: this.calendarStore,
                    listeners: {
                        'eventsrendered': Ext.bind(this.onDetailViewUpdated, this)
                    }
                }
            });
            
            if(this.enableContextMenus && this.readOnly !== true) {
                this.detailPanel.body.on('contextmenu', this.onContextMenu, this);
            }
        }
        else{
            this.detailPanel.setTitle(Ext.Date.format(dt, this.detailsTitleDateFormat));
        }
        this.detailPanel.getComponent(this.id+'-details-view').update(dt);
    },

    onDetailViewUpdated: function(view, dt, numEvents) {
        var p = this.detailPanel,
            dayEl = this.getDayEl(dt),
            box = dayEl.getBox(),
            innerTplHeight = p.el.down('.ext-cal-mdv').getHeight(),
            header = p.getDockedItems('header')[0],
            frameSize = p.frameSize || {top:0, bottom:0},
            frameHeight = frameSize.top + frameSize.bottom + header.getHeight(),
            bodyHeight = innerTplHeight + frameHeight + 5,
            documentBodyHeight = Ext.getBody().getHeight() - 20,
            calculatedHeight = Math.min(bodyHeight, documentBodyHeight);
        
        // Check for overflow first -- if overflow is needed the scrollbar
        // will affect the body width in some browsers
        if (calculatedHeight === documentBodyHeight) {
            p.body.addCls('ext-cal-overflow-y');
        }
        else {
            p.body.removeCls('ext-cal-overflow-y');
        }
        // Now set the new calculated panel dimensions
        p.setWidth(Math.max(box.width, this.morePanelMinWidth));
        p.setHeight(calculatedHeight);
        
        p.show();
        p.getPositionEl().alignTo(dayEl, 't-t?');
    },

    onHide: function() {
        this.callParent(arguments);
        
        if(this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    onClick: function(e, t) {
        if(this.detailPanel) {
            this.detailPanel.hide();
        }
        
        var el = e.getTarget(this.moreSelector, 3),
            dt;
        
        if (el) {
            dt = el.id.split(this.moreElIdDelimiter)[1];
            this.onMoreClick(Ext.Date.parseDate(dt, 'Ymd'));
            return;
        }
        
        el = e.getTarget(this.weekLinkSelector, 3);
        
        if (el) {
            dt = el.id.split(this.weekLinkIdDelimiter)[1];
            this.fireEvent('weekclick', this, Ext.Date.parseDate(dt, 'Ymd'));
            return;
        }
        
        if (Extensible.calendar.view.Month.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        
        el = e.getTarget('td', 3);
        
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var parts = el.id.split(this.dayElIdDelimiter);
                dt = parts[parts.length-1];
                    
                //this.fireEvent('dayclick', this, Ext.Date.parseDate(dt, 'Ymd'), false, Ext.get(this.getDayId(dt)));
                this.onDayClick(Ext.Date.parseDate(dt, 'Ymd'), false, Ext.get(this.getDayId(dt)));
                return;
            }
        }
    },

    handleDayMouseEvent: function(e, t, type) {
        var el = e.getTarget(this.weekLinkSelector, 3, true);
        if(el) {
            el[type === 'over' ? 'addCls' : 'removeCls'](this.weekLinkOverClass);
            return;
        }
        this.callParent(arguments);
    },

    destroy: function() {
        this.callParent(arguments);
        
        if(this.detailsPanel) {
            this.detailPanel.body.un('contextmenu', this.onContextMenu, this);
        }
    }
});/**
 * This is the header area container within the day and week views where all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link Extensible.calendar.view.Day DayView}
 * which aggregates this class and the {@link Extensible.calendar.view.DayBody DayBodyView} into the single unified view
 * presented by {@link Extensible.calendar.CalendarPanel CalendarPanel}
 */
Ext.define('Extensible.calendar.view.DayHeader', {
    extend: 'Extensible.calendar.view.Month',
    alias: 'widget.extensible.dayheaderview',
    
    requires: [
        'Extensible.calendar.template.DayHeader'
    ],
    
    // private configs
    weekCount: 1,
    dayCount: 1,
    allDayOnly: true,
    monitorResize: false,
    isHeaderView: true,
    
    // The event is declared in MonthView but we're just overriding the docs:
    /**
     * @event dayclick
     * Fires after the user clicks within the view container and not on an event element. This is a cancelable event, so
     * returning false from a handler will cancel the click without displaying the event editor view. This could be useful
     * for validating that a user can only create events on certain days.
     * @param {Extensible.calendar.view.DayHeader} this
     * @param {Date} dt The date/time that was clicked on
     * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks within the
     * DayHeaderView always return true for this param.
     * @param {Ext.Element} el The Element that was clicked on
     */

    afterRender: function() {
        if(!this.tpl) {
            this.tpl = Ext.create('Extensible.calendar.template.DayHeader', {
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();
        this.addCls('ext-cal-day-header');
        
        this.callParent(arguments);
    },

    forceSize: Ext.emptyFn,

    refresh: function(reloadData) {
        Extensible.log('refresh (DayHeaderView)');
        this.callParent(arguments);
        this.recalcHeaderBox();
    },

    recalcHeaderBox: function() {
        var tbl = this.el.down('.ext-cal-evt-tbl'),
            h = tbl.getHeight();
        
        this.el.setHeight(h+7);
        
        // These should be auto-height, but since that does not work reliably
        // across browser / doc type, we have to size them manually
        this.el.down('.ext-cal-hd-ad-inner').setHeight(h+5);
        this.el.down('.ext-cal-bg-tbl').setHeight(h+5);
    },

    moveNext: function() {
        return this.moveDays(this.dayCount, false);
    },

    movePrev: function() {
        return this.moveDays(-this.dayCount, false);
    },

    onClick: function(e, t) {
        var el = e.getTarget('td', 3);
        
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var parts = el.id.split(this.dayElIdDelimiter),
                    dt = parts[parts.length-1];
                    
                this.onDayClick(Ext.Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt, true)));
                return;
            }
        }
        this.callParent(arguments);
    },
    
    /**
     * @protected 
     */
    isActiveView: function() {
        var calendarPanel = this.ownerCalendarPanel;
        return (calendarPanel && calendarPanel.getActiveView().isDayView);
    }
});/**
 * This is the scrolling container within the day and week views where non-all-day events are displayed.
 * Normally you should not need to use this class directly -- instead you should use {@link
 * Extensible.calendar.view.Day DayView} which aggregates this class and the {@link
 * Extensible.calendar.view.DayHeader DayHeaderView} into the single unified view
 * presented by {@link Extensible.calendar.CalendarPanel CalendarPanel}.
 */
Ext.define('Extensible.calendar.view.DayBody', {
    extend: 'Extensible.calendar.view.AbstractCalendar',
    alias: 'widget.extensible.daybodyview',

    requires: [
        'Ext.XTemplate',
        'Extensible.calendar.template.DayBody',
        'Extensible.calendar.data.EventMappings',
        'Extensible.calendar.dd.DayDragZone',
        'Extensible.calendar.dd.DayDropZone'
    ],

    dayColumnElIdDelimiter: '-day-col-',
    hourIncrement: 60,

    initComponent: function() {
        this.callParent(arguments);

        if(this.readOnly === true) {
            this.enableEventResize = false;
        }
        this.incrementsPerHour = this.hourIncrement / this.ddIncrement;
        this.minEventHeight = this.minEventDisplayMinutes / (this.hourIncrement / this.hourHeight);

        this.addEvents({
            /**
             * @event beforeeventresize
             * Fires after the user drags the resize handle of an event to resize it, but before the resize
             * operation is carried out. This is a cancelable event, so returning false from a handler will
             * cancel the resize operation.
             * @param {Extensible.calendar.view.DayBody} this
             * @param {Extensible.calendar.data.EventModel} rec The original {@link
             * Extensible.calendar.data.EventModel record} for the event that was resized
             * @param {Object} data An object containing the new start and end dates that will be set into the
             * event record if the event is not canceled. Format of the object is: {StartDate: [date], EndDate: [date]}
             */
            beforeeventresize: true,
            /**
             * @event eventresize
             * Fires after the user has drag-dropped the resize handle of an event and the resize operation is
             * complete. If you need to cancel the resize operation you should handle the {@link #beforeeventresize}
             * event and return false from your handler function.
             * @param {Extensible.calendar.view.DayBody} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel
             * record} for the event that was resized containing the updated start and end dates
             */
            eventresize: true,
            /**
             * @event dayclick
             * Fires after the user clicks within the view container and not on an event element. This is a
             * cancelable event, so returning false from a handler will cancel the click without displaying the event
             * editor view. This could be useful for validating that a user can only create events on certain days.
             * @param {Extensible.calendar.view.DayBody} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false. Clicks
             * within the DayBodyView always return false for this param.
             * @param {Ext.Element} el The Element that was clicked on
             */
            dayclick: true
        });
    },

    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            copyText: this.ddCopyEventText,
            moveText: this.ddMoveEventText,
            resizeText: this.ddResizeEventText,
            ddIncrement: this.ddIncrement,
            ddGroup: this.ddGroup || this.id+'-DayViewDD'
        };

        this.el.ddScrollConfig = {
            // scrolling is buggy in IE/Opera for some reason.  A larger vthresh
            // makes it at least functional if not perfect
            vthresh: Ext.isIE || Ext.isOpera ? 100 : 40,
            hthresh: -1,
            frequency: 50,
            increment: 100,
            ddGroup: this.ddGroup || this.id+'-DayViewDD'
        };

        this.dragZone = Ext.create('Extensible.calendar.dd.DayDragZone', this.el, Ext.apply({
            // disabled for now because of bugs in Ext 4 ScrollManager:
            //containerScroll: true
        }, cfg));

        this.dropZone = Ext.create('Extensible.calendar.dd.DayDropZone', this.el, cfg);
    },

    refresh: function(reloadData) {
        Extensible.log('refresh (DayBodyView)');
        var top = this.el.getScroll().top;

        this.callParent(arguments);

        // skip this if the initial render scroll position has not yet been set.
        // necessary since IE/Opera must be deferred, so the first refresh will
        // override the initial position by default and always set it to 0.
        if(this.scrollReady) {
            this.scrollTo(top);
        }
    },

    /**
     * Scrolls the container to the specified vertical position. If the view is large enough that
     * there is no scroll overflow then this method will have no affect.
     * @param {Number} y The new vertical scroll position in pixels
     * @param {Boolean} defer (optional) <p>True to slightly defer the call, false to execute immediately.
     *
     * This method will automatically defer itself for IE and Opera (even if you pass false) otherwise
     * the scroll position will not update in those browsers. You can optionally pass true, however, to
     * force the defer in all browsers, or use your own custom conditions to determine whether this is needed.
     *
     * Note that this method should not generally need to be called directly as scroll position is
     * managed internally.
     */
    scrollTo: function(y, defer) {
        defer = defer || (Ext.isIE || Ext.isOpera);
        if(defer) {
            Ext.defer(function() {
                this.el.scrollTo('top', y);
                this.scrollReady = true;
            }, 10, this);
        }
        else{
            this.el.scrollTo('top', y);
            this.scrollReady = true;
        }
    },

    afterRender: function() {
        if(!this.tpl) {
            this.tpl = Ext.create('Extensible.calendar.template.DayBody', {
                id: this.id,
                dayCount: this.dayCount,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                showHourSeparator: this.showHourSeparator,
                viewStartHour: this.viewStartHour,
                viewEndHour: this.viewEndHour,
                hourIncrement: this.hourIncrement,
                hourHeight: this.hourHeight
            });
        }
        this.tpl.compile();

        this.addCls('ext-cal-body-ct');

        this.callParent(arguments);

        // default scroll position to scrollStartHour (7am by default) or min view hour if later
        var startHour = Math.max(this.scrollStartHour, this.viewStartHour),
            scrollStart = Math.max(0, startHour - this.viewStartHour);

        if(scrollStart > 0) {
            this.scrollTo(scrollStart * this.hourHeight);
        }
    },

    forceSize: Ext.emptyFn,

    // called from DayViewDropZone
    onEventResize: function(rec, data) {
        var me = this,
            EventMappings = Extensible.calendar.data.EventMappings,
            compareFn = Extensible.Date.compare;

        if (compareFn(rec.getStartDate(), data[EventMappings.StartDate.name]) === 0 &&
            compareFn(rec.getEndDate(), data[EventMappings.EndDate.name]) === 0) {
            // no changes
            return;
        }

        if (me.fireEvent('beforeeventresize', me, rec, data) !== false) {
            if (rec.isRecurring()) {
                if (me.recurrenceOptions.editSingleOnResize) {
                    me.onRecurrenceResizeModeSelected('single', rec, data);
                }
                else {
                    this.rangeEditWin = this.rangeEditWin || Ext.WindowMgr.get('ext-cal-rangeeditwin');
                    if (!this.rangeEditWin) {
                        this.rangeEditWin = new Extensible.form.recurrence.RangeEditWindow();
                    }
                    this.rangeEditWin.prompt({
                        callback: Ext.bind(me.onRecurrenceResizeModeSelected, me, [rec, data], true),
                        scope: me
                    });
                }
            }
            else {
                me.doEventResize(rec, data);
            }
        }
    },

    onRecurrenceResizeModeSelected: function(editMode, rec, data) {
        var EventMappings = Extensible.calendar.data.EventMappings;

        if (editMode) {
            rec.data[EventMappings.REditMode.name] = editMode;
            rec.data[EventMappings.RInstanceStartDate.name] = rec.getStartDate();
            this.doEventResize(rec, data);
        }
        // else user canceled
    },

    doEventResize: function(rec, data) {
        var EventMappings = Extensible.calendar.data.EventMappings,
            startDateName = EventMappings.StartDate.name,
            endDateName = EventMappings.EndDate.name,
            updateData = {};

        updateData[startDateName] = data[startDateName];
        updateData[endDateName] = data[endDateName];
        
        if (EventMappings.Duration) {
            updateData[EventMappings.Duration.name] = Extensible.Date.diff(data[startDateName], data[endDateName],
                Extensible.calendar.data.EventModel.resolution);
        }

        rec.set(updateData);

        this.save();

        this.fireEvent('eventupdate', this, rec);
        this.fireEvent('eventresize', this, rec);
    },

    /**
     * @protected 
     */
    getEventBodyMarkup: function() {
        if(!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
                '<tpl if="_isReminder">',
                    '<i class="ext-cal-ic ext-cal-ic-rem">&#160;</i>',
                '</tpl>',
                '<tpl if="_isRecurring">',
                    '<i class="ext-cal-ic ext-cal-ic-rcr">&#160;</i>',
                '</tpl>'
//                '<tpl if="spanLeft">',
//                    '<i class="ext-cal-spl">&#160;</i>',
//                '</tpl>',
//                '<tpl if="spanRight">',
//                    '<i class="ext-cal-spr">&#160;</i>',
//                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    /**
     * @protected 
     */
    getEventTemplate: function() {
        if(!this.eventTpl) {
            this.eventTpl = !(Ext.isIE || Ext.isOpera) ?
                Ext.create('Ext.XTemplate',
                    '<div id="{_elId}" class="{_extraCls} ext-cal-evt ext-cal-evr" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
                        '<div class="ext-evt-bd">', this.getEventBodyMarkup(), '</div>',
                        this.enableEventResize ?
                            '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&#160;</div></div>' : '',
                    '</div>'
                )
                : Ext.create('Ext.XTemplate',
                    '<div id="{_elId}" class="ext-cal-evt {_extraCls}" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px;">',
                        '<div class="ext-cal-evb">&#160;</div>',
                        '<dl style="height: {_height}px;" class="ext-cal-evdm">',
                            '<dd class="ext-evt-bd">',
                                this.getEventBodyMarkup(),
                            '</dd>',
                            this.enableEventResize ?
                                '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&#160;</div></div>' : '',
                        '</dl>',
                        '<div class="ext-cal-evb">&#160;</div>',
                    '</div>'
                );
            this.eventTpl.compile();
        }
        return this.eventTpl;
    },

    /**
     * Returns the XTemplate that is bound to the calendar's event store (it expects records of type
     * {@link Extensible.calendar.data.EventModel}) to populate the calendar views with **all-day** events.
     * Internally this method by default generates different markup for browsers that support CSS border radius
     * and those that don't. This method can be overridden as needed to customize the markup generated.
     * 
     * Note that this method calls {@link #getEventBodyMarkup} to retrieve the body markup for events separately
     * from the surrounding container markup.  This provdes the flexibility to customize what's in the body without
     * having to override the entire XTemplate. If you do override this method, you should make sure that your
     * overridden version also does the same.
     * @return {Ext.XTemplate} The event XTemplate
     */
    getEventAllDayTemplate: function() {
        if(!this.eventAllDayTpl) {
            var tpl, body = this.getEventBodyMarkup();

            tpl = !(Ext.isIE || Ext.isOpera) ?
                Ext.create('Ext.XTemplate',
                    '<div class="{_extraCls} {spanCls} ext-cal-evt ext-cal-evr" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
                        body,
                    '</div>'
                )
                : Ext.create('Ext.XTemplate',
                    '<div class="ext-cal-evt" ',
                            'style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
                        '<div class="{_extraCls} {spanCls} ext-cal-evo">',
                            '<div class="ext-cal-evm">',
                                '<div class="ext-cal-evi">',
                                    body,
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>'
                );
            tpl.compile();
            this.eventAllDayTpl = tpl;
        }
        return this.eventAllDayTpl;
    },

    getTemplateEventData: function(evtData) {
        var M = Extensible.calendar.data.EventMappings,
            extraClasses = [this.getEventSelectorCls(evtData[M.EventId.name])],
            data = {},
            txtColorCls = 'r-cal-' + evtData[Extensible.calendar.data.EventMappings.Color.name] + '-evt',
            colorCls = 'x-cal-' + evtData[Extensible.calendar.data.EventMappings.Color.name] + '-ad',
            title = evtData[M.Title.name],
            fmt = Extensible.Date.use24HourTime ? 'G:i ' : 'g:ia ',
            rec;

        this.getTemplateEventBox(evtData);

        extraClasses.push(txtColorCls);
        extraClasses.push(colorCls);

        extraClasses.push('ext-evt-block');

        if(this.getEventClass) {
            rec = this.getEventRecord(evtData[M.EventId.name]);
            var cls = this.getEventClass(rec, !!evtData._renderAsAllDay, data, this.store);
            extraClasses.push(cls);
        }

        data._extraCls = extraClasses.join(' ');
        data._isRecurring = M.RRule && evtData[M.RRule.name] && evtData[M.RRule.name] !== '';
        data._isReminder = evtData[M.Reminder.name] && evtData[M.Reminder.name] !== '';
        data.Title = (evtData[M.IsAllDay.name] ? '' : Ext.Date.format(evtData[M.StartDate.name], fmt)) +
                (!title || title.length === 0 ? this.defaultEventTitleText : title);

        return Ext.applyIf(data, evtData);
    },

    getEventPositionOffsets: function() {
        return {
            top: 0,
            height: -1
        };
    },

    getTemplateEventBox: function(evtData) {
        var heightFactor = this.hourHeight / this.hourIncrement,
            start = evtData[Extensible.calendar.data.EventMappings.StartDate.name],
            end = evtData[Extensible.calendar.data.EventMappings.EndDate.name],
            startOffset = Math.max(start.getHours() - this.viewStartHour, 0),
            endOffset = Math.min(end.getHours() - this.viewStartHour, this.viewEndHour - this.viewStartHour),
            startMins = startOffset * this.hourIncrement,
            endMins = endOffset * this.hourIncrement,
            viewEndDt = Extensible.Date.add(Ext.Date.clone(end), {hours: this.viewEndHour, clearTime: true}),
            evtOffsets = this.getEventPositionOffsets();

        if(start.getHours() >= this.viewStartHour) {
            // only add the minutes if the start is visible, otherwise it offsets the event incorrectly
            startMins += start.getMinutes();
        }
        if(end <= viewEndDt) {
            // only add the minutes if the end is visible, otherwise it offsets the event incorrectly
            endMins += end.getMinutes();
        }

        evtData._left = 0;
        evtData._width = 100;
        evtData._top = startMins * heightFactor + evtOffsets.top;
        evtData._height = Math.max(((endMins - startMins) * heightFactor), this.minEventHeight) + evtOffsets.height;
    },

    renderItems: function() {
        var day = 0,
            evt,
            evts = [];
        
        for (; day < this.dayCount; day++) {
            var ev = 0,
                emptyCells = 0,
                skipped = 0,
                d = this.eventGrid[0][day],
                ct = d ? d.length : 0;

            for (; ev < ct; ev++) {
                evt = d[ev];
                if(!evt) {
                    continue;
                }
                var item = evt.data || evt.event.data,
                    M = Extensible.calendar.data.EventMappings,
                    ad = item[M.IsAllDay.name] === true,
                    span = this.isEventSpanning(evt.event || evt),
                    renderAsAllDay = ad || span;

                if(renderAsAllDay) {
                    // this event is already rendered in the header view
                    continue;
                }
                Ext.apply(item, {
                    cls: 'ext-cal-ev',
                    _positioned: true
                });
                evts.push({
                    data: this.getTemplateEventData(item),
                    date: Extensible.Date.add(this.viewStart, {days: day})
                });
            }
        }

        // overlapping event pre-processing loop
        var i = 0,
            j = 0,
            overlapCols = [],
            l = evts.length,
            prevDt,
            evt2,
            dt;
        
        for (; i<l; i++) {
            evt = evts[i].data;
            evt2 = null;
            dt = evt[Extensible.calendar.data.EventMappings.StartDate.name].getDate();

            for (j = 0; j < l; j++) {
                if (i === j) {
                    continue;
                }
                evt2 = evts[j].data;
                if(this.isOverlapping(evt, evt2)) {
                    evt._overlap = evt._overlap === undefined ? 1 : evt._overlap+1;
                    if(i<j) {
                        if (evt._overcol === undefined) {
                            evt._overcol = 0;
                        }
                        evt2._overcol = evt._overcol+1;
                        overlapCols[dt] = overlapCols[dt] ? Math.max(overlapCols[dt], evt2._overcol) : evt2._overcol;
                    }
                }
            }
        }

        // rendering loop
        for (i = 0; i < l; i++) {
            evt = evts[i].data;
            dt = evt[Extensible.calendar.data.EventMappings.StartDate.name].getDate();

            if(evt._overlap !== undefined) {
                var colWidth = 100 / (overlapCols[dt]+1),
                    evtWidth = 100 - (colWidth * evt._overlap);

                evt._width = colWidth;
                evt._left = colWidth * evt._overcol;
            }
            var markup = this.getEventTemplate().apply(evt),
                target = this.id + '-day-col-' + Ext.Date.format(evts[i].date, 'Ymd');
            
            Ext.DomHelper.append(target, markup);
        }

        this.fireEvent('eventsrendered', this);
    },

    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    getDayId: function(dt) {
        if(Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayColumnElIdDelimiter + dt;
    },

    getDaySize: function() {
        var box = this.el.down('.ext-cal-day-col-inner').getBox();
        return {height: box.height, width: box.width};
    },

    getDayAt: function(x, y) {
        var sel = '.ext-cal-body-ct',
            xoffset = this.el.down('.ext-cal-day-times').getWidth(),
            viewBox = this.el.getBox(),
            daySize = this.getDaySize(false),
            relX = x - viewBox.x - xoffset,
            dayIndex = Math.floor(relX / daySize.width), // clicked col index
            scroll = this.el.getScroll(),
            row = this.el.down('.ext-cal-bg-row'), // first avail row, just to calc size
            rowH = row.getHeight() / this.incrementsPerHour,
            relY = y - viewBox.y - rowH + scroll.top,
            rowIndex = Math.max(0, Math.ceil(relY / rowH)),
            mins = rowIndex * (this.hourIncrement / this.incrementsPerHour),
            dt = Extensible.Date.add(this.viewStart, {days: dayIndex, minutes: mins, hours: this.viewStartHour}),
            el = this.getDayEl(dt),
            timeX = x;

        if(el) {
            timeX = el.getLeft();
        }

        return {
            date: dt,
            el: el,
            // this is the box for the specific time block in the day that was clicked on:
            timeBox: {
                x: timeX,
                y: (rowIndex * this.hourHeight / this.incrementsPerHour) + viewBox.y - scroll.top,
                width: daySize.width,
                height: rowH
            }
        };
    },

    onClick: function(e, t) {
        if(this.dragPending || Extensible.calendar.view.DayBody.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if(e.getTarget('.ext-cal-day-times', 3) !== null) {
            // ignore clicks on the times-of-day gutter
            return;
        }
        var el = e.getTarget('td', 3);
        if(el) {
            if(el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(el.id, this.dayElIdDelimiter);
                this.onDayClick(Ext.Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt)));
                return;
            }
        }
        var day = this.getDayAt(e.getX(), e.getY());
        if(day && day.date) {
            this.onDayClick(day.date, false, null);
        }
    },

    /**
     * @protected 
     */
    isActiveView: function() {
        var calendarPanel = this.ownerCalendarPanel;
        return (calendarPanel && calendarPanel.getActiveView().isDayView);
    }
});/**
 * Unlike other calendar views, is not actually a subclass of {@link Extensible.calendar.view.AbstractCalendar CalendarView}.
 * Instead it is a {@link Ext.container.Container Container} subclass that internally creates and manages the layouts of
 * a {@link Extensible.calendar.view.DayHeader DayHeaderView} and a {@link Extensible.calendar.view.DayBody DayBodyView}. As such
 * DayView accepts any config values that are valid for DayHeaderView and DayBodyView and passes those through
 * to the contained views. It also supports the interface required of any calendar view and in turn calls methods
 * on the contained views as necessary.
 */
Ext.define('Extensible.calendar.view.Day', {
    extend: 'Ext.container.Container',
    alias: 'widget.extensible.dayview',
    
    requires: [
        'Extensible.calendar.view.AbstractCalendar',
        'Extensible.calendar.view.DayHeader',
        'Extensible.calendar.view.DayBody'
    ],
    
    /**
     * @cfg {String} todayText
     * The text to display in the current day's box in the calendar when {@link #showTodayText} is true (defaults to 'Today')
     */
    /**
     * @cfg {Boolean} readOnly
     * True to prevent clicks on events or the view from providing CRUD capabilities, false to enable CRUD (the default).
     */

    /**
     * @cfg {Boolean} showTime
     * True to display the current time in today's box in the calendar, false to not display it (defaults to true)
     */
    showTime: true,
    /**
     * @cfg {Boolean} showTodayText
     * True to display the {@link #todayText} string in today's box in the calendar, false to not display it (defaults to true)
     */
    showTodayText: true,
    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view (defaults to 1). Only values from 1 to 7 are allowed.
     */
    dayCount: 1,
    /**
     * @cfg {Boolean} enableEventResize
     * True to allow events in the view's scrolling body area to be updated by a resize handle at the
     * bottom of the event, false to disallow it (defaults to true). If {@link #readOnly} is true event
     * resizing will be disabled automatically.
     */
    enableEventResize: true,
    /**
     * @cfg {Integer} ddIncrement
     * The number of minutes between each step during various drag/drop operations in the view (defaults to 30).
     * This controls the number of times the dragged object will "snap" to the view during a drag operation, and does
     * not have to match with the time boundaries displayed in the view. E.g., the view could be displayed in 30 minute
     * increments (the default) but you could configure ddIncrement to 10, which would snap a dragged object to the
     * view at 10 minute increments.
     * 
     * This config currently applies while dragging to move an event, resizing an event by its handle or dragging
     * on the view to create a new event.
     */
    ddIncrement: 30,
    /**
     * @cfg {Integer} minEventDisplayMinutes
     * This is the minimum **display** height, in minutes, for events shown in the view (defaults to 30). This setting
     * ensures that events with short duration are still readable (e.g., by default any event where the start and end
     * times were the same would have 0 height). It also applies when calculating whether multiple events should be
     * displayed as overlapping. In datetime terms, an event that starts and ends at 9:00 and another event that starts
     * and ends at 9:05 do not overlap, but visually the second event would obscure the first in the view. This setting
     * provides a way to ensure that such events will still be calculated as overlapping and displayed correctly.
     */
    minEventDisplayMinutes: 30,
    /**
     * @cfg {Boolean} showHourSeparator
     * True to display a dotted line that separates each hour block in the scrolling body area at the half-hour mark
     * (the default), false to hide it.
     */
    showHourSeparator: true,
    /**
     * @cfg {Integer} viewStartHour
     * The hour of the day at which to begin the scrolling body area's times (defaults to 0, which equals early 12am / 00:00).
     * Valid values are integers from 0 to 24, but should be less than the value of {@link viewEndHour}.
     */
    viewStartHour: 0,
    /**
     * @cfg {Integer} viewEndHour
     * The hour of the day at which to end the scrolling body area's times (defaults to 24, which equals late 12am / 00:00).
     * Valid values are integers from 0 to 24, but should be greater than the value of {@link viewStartHour}.
     */
    viewEndHour: 24,
    /**
     * @cfg {Integer} scrollStartHour
     * The default hour of the day at which to set the body scroll position on view load (defaults to 7, which equals 7am / 07:00).
     * Note that if the body is not sufficiently overflowed to allow this positioning this setting will have no effect.
     * This setting should be equal to or greater than {@link viewStartHour}.
     */
    scrollStartHour: 7,
    /**
     * @cfg {Integer} hourHeight
     * The height, in pixels, of each hour block displayed in the scrolling body area of the view (defaults to 42).
     * 
     * **Important note:** 
     * While this config can be set to any reasonable integer value, note that it is also used to calculate the ratio used 
     * when assigning event heights. By default, an hour is 60 minutes and 42 pixels high, so the pixel-to-minute ratio is 
     * 42 / 60, or 0.7. This same ratio is then used when rendering events. When rendering a 30 minute event, the rendered 
     * height would be 30 minutes * 0.7 = 21 pixels (as expected).
     * 
     * This is important to understand when changing this value because some browsers may handle pixel rounding in different 
     * ways which could lead to inconsistent visual results in some cases. If you have any problems with pixel precision in 
     * how events are laid out, you might try to stick with hourHeight values that will generate discreet ratios. This is 
     * easily done by simply multiplying 60 minutes by different discreet ratios (.6, .8, 1.1, etc.) to get the corresponding 
     * hourHeight pixel values (36, 48, 66, etc.) that will map back to those ratios. By contrast, if you chose an hourHeight 
     * of 50 for example, the resulting height ratio would be 50 / 60 = .833333... This will work just fine, just be aware 
     * that browsers may sometimes round the resulting height values inconsistently.
     */
    hourHeight: 42,
    /**
     * @cfg {String} hideMode
     * How this component should be hidden. Supported values are <tt>'visibility'</tt>
     * (css visibility), <tt>'offsets'</tt> (negative offset position) and <tt>'display'</tt> (css display).
     * 
     * **Note:** For calendar views the default is 'offsets' rather than the Ext JS default of
     * 'display' in order to preserve scroll position after hiding/showing a scrollable view like Day or Week.
     */
    hideMode: 'offsets',
    /**
     * @cfg {Number} minBodyHeight
     * The minimum height for the scrollable body view (defaults to 150 pixels). By default the body is auto
     * height and simply fills the available area left by the overall layout. However, if the browser window
     * is too short and/or the header area contains a lot of events on a given day, the body area could
     * become too small to be usable. Because of that, if the body falls below this minimum height, the
     * layout will automatically adjust itself by fixing the body height to this minimum height and making the
     * overall Day view container vertically scrollable.
     */
    minBodyHeight: 150,

    isDayView: true,

    initComponent: function() {
        /**
         * @cfg {String} ddCreateEventText
         * The text to display inside the drag proxy while dragging over the calendar to create a new event (defaults to
         * 'Create event for {0}' where {0} is a date range supplied by the view)
         */
        this.ddCreateEventText = this.ddCreateEventText || Extensible.calendar.view.AbstractCalendar.prototype.ddCreateEventText;
        /**
         * @cfg {String} ddMoveEventText
         * The text to display inside the drag proxy while dragging an event to reposition it (defaults to
         * 'Move event to {0}' where {0} is the updated event start date/time supplied by the view)
         */
        this.ddMoveEventText = this.ddMoveEventText || Extensible.calendar.view.AbstractCalendar.prototype.ddMoveEventText;
        
        // day count is only supported between 1 and 7 days
        this.dayCount = this.dayCount > 7 ? 7 : (this.dayCount < 1 ? 1 : this.dayCount);
        
        var cfg = Ext.apply({}, this.initialConfig);
        cfg.showTime = this.showTime;
        cfg.showTodayText = this.showTodayText;
        cfg.todayText = this.todayText;
        cfg.dayCount = this.dayCount;
        cfg.weekCount = 1;
        cfg.readOnly = this.readOnly;
        cfg.ddIncrement = this.ddIncrement;
        cfg.minEventDisplayMinutes = this.minEventDisplayMinutes;
        
        var header = Ext.applyIf({
            xtype: 'extensible.dayheaderview',
            id: this.id+'-hd',
            ownerCalendarPanel: this.ownerCalendarPanel
        }, cfg);
        
        var body = Ext.applyIf({
            xtype: 'extensible.daybodyview',
            enableEventResize: this.enableEventResize,
            showHourSeparator: this.showHourSeparator,
            viewStartHour: this.viewStartHour,
            viewEndHour: this.viewEndHour,
            scrollStartHour: this.scrollStartHour,
            hourHeight: this.hourHeight,
            id: this.id+'-bd',
            ownerCalendarPanel: this.ownerCalendarPanel
        }, cfg);
        
        this.items = [header, body];
        this.addCls('ext-cal-dayview ext-cal-ct');
        
        this.callParent(arguments);
    },

    afterRender: function() {
        this.callParent(arguments);
        
        this.header = Ext.getCmp(this.id+'-hd');
        this.body = Ext.getCmp(this.id+'-bd');
        
        this.body.on('eventsrendered', this.forceSize, this);
        this.on('resize', this.onResize, this);
    },

    refresh: function(reloadData) {
        Extensible.log('refresh (DayView)');
        if (reloadData === undefined) {
            reloadData = false;
        }
        this.header.refresh(reloadData);
        this.body.refresh(reloadData);
    },

    forceSize: function() {
        var me = this;
        
        // The defer call is mainly for good ol' IE, but it doesn't hurt in
        // general to make sure that the window resize is good and done first
        // so that we can properly calculate sizes.
        Ext.defer(function() {
            var ct = me.el.up('.x-panel-body'),
                header = me.el.down('.ext-cal-day-header'),
                bodyHeight = ct ? ct.getHeight() - header.getHeight() : false;
            
            if (bodyHeight) {
                if (bodyHeight < me.minBodyHeight) {
                    bodyHeight = me.minBodyHeight;
                    me.addCls('ext-cal-overflow-y');
                }
                else {
                    me.removeCls('ext-cal-overflow-y');
                }
                me.el.down('.ext-cal-body-ct').setHeight(bodyHeight - 1);
            }
        }, Ext.isIE ? 1 : 0, me);
    },

    onResize: function() {
        this.forceSize();
        Ext.defer(this.refresh, Ext.isIE ? 1 : 0, this); //IE needs the defer
    },
    
    /*
     * We have to "relay" this Component method so that the hidden
     * state will be properly reflected when the views' active state changes
     */
    doHide: function() {
        this.header.doHide.apply(this, arguments);
        this.body.doHide.apply(this, arguments);
    },

    getViewBounds: function() {
        return this.header.getViewBounds();
    },
    
    /**
     * Returns the start date of the view, as set by {@link #setStartDate}. Note that this may not
     * be the first date displayed in the rendered calendar -- to get the start and end dates displayed
     * to the user use {@link #getViewBounds}.
     * @return {Date} The start date
     */
    getStartDate: function() {
        return this.header.getStartDate();
    },

    /**
     * Sets the start date used to calculate the view boundaries to display. The displayed view will be the
     * earliest and latest dates that match the view requirements and contain the date passed to this function.
     * @param {Date} dt The date used to calculate the new view boundaries
     */
    setStartDate: function(dt) {
        this.header.setStartDate(dt, false);
        this.body.setStartDate(dt, true);
    },

    renderItems: function() {
        this.header.renderItems();
        this.body.renderItems();
    },
    
    /**
     * Returns true if the view is currently displaying today's date, else false.
     * @return {Boolean} True or false
     */
    isToday: function() {
        return this.header.isToday();
    },
    
    /**
     * Updates the view to contain the passed date
     * @param {Date} dt The date to display
     * @return {Date} The new view start date
     */
    moveTo: function(dt) {
        dt = this.header.moveTo(dt, false);
        this.body.moveTo(dt, true);
        this.forceSize();
        
        return dt;
    },
    
    /**
     * Updates the view to the next consecutive date(s)
     * @return {Date} The new view start date
     */
    moveNext: function() {
        var dt = this.header.moveNext(false);
        this.body.moveNext(true);
        this.forceSize();
        
        return dt;
    },
    
    /**
     * Updates the view to the previous consecutive date(s)
     * @return {Date} The new view start date
     */
    movePrev: function(noRefresh) {
        var dt = this.header.movePrev(false);
        this.body.movePrev(true);
        this.forceSize();
        
        return dt;
    },

    /**
     * Shifts the view by the passed number of days relative to the currently set date
     * @param {Number} value The number of days (positive or negative) by which to shift the view
     * @return {Date} The new view start date
     */
    moveDays: function(value) {
        var dt = this.header.moveDays(value, false);
        this.body.moveDays(value, true);
        this.forceSize();
        
        return dt;
    },
    
    /**
     * Updates the view to show today
     * @return {Date} Today's date
     */
    moveToday: function() {
        var dt = this.header.moveToday(false);
        this.body.moveToday(true);
        this.forceSize();
        
        return dt;
    },
    
    /**
     * Show the currently configured event editor view (by default the shared instance of
     * {@link Extensible.calendar.form.EventWindow EventEditWindow}).
     * @param {Extensible.calendar.data.EventModel} rec The event record
     * @param {Ext.Element/HTMLNode} animateTarget The reference element that is being edited. By default this is
     * used as the target for animating the editor window opening and closing. If this method is being overridden to
     * supply a custom editor this parameter can be ignored if it does not apply.
     * @return {Extensible.calendar.view.Day} this
     */
    showEventEditor: function(rec, animateTarget) {
        return Extensible.calendar.view.AbstractCalendar.prototype.showEventEditor.apply(this, arguments);
    },
    
    /**
     * Dismiss the currently configured event editor view (by default the shared instance of
     * {@link Extensible.calendar.form.EventWindow EventEditWindow}, which will be hidden).
     * @param {String} dismissMethod (optional) The method name to call on the editor that will dismiss it
     * (defaults to 'hide' which will be called on the default editor window)
     * @return {Extensible.calendar.view.Day} this
     */
    dismissEventEditor: function(dismissMethod) {
        return Extensible.calendar.view.AbstractCalendar.prototype.dismissEventEditor.apply(this, arguments);
    }
});/**
 * Displays a calendar view by day, more than one day at a time. This class does not usually need to be used directly as you can
 * use a {@link Extensible.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once.
 */
Ext.define('Extensible.calendar.view.MultiDay', {
    extend: 'Extensible.calendar.view.Day',
    alias: 'widget.extensible.multidayview',
    
    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view (defaults to 3).  Only values from 1 to 7 are allowed.
     */
    dayCount: 3,
    
    /**
     * @cfg {Boolean} startDayIsStatic
     * By default, any configuration of a multi-day view that contains fewer than 7 days will have a rolling
     * start day. If you view the next or previous views, the dates will be adjusted as needed so that each
     * view is contiguous (e.g., if the last day in the current view is Wednesday and you go to the next view
     * it will always begin with Thursday, regardless of the value of {@link #startDay}.
     * 
     * If you set <tt>startDayIsStatic</tt> to <tt>true</tt>, then the view will *always* begin on
     * {@link #startDay}. For any {@link #dayCount} less than 7, days outside the startDay + dayCount range
     * will not be viewable. If a date that is not in the viewable range is set into the view it will
     * automatically advance to the first viewable date for the current range.  This could be useful for
     * creating custom views like a weekday-only or weekend-only view.
     * 
     * Some example {@link Extensible.calendar.CalendarPanel CalendarPanel} configs:
     *
     *		// Weekdays only:
     *		showMultiDayView: true,
     *		multiDayViewCfg: {
     *			dayCount: 5,
     *			startDay: 1,
     *			startDayIsStatic: true
     *		}
     *
     *		// Weekends only:
     *		showMultiDayView: true,
     *		multiDayViewCfg: {
     *			dayCount: 2,
     *			startDay: 6,
     *			startDayIsStatic: true
     *		}
     */
    startDayIsStatic: false,
    
    /**
     * @protected 
     */
    moveNext: function(/*private*/reload) {
        return this.moveDays(this.startDayIsStatic ? 7 : this.dayCount, reload);
    },

    /**
     * @protected 
     */
    movePrev: function(/*private*/reload) {
        return this.moveDays(this.startDayIsStatic ? -7 : -this.dayCount, reload);
    }
});/**
 * Displays a calendar view by week. This class does not usually need to be used directly as you can
 * use a {@link Extensible.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once including
 * the week view.
 */
Ext.define('Extensible.calendar.view.Week', {
    extend: 'Extensible.calendar.view.MultiDay',
    alias: 'widget.extensible.weekview',
    
    /**
     * @cfg {Number} dayCount
     * The number of days to display in the view (defaults to 7)
     */
    dayCount: 7
});/**
 * Displays a calendar view by week, more than one week at a time. This class does not usually need to be used directly as you can
 * use a {@link Extensible.calendar.CalendarPanel CalendarPanel} to manage multiple calendar views at once.
 */
Ext.define('Extensible.calendar.view.MultiWeek', {
    extend: 'Extensible.calendar.view.Month',
    alias: 'widget.extensible.multiweekview',
    
    /**
     * @cfg {Number} weekCount
     * The number of weeks to display in the view (defaults to 2)
     */
    weekCount: 2,
    
    /**
     * @protected 
     */
    moveNext: function() {
        return this.moveWeeks(this.weekCount, true);
    },
    
    /**
     * @protected 
     */
    movePrev: function() {
        return this.moveWeeks(-this.weekCount, true);
    }
});/**
 * This is the default container for calendar views. It supports day, week, multi-week and month views as well
 * as a built-in event edit form. The only requirement for displaying a calendar is passing in a valid
 * {@link #Ext.data.Store store} config containing records of type
 * {@link Extensible.calendar.data.EventModel EventRModel}.
 */
Ext.define('Extensible.calendar.CalendarPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.extensible.calendarpanel',
    
    requires: [
        'Ext.layout.container.Card',
        'Extensible.calendar.view.Day',
        'Extensible.calendar.view.Week',
        'Extensible.calendar.view.Month',
        'Extensible.calendar.view.MultiDay',
        'Extensible.calendar.view.MultiWeek'
    ],
    
    /**
     * @cfg {Number} activeItem
     * The 0-based index within the available views to set as the default active view (defaults to undefined).
     * If not specified the default view will be set as the last one added to the panel. You can retrieve a
     * reference to the active {@link Extensible.calendar.view.AbstractCalendar view} at any time using the
     * {@link #activeView} property.
     */
    /**
     * @cfg {Boolean} recurrence
     * True to enable event recurrence, false to disable it (default). Note that at this time this
     * requires handling code on the server-side that can parse the iCal RRULE format in order to generate
     * the instances of recurring events to display on the calendar, so this field should only be enabled
     * if the server supports it.
     */
    recurrence: false,
    /**
     * @cfg {Boolean} showDayView
     * True to include the day view (and toolbar button), false to hide them (defaults to true).
     */
    showDayView: true,
    /**
     * @cfg {Boolean} showMultiDayView
     * True to include the multi-day view (and toolbar button), false to hide them (defaults to false).
     */
    showMultiDayView: false,
    /**
     * @cfg {Boolean} showWeekView
     * True to include the week view (and toolbar button), false to hide them (defaults to true).
     */
    showWeekView: true,
    /**
     * @cfg {Boolean} showMultiWeekView
     * True to include the multi-week view (and toolbar button), false to hide them (defaults to true).
     */
    showMultiWeekView: true,
    /**
     * @cfg {Boolean} showMonthView
     * True to include the month view (and toolbar button), false to hide them (defaults to true).
     * If all other views are hidden, the month view will show by default even if this config is false.
     */
    showMonthView: true,
    /**
     * @cfg {Boolean} showNavBar
     * True to display the calendar navigation toolbar, false to hide it (defaults to true). Note that
     * if you hide the default navigation toolbar you'll have to provide an alternate means of navigating
     * the calendar.
     */
    showNavBar: true,
    /**
     * @cfg {String} todayText
     * Text to use for the 'Today' nav bar button.
     */
    todayText: 'Today',
    /**
     * @cfg {Boolean} showTodayText
     * True to show the value of {@link #todayText} instead of today's date in the calendar's current day box,
     * false to display the day number(defaults to true).
     */
    showTodayText: true,
    /**
     * @cfg {Boolean} showTime
     * True to display the current time next to the date in the calendar's current day box, false to not show it
     * (defaults to true).
     */
    showTime: true,
    /**
     * @cfg {Boolean} readOnly
     * True to prevent clicks on events or calendar views from providing CRUD capabilities, false to enable CRUD
     * (the default). This option is passed into all views managed by this CalendarPanel.
     */
    readOnly: false,
    /**
     * @cfg {Boolean} showNavToday
     * True to display the "Today" button in the calendar panel's navigation header, false to not
     * show it (defaults to true).
     */
    showNavToday: true,
    /**
     * @cfg {Boolean} showNavJump
     * True to display the "Jump to:" label in the calendar panel's navigation header, false to not
     * show it (defaults to true).
     */
    showNavJump: true,
    /**
     * @cfg {Boolean} showNavNextPrev
     * True to display the left/right arrow buttons in the calendar panel's navigation header, false to not
     * show it (defaults to true).
     */
    showNavNextPrev: true,
    /**
     * @cfg {String} jumpToText
     * Text to use for the 'Jump to:' navigation label.
     */
    jumpToText: 'Jump to:',
    /**
     * @cfg {String} goText
     * Text to use for the 'Go' navigation button.
     */
    goText: 'Go',
    /**
     * @cfg {String} dayText
     * Text to use for the 'Day' nav bar button.
     */
    dayText: 'Day',
    /**
     * @cfg {String} multiDayText
     * **Deprecated.** Please override {@link #getMultiDayText} instead.
     * 
     * Text to use for the 'X Days' nav bar button (defaults to "{0} Days" where {0} is automatically
     * replaced by the value of the {@link #multDayViewCfg}'s dayCount value if available, otherwise it
     * uses the view default of 3).
     * @deprecated
     */
    multiDayText: '{0} Days',
    /**
     * @cfg {String} weekText
     * Text to use for the 'Week' nav bar button.
     */
    weekText: 'Week',
    /**
     * @cfg {String} multiWeekText
     * **Deprecated.** Please override {@link #getMultiWeekText} instead.
     * 
     * Text to use for the 'X Weeks' nav bar button (defaults to "{0} Weeks" where {0} is automatically
     * replaced by the value of the {@link #multiWeekViewCfg}'s weekCount value if available, otherwise it
     * uses the view default of 2).
     * @deprecated
     */
    multiWeekText: '{0} Weeks',
    /**
     * @cfg {String} monthText
     * Text to use for the 'Month' nav bar button.
     */
    monthText: 'Month',
    /**
     * @cfg {Boolean} editModal
     * True to show the default event editor window modally over the entire page, false to allow user
     * interaction with the page while showing the window (the default). Note that if you replace the
     * default editor window with some alternate component this config will no longer apply.
     */
    editModal: false,
    /**
     * @cfg {Boolean} enableEditDetails
     * True to show a link on the event edit window to allow switching to the detailed edit form (the
     * default), false to remove the link and disable detailed event editing.
     */
    enableEditDetails: true,
    /**
     * @cfg {Number} startDay
     * The 0-based index for the day on which the calendar week begins (0=Sunday, which is the default)
     */
    startDay: 0,
    /**
     * @cfg {Ext.data.Store} eventStore
     * The {@link Ext.data.Store store} which is bound to this calendar and contains
     * {@link Extensible.calendar.data.EventModel EventModels}. Note that this is an alias to the
     * default {@link #store} config (to differentiate that from the optional {@link #calendarStore}
     * config), and either can be used interchangeably.
     */
    /**
     * @cfg {Ext.data.Store} calendarStore
     * The {@link Ext.data.Store store} which is bound to this calendar and contains
     * {@link Extensible.calendar.data.CalendarModel CalendarModelss}. This is an optional store that
     * provides multi-calendar (and multi-color) support. If available an additional field for selecting
     * the calendar in which to save an event will be shown in the edit forms. If this store is not
     * available then all events will simply use the default calendar (and color).
     */
    /**
     * @cfg {Object} viewConfig
     * A config object that will be applied to all {@link Extensible.calendar.view.AbstractCalendar views}
     * managed by this CalendarPanel. Any options on this object that do not apply to any particular view
     * will simply be ignored.
     */
    /**
     * @cfg {Object} dayViewCfg
     * A config object that will be applied only to the {@link Extensible.calendar.view.Day DayView}
     * managed by this CalendarPanel.
     */
    /**
     * @cfg {Object} multiDayViewCfg
     * A config object that will be applied only to the {@link Extensible.calendar.view.MultiDay MultiDayView}
     * managed by this CalendarPanel.
     */
    /**
     * @cfg {Object} weekViewCfg
     * A config object that will be applied only to the {@link Extensible.calendar.view.Week WeekView}
     * managed by this CalendarPanel.
     */
    /**
     * @cfg {Object} multiWeekViewCfg
     * A config object that will be applied only to the {@link Extensible.calendar.view.MultiWeek MultiWeekView}
     * managed by this CalendarPanel.
     */
    /**
     * @cfg {Object} monthViewCfg
     * A config object that will be applied only to the {@link Extensible.calendar.view.Month MonthView}
     * managed by this CalendarPanel.
     */
    /**
     * @cfg {Object} editViewCfg
     * A config object that will be applied only to the {@link Extensible.calendar.form.EventDetails
     * EventEditForm} managed by this CalendarPanel.
     */
    
    /**
     * A reference to the {@link Extensible.calendar.view.AbstractCalendar view} that is currently active.
     * @type {Extensible.calendar.view.AbstractCalendar}
     * @property activeView
     */

    layout: {
        type: 'card',
        deferredRender: true
    },
    
    // private property
    startDate: new Date(),

    initComponent: function() {
        this.tbar = {
            cls: 'ext-cal-toolbar',
            border: true,
            items: []
        };
        
        this.viewCount = 0;
        
        var text,
            multiDayViewCount = (this.multiDayViewCfg && this.multiDayViewCfg.dayCount) || 3,
            multiWeekViewCount = (this.multiWeekViewCfg && this.multiWeekViewCfg.weekCount) || 2;
        
        //
        // TODO: Pull the configs for the toolbar/buttons out to the prototype for overrideability
        //
        if(this.showNavToday) {
            this.tbar.items.push({
                id: this.id+'-tb-today', text: this.todayText, handler: this.onTodayClick, scope: this
            });
        }
        if(this.showNavNextPrev) {
            this.tbar.items.push({id: this.id+'-tb-prev', handler: this.onPrevClick, scope: this, iconCls: 'x-tbar-page-prev'});
            this.tbar.items.push({id: this.id+'-tb-next', handler: this.onNextClick, scope: this, iconCls: 'x-tbar-page-next'});
        }
        if(this.showNavJump) {
            this.tbar.items.push(this.jumpToText);
            this.tbar.items.push({id: this.id+'-tb-jump-dt', xtype: 'datefield', width: 120, showToday: false, startDay: this.startDay});
            this.tbar.items.push({id: this.id+'-tb-jump', text: this.goText, handler: this.onJumpClick, scope: this});
        }
        
        this.tbar.items.push('->');
        
        if(this.showDayView) {
            this.tbar.items.push({
                id: this.id+'-tb-day', text: this.dayText, handler: this.onDayNavClick, scope: this, toggleGroup: this.id+'-tb-views'
            });
            this.viewCount++;
        }
        if(this.showMultiDayView) {
            text = Ext.String.format(this.getMultiDayText(multiDayViewCount), multiDayViewCount);
            this.tbar.items.push({
                id: this.id+'-tb-multiday', text: text, handler: this.onMultiDayNavClick, scope: this, toggleGroup: this.id+'-tb-views'
            });
            this.viewCount++;
        }
        if(this.showWeekView) {
            this.tbar.items.push({
                id: this.id+'-tb-week', text: this.weekText, handler: this.onWeekNavClick, scope: this, toggleGroup: this.id+'-tb-views'
            });
            this.viewCount++;
        }
        if(this.showMultiWeekView) {
            text = Ext.String.format(this.getMultiWeekText(multiWeekViewCount), multiWeekViewCount);
            this.tbar.items.push({
                id: this.id+'-tb-multiweek', text: text, handler: this.onMultiWeekNavClick, scope: this, toggleGroup: this.id+'-tb-views'
            });
            this.viewCount++;
        }
        if(this.showMonthView || this.viewCount === 0) {
            this.tbar.items.push({
                id: this.id+'-tb-month', text: this.monthText, handler: this.onMonthNavClick, scope: this, toggleGroup: this.id+'-tb-views'
            });
            this.viewCount++;
            this.showMonthView = true;
        }
        
        var idx = this.viewCount-1;
        this.activeItem = (this.activeItem === undefined ? idx : (this.activeItem > idx ? idx : this.activeItem));
        
        if(this.showNavBar === false) {
            delete this.tbar;
            this.addCls('x-calendar-nonav');
        }
        
        this.callParent(arguments);
        
        this.addEvents({
            /**
             * @event eventadd
             * Fires after a new event is added to the underlying store
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The new 
             * {@link Extensible.calendar.data.EventModel record} that was added
             */
            eventadd: true,
            /**
             * @event eventupdate
             * Fires after an existing event is updated
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The new 
             * {@link Extensible.calendar.data.EventModel record} that was updated
             */
            eventupdate: true,
            /**
             * @event beforeeventdelete
             * Fires before an event is deleted by the user. This is a cancelable event, so returning
             * false from a handler will cancel the delete operation.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The {@link Extensible.calendar.data.EventModel record}
             * for the event that was deleted
             * @param {Ext.Element} el The target element
             */
            beforeeventdelete: true,
            /**
             * @event eventdelete
             * Fires after an event is deleted by the user.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that was deleted
             * @param {Ext.Element} el The target element
             */
            eventdelete: true,
            /**
             * @event eventcancel
             * Fires after an event add/edit operation is canceled by the user and no store update took place
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The new
             * {@link Extensible.calendar.data.EventModel record} that was canceled
             */
            eventcancel: true,
            /**
             * @event viewchange
             * Fires after a different calendar view is activated (but not when the event edit form is activated)
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.CalendarView} view The view being activated (any valid 
             * {@link Extensible.calendar.view.AbstractCalendar CalendarView} subclass)
             * @param {Object} info Extra information about the newly activated view. This is a plain object
             * with following properties:
             * 
             *	* **activeDate**
             *		* The currently selected date
             *	* **viewStart**
             *		* The first date in the new view range
             *	* **viewEnd**
             *		* The last date in the new view range
             */
            viewchange: true,
            /**
             * @event editdetails
             * Fires when the user selects the option to edit the selected event in the detailed edit form
             * (by default, an instance of {@link Extensible.calendar.form.EventDetails}). Handling code
             * should hide the active event editor and transfer the current event record to the appropriate
             * instance of the detailed form by showing it and calling
             * {@link Extensible.calendar.form.EventDetails#loadRecord loadRecord}.
             * @param {Extensible.calendar.CalendarPanel} this The CalendarPanel
             * @param {Extensible.calendar.view.AbstractCalendar} view The currently active 
             * {@link Extensible.calendar.view.AbstractCalendar CalendarView} subclass
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} that is currently being edited
             * @param {Ext.Element} el The target element
             */
            editdetails: true
            
            
            //
            // NOTE: CalendarPanel also relays the following events from contained views as if
            // they originated from this:
            //
            
            /**
             * @event eventsrendered
             * Fires after events are finished rendering in the view
             * @param {Extensible.calendar.CalendarPanel} this
             */
            /**
             * @event eventclick
             * Fires after the user clicks on an event element.
             * 
             * **NOTE:** This version of <tt>eventclick</tt> differs from the same
             * event fired directly by {@link Extensible.calendar.view.AbstractCalendar CalendarView}
             * subclasses in that it provides a default implementation (showing the default edit window)
             * and is also cancelable (if a handler returns <tt>false</tt> the edit window will not be
             * shown). This event when fired from a view class is simply a notification that an event was
             * clicked and has no default behavior.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that was clicked on
             * @param {HTMLNode} el The DOM node that was clicked on
             */
            /**
             * @event rangeselect
             * Fires after the user drags on the calendar to select a range of dates/times in which to
             * create an event
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Object} dates An object containing the start (StartDate property) and end (EndDate
             * property) dates selected
             * @param {Function} callback A callback function that MUST be called after the event handling 
             * is complete so that the view is properly cleaned up (shim elements are persisted in 
             * the view while the user is prompted to handle the range selection). The callback is 
             * already created in the proper scope, so it simply needs to be executed as a standard 
             * function call (e.g., callback()).
             */
            /**
             * @event eventover
             * Fires anytime the mouse is over an event element
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that the cursor is over
             * @param {HTMLNode} el The DOM node that is being moused over
             */
            /**
             * @event eventout
             * Fires anytime the mouse exits an event element
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that the cursor exited
             * @param {HTMLNode} el The DOM node that was exited
             */
            /**
             * @event beforedatechange
             * Fires before the start date of the view changes, giving you an opportunity to save state or
             * anything else you may need to do prior to the UI view changing. This is a cancelable event, so
             * returning false from a handler will cancel both the view change and the setting of the start date.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Date} startDate The current start date of the view (as explained in {@link #getStartDate}
             * @param {Date} newStartDate The new start date that will be set when the view changes
             * @param {Date} viewStart The first displayed date in the current view
             * @param {Date} viewEnd The last displayed date in the current view
             */
            /**
             * @event dayclick
             * Fires after the user clicks within a day/week view container and not on an event element
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Date} dt The date/time that was clicked on
             * @param {Boolean} allday True if the day clicked on represents an all-day box, else false.
             * @param {Ext.Element} el The Element that was clicked on
             */
            /**
             * @event datechange
             * Fires after the start date of the view changes
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Date} startDate The start date of the view (as explained in {@link #getStartDate}
             * @param {Date} viewStart The first displayed date in the view
             * @param {Date} viewEnd The last displayed date in the view
             */
            /**
             * @event beforeeventmove
             * Fires before an event element is dragged by the user and dropped in a new position. This is
             * a cancelable event, so returning false from a handler will cancel the move operation.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that will be moved
             */
            /**
             * @event eventmove
             * Fires after an event element is dragged by the user and dropped in a new position
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that was moved with
             * updated start and end dates
             */
            /**
             * @event initdrag
             * Fires when a drag operation is initiated in the view
             * @param {Extensible.calendar.CalendarPanel} this
             */
            /**
             * @event dayover
             * Fires while the mouse is over a day element
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Date} dt The date that is being moused over
             * @param {Ext.Element} el The day Element that is being moused over
             */
            /**
             * @event dayout
             * Fires when the mouse exits a day element
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Date} dt The date that is exited
             * @param {Ext.Element} el The day Element that is exited
             */
            /**
             * @event beforeeventresize
             * Fires after the user drags the resize handle of an event to resize it, but before the
             * resize operation is carried out. This is a cancelable event, so returning false from a
             * handler will cancel the resize operation. **NOTE:** This event is only fired
             * from views that support event resizing.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that was resized
             * containing the updated start and end dates
             */
            /**
             * @event eventresize
             * Fires after the user drags the resize handle of an event and the resize operation is
             * complete. **NOTE:** This event is only fired from views that support event resizing.
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Extensible.calendar.data.EventModel} rec The 
             * {@link Extensible.calendar.data.EventModel record} for the event that was resized
             * containing the updated start and end dates
             */
            /**
             * @event eventexception
             * Fires after an event has been processed via an Ext proxy and returned with an exception. This
             * could be because of a server error, or because the data returned <tt>success: false</tt>.
             *
             * The view provides default handling via the overrideable
             * {@link Extensible.calendar.view.AbstractCalendar#notifyOnException notifyOnException} method. If
             * any function handling this event returns false, the notifyOnException method will not be called.
             *
             * Note that only Server proxy and subclasses (including Ajax proxy) will raise this event.
             *
             * @param {Extensible.calendar.CalendarPanel} this
             * @param {Object} response The raw response object returned from the server
             * @param {Ext.data.Operation} operation The operation that was processed
             * @since 1.6.0
             */
        });
        
        this.addCls('x-cal-panel');
        
        if(this.eventStore) {
            this.store = this.eventStore;
            delete this.eventStore;
        }
        this.setStore(this.store);
        
        var sharedViewCfg = {
            showToday: this.showToday,
            todayText: this.todayText,
            showTodayText: this.showTodayText,
            showTime: this.showTime,
            readOnly: this.readOnly,
            recurrence: this.recurrence,
            store: this.store,
            calendarStore: this.calendarStore,
            editModal: this.editModal,
            enableEditDetails: this.enableEditDetails,
            startDay: this.startDay,
            ownerCalendarPanel: this
        };
        
        if(this.showDayView) {
            var day = Ext.apply({
                xtype: 'extensible.dayview',
                title: this.dayText
            }, sharedViewCfg);
            
            day = Ext.apply(Ext.apply(day, this.viewConfig), this.dayViewCfg);
            day.id = this.id+'-day';
            this.initEventRelay(day);
            this.add(day);
        }
        if(this.showMultiDayView) {
            var mday = Ext.apply({
                xtype: 'extensible.multidayview',
                title: this.getMultiDayText(multiDayViewCount)
            }, sharedViewCfg);
            
            mday = Ext.apply(Ext.apply(mday, this.viewConfig), this.multiDayViewCfg);
            mday.id = this.id+'-multiday';
            this.initEventRelay(mday);
            this.add(mday);
        }
        if(this.showWeekView) {
            var wk = Ext.applyIf({
                xtype: 'extensible.weekview',
                title: this.weekText
            }, sharedViewCfg);
            
            wk = Ext.apply(Ext.apply(wk, this.viewConfig), this.weekViewCfg);
            wk.id = this.id+'-week';
            this.initEventRelay(wk);
            this.add(wk);
        }
        if(this.showMultiWeekView) {
            var mwk = Ext.applyIf({
                xtype: 'extensible.multiweekview',
                title: this.getMultiWeekText(multiWeekViewCount)
            }, sharedViewCfg);
            
            mwk = Ext.apply(Ext.apply(mwk, this.viewConfig), this.multiWeekViewCfg);
            mwk.id = this.id+'-multiweek';
            this.initEventRelay(mwk);
            this.add(mwk);
        }
        if(this.showMonthView) {
            var month = Ext.applyIf({
                xtype: 'extensible.monthview',
                title: this.monthText,
                listeners: {
                    'weekclick': {
                        fn: function(vw, dt) {
                            this.showWeek(dt);
                        },
                        scope: this
                    }
                }
            }, sharedViewCfg);
            
            month = Ext.apply(Ext.apply(month, this.viewConfig), this.monthViewCfg);
            month.id = this.id+'-month';
            this.initEventRelay(month);
            this.add(month);
        }

        this.add(Ext.applyIf({
            xtype: 'extensible.eventeditform',
            id: this.id+'-edit',
            calendarStore: this.calendarStore,
            recurrence: this.recurrence,
            startDay: this.startDay,
            listeners: {
                'eventadd':    { scope: this, fn: this.onEventAdd },
                'eventupdate': { scope: this, fn: this.onEventUpdate },
                'eventdelete': { scope: this, fn: this.onEventDelete },
                'eventcancel': { scope: this, fn: this.onEventCancel }
            }
        }, this.editViewCfg));
    },

    initEventRelay: function(cfg) {
        cfg.listeners = cfg.listeners || {};
        cfg.listeners.afterrender = {
            fn: function(c) {
                // Relay view events so that app code only has to handle them in one place.
                // These events require no special handling by the calendar panel.
                this.relayEvents(c, ['eventsrendered', 'eventclick', 'dayclick', 'eventover', 'eventout',
                    'beforedatechange', 'datechange', 'rangeselect', 'beforeeventcopy', 'eventcopy',
                    'beforeeventmove', 'eventmove', 'initdrag', 'dayover', 'dayout', 'beforeeventresize',
                    'eventresize', 'eventadd', 'eventupdate', 'beforeeventdelete', 'eventdelete',
                    'eventcancel', 'eventexception']);
                
                c.on('editdetails', this.onEditDetails, this);
            },
            scope: this,
            single: true
        };
    },

    afterRender: function() {
        this.callParent(arguments);
        
        this.body.addCls('x-cal-body');
        this.updateNavState();
        this.setActiveView();
    },
    
    /**
     * Returns the text to use for the 'X Days' nav bar button (defaults to "{0} Days" where {0} is automatically replaced by the
     * value of the {@link #multDayViewCfg}'s dayCount value if available, otherwise it uses the view default of 3).
     */
    getMultiDayText: function(numDays) {
        return this.multiDayText;
    },
    
    /**
     * Returns the text to use for the 'X Weeks' nav bar button (defaults to "{0} Weeks" where {0} is automatically replaced by the
     * value of the {@link #multiWeekViewCfg}'s weekCount value if available, otherwise it uses the view default of 2).
     */
    getMultiWeekText: function(numWeeks) {
        return this.multiWeekText;
    },
    
    /**
     * Sets the event store used by the calendar to display {@link Extensible.calendar.data.EventModel events}.
     * @param {Ext.data.Store} store
     */
    setStore: function(store, initial) {
        var currStore = this.store;
        
        if(!initial && currStore) {
            currStore.un("write", this.onWrite, this);
        }
        if(store) {
            store.on("write", this.onWrite, this);
        }
        this.store = store;
    },

    onStoreAdd: function(ds, recs, index) {
        this.hideEditForm();
    },

    onStoreUpdate: function(ds, rec, operation) {
        if(operation === Ext.data.Record.COMMIT) {
            this.hideEditForm();
        }
    },

    onStoreRemove: function(ds, rec) {
        this.hideEditForm();
    },

    onWrite: function(store, operation) {
        var rec = operation.records[0];
        
        switch(operation.action) {
            case 'create':
                this.onStoreAdd(store, rec);
                break;
            case 'update':
                this.onStoreUpdate(store, rec, Ext.data.Record.COMMIT);
                break;
            case 'destroy':
                this.onStoreRemove(store, rec);
                break;
        }
    },

    onEditDetails: function(vw, rec, el) {
        if(this.fireEvent('editdetails', this, vw, rec, el) !== false) {
            this.showEditForm(rec);
        }
    },

    save: function() {
        // If the store is configured as autoSync:true the record's endEdit
        // method will have already internally caused a save to execute on
        // the store. We only need to save manually when autoSync is false,
        // otherwise we'll create duplicate transactions.
        if(!this.store.autoSync) {
            this.store.sync();
        }
    },

    onEventAdd: function(form, rec) {
        if(!rec.store) {
            this.store.add(rec);
            this.save();
        }
        this.fireEvent('eventadd', this, rec);
    },

    onEventUpdate: function(form, rec) {
        this.save();
        this.fireEvent('eventupdate', this, rec);
    },

    onEventDelete: function(form, rec) {
        this.store.remove(rec);
        this.save();
        this.fireEvent('eventdelete', this, rec);
    },

    onEventCancel: function(form, rec) {
        this.hideEditForm();
        this.fireEvent('eventcancel', this, rec);
    },
    
    /**
     * Shows the built-in event edit form for the passed in event record.  This method automatically
     * hides the calendar views and navigation toolbar.  To return to the calendar, call {@link #hideEditForm}.
     * @param {Extensible.calendar.data.EventModel} record The event record to edit
     * @return {Extensible.calendar.CalendarPanel} this
     */
    showEditForm: function(rec) {
        this.preEditView = this.layout.getActiveItem().id;
        this.setActiveView(this.id+'-edit');
        this.layout.getActiveItem().loadRecord(rec);
        return this;
    },
    
    /**
     * Hides the built-in event edit form and returns to the previous calendar view. If the edit form is
     * not currently visible this method has no effect.
     * @return {Extensible.calendar.CalendarPanel} this
     */
    hideEditForm: function() {
        if(this.preEditView) {
            this.setActiveView(this.preEditView);
            delete this.preEditView;
        }
        return this;
    },
    
    /**
     * Set the active view, optionally specifying a new start date.
     * @param {String/Number} id The id of the view to activate (or the 0-based index of the view within 
     * the CalendarPanel's internal card layout).
     * @param {Date} startDate (optional) The new view start date (defaults to the current start date)
     */
    setActiveView: function(id, startDate) {
        var me = this,
            layout = me.layout,
            editViewId = me.id + '-edit',
            toolbar;
        
        if (startDate) {
            me.startDate = startDate;
        }
        
        // Make sure we're actually changing views
        if (id !== layout.getActiveItem().id) {
            // Show/hide the toolbar first so that the layout will calculate the correct item size
            toolbar = me.getDockedItems('toolbar')[0];
            if (toolbar) {
                toolbar[id === editViewId ? 'hide' : 'show']();
            }
            
            // Activate the new view and refresh the layout
            layout.setActiveItem(id || me.activeItem);
            me.doComponentLayout();
            me.activeView = layout.getActiveItem();
            
            if (id !== editViewId) {
                if (id && id !== me.preEditView) {
                    // We're changing to a different view, so the view dates are likely different.
                    // Re-set the start date so that the view range will be updated if needed.
                    // If id is undefined, it means this is the initial pass after render so we can
                    // skip this (as we don't want to cause a duplicate forced reload).
                    layout.activeItem.setStartDate(me.startDate, true);
                }
                // Switching to a view that's not the edit view (i.e., the nav bar will be visible)
                // so update the nav bar's selected view button
                me.updateNavState();
            }
            // Notify any listeners that the view changed
            me.fireViewChange();
        }
    },

    fireViewChange: function() {
        if (this.layout && this.layout.getActiveItem) {
            var view = this.layout.getActiveItem(),
                cloneDt = Ext.Date.clone;
                
            if (view) {
                var info;
                
                // some views do not have these properties, e.g. the detailed edit form
                if (view.getViewBounds) {
                    var vb = view.getViewBounds();
                    info = {
                        viewStart: cloneDt(vb.start),
                        viewEnd: cloneDt(vb.end),
                        activeDate: cloneDt(view.getStartDate())
                    };
                }
                if (view.dismissEventEditor) {
                    view.dismissEventEditor();
                }
                this.fireEvent('viewchange', this, view, info);
            }
        }
    },

    updateNavState: function() {
        var me = this,
            activeItem = me.layout.activeItem;
        
        if (activeItem && me.showNavBar !== false) {
            var suffix = activeItem.id.split(me.id + '-')[1],
                btn = Ext.getCmp(me.id + '-tb-' + suffix);
            
            if (me.showNavToday) {
                Ext.getCmp(me.id + '-tb-today').setDisabled(activeItem.isToday());
            }
            btn.toggle(true);
        }
    },

    /**
     * Sets the start date for the currently-active calendar view.
     * @param {Date} dt The new start date
     * @return {Extensible.calendar.CalendarPanel} this
     */
    setStartDate: function(dt) {
        Extensible.log('setStartDate (CalendarPanel');
        this.startDate = dt;
        this.layout.activeItem.setStartDate(dt, true);
        this.updateNavState();
        this.fireViewChange();
        return this;
    },

    showWeek: function(dt) {
        this.setActiveView(this.id+'-week', dt);
    },

    onTodayClick: function() {
        this.startDate = this.layout.activeItem.moveToday(true);
        this.updateNavState();
        this.fireViewChange();
    },

    onJumpClick: function() {
        var dt = Ext.getCmp(this.id+'-tb-jump-dt').getValue();
        if(dt !== '') {
            this.startDate = this.layout.activeItem.moveTo(dt, true);
            this.updateNavState();
            // TODO: check that view actually changed:
            this.fireViewChange();
        }
    },

    onPrevClick: function() {
        this.startDate = this.layout.activeItem.movePrev(true);
        this.updateNavState();
        this.fireViewChange();
    },

    onNextClick: function() {
        this.startDate = this.layout.activeItem.moveNext(true);
        this.updateNavState();
        this.fireViewChange();
    },

    onDayNavClick: function() {
        this.setActiveView(this.id+'-day');
    },

    onMultiDayNavClick: function() {
        this.setActiveView(this.id+'-multiday');
    },

    onWeekNavClick: function() {
        this.setActiveView(this.id+'-week');
    },

    onMultiWeekNavClick: function() {
        this.setActiveView(this.id+'-multiweek');
    },

    onMonthNavClick: function() {
        this.setActiveView(this.id+'-month');
    },
    
    /**
     * Return the calendar view that is currently active, which will be a subclass of
     * {@link Extensible.calendar.view.AbstractCalendar AbstractCalendar}.
     * @return {Extensible.calendar.view.AbstractCalendar} The active view
     */
    getActiveView: function() {
        return this.layout.activeItem;
    }
});