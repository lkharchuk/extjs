var App = {
    Portal:{},
    Parts:{},
    activeTabId : 0,
    nodesToReload: [],

    initializeTabsContent:function(tabPanel, result, url) {
        var that = this.Portal,
                parts = this.Parts,
                _id = result.id.toString(),
                curTabId = 'TabContainer_' + _id ,
                _isLangscape = (url.indexOf('langscape') >= 0),
                _attrLang = _isLangscape ? 'lang' : '';

        that.tabContent.title = result.title;
        that.tabContent.id = curTabId;
        that.westTabContainer.id = curTabId + '_WestTabPanel';
        that.centerTabContainer.id = curTabId + '_CenterTabContainer';
        that.eastTabContainer.id = curTabId + '_EastTabContainer';
        that.ResultsContainer.id = curTabId + '_ResultsContainer';

        App.Actions.callMethodForAllParts('initializeFirst', [curTabId,_attrLang,_id]);

        that.tabContent.items = [that.westTabContainer, that.centerTabContainer, that.eastTabContainer];
        //that.westTabContainer.items = [parts.Category.Search, parts.Category.initTree(_id, url)];
        that.westTabContainer.items = [parts.Category.initTree(_id, url)];
        that.centerTabContainer.items = [that.ResultsContainer, parts.Keywords.Panel];
        parts.Keywords.Panel.items = _isLangscape ? [parts.Keywords.Grid,parts.Keywords.NavigationPanel] : [parts.Keywords.PanelTop, parts.Keywords.Grid,parts.Keywords.NavigationPanel];
        that.ResultsContainer.items = [parts.Classify.Grid, parts.Scrape.Tabs];
        parts.Scrape.Tabs.items = [parts.Scrape.Result, parts.FrequencyList.Grid];
        //that.eastTabContainer.items = [parts.Senses.Search,parts.Senses.livegrid,parts.Senses.NavigationPanel];
        that.eastTabContainer.items = [parts.Senses.Search,parts.Senses.GridPanel];


        tabPanel.add(that.tabContent);
        parts[curTabId] = {'clear':false,'active':false,'langscape':_isLangscape,id:_id};

        Ext.getCmp(parts.Keywords.Grid.id).getView().getRowClass = function(record, index) {
            if (index == 0 && record.id.indexOf('ext') >= 0) {
                return 'rowempty';
            }
            return (record.data.is_deleted == '1' ? 'deleted' : record.data.is_changed == '1' ? 'changed' : '');
        };

        Ext.getCmp(parts.Keywords.Grid.id).getView().on('rowsinserted', function(view, firstRow, lastRow) {
            this.grid.getSelectionModel().selectRow(1, true);
            App.Actions.checkCredentials('keywordsReadOnly') ?null:this.grid.startEditing(0, 0);
        });

    },

    initializeTabs: function () {
        var that = this;
        new Ajax.Request('/tree/tabs', {
            method:'get',
            onSuccess: function(transport) {
                var _tabPanel = Ext.getCmp('TabPanel');
                result = eval('(' + transport.responseText + ')');
                for (i = 0; i < result.length; i++) {
                    that.initializeTabsContent(_tabPanel, result[i], '/tree/index/?dimension=' + result[i].id);
                }
                var lang = {
                    id:result.length + 1,
                    title:'langScape',
                    name:'ls',
                    algo_enum:'ls'
                };
                that.initializeTabsContent(_tabPanel, lang, '/tree/langscape');
                App.countTabID = lang.id;
                _tabPanel.setActiveTab(App.activeTabId);
                //fix for IE8
                _tabPanel.setHeight(Ext.getCmp('TabPanel').getHeight() - 1);
            }
        });
    },




    initialize:function() {
        var ViewPortal = new Ext.Viewport({
            id: 'ViewPortal',
            layout: 'border',
            items: [this.Portal.topPanel, this.Portal.centerPanel, this.Portal.southPanel]
        });
        new Ext.form.ComboBox(App.Portal.Language);
        this.initializeTabs();

        App.Actions.initTopMenuClick();

        Ext.get('TabPanel').on('click', function(e) {
            var t = Ext.getCmp(App.activeTabId + '_KeywordsGrid').store;
            t.proxy.api.read.url = "/keywords/index" +
                    "?category_id=" + Ext.getCmp(App.activeTabId + 'CategoryId').value +
                    "&language_id=" + e.target.id.replace(App.activeTabId + '_', '');
            t.reload();
        },
                this, { delegate: 'img.flag'}
                );
    }
};




App.Portal.ResultsContainer = {
    xtype: 'panel',
    region: 'center',
    split: true,
    layout: 'border',
    border: false
};


App.Portal.centerTabContainer = {
    xtype: 'panel',
    region: 'center',
    layout: 'border',
    margins:'1px 0 0 0',
    border: false
};

App.Portal.eastTabContainer = {
    xtype: 'panel',
    region: 'east',
    title: 'Keyword Senses',
    collapsible: true,
    titleCollapse: true,
    collapseMode:'mini',
    layout:'border',
    width: 250,
    minWidth: 200,
    margins:'1px 0 0 0'
};

