var KeywordsGridSM = function() {
            return new Ext.grid.CheckboxSelectionModel({
                singleSelect: false,
                checkOnly: true,
                listeners:{
                    beforerowselect: function(el, rowIndex, keepExisting, record) {
                        if (rowIndex == 0)
                            return false;
                    }},
                onEditorKey : function(field, e) {
                    var k = e.getKey(),
                            newCell,
                            g = this.grid,
                            last = g.lastEdit,
                            ed = g.activeEditor,
                            shift = e.shiftKey,
                            ae, last, r, c;

                    if (k == e.TAB) {
                        e.stopEvent();
                        ed.completeEdit();
                        if (shift) {
                            newCell = g.walkCells(ed.row, ed.col - 1, -1, this.acceptsNav, this);
                        } else {
                            newCell = g.walkCells(ed.row, ed.col + 1, 1, this.acceptsNav, this);
                        }
                    } else if (k == e.ENTER) {

                        if (this.moveEditorOnEnter !== false) {
                            if (shift) {
                                newCell = g.walkCells(last.row - 1, last.col, -1, this.acceptsNav, this);
                            } else {
                                if (last.row == 0)
                                    newCell = g.walkCells(0, 0, 1, this.acceptsNav, this);
                                else
                                if (g.lastEdit && g.lastEdit.isValid == false)
                                    newCell = g.walkCells(last.row, last.col, 1, this.acceptsNav, this);
                                else
                                    newCell = g.walkCells(last.row + 1, last.col, 1, this.acceptsNav, this);
                            }
                        }
                    }
                    if (newCell) {
                        r = newCell[0];
                        c = newCell[1];
                        if (g.isEditor && g.editing) {
                            ae = g.activeEditor;
                            if (ae && ae.field.triggerBlur) {
                                ae.field.triggerBlur();
                            }
                        }
                        g.startEditing(r, c);
                    }
                }
            })
        };

