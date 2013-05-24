App.Parts.Category = {

    dialogFields : {
        nameField : {
            xtype:'textfield',
            fieldLabel: 'Code',
            name:       'name',
            allowBlank:  false,
            grow:        false,
            vtype: 'alphanum'
        },
        codeField : {
            xtype:'textfield',
            fieldLabel: 'Code',
            name:       'code',
            allowBlank:  false,
            grow:        false,
            vtype: 'alpha'
        },
        titleField : {
            xtype:'textfield',
            fieldLabel: 'Name',
            name:       'title',
            allowBlank:  false,
            grow:        false,
            vtype: 'alphanum'
        },
        politeField :{
            xtype:'textfield',
            fieldLabel: 'Polite Name',
            name:       'polite_name',
            allowBlank:  false,
            grow:        false
        }
    },

    treeNodeTemplate : function(attr) {
        var templateVer = App.Actions.checkCredentials('Categories') ? "<div class='treeEdit'><div id='add' class='icon-add'></div><div id='csv' class='icon-csv'></div></div>" : "";
        var templateOther = App.Actions.checkCredentials('Categories')
                ? "<div class='treeEdit'><div id='add' class='icon-add'></div>" + (App.Actions.checkCredentials('CategoriesEditName') == false && App.Actions.checkCredentials('CategoriesEditCode') == false ? "" : "<div id='edit' class='icon-edit'></div>") + "<div id='delete' class='icon-delete'></div></div>"
                : (App.Actions.checkCredentials('CategoriesEditName') == false && App.Actions.checkCredentials('CategoriesEditCode') == false ? "" : "<div class='treeEdit'><div id='edit' class='icon-edit'></div></div>");

        var templateStatus = !attr.status ? "" : "<div class='status'>" +
                "<div class='waiting left'>" + (attr.status.waiting == 0 ? "&nbsp;" : + attr.status.waiting) + "</div>" +
                "<div class='active left'>" + (attr.status.active == 0 ? "&nbsp;" : attr.status.active) + "</div>" +
                "<div class='live left'>" + (attr.status.live == 0 ? "&nbsp;" :  + attr.status.live) + "</div>" +
                "</div>";

        if (attr.version) {
            attr.version_id = attr.id;
            attr.id = 'v-' + attr.id;
            attr.text = "<span class='treeTitle'>" + attr.version + "</span>" + templateVer;
            attr.cls = 'tree-version';
            attr.iconCls = 'tree-version-icon';
        }
        else {
            attr.cur_id = attr.id;
            attr.id = 'c-' + attr.id;
            attr.text = ' <span class="'+attr.status.color+'">' + attr.name + ' ' + attr.polite_name + '</span>' + templateStatus + templateOther;
            attr.cls = 'tree-category';
            attr.iconCls = 'tree-category-icon';
        }
        return attr;
    },

    treeNodeTemplateLangscape : function(attr) {
        var templateVer = "";//App.Actions.checkCredentials('Languages') ? "<div class='treeEdit'><div id='add' class='icon-add'></div></div>" : "";
        var templateLang = ""; //App.Actions.checkCredentials('Languages') ? "<div class='treeEdit'><div id='edit' class='icon-edit'></div><div id='del' class='icon-delete'></div></div>" : "";
        var templateStatus = !attr.status ? "" : "<div class='status'>" +
                (attr.status.waiting == 0 ? "" : "<span class='waiting'>" + attr.status.waiting + "</span>") +
                "</div>";
        
        if (attr.code) {
            attr.cur_id = attr.id;
            attr.id = 'l-' + attr.version_id + '-' + attr.id;
            attr.text = '<span class="'+attr.status.color+'">' + attr.title + ' (' + attr.code + ')' + '</span>' + templateStatus;
            attr.cls = 'tree-category';
            attr.iconCls = 'tree-category-icon';
        }
        else {
            attr.version_id = attr.id;
            attr.id = 'v-' + attr.id;
            attr.iconCls = 'version';
            attr.text = attr.version + templateVer;
            attr.cls = 'tree-version';
            attr.iconCls = 'tree-version-icon';
        }
        return attr;
    },

    initTree : function(id, url) {
        var _isLangscape = url.indexOf('langscape') >= 0;

        var initTreeDialog = function(container, rootID, _isLangscape) {
            var dialogID = rootID + '_Dialog';
            var el = '<div id="' + dialogID + '" class="treeDialog"></div>';
            Ext.DomHelper.append(container, el);

            var maskForm = function(mask, id) {
                var _el = Ext.get(id + '_Dialog').child('*');
                mask ? _el.mask('Please wait', 'x-mask-loading') : _el.unmask();
            }

            var onSucessFormSubmit = function(f, a) {

                var curTree = Ext.getCmp(rootID),
                        curNode = curTree.getSelectionModel().getSelectedNode(),
                        curExpand = curNode.expanded,
                        curPath = curNode.getPath(),
                        parentNode = curNode.parentNode;

                if (f.url.indexOf('edit') >= 0) {
                    curTree.getLoader().load(parentNode);
                    parentNode.expand();
                }else if (f.url.indexOf('delete') >= 0) {
                    var curPath = parentNode.getPath();
                    var data = curPath.split("/");
                    curNode = curTree.getNodeById(data[2]);
                    curNode.reload();
                    curTree.expandPath(curPath);
                }else {
                    if (curNode.loaded === true || curNode.loaded == undefined) {
                        curTree.getLoader().load(curNode);
                        curNode.leaf = false;
                        curNode.expand();
                    }
                }
                Ext.get(rootID + '_Dialog').hide();
            };

            var onFailFormSubmit = function(f, a) {
                maskForm(false, rootID);
                Ext.get(rootID + '_Dialog').hide(); 
                Ext.getCmp(rootID).getSelectionModel().getSelectedNode().setText("Processing...");
                if (f.url.indexOf('delete') >= 0) {
                    updateTree();
                }
            };

            var cancelHandler = function(id) {
                maskForm(false, rootID);
                //fix for IE7
                var cur = Ext.query('.active', rootID)[0];
                cur.className = cur.className.replace('active', '');
                Ext.get(rootID + '_Dialog').hide();
            };

            var submitHandler = function(id) {
                var _form = Ext.getCmp(id).getForm();
                //maskForm(true, rootID);
                _form.submit({
                    success : onSucessFormSubmit,
                    failure : onFailFormSubmit
                });
                var node = Ext.getCmp(rootID).getSelectionModel().getSelectedNode();
                if (_form.url.indexOf('delete') >= 0){
                    App.nodesToReload.push(node);
                }
                node.setText("Processing...");
                Ext.get(rootID + '_Dialog').hide(); 
            };

            var buttons = [
                {
                    xtype:'button',
                    text: 'Accept',
                    id:'confirm',
                    handler: submitHandler.createCallback(dialogID + '_Form')
                }
                ,
                {
                    xtype:'button',
                    text: 'Cancel',
                    id:'cancel',
                    handler: cancelHandler.createCallback(dialogID + '_Form')
                }
            ];

            var buttonsDel = [
                {
                    xtype:'button',
                    text: 'Confirm',
                    id:'confirm_del',
                    handler: submitHandler.createCallback(dialogID + '_Form_Del')
                }
                ,
                {
                    xtype:'button',
                    text: 'Cancel',
                    id:'cancel_del',
                    handler: cancelHandler.createCallback(dialogID + '_Form_Del')
                }
            ];


            var dialog_form = new Ext.FormPanel({
                id: dialogID + '_Form',
                border:false,
                width:235,
                items: [
                    {
                        xtype: 'textfield',
                        hidden:true,
                        name: 'parent_id'
                    },
                    {
                        xtype: 'textfield',
                        hidden:true,
                        name: 'version_id'
                    },
                    {
                        xtype: 'textfield',
                        hidden:true,
                        name: 'id'
                    }
                ],
                buttons:buttons
            });

            if (_isLangscape) {
                dialog_form.add(App.Parts.Category.dialogFields.titleField);
                dialog_form.add(App.Parts.Category.dialogFields.codeField);
            }
            else {
                App.Parts.Category.dialogFields.politeField.disabled = !App.Actions.checkCredentials('CategoriesEditName'),
                        dialog_form.add(App.Parts.Category.dialogFields.politeField);
                App.Parts.Category.dialogFields.nameField.disabled = !App.Actions.checkCredentials('CategoriesEditCode'),
                        dialog_form.add(App.Parts.Category.dialogFields.nameField);
            }
            dialog_form.render(dialogID);

            var dialog_form_del = new Ext.FormPanel({
                id: dialogID + '_Form_Del',
                border:false,
                width:160,
                items: [
                    {
                        xtype: 'textfield',
                        hidden:true,
                        name: 'id'
                    },
                    {
                        xtype: 'label',
                        cls:'x-form-item',
                        text:'Confirm delete'
                    }
                ],
                buttons:buttonsDel
            });

            dialog_form_del.render(dialogID);

        };

        var tree = new Ext.tree.TreePanel({
            useArrows: true,
            region: 'center',
            margins: '0 0 0 0',
            width: 200,
            autoScroll: true,
            containerScroll:true,
            enableDD: !_isLangscape && App.Actions.checkCredentials('Categories'),
            split: true,
            rootVisible: false,
            loadMask:true,
            border:false,
            id:'TabContainer_' + id + '_Tree',
            loader: new Ext.tree.TreeLoader({
                dataUrl: url,
                createNode: function(attr) {
                    if (_isLangscape)
                        return Ext.tree.TreeLoader.prototype.createNode.call(this, App.Parts.Category.treeNodeTemplateLangscape(attr));
                    else
                        return Ext.tree.TreeLoader.prototype.createNode.call(this, App.Parts.Category.treeNodeTemplate(attr));
                }
            }),
            listeners: {
                render:function(el) {
                    //Ext.dd.ScrollManager.register(tree.id);
                    initTreeDialog(this.id, tree.id, _isLangscape);                    
                },
                click: function(node, e) {
                    var getDialog = Ext.get(tree.id + '_Dialog'),
                            _getDialogForm = Ext.getCmp(tree.id + '_Dialog_Form'),
                            _getDialogFormDel = Ext.getCmp(tree.id + '_Dialog_Form_Del'),
                            getDialogForm = _getDialogForm.getForm(),
                            getDialogFormDel = _getDialogFormDel.getForm();

                    getDialog.hide();
                    getDialogForm.reset();
                    _getDialogForm.hide();
                    _getDialogFormDel.hide();


                    if (e.target.id == 'add') {
                        e.target.className = e.target.className + ' active';
                        getDialogForm.url = '/tree/add-' + (_isLangscape ? 'language' : 'category');
                        getDialogForm.setValues({'parent_id':node.attributes.cur_id,'version_id':node.attributes.version_id});
                        _getDialogForm.show();
                        getDialog.alignTo(node.getUI().elNode, "tr-br").show();
                    } else if (e.target.id == 'edit') {
                        e.target.className = e.target.className + ' active';
                        getDialogForm.url = '/tree/edit-' + (_isLangscape ? 'language' : 'category');
                        _isLangscape ?
                                getDialogForm.setValues({'id':node.attributes.cur_id,'title':node.attributes.title,'code':node.attributes.code,'version_id':node.attributes.version_id})
                                : getDialogForm.setValues({'id':node.attributes.cur_id,'name':node.attributes.name,'polite_name':node.attributes.polite_name,'version_id':node.attributes.version_id});
                        _getDialogForm.show();
                        getDialog.alignTo(node.getUI().elNode, "tr-br").show();
                    } else if (e.target.id == 'delete') {
                        e.target.className = e.target.className + ' active';
                        getDialogFormDel.url = '/tree/delete-' + (_isLangscape ? 'language' : 'category');
                        getDialogFormDel.setValues({'id':node.attributes.cur_id});
                        _getDialogFormDel.show();
                        getDialog.alignTo(node.getUI().elNode, "tr-br").show();
                    } else if (e.target.id == 'csv') {
                        e.target.className = e.target.className + ' active';
                        document.location = '/tree/download-list/id/' + node.attributes.id;

                    } else {

                        if (_isLangscape) {
                            var t = Ext.getCmp(App.activeTabId + '_KeywordsGrid').store;
                            var data = node.attributes.id.split("-");

                            if (data.length != 3) {
                                return;
                            }
                            t.proxy.api.read.url = "/keywords/langscape" +
                                    "?version_id=" + data[1] +
                                    "&language_id=" + data[2];
                            t.reload();
                        } else {
                            if (!node.attributes.cur_id) {
                                return;
                            }
                            t = Ext.getCmp(App.activeTabId + '_KeywordsGrid').store;
                            lang = Ext.getCmp('language_selector').value;
                            t.proxy.api.read.url = "/keywords/index" +
                                    "?category_id=" + node.attributes.cur_id +
                                    "&language_id=" + lang;
                            t.reload();
                        }
                    }
                }
                ,
                beforemovenode:function(tree, node, oldParent, newParent, index) {

                    var oldPosition = node.parentNode.indexOf(node);
                    var oldNextSibling = node.nextSibling;

                    Ext.Ajax.request({
                        url: '/tree/drop-category',
                        params: {
                            nodeid: node.id,
                            newparentid: newParent.id
                        },
                        success: function (result, request) {
                            if (result.responseText.toLowerCase() == 'false') {
                                tree.suspendEvents();
                                oldParent.appendChild(node);
                                if (oldNextSibling) {
                                    oldParent.insertBefore(node, oldNextSibling);
                                }
                                tree.resumeEvents();
                                tree.enable();
                            }else{
                                var tree = Ext.getCmp(App.activeTabId + '_Tree');
                                var  curPath = newParent.getPath();
                                var data = curPath.split("/");
                                curNode = tree.getNodeById(data[2]);
                                curNode.reload();
                                tree.expandPath(curPath);
                            }

                        }
                    });
                },
                beforenodedrop: function (e) {
                    e.tree.el.select('.x-tree-node-over').removeClass('x-tree-node-over');
                    if (e.data.node.attributes.version_id != e.target.attributes.version_id) {
                        
                        tmp_id = e.target.attributes.version_id+"_"+e.target.attributes.id+"_"+e.data.node.attributes.id;
                        var newNode = new Ext.tree.TreeNode({id: tmp_id,
                                                             text: e.data.node.text+", processing...",
                                                             draggable: false,
                                                             leaf: true});
                        e.target.appendChild(newNode);
                        Ext.Ajax.request({
                            url: '/tree/drop-category',
                            params: {
                                nodeid: e.data.node.id,
                                newparentid: e.target.id
                            },
                            success: updateTree,
                            failure: updateTree
                        });

                        App.nodesToReload.push(e.target);

                        return false;
                    }
                    return true;
                },
                nodedragover: function (e) {
                    e.source.proxy.el[e.data.node.attributes.version_id != e.target.attributes.version_id ? 'addClass' : 'removeClass']('x-dd-drag-version');
                }

            },
            root: new Ext.tree.AsyncTreeNode()
        });
        return tree;
    },

    initializeFirst:function(curTabId, Lang, _id) {
        this.Search = new Ext.ux.form.SearchField({
            id : curTabId + '_TreeSearch',
            region: 'north',
            height: 24,
            emptyText: 'Search terms'
        })
    }
}

function updateTree()
{
    Ext.Ajax.request({
        url : '/tree/check-drop',
        method: 'GET',
        success: function(result, request){
            x = Ext.decode(result.responseText);
            if(x.checkTree){
                reloadTree();
            }
        },
        failure: updateTree
    });
}

function reloadTree(node){
    while(node = App.nodesToReload.pop()){
        try{
            var tree = node.getOwnerTree();
            var  curPath = node.getPath();
            var data = curPath.split("/");
            curNode = tree.getNodeById(data[2]);
            curNode.reload();
            tree.expandPath(curPath);
        }catch(e){
            // do nothing tree is reloaded & closed node;
        }
    }

}
