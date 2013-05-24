App.Actions = {
    loading : function (id) {
        var loadingEl = document.createElement('div'),
                loadingInner = document.createElement('div');

        loadingEl.setAttribute('style', 'min-width:100%; width:100%; height:100%; min-height:100%; position:absolute; top:0px; left:0px; background-color:rgba(216,230,246,0.5);');
        loadingInner.setAttribute('class', 'loading-indicator');
        loadingInner.setAttribute('style', 'position: absolute; top: 50%; left: 50%; margin-top: -5px; margin-left: -20px; z-index:1; ');
        loadingInner.innerHTML = "Loading...";

        loadingEl.appendChild(loadingInner);

        $(id).insertBefore(loadingEl, $(id).firstChild);

    },

    ReClassifyTab : function () {
        App.Parts[App.activeTabId].clear = false;
        var el = Ext.getCmp(App.activeTabId + '_ClassifyVersion');
        el.store.reload();
    },

    clearTabs :function () {
        for (var i = 1; i <= App.countTabID; i++) {
            var curTab = 'TabContainer_' + i;
            if (App.Parts[curTab].active) {
                Ext.getCmp(curTab + '_ClassifyResult').store.removeAll();
                Ext.getCmp(curTab + '_ScrapeResult').update("");
                Ext.getCmp(curTab + '_FrequencyList').store.removeAll();
                Ext.getCmp(curTab + '_KeywordsGrid').store.removeAll();
                Ext.getCmp(curTab + '_SensesGrid').store.removeAll();

                App.Parts[curTab].clear = true;
            }
        }
    },

    classifyUtility:function (text) {
        Ext.getCmp('main_url').setValue('');
        this.classifyInit({text:text});
    },

    classify : function (url) {
        if (Ext.getCmp('main_url').getValue() == "")
            return false;
        this.classifyInit({url:url});
    },

    classifyInit : function (param) {
        Ext.getCmp('TabPanel').body.mask('Loading...', 'ext-el-mask-msg x-mask-loading');
        Ext.Ajax.request({
            url : '/classify/classify',
            method: 'POST',
            params :param,
            success: function (result, request) {
                Ext.getCmp('TabPanel').body.unmask();
                x = Ext.decode(result.responseText);
                if (x.success) {
                    App.Actions.clearTabs();
                    App.Actions.ReClassifyTab();

                } else {
                    alert("Classification fail");
                }
            }
        });
    },

    clear : function () {
        Ext.Ajax.request({
            url : '/classify/clear',
            method: 'POST',
            params :{url:''},
            success: function (result, request) {
                x = Ext.decode(result.responseText);
                if (x.success) {
                    Ext.getCmp('main_url').setValue('');
                    App.Actions.clearTabs();
                }
                else {
                    alert("Clear is fail");
                }
            }
        });
    },

    highlightNearest: function(e,grid) {
        var search = e.id.toLowerCase();
        var sucess = search == '' ? true : App.Actions.highlight(search == '#' ? '[0-9]' : search, null,grid);
        if (sucess === false) {
            e.nextSibling == null ? null : App.Actions.highlightNearest(e.nextSibling,grid);
        }
    },

    highlight: function (search, column,_grid) {
        _grid=_grid?_grid:"_KeywordsGrid";
        var grid = Ext.getCmp(App.activeTabId + _grid);
        var field = column ? column : grid.store.sortInfo.field;
        var id = grid.store.find(field, new RegExp('^(' + search.toLowerCase()+'|'+search.toUpperCase()+')'), 0,false,false,false);
        //add double check for fixiing err in grid.find method
        if (id>=0 && grid.store.data.items[id].data[field]==undefined)
            id = -1
        var view = grid.getView();
        if(view.liveScroller && App["ScrollGrid"+_grid])
                view.getRow(App["ScrollGrid"+_grid].row)?view.getRow(App["ScrollGrid"+_grid].row).removeClassName('live-grid-selected'):null;
        if (id != -1) {
            App["ScrollGrid"+_grid] = {
                'grid':grid.id,
                'row':id,
                'col':grid.colModel.findColumnIndex(field)
            };
            if(view.liveScroller){
                var scrollTop = id * view.rowHeight;
                view.liveScroller.dom.scrollTop=scrollTop;
                setTimeout(function(){
                    view.getRow(id)?view.getRow(id).addClassName('live-grid-selected'):null;
                }, 200);
            }
            else{
                var scrollTop = id * (view.rowHeight + 2);
                view.scroller.dom.scrollTop == scrollTop ? view.fireEvent('doUpdate') : view.scroller.scrollTo('top', scrollTop, false);
            }
            return true;
        }
        else
            return false;
    },

    initTopMenuClick: function() {
        Ext.get('TopPanelContent').select('div').on('click', function(e) {
            if (e.target.parentNode.id == 'TopPanelContent' && e.target.id.indexOf('_') >= 0) {
                location.href = e.target.id.replace(/_/g, '/');
            }
        })
    },

    checkCredentials: function (el, lang) {
        var cur = App.credentials;

        var credential = {
            admin:[3],
            keywords:[5,8],
            keywordsReadOnly:[-5,-13,-8,-14, -15],
            keywordsEdit:[5],
            keywordsEditlang:[13],
            keywordslang:[13,14],
            keywordsActive:[6],
            keywordsLive:[15],
            keywordsApprove:[8],
            keywordsApprovelang:[14],
            keywordsTranslated:[7],
            Categories:[9],
            CategoriesEditCode:[10],
            CategoriesEditName:[11],
            Languages:[12]
        };
        var need = credential[el];
        var result = need[0] < 0;

        if (cur.indexOf(2) >= 0) {
            return !result;
        }
        for (var i = 0; i < cur.length; i++) {
            if (need.indexOf(cur[i]) >= 0) {
                if (lang && (lang != App.allowLanguage)) {
                    return false;
                }
                result = true;
                break;
            }
            if (need.indexOf(-cur[i]) >= 0) {
                result = false;
                break;
            }
        }
        return result;
    },

    adminSubmitCallback : function(element) {
        document.getElementById('edit_form').onsubmit = function() {
            Ext.getCmp('editPanel').load({
                url : this.action,
                params : App.Actions.serialize(this),
                scripts: true,
                callback:App.Actions.adminSubmitCallback
            });

            var curTree = Ext.getCmp('AdminTree');
            var curGrid = Ext.getCmp('AdminGrid');
            if (curTree.el.isDisplayed()) {
                var parentNode = curTree.getRootNode();
                curTree.getLoader().load(parentNode);
                parentNode.expand();
            }
            if (curGrid.el.isDisplayed()) {
                curGrid.store.reload({'params':'collback'});
            }
            return false;
        }
    },

    callMethodForAllParts: function (method, args) {
        Ext.iterate(App.Parts, function (key, element) {
            if (element[method])
                element[method].apply(element, args || []);
        });
    },

    // Serializes a form
    // Will return a string which is a vald HTTP POST body for the given form
    // If no form is given, it will search for the _FIRST_ form on the page
    serialize : function(element) {

        // Return value
        var retVal = '';


        // Getting ALL elements inside of form element
        var els = element.getElementsByTagName('*');
        // Looping through all elements inside of form and checking to see if they're "form elements"
        for (var idx = 0; idx < els.length; idx++) {
            var el = els[idx];

            // According to the HTTP/HTML specs we shouldn't serialize disabled controls
            // Notice also that according to the HTTP/HTML standards we should also serialize the
            // name/value pair meaning that the name attribute are being used as the ID of the control
            // Though for Ra controls the name attribute will have the same value as the ID attribute
            if (!el.disabled && el.name && el.name.length > 0) {
                switch (el.tagName.toLowerCase()) {
                    case 'input':
                        switch (el.type) {
                            // Note we SKIP Buttons and Submits since there are no reasons as to why we
                            // should submit those anyway
                            case 'checkbox':
                            case 'radio':
                                if (el.checked) {
                                    if (retVal.length > 0) {
                                        retVal += '&';
                                    }
                                    retVal += el.name + '=' + encodeURIComponent(el.value);
                                }
                                break;
                            case 'hidden':
                            case 'password':
                            case 'text':
                                if (retVal.length > 0) {
                                    retVal += '&';
                                }
                                retVal += el.name + '=' + encodeURIComponent(el.value);
                                break;
                        }
                        break;
                    case 'select':
                    case 'textarea':
                        if (retVal.length > 0) {
                            retVal += '&';
                        }
                        retVal += el.name + '=' + encodeURIComponent(el.value);
                        break;
                }
            }
        }
        return retVal;
    },

    //generate pop up window!!!!!!!!!!!!!!!!!!!!!!!!
    GenerateUtilityWindow:function() {
        App.UtilityWindow = new Ext.Window({
            title: 'Utility',
            closable:true,
            width:500,
            height:300,
            plain:true,
            layout: 'border',
            border:false,
            items:[
                {
                    xtype: 'textarea',
                    region:'center',
                    id: "classify_text",
                    name: 'classify_text',
                    emptyText: 'enter scrape text'
                }
            ],
            buttons: [
                {
                    text:'Submit',
                    handler:function() {
                        var classify_text = Ext.getCmp('classify_text').getValue();
                        if (classify_text == "")
                            return false;
                        App.Actions.classifyUtility(classify_text);
                    }
                },
                {
                    text: 'Close',
                    handler: function() {
                        App.UtilityWindow.hide();
                    }
                }
            ]
        });
    },


    GenerateIssueWindow:function() {
        App.IssueWindow = new Ext.Window({
            title: 'Issue Reporting',
            closable:true,
            width:620,
            height:525,
            modal:true,
            plain:true,
            layout: 'fit',
            border:false,
            items:{
                xtype:'form',
                fileUpload: true, 
                frame:true,
                enctype : 'multipart/form-data',                
                autoScroll:true,
                labelWidth:110,
                id:'IssueForm',
                name:'IssueForm',
                items:[
                    {
                        layout:'column',
                        defaults:{
                            layout:'form',
                            bodyStyle:'padding:0 10px 0 0'
                        },
                        items:[
                            {
                                items:[
                                    {
                                        columnWidth:0.2,
                                        xtype: 'textfield',
                                        fieldLabel:'Editor',
                                        id: "IssueEditor",
                                        name: 'IssueEditor',
                                        readOnly:true,
                                        fieldClass:'readonly',
                                        listeners:{
                                            load:function() {
                                                this.setValue(Ext.get('Editor').dom.innerHTML);
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                items:[
                                    {
                                        columnWidth:0.8,
                                        xtype: 'textfield',
                                        fieldLabel:'Date',
                                        id: "IssueDate",
                                        name: 'IssueDate',
                                        readOnly:true,
                                        fieldClass:'readonly',
                                        listeners:{
                                            load:function() {
                                                var date = new Date();
                                                this.setValue(date.dateFormat('d.m.Y H:i:s'));
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        layout:'column',
                        defaults:{
                            layout:'form',
                            bodyStyle:'padding:0 10px 0 0'
                        },
                        items:[
                            {
                                items:[
                                    {
                                        columnWidth:0.2,
                                        xtype: 'textfield',
                                        fieldLabel:'Dimension',
                                        id: "IssueDimension",
                                        name: 'IssueDimension',
                                        readOnly:true,
                                        fieldClass:'readonly',
                                        listeners:{
                                            load:function() {
                                                this.setValue(Ext.getCmp(App.activeTabId).title);
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        fieldLabel:'Dimension Id',
                                        id: "IssueDimensionID",
                                        name: 'IssueDimensionID',
                                        readOnly:true,
                                        hidden:true,
                                        listeners:{
                                            load:function() {
                                                this.setValue(App.Parts[App.activeTabId].langscape ? 'langscape' : App.Parts[App.activeTabId].id);
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                items:[
                                    {
                                        columnWidth:0.8,
                                        xtype: 'textfield',
                                        fieldLabel:'Url',
                                        id: "IssueUrl",
                                        readOnly:true,
                                        fieldClass:'readonly',
                                        name: 'IssueUrl',
                                        listeners:{
                                            load:function() {
                                                this.setValue(Ext.getCmp('main_url').getValue());
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        layout:'column',
                        defaults:{
                            layout:'form',
                            bodyStyle:'padding:0 10px 0 0'
                        },
                        items:[
                            {
                                defaults:{anchor:'100%'},
                                items:[
                                    {
                                        columnWidth:0.2,
                                        xtype: 'textfield',
                                        fieldLabel:'Version',
                                        id: "IssueVersion",
                                        name: 'IssueVersion',
                                        readOnly:true,
                                        fieldClass:'readonly',
                                        listeners:{
                                            load:function() {
                                                this.setValue(Ext.get(App.activeTabId + '_ClassifyVersion').getValue());
                                            }
                                        }
                                    },
                                    {

                                        xtype: 'textfield',
                                        fieldLabel:'VersionID',
                                        id: "IssueVersionID",
                                        name: 'IssueVersionID',
                                        readOnly:true,
                                        hidden:true,
                                        fieldClass:'readonly',
                                        listeners:{
                                            load:function() {
                                                this.setValue(Ext.getCmp(App.activeTabId + '_ClassifyVersion').getValue());
                                            }
                                        }
                                    }
                                ]
                            },
                            {
                                defaults:{anchor:'100%'},
                                items:[
                                    {
                                        columnWidth:0.8,
                                        xtype: 'textfield',
                                        id: "IssueCategoryName",
                                        name: 'IssueCategoryName',
                                        fieldLabel:App.Parts[App.activeTabId].langscape ? 'Language':'Category',
                                        readOnly:true,
                                        fieldClass:'readonly',
                                        listeners:{
                                            load:function() {
                                                this.label.dom.textContent=App.Parts[App.activeTabId].langscape ? 'Language:':'Category:';
                                                App.Parts[App.activeTabId].langscape ?
                                                        this.setValue(Ext.getCmp('TabContainer_4_ClassifyResult').getSelectionModel().selections.items[0]?Ext.getCmp('TabContainer_4_ClassifyResult').getSelectionModel().selections.items[0].json.code:"")
                                                        :this.setValue(Ext.get(App.activeTabId + 'CategoryName') && Ext.get(App.activeTabId + 'CategoryName').dom.firstChild ? Ext.get(App.activeTabId + 'CategoryName').dom.firstChild.data : null);
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        id: "IssueCategory",
                                        name: 'IssueCategory',
                                        hidden:true,
                                        listeners:{
                                            load:function() {
                                                this.setValue(Ext.getCmp('TabContainer_1CategoryId').getValue());
                                            }
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        xtype: 'combo',
                        fieldLabel:'Type',
                        allowBlank:false,
                        emptyText :'Select type',
                        id: "type",
                        name: 'type',
                        editable:false,
                        mode: 'local',
                        store: new Ext.data.ArrayStore({
                            id: 0,
                            fields: [
                                'value',
                                'text'
                            ],
                            data: [
                                ['editorial', 'editorial'],
                                ['dashboard', 'dashboard'],
                                ['classifier','classifier'],
                                ['scraper','scraper']
                            ]
                        }),
                        valueField: 'value',
                        displayField: 'text'
                    },
                    {
                        xtype: 'fileuploadfield',
                        id: 'form-file',
                        anchor:'100%',
                        emptyText: 'Select an file',
                        fieldLabel: 'Upload file'
                    },
                    {
                        xtype: 'htmleditor',
                        height:130,
                        anchor:'100%',
                        fieldLabel:'Description',
                        id: "description",
                        name: 'description',
                        emptyText: 'enter scrape text'
                    },
                    {
                        layout:'column',
                        defaults:{
                            bodyStyle:'padding:0 0 5px 0'
                        },
                        items:[
                            {
                                width: 115,
                                bodyStyle:'padding:3px 3px 3px 0',
                                items: {
                                    xtype: 'label',
                                    cls:'x-form-item',
                                    text:'Classification Result:'
                                }
                            },
                            {
                                columnWidth: 1,
                                items: {
                                    xtype: 'grid',
                                    enableColumnMove :false,
                                    enableColumnHide:false,
                                    deferRowRender:true,
                                    disableSelection:true,
                                    viewConfig: {forceFit: true} ,
                                    autoScroll: true,
                                    style:'border:1px solid #B5B8C8',
                                    height: 100,
                                    id: "IssueClassifyResult",
                                    name: 'IssueClassifyResult',
                                    columns: [],
                                    store:new Ext.data.Store(),
                                    listeners:{
                                        load:function() {
                                            var t = Ext.getCmp(App.activeTabId + '_ClassifyResult');
                                            var cm = [];
                                            Ext.each(t.view.cm.config, function() {
                                                cm.push({header: this.header,sortable:false,dataIndex :this.dataIndex,hidden:this.hidden });
                                            });
                                            var newCM = new Ext.grid.ColumnModel(cm);
                                            this.reconfigure(t.store, newCM);
                                        }
                                    }
                                }
                            }
                        ]
                    },

                    {
                        xtype: 'textarea',
                        disabled :true,
                        fieldLabel:'Scrape Result',
                        height:80,
                        anchor:'100%',
                        id: "IssueScrapeResult",
                        name: 'IssueScrapeResult',
                        readOnly:true,
                        cls:'readonly',
                        listeners:{
                            load:function() {
                                this.setValue(Ext.get(App.activeTabId + '_ScrapeResult').dom.textContent ? Ext.get(App.activeTabId + '_ScrapeResult').dom.textContent : Ext.get(App.activeTabId + '_ScrapeResult').dom.innerText);
                            }
                        }
                    }
                ]
            },
            buttons: [
                {
                    text:'Submit',
                    handler:function() {
                        var fp=Ext.getCmp('IssueForm');
                        if(fp.getForm().isValid())
                            fp.getForm().submit({
                                url:'/index/submit/',
                                waitMsg: 'Uploading your issue...',
                                success: function(fp, o) {
                                    App.IssueWindow.hide();
                                },
                                failure: function(fp, o) {
                                }
                        });
                    }
                },
                {
                    text: 'Close',
                    handler: function() {
                        App.IssueWindow.hide();
                    }
                }
            ],
            listeners:{
                show:function() {
                    var formItems = this.items.items[0].getForm().items;
                    Ext.each(formItems.items, function(item) {
                        item.fireEvent('load', item);
                    });

                    Ext.getCmp('IssueClassifyResult').fireEvent('load', Ext.getCmp('IssueClassifyResult'));
                }
            }
        });
    },
    recalcTree : function() {
        var tree = Ext.getCmp(App.activeTabId + '_Tree');
        if(!tree){
            return;
        }
        var element = Ext.get(App.activeTabId + 'CategoryId')
        // we are in langscape
        if(!element){
            tree.reload();
            tree.expandAll();
            return;
        }
        var curNode = tree.getNodeById('c-'+element.getValue());
        if(!curNode){
            return
        }
        var  curPath = curNode.getPath();
        var data = curPath.split("/");
        curNode = tree.getNodeById(data[2]);
        curNode.reload();
        tree.expandPath(curPath);
    }
}