App.Parts.Keywords = {
    PanelTop : {
        xtype: 'panel',
        region: 'north',
        height: 70,
        border:false,
        cls:'nobg',
        bodyCssClass:'keywordstop',
        listeners:{
            afterrender :function() {
                this.body.hide();
            }
        }
    },
    NavigationPanelDataweight:['-90','-80','-70','-60','-50','-40','-30','-20','-10','0','10','20','30','40','50','60','70','80','90'],
    NavigationPanelDatalexeme:['#','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    NavigationPanel : {
        xtype: 'panel',
        region: 'east',
        width: 22,
        border:false,
        cls:'nobg',
        tpl: new Ext.XTemplate(
                '<ul class="inline">',
                '<tpl for=".">',
                '<li id="{.}">{.}</li>',
                '</tpl></ul>'
                )
        ,
        listeners:{
            render: function(el) {
                this.tpl.overwrite(this.body, this.data);
                this.body.on('click', function(e) {
                    App.Actions.highlightNearest(e.target,"_KeywordsGrid");
                });
            }
            ,
            afterrender:function() {
                this.body.hide();
            }
        }
    },

    Panel : {
        xtype: 'panel',
        split: true,
        collapsible: true,
        titleCollapse: true,
        collapseMode:'mini',
        region: 'east',
        //layout:'border',
        width: 300,
        minWidth: 300
    },

    GridFieldslang : [
        'id',
        'lexeme',
        'is_changed',
        'is_deleted',
        'langscape_version_id',
        'language_id',
        'group'
    ],

    GridFields : [
        'id',
        'lexeme',
        'weight',
        'is_deleted',
        'is_changed',
        'category_translation_id',
        'group',
        'previous',
        'count'
    ],

    GridRecordlang:[
        {name: 'id',mapping:'id'},
        {name: 'lexeme',mapping:'lexeme'},
        {name: 'is_deleted',mapping:'is_deleted'},
        {name: 'is_changed',mapping:'is_changed'},
        {name: 'langscape_version_id',mapping:'langscape_version_id'},
        {name: 'language_id',mapping:'language_id'},
        {name: 'group',mapping:'group'},
    ],
    GridRecord:[
        {name: 'id',mapping:'id'},
        {name: 'lexeme',mapping:'lexeme'},
        {name: 'weight',mapping:'weight', sortType : 'asInt',type:'int'},
        {name: 'is_deleted',mapping:'is_deleted'},
        {name: 'is_changed',mapping:'is_changed'},
        {name: 'category_translation_id',mapping:'category_translation_id'},
        {name: 'group',mapping:'group'},
        {name: 'previous',mapping:'previous'},
        {name: 'count',mapping:'count'}
    ],


    GridCMlang : function() {
            return [
        {
            header:"Lexeme",
            sortable:true,
            dataIndex:'lexeme',
            editable:true,
            id:'lexeme',
            unique:true,
            menuDisabled  :true,
            editor   : new Ext.form.TextField({allowBlank: false})/*,
            renderer:function(value, meta, record) {
                if (record.data.is_changed == 1) {
                    meta.attr = 'ext:qtip="' + record.data.previous + '"';
                }
                return value;
            }*/
        },
        {
            width:16,
            sortable:false,
            editable:false,
            cmargins:'0 0 0 0',
            menuDisabled:true,
            //css:{'background-color':'red'},
            renderer:function(value, meta, record) {
                return "<div class='next'></div>";
            },
            listeners: {
                click: function(obj, grid, rowIndex, e) {
                    Ext.select('.next.active').removeClass('active');
                    e.target.addClassName('active');

                    if (rowIndex == 0)
                        return;
                    var record = grid.getStore().getAt(rowIndex);  // Get the Record
                    var t = Ext.getCmp(App.activeTabId + '_EastTabContainer');
                    if (t.header.select('.x-panel-header-subtext').elements.length == 0) {
                        t.header.createChild("<div class='x-panel-header-subtext'>: " + record.data.lexeme + "</div>");
                    }
                    else {
                        t.header.select('.x-panel-header-subtext').elements[0].textContent = ': ' + record.data.lexeme;
                    }

                    var t = Ext.getCmp(App.activeTabId + '_SensesGrid');
                    t.store.proxy.api.read.url = "/senses/langscape?" + "id=" + record.data.id + '&version_id=' + record.data.langscape_version_id;
                    t.store.reload({ params: { start: 1} });
                }
            }
        },
        {
            sortable:false,
            editable:false,
            dataIndex:'group',
            hidden:true
        }
    ]},

    GridCM : function() {
            return [
        {
            header:"Lexeme",
            dataIndex:'lexeme',
            id:'lexeme',
            sortable:true,
            editable:true,
            unique:true,
            menuDisabled:true,
            editor: new Ext.form.TextField({allowBlank: false})//,
            /*renderer:function(value, meta, record) {
                if (record.data.is_changed == 1) {
                    meta.attr = 'ext:qtip="' + record.data.previous + '"';
                }
                return value;
            }*/
        },
        {
            header:"Weight",
            dataIndex:'weight',
            sortable:true,
            editable:true,
            menuDisabled:true,
            editor: new Ext.form.NumberField({ allowBlank: false,id:App.activeTabId + 'editWeight' }),
            renderer:function(value, meta, record) {
                if (record.data.is_changed == 1) {
                    meta.attr = 'ext:qtip="' + record.data.previous + '"';
                }
                return value;
            }
        },
        {
            width:16,
            sortable:false,
            editable:false,
            cmargins:'0 0 0 0',
            menuDisabled:true,
            //css:{'background-color':'red'},
            renderer:function(value, meta, record) {
                return "<div class='next'></div>";
            },
            listeners: {
                click: function(obj, grid, rowIndex, e) {
                    Ext.select('.next.active').removeClass('active');
                    e.target.className = e.target.className + ' active';

                    if (rowIndex == 0)
                        return;
                    var record = grid.getStore().getAt(rowIndex);  // Get the Record
                    var t = Ext.getCmp(App.activeTabId + '_EastTabContainer');
                    if (t.header.select('.x-panel-header-subtext').elements.length == 0) {
                        t.header.createChild("<div class='x-panel-header-subtext'>: " + record.data.lexeme + "</div>");
                    }
                    else {
                        t.header.select('.x-panel-header-subtext').elements[0].textContent = ': ' + record.data.lexeme;
                    }
                    var t = Ext.getCmp(App.activeTabId + '_SensesGrid');
                    t.store.proxy.api.read.url = "/senses/index?" + "id=" + record.data.id;
                    t.store.sortInfo.field=App.Parts.Senses['GridCM'+ (App.Parts[App.activeTabId].langscape?'lang':'')+'SortInfo'];
                    t.store.sortInfo.direction='ASC';
                    t.store.reload();
                    //t.store.reload({'params':{ start: 1}});
                }
            }
        },
        {
            sortable:false,
            editable:false,
            dataIndex:'group',
            hidden:true
        }
    ]},

    Grid : {
        region:'center',
        loadMask:true,
        clicksToEdit: 1,
        cls:'gridborder',
        autoScroll:true,
        autoShow:false,
        border:false,
        listeners: {
            afterrender :function() {
                this.setVisible(false);
                this.getView().on('doUpdate', function() {
                    var obj='ScrollGrid_KeywordsGrid';
                    if (App[obj] !== undefined) {
                        var grid = Ext.getCmp(App[obj].grid);
                        grid.startEditing(App[obj].row, App[obj].col);
                        delete App[obj];
                    }
                });
            },
            validateedit:function(e) {
                if (!e.grid.colModel.config[e.column].unique)
                    return;
                if (e.grid.colModel.config[e.column].unique == true) {
                    var field = e.field;
                    var i = 0, isValid = true;
                    Ext.each(e.grid.store.data.items, function(item) {
                        if (e.value == item.data[field] && i != e.row) {
                            isValid = false;
                            return;
                        }
                        i++;
                    });
                    e.grid.lastEdit.isValid = isValid;
                    return isValid;
                }
            },
            beforeedit: function(e) {
                return App.Actions.checkCredentials('keywordsEdit' + (App.Parts[App.activeTabId].langscape?'lang':''),  Ext.get(App.activeTabId + '_LanguageId')?Ext.get(App.activeTabId + '_LanguageId').getValue():e.record.data.language_id) ;
            },
            afteredit: function(e) {
                var _isFilled = true;
                var _isValid = true;
                if (e.row == 0) {
                    for (var i = 1; i < e.grid.colModel.config.length; i++) {
                        if (e.grid.colModel.config[i].dataIndex && !e.record.data[e.grid.colModel.config[i].dataIndex]) {
                            _isFilled = false;
                            e.grid.startEditing(e.row, i);
                            return;
                        }
                    }
                    if (_isFilled) {
                        //insert new row for adding element
                        //e.grid.getView().getRow(e.row).addClassName('rownew').removeClassName('rowempty');
                        var cl=e.grid.getView().getRow(e.row).className;
                        e.grid.getView().getRow(e.row).className=cl.replace('rowempty','rownew');
                        e.grid.getStore().getAt(e.row).data.group = 'default';
                        e.record.data.category_translation_id
                                ? e.grid.getStore().insert(0, new e.grid.store.recordType({'category_translation_id':e.record.data.category_translation_id,'group':'a'}))
                                : e.grid.getStore().insert(0, new e.grid.store.recordType({'language_id':e.record.data.language_id,'langscape_version_id':e.record.data.langscape_version_id,'group':'a'}));
                    }
                }
                else {
                    e.grid.getSelectionModel().selectRow(e.row, true);
                }
            },
            sortchange :function(grid, sortInfo) {
                Ext.get(App.activeTabId + '_NavigationPanel') && Ext.getCmp(App.activeTabId + '_NavigationPanel').update(App.Parts.Keywords['NavigationPanelData' + sortInfo.field]);
            }
        }
    },


    displayFlags : function (id, container, data, curLang, category_id) {
        var _flagHtml = '',
                _flagCls = 'translated';
        for (var i = 0; i < data.length; i++) {
            el = data[i];
            _flagHtml += "<img title='" + el.code + "' class='" + (curLang == el.id ? 'flag active' : 'flag') + "' id='" + id + '_' + el.id + "' src='/images/flags/" + el.code + (el.status == 1 ? '' : '_off') + ".gif'/>";
            if (el.status == 0)
                _flagCls = 'edit';
        }
        Ext.getCmp(id + '_Flags').update(_flagHtml);
        Ext.getCmp(id + '_FlagsStatus').addClass(_flagCls);
    },

    fillTopPanel:function(_data, curTabId) {
        Ext.getCmp(curTabId + '_KeywordsPanelTop').body.show();

        Ext.get(curTabId + 'CategoryName').update(_data.caterory_name + " <span class='gray' title='" + _data.category_translation.name + "'> - " + _data.category_translation.name + "</span>");
        Ext.getCmp(curTabId + 'CategoryId').setValue(_data.category_translation.category_id);
        Ext.getCmp(curTabId + 'CategoryTranslatedId').setValue(_data.category_translation.id);
        Ext.getCmp(curTabId + '_LanguageId').setValue(_data.category_translation.language_id);

        var t = Ext.getCmp(curTabId + 'IsLive');
        t.suspendEvents();
        t.setValue(_data.category_translation.is_live);
        t.resumeEvents();

        var t = Ext.getCmp(curTabId + 'IsActive');
        t.suspendEvents();
        App.Actions.checkCredentials('keywordsActive',_data.category_translation.language_id) ? t.enable() : t.disable();
        t.setValue(_data.category_translation.is_active);
        t.resumeEvents();

        var t = Ext.getCmp(curTabId + 'IsTranslated');
        t.suspendEvents();
        App.Actions.checkCredentials('keywordsTranslated', _data.category_translation.language_id) ? t.enable() : t.disable();
        t.setValue(_data.category_translation.is_translated);
        t.resumeEvents();

        this.displayFlags(curTabId, Ext.getCmp(curTabId + '_KeywordsPanelTop'), _data.languages, _data.category_translation.language_id, _data.category_translation.category_id);

    },

    initializeFirst:function(curTabId, Lang, _id) {
        var that = this;
        var _isLangscape = Lang == '' ? false : true;
                this.Panel.id = curTabId + '_KeywordsPanel';
                this.Grid.id = curTabId + '_KeywordsGrid';

        var sm=KeywordsGridSM();//.apply(this.Grid)
        this.Grid.sm =sm;
        this.Grid.columns = [sm];
        this.Grid.columns=this.Grid.columns.concat(this["GridCM" + Lang].apply(this.Grid));

        this.Grid.xtype = App.Actions.checkCredentials('keywordsReadOnly') ? 'grid' : 'editorgrid';
        this.NavigationPanel.id = curTabId + '_NavigationPanel';
        this.NavigationPanel.data = this.NavigationPanelDatalexeme;
        this.Panel.title = _isLangscape ? 'Language Keywords' : 'Category Keywords';

        if (!_isLangscape) {
            this.Panel.layout = 'border';
            this.PanelTop.id = curTabId + '_KeywordsPanelTop';
            this.PanelTop.items = [
                {
                    xtype:'box',
                    cls:'nowrapTitle',
                    id:curTabId + 'CategoryName',
                    style:{'padding':'5px 0 3px 0'},
                    autoEl:{
                        tag:'div',
                        html:''
                    }
                },
                {
                    layout:'column',
                    border:false,
                    items:[
                        {
                            columnWidth:0.21,
                            labelWidth:25,
                            hideLabels:false,
                            border:false,
                            layout:'form',
                            items:[
                                {
                                    xtype : 'checkbox',
                                    name:'is_live',
                                    id:curTabId + 'IsLive',
                                    fieldLabel:'Live',
                                    inputValue : '1',
                                    boxLabel:'',
                                    disabled:!App.Actions.checkCredentials('keywordsLive'),
                                    listeners:{
                                        check:function() {
                                            var category_translation_id = Ext.get(App.activeTabId + 'CategoryTranslatedId').getValue();
                                            new Ajax.Request((_isLangscape ? '/keywords/set-langscape-live/?id=' : '/keywords/set-live/?id=' + category_translation_id + '&status=') + (+this.getValue()), {
                                                method:'get',
                                                asynchronous:true,
                                                onSuccess:function() {
                                                    var t = Ext.get(App.activeTabId + '_' + Ext.getCmp(App.activeTabId + '_LanguageId').value);
                                                    src = t.getAttribute('src');
                                                    src = Ext.getCmp(App.activeTabId + 'IsLive').checked ? src.replace('_off.gif', '.gif') : src.replace('.gif', '_off.gif');
                                                    t.set({'src':src});
                                                    App.Actions.recalcTree();
                                                }
                                            });
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columnWidth:0.23,
                            labelWidth:37,
                            hideLabels:false,
                            border:false,
                            layout:'form',
                            items:[
                                {
                                    xtype : 'checkbox',
                                    name:'is_active',
                                    id:curTabId + 'IsActive',
                                    fieldLabel:'Active',
                                    inputValue : '1',
                                    boxLabel:'',
                                    listeners:{
                                        check:function() {
                                            new Ajax.Request((_isLangscape ? '/keywords/set-langscape-activity/?id=' : '/keywords/set-activity/?id=' + Ext.get(App.activeTabId + 'CategoryTranslatedId').getValue() + '&status=') + (+this.getValue()), {
                                                method:'get',
                                                asynchronous:true,
                                                onSuccess:function() {
                                                    var t = Ext.get(App.activeTabId + '_' + Ext.getCmp(App.activeTabId + '_LanguageId').value);
                                                    src = t.getAttribute('src');
                                                    src = Ext.getCmp(App.activeTabId + 'IsActive').checked ? src.replace('_off.gif', '.gif') : src.replace('.gif', '_off.gif');
                                                    t.set({'src':src});
                                                    App.Actions.recalcTree();
                                                }
                                            });
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columnWidth:0.30,
                            labelWidth:60,
                            hideLabels:false,
                            layout:'form',
                            border:false,
                            border:false,
                            items:[
                                {
                                    xtype: 'checkbox',
                                    name: 'is_translated',
                                    id: curTabId + 'IsTranslated',
                                    fieldLabel: 'Translated',
                                    inputValue: '1',
                                    boxLabel: '',
                                    disabled:!App.Actions.checkCredentials('keywordsTranslated'),
                                    listeners: {
                                        check:function() {
                                            new Ajax.Request((_isLangscape ? '/keywords/set-langscape-translation/?id=' : '/keywords/set-translation/?id=' + Ext.get(App.activeTabId + 'CategoryTranslatedId').getValue() + '&status=') + (+this.getValue()), {
                                                method:'get',
                                                asynchronous:true,
                                                onSuccess:function() {
                                                    App.Actions.recalcTree();
                                                }
                                            });
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            columnWidth:0.2,
                            border:false,
                            items:[
                                {
                                    cls :'right convert',
                                    xtype : 'box',
                                    id:curTabId + 'Convert',
                                    border:false,
                                    listeners:{
                                        render: function(component) {
                                            component.getEl().on('click', function(e) {
                                                document.location = '/keywords/export-category/?id=' + Ext.get(App.activeTabId + 'CategoryTranslatedId').getValue();
                                            });
                                        }
                                    }

                                },
                                {
                                    xtype:'textfield',
                                    hidden:true,
                                    id: curTabId + 'CategoryId'
                                },
                                {
                                    xtype:'textfield',
                                    hidden:true,
                                    id: curTabId + 'CategoryTranslatedId'
                                },
                                {
                                    xtype:'textfield',
                                    hidden:true,
                                    id: curTabId + '_LanguageId'
                                }
                            ]

                        }
                    ]
                },
                {
                    cls:'left',
                    xtype:'box',
                    id:curTabId + '_Flags',
                    autoEl:{
                        tag:'div',
                        html:''
                    }
                },
                {
                    cls:'right flagsstatus',
                    xtype:'box',
                    id:curTabId + '_FlagsStatus',
                    autoEl:{
                        tag:'div',
                        html:''
                    }
                }
            ];

        }

        this.Grid.view = new Ext.ux.grid.BufferView({
            // custom row height
            rowHeight: 20,
            // render rows as they come into viewable area.
            forceFit:true,
            scrollDelay: false
        });


        
        this.Grid.store = new Ext.data.GroupingStore({
            url:'/keywords/index',
            sortInfo:{field: 'lexeme', direction: "ASC"},
            groupField:'group',
            totalProperty: 'count',
            reader:new Ext.data.JsonReader({
                root:'result',
                fields:this["GridFields" + Lang]
            }, Ext.data.Record.create(this["GridRecord" + Lang])),
            listeners: {
                beforeload: function() {
                    var grid = Ext.getCmp(curTabId + '_KeywordsGrid');
                    grid.setVisible(true);
                    Ext.getCmp(curTabId + '_KeywordsPanel').body.mask();
                    Ext.getCmp(curTabId + '_NavigationPanel').body.show();
                },
                load: function() {
                    var _data = this.reader.jsonData;
                    var _getKG = Ext.getCmp(curTabId + '_KeywordsGrid');

                    var langId=_isLangscape?_data.language_id:_data.category_translation.language_id;

                    //check tbar items permissions
                    var _gBtns=_getKG.topToolbar?_getKG.topToolbar.items:undefined;
                    if(_gBtns){
                        var btn=[_gBtns.get('Update'),_gBtns.get('Remove')];
                        App.Actions.checkCredentials('keywordsEdit' + Lang,langId ) ? Ext.each(btn,function(){this.enable();}) :  Ext.each(btn,function(){this.disable();});

                        var btn=[_getKG.topToolbar.items.get('Approve'),_getKG.topToolbar.items.get('Reject')];
                        App.Actions.checkCredentials('keywordsApprove' + Lang,langId ) ? Ext.each(btn,function(){this.enable();}) :  Ext.each(btn,function(){this.disable();});
                    }
                    //end check credentials

                    if (App.Actions.checkCredentials('keywordsEdit' + Lang)) {
                        _isLangscape
                                ? this.insert(0, new _getKG.store.recordType({'language_id':_data.language_id,'langscape_version_id':_data.langscape_version_id,'group':'a'}))
                                : this.insert(0, new _getKG.store.recordType({'category_translation_id':_data.category_translation.id,'group':'a'}));
                    }
                    _getKG.getSelectionModel().clearSelections();
                    //temp solution
                    _getKG.setHeight(Ext.getCmp(curTabId + '_NavigationPanel').getHeight());
                    if (!_isLangscape) {
                        _data.category_translation ? that.fillTopPanel(_data, curTabId) : null;
                    }

                    Ext.getCmp(curTabId + '_KeywordsPanel').body.unmask();

                },
                clear:function() {
                    Ext.getCmp(curTabId + '_KeywordsGrid').setVisible(false);
                    Ext.get(curTabId + '_KeywordsPanelTop') && Ext.getCmp(curTabId + '_KeywordsPanelTop').body.hide();
                    Ext.getCmp(curTabId + '_NavigationPanel').body.hide();
                }
            }
        });

        if (App.Actions.checkCredentials('keywords' + Lang))
            this.Grid.tbar = {
                //height: 100,
                items:
                        [
                            {
                                text:'Approve',
                                id:'Approve',
                                cls:'bgWhite',
                                iconCls:'gridApprove',
                                disabled:!App.Actions.checkCredentials('keywordsApprove' + Lang),
                                handler:function(e) {
                                    var grid = Ext.getCmp(App.activeTabId + '_KeywordsGrid');
                                    var sm = grid.getSelectionModel();
                                    if (sm.selections.length == 0)
                                        return true;
                                    var todoList = sm.getSelections();
                                    var todoList_Id = [];
                                    for (i = 0; i < sm.getCount(); i++) {
                                        if (todoList[i].data.is_changed == 1 || todoList[i].data.is_deleted == 1)
                                            todoList_Id.push(todoList[i].id);
                                    }
                                    if (todoList_Id.length > 0 && sm.hasSelection()) {
                                        Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.mask();
                                        var conn = new Ext.data.Connection();
                                        conn.request({
                                            url: '/keywords/approve' + (_isLangscape ? '-langscape' : ''),
                                            params:  {data: Ext.encode(todoList_Id)},
                                            success: function(resp, opt) {
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").store.reload();
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                                App.Actions.recalcTree();

                                            },
                                            failure: function(resp, opt) {
                                                Ext.Msg.alert('Error', 'Unable to Approve keyword(s)');
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                            }
                                        });
                                    } else {
                                        sm.clearSelections();
                                    }

                                }
                            },
                            '-',
                            {
                                text:'Reject',
                                id:'Reject',
                                cls:'bgWhite',
                                iconCls:'gridReject',
                                disabled:!App.Actions.checkCredentials('keywordsApprove' + Lang),
                                handler:function(e) {
                                    var grid = Ext.getCmp(App.activeTabId + '_KeywordsGrid');
                                    var sm = grid.getSelectionModel();
                                    if (sm.selections.length == 0)
                                        return true;
                                    var todoList = sm.getSelections();
                                    var todoList_Id = [],todoListLocal_Id = [];
                                    for (i = 0; i < sm.getCount(); i++) {
                                        if (todoList[i].data.is_changed == 1 || todoList[i].data.is_deleted == 1)
                                            todoList_Id.push(todoList[i].id);
                                        else
                                            if(todoList[i].dirty)
                                            todoListLocal_Id.push(todoList[i].id);

                                    }
                                    if (todoList_Id.length > 0 && sm.hasSelection()) {
                                        Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.mask();
                                        var conn = new Ext.data.Connection();
                                        conn.request({
                                            url: '/keywords/reject' + (_isLangscape ? '-langscape' : ''),
                                            params:  {data: Ext.encode(todoList_Id)},
                                            success: function(resp, opt) {
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").store.reload();
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                                App.Actions.recalcTree();
                                            },
                                            failure: function(resp, opt) {
                                                Ext.Msg.alert('Error', 'Unable to Reject keyword(s)');
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                            }
                                        });
                                    }
                                    else {
                                        if(todoListLocal_Id.length > 0)
                                        Ext.each(todoListLocal_Id,function(item){
                                            var cur=sm.selections.items[sm.selections.indexOfKey(item)];
                                            if(cur.modified.weight)
                                                cur.data.weight=cur.modified.weight;
                                            if(cur.modified.lexeme)
                                            cur.data.lexeme=cur.modified.lexeme;
                                            cur.dirty=false;
                                        });
                                        grid.getView().refresh();
                                        sm.clearSelections();
                                    }
                                }
                            },
                            '-',
                            {
                                text:'Update',
                                id:'Update',
                                iconCls:'gridUpdate',
                                disabled:!App.Actions.checkCredentials('keywordsEdit' + Lang),
                                handler:function(e) {
                                    var grid = Ext.getCmp(App.activeTabId + '_KeywordsGrid');
                                    var sm = grid.getSelectionModel();
                                    if (sm.selections.length == 0)
                                        return true;
                                    var todoList = sm.getSelections();
                                    var todoList_Id = [];
                                    var todoList_Update = [];
                                    for (i = 0; i < sm.getCount(); i++) {
                                        if (todoList[i].dirty) {
                                            todoList_Id.push(todoList[i].id);
                                            todoList_Update.push(todoList[i].data);
                                        }
                                    }
                                    if (todoList_Update.length > 0 && sm.hasSelection()) {
                                        var conn = new Ext.data.Connection();
                                        Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.mask();
                                        conn.request({
                                            url: '/keywords/update' + (_isLangscape ? '-langscape' : ''),
                                            method:'post',
                                            params:{data: Ext.encode(todoList_Update)},
                                            success: function(resp, opt) {
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").store.reload();
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                                App.Actions.recalcTree();

                                            },
                                            failure: function(resp, opt) {
                                                Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                            }
                                        });
                                    }
                                    else {
                                        sm.clearSelections();
                                    }
                                }
                            },
                            '-',
                            {
                                text:'Remove',
                                id:'Remove',
                                iconCls:'gridRemove',
                                disabled:!App.Actions.checkCredentials('keywordsEdit' + Lang),
                                handler:function(e) {
                                    var grid = Ext.getCmp(App.activeTabId + '_KeywordsGrid');
                                    var sm = grid.getSelectionModel();
                                    if (sm.selections.length == 0)
                                        return true;
                                    var todoList = sm.getSelections();

                                    var todoList_Id = [];
                                    var todoList_Title = [];
                                    for (i = 0; i < sm.getCount(); i++) {
                                        todoList_Id.push(todoList[i].id);
                                        todoList_Title.push(todoList[i].data.lexeme);
                                    }
                                    if (sm.hasSelection()) {
                                        Ext.Msg.show({
                                            title: 'Remove Keyword',
                                            buttons: Ext.MessageBox.YESNOCANCEL,
                                            msg: 'Remove <b>' + todoList_Title.splice(', ') + '</b> ?',
                                            fn: function(btn) {
                                                if (btn == 'yes') {
                                                    Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.mask();
                                                    var conn = new Ext.data.Connection();
                                                    conn.request({
                                                        url: '/keywords/delete' + (_isLangscape ? '-langscape' : ''),
                                                        params: {data: Ext.encode(todoList_Id)},
                                                        success: function(resp, opt) {
                                                            for (var i = 0; i < todoList.length; i++)
                                                                todoList[i].data.is_deleted = "1";
                                                            grid.getView().refresh();
                                                            sm.clearSelections();
                                                            Ext.getCmp(App.activeTabId + "_KeywordsGrid").store.reload();
                                                            Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                                            App.Actions.recalcTree();
                                                        },
                                                        failure: function(resp, opt) {
                                                            Ext.Msg.alert('Error', 'Unable to delete keyword' + todoList_Id.length > 1 ? 's' : '');
                                                            Ext.getCmp(App.activeTabId + "_KeywordsGrid").el.unmask();
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        ]};


    }
}