App.Portal.westTabContainer = {
    xtype: 'panel',
    title: 'Category Manager',
    collapsible: true,
    titleCollapse: true,
    collapseMode:'mini',
    region: 'west',
    layout: 'border',
    margins:'1px 0 0 0',
    width: 350,
    minWidth:200
};

App.Portal.tabContent = {
    layout: 'border',
    border: false,
    defaults : {split : true},
    listeners : {
        activate: function(tab) {
            App.activeTabId = tab.id;
            App.Parts[tab.id].active = true;
            if (App.Parts[tab.id].clear) {
                App.Actions.ReClassifyTab();
                App.Parts[tab.id].clear = false;
            }
        }
    }
};

/*
 * Main Panels
 */

App.Portal.urlPost = {
    items: [
        {
            xtype: 'label',
            text: 'Enter URL:',
            style:'padding:0 10px 0 0'
        },
        {
            xtype: 'textfield',
            id: "main_url",
            name: 'url',
            emptyText: 'enter URLs',
            //vtype: 'url',
            //allowBlank: false,
            minWidth:200,
            maxWidth:500,
            width: 400,
            listeners: {
                specialkey: function(field, e) {
                    if (e.getKey() == e.ENTER) {
                        App.Actions.classify(field.getValue());
                    }
                },
                render:function() {
                    this.value = App.url;
                }
            }
        },
        {
            xtype: 'tbbutton',
            text:'Classify',
            listeners: {
                click: function() {
                    App.Actions.classify(Ext.getCmp('main_url').getValue());
                }
            }
        },
        '-',
        {
            xtype: 'tbbutton',
            text:'ReClassify',
            listeners: {
                click: function() {
                    App.Actions.classify('');
                }
            }
        },
        '-',
        {
            xtype:'tbbutton',
            text:'Utility',
            listeners:{
                click:function() {
                    App.UtilityWindow ? null : App.Actions.GenerateUtilityWindow();
                    App.UtilityWindow.show(this);
                }
            }
        },
        '-',
        {
            xtype: 'tbbutton',
            text:'Clear',
            listeners: {
                click: function() {
                    App.Actions.clear();
                }
            }
        },
        {  xtype: 'tbfill'},
        {
            xtype: 'tbbutton',
            cls:'x-btn-text-icon',
            iconCls:'issue-icon',
            text:'Issue Reporting',
            listeners:{
                click:function() {
                    App.IssueWindow ? null : App.Actions.GenerateIssueWindow();
                    App.IssueWindow.show(this);
                }
            }
        }
    ]
};

App.Portal.tabPanel = {
    xtype: 'tabpanel',
    id: 'TabPanel',
    region: 'center',
    border: false
};

App.Portal.topPanel = {
    xtype: 'panel',
    id: 'TopPanel',
    region: 'north',
    height: 33,
    border: false,
    style: 'border-bottom-width: 1px',
    contentEl: 'TopPanelContent',
    listeners:{
        afterrender:function() {
            App.Actions.checkCredentials('admin') ? Ext.get('_admin').removeClass('hidden') : Ext.get('_admin').addClass('hidden');
            Ext.get('_').addClass('hidden');
        }
    }
};

App.Portal.centerPanel = {
    xtype: 'panel',
    region: 'center',
    layout: 'border',
    border:false,
    items: App.Portal.tabPanel,
    tbar: App.Portal.urlPost
};

App.Portal.southPanel = {
    xtype: 'panel',
    id: 'southPanel',
    region: 'south',
    height: 15,
    border: false,
    hideBorders:true,
    bodyCssClass:'footer',
    html:'<div class="status left">  <span class="waiting">waiting</span> <span class="active">active</span> <span class="live">live</span> <span class="default">default</span> <span class="blank">empty</span></div><div class=right>&copy; 2011 Crystal Semantics</div>'
};

App.Portal.Language = {
    id: "language_selector",
    renderTo:'TabLanguage',
    triggerAction:'all',
    mode:'local',
    displayField: 'title',
    valueField: 'id',
    width: 100,
    editable: false,
    store: new Ext.data.JsonStore({
        url:'/index/languages',
        root:'result',
        fields: ['id','selected','title'],
        listeners: {
            load:function(ds, records, o) {
                var _selected=records[ds.find('selected', 'true')];
                var _id = _selected?_selected.data.id:records[0].data.id;                                            
                Ext.getCmp('language_selector').setValue(_id);
                App.activeLanguage = _id;
            }
        }
    }),
    listeners: {
        render: function() {
            this.store.load();
        },
        select:function(combo, record, index) {
            App.activeLanguage = record.data.id;
            new Ajax.Request("/index/change-language?id=" + this.getValue(), {
                method:'get',
                asynchronous:false,
                onSuccess: function(data) {
                    //reload tree
                    var t = Ext.getCmp(App.activeTabId + '_Tree');
                    t.loader.load(t.getRootNode());
                    
                    //reload keywords
                    var g = Ext.getCmp(App.activeTabId + "_KeywordsGrid").store;//.removeAll();
                    g.proxy.api.read.url = "/keywords/index" +
                            "?category_id=" + Ext.getCmp(App.activeTabId + 'CategoryId').getValue() +
                            "&language_id=" + record.data.id;
                    Ext.getCmp(App.activeTabId + 'CategoryId').getValue() == "" ? null : g.reload();
                }
            });

        }
    }
};
