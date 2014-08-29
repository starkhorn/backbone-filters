var OrderStatusFilterButton = Backbone.View.extend({

    "previousCollection": new Backbone.Collection(),
    "currentCollection": new Backbone.Collection(),
    "displayCollection": new Backbone.Collection(),
   

    context: new Backbone.Model({
        "itemFilterText": "",
        "criteria": new Backbone.Model(),
    }),

    ui: {},

    initialize: function() {
        var self = this;

        // this.previousCollection.on("reset", this.resetToPrevious, this);
        this.displayCollection.on("reset", this.onDisplayCollectionChange, this);

        $(document).on("click", ".orderStatusItem", this.onOrderStatusItemClick.bind(this));
        $(document).on("click", "#applyButton", _.bind(this.onApplyButtonClick, this));
        $(document).on("click", "#cancelButton", _.bind(this.onCancelButtonClick, this));

        this.context.on("change:itemFilterText", this.onFilterTextChange, this);

        this.ui.orderStatusFilter = $("#orderStatusFilterText");
        this.ui.orderStatusFilter.on("input", function(event) {
            self.context.set("itemFilterText", $(event.currentTarget).val());
        });
        
        this.setItems([
            "Open Order",
            "Pending Signature",
            "Pending Review",
            "Completed",
            "Rejected"
        ]);
    },

    setItems: function(items) {
        this.previousCollection.reset(_(items).map(function(item) {
            return { name: item, selected: false };
        }));

        this.resetToPrevious();
    },

    resetToPrevious: function() {
        var previous = this.clone(this.previousCollection.models);

        this.currentCollection.reset(previous);
        this.displayCollection.reset(previous);
    },

    onDisplayCollectionChange: function() {
        var lis = this.displayCollection.map(function(item) {
            return $("<li>")
                .addClass("orderStatusItem")
                .data("model", item)
                .text(item.get("name") + " => " + item.get("selected"));
        });

        $("#orderStatusContainer").html(lis);
    },

    clone: function(items) {
        return _(items).map(function(item) {
            return item.clone();
        });
    },

    onFilterTextChange: function() {
        var text = this.context.get("itemFilterText");
        var filtered = this.currentCollection.filter(function(item) {
            return item.get('name').toLowerCase().indexOf(text.toLowerCase()) >= 0;
        });

        this.displayCollection.reset(filtered);
        this.ui.orderStatusFilter.val(text);
    },

    onOrderStatusItemClick: function(event) {
         var li = $(event.currentTarget);

         var item = li.data("model");
         item.set("selected", !item.get("selected"));

         li.text(item.get("name") + " => " + item.get("selected"));
    },

    onApplyButtonClick: function(event) {
        // var criteria = this.buildCriteria();

        // this.set("criteria", criteria);

        // var triggered = {
        //     criteria: criteria
        // };

        // this.context.set("itemFilterText", "");
        this.previousCollection.reset(this.currentCollection.models);
    },

    onCancelButtonClick: function(event) {
        this.context.set("itemFilterText", "");
        this.resetToPrevious();
    },

    buildCriteria: function() {

        var selected = $(".orderStatusItem")
            .filter(function() { return $(this).text().indexOf("true") >= 0; })
            .map(function() { return $(this).data("model").get("name"); })
            .toArray();

        return {
            orderStatus: selected
        };
    }

});

new OrderStatusFilterButton({ el: $('#orderStatusButton') });
