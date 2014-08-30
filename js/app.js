var RollbackCollection = Backbone.Collection.extend({

    context: new Backbone.Model({
        currentFilter: undefined
    }),

    filtered: new Backbone.Collection(),
    previous: new Backbone.Collection(),

    initialize: function() {
        this.on("reset", this.onCollectionReset, this);

        this.context.on("change:currentFilter", this.applyFilter, this);
    },

    onCollectionReset: function() {
        this.saveCurrentItems();
        this.applyFilter();
    },

    setFilter: function(predicate) {
        this.context.set("currentFilter", predicate);
    },

    applyFilter: function() {
        var filter = this.context.get("currentFilter");

        this.filtered.reset(this.filter(filter));
    },

    saveCurrentItems: function() {
        this.previous.reset(this.map(function(item) {
            return item.clone();
        }));
    },

    rollback: function() {
        this.reset(this.previous.models);
    }
});

var BaseView = Backbone.View.extend({
    ui: {
        // name: "selector"
    },
    uiEvents: {
        // "event ui-name": "callback"
    },

    constructor: function() {
        this.initialize = _.wrap(this.initialize, function(actualFn) {
            this.bindEvents();
            this.bindUiEvents();

            actualFn.apply(this, _(arguments).rest());
        });

        Backbone.View.prototype.constructor.apply(this, arguments);
    },

    getUi: function(key) {
        var selector = this.ui[key];

        return this.$(selector);
    },

    bindUiEvents: function() {
        var uiEvents = _(this.uiEvents).reduce(function(memo, callback, event) {
            var parts = event.split(" ");
            var eventName = _(parts).initial();
            var uiKey = _(parts).last();

            var actualSelector = this.ui[uiKey];
            var actualEvent = eventName.concat([ actualSelector ]).join(" ");

            memo[actualEvent] = callback;

            return memo;
        }, {}, this);

        this.delegateEvents(uiEvents);
    },
});

var MyView = BaseView.extend({

    items: new RollbackCollection(),

    ui: {
        itemContainer: "#orderStatusContainer",
        filterInput: "#orderStatusFilterText",
        itemInput: ".item input",
        applyButton: "#applyButton",
        cancelButton: "#cancelButton"
    },

    uiEvents: {
        "input filterInput": "onFilterInputChange",
        "change itemInput": "onItemInputChange",
        "click applyButton": "onApplyButtonClick",
        "click cancelButton": "onCancelButtonClick"
    },

    initialize: function() {
        var initials = _([
            "Open Order",
            "Pending Signature",
            "Pending Review",
            "Completed",
            "Rejected"
        ]).map(function(item) {
            return { name: item, selected: false };
        });

        this.items.reset(initials);
    },

    bindEvents: function() {
        this.items.filtered.on("reset", this.onFilteredItemsChange, this);
    },

    onFilterInputChange: function() {
        var filterText = this.getUi("filterInput").val();

        this.items.setFilter(function(item) {
            var itemName = item.get("name").toLowerCase();

            return itemName.indexOf(filterText.toLowerCase()) >= 0;
        });
    },

    onFilteredItemsChange: function() {
        var filtered = this.items.filtered;

        this.populateItemElements(filtered);
    },

    populateItemElements: function(items) {
        var elements = items.map(function(item) {
            var li = $("<li>")
                .addClass("item")
                .data("model", item);

            var checkbox = $("<input>")
                .attr({
                    type: "checkbox",
                    value: item.get("name"),
                    checked: item.get("selected")
                });

            return li.append(checkbox).append(item.get("name"));
        });

        this.getUi("itemContainer").html(elements);
    },

    onItemInputChange: function(event) {
        var item = $(event.currentTarget).parents(".item");
        var model = item.data("model");

        model.set("selected", !model.get("selected"));
    },

    onApplyButtonClick: function() {
        this.items.saveCurrentItems();
    },

    onCancelButtonClick: function() {
        this.items.rollback();
    }

});

var ohmView = new MyView({ el: $("#myView") });