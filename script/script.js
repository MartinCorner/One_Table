jQuery(document).ready( function () {
    var _app = {
        _init: function () {

            $('.new_store_form').prepend(template('new_store_form_iterate', _db));

            $(document).on('click', '#create_store', function () {
                $('#new_store')[0].showModal();
            });

            $(document).on('click', '.mdl-dialog-close', function () {
                $(this).parents('.mdl-dialog')[0].close();
            });

            $(document).on('click', '#new_store_add_row', function () {
                ++_db._new_store_name_seq;
                $('.new_store_add_btn_row').before(template('new_store_form_iterate', _db));
                getmdlSelect.init('.getmdl-select');
                componentHandler.upgradeElement($('.mdl-textfield:not(.getmdl-select)').last()[0]); // mdl components upgrade
            });

            $(document).on('click', '.new_store_del_row', function () {
                $(this).parents('.new_store_row').remove();
            });

            $(document).on('click', '#create-btn', function () {
                $(this).parents('.new_store_row').remove();
                var flag = false;
                jQuery('#new_store .mdl-textfield__input').each(function () {
                    if(this.value == "") {
                        $(this).parents('.mdl-textfield').addClass('is-invalid');
                        flag = false;
                        return false;
                    }else {
                        $(this).parents('.mdl-textfield').removeClass('is-invalid');
                        flag = true;
                    }
                });
                if(flag) _db._addStore();
            });

            $(document).on('click', '.navigation-list', function () {
                _db._current_table_name = $(this).attr('data-name');
                $('.header-title').html(_db._current_table_name);
                $('.mdl-layout__obfuscator').click();

                _db._readStore();
            });

            $(document).on('click', '#add-btn', function () {
                if($('.main-table-card.show')[0]) {
                    if (!$('.dataTable tbody tr[role="row"]:not([data-id])')[0]) {
                        var new_row = _dataTable._table.row.add(_dataTable._new_row_data).draw().node();
                        $(new_row).parents('tr').addClass('unsync');
                        _dataTable._upgraded_input();
                    }
                }else{
                    $('#snackbar')[0].MaterialSnackbar.showSnackbar({message: 'Please open a table'});
                }
            });

            $(document).on('click', '.mdl-menu__item #menu-export-icon', function () {
                var link_node = $('#download_link')[0];
                if($('.main-table-card.show')[0]) {
                    _db._exportStore(function (str) {
                        str = encodeURIComponent(str);
                        link_node.href = "data:text/csv;charset=utf-8,\ufeff" + str;
                        link_node.click();
                    });
                }else {
                    $('#snackbar')[0].MaterialSnackbar.showSnackbar({message: 'Please open a table'});
                }
            });


            _db._mapping();
        },
        _Guuid: function() {
            function S4() {
                return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            }
            return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        }
    }
    var _db = {
        _databaseName: "One-Table",
        _tables: [],
        _dataType: ['Text', 'Datetime', 'Image url', 'Website url', 'Bool', 'Location'],
        _new_store_name_seq: 1,
        _current_table_name: '',
        _current_table_store: null,
        _mapping: function () {
            localforage.config({ //load IndexedDB
                name: _db._databaseName,
                storeName: '__chrome_extension_One-Table_mapping'
            });

            localforage.keys().then(function(keys) {
                _db._tables = keys;
                $('.mdl-navigation .mdl-list').prepend(template('all_tables_navigation', _db));
            });
        },
        _readStore: function () {
            _db._current_table_store = localforage.createInstance({
                name: _db._databaseName,
                storeName: _db._current_table_name
            });

            var ids = [];
            var data = [];
            _db._current_table_store.iterate(function(value, key, iterationNumber) {
                ids.push(key);

                var $val = [];
                console.log([key, value]);
                for(var i=0; i<value.length; i++){
                    $val.push('<div class="mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" id="textfield__input-' + key + '-' + i + '" value="' + value[i] + '"><label class="mdl-textfield__label" for="textfield__input-' + key + '-' + i + '">&nbsp;</label></div>')
                }
                $val.push(_dataTable._control_column_html);
                data.push($val);
            }).then(function() {
                console.log('Iteration has completed');
                _dataTable._init(ids, data);
            }).catch(function(err) {
                console.log(err);
            });
        },
        _addStore: function () {
            var name = $('#new_store_name').val();
            var now_time = new Date().Format('yyyy-MM-dd hh:mm:ss');
            var title = [];
            var data_type = [];

            $('.new_store_title_input').each(function () {
                title.push(this.value);
            });
            $('.new_store_datatype_input').each(function () {
                data_type.push(this.value);
            });

            var $key = name;
            var $value = {
                'name': name,
                'title': title,
                'data_type': data_type,
                'create_time': now_time,
                'update_time': now_time,
                version: 0
            };

            localforage.setItem($key, $value, function() {
                $('#snackbar')[0].MaterialSnackbar.showSnackbar({message: name + ' Created'});
                $('#new_store .new_store_row:not(:first-child):not(:last-child)').remove();
                $('#new_store .mdl-textfield__input').val('');
                $('#new_store .mdl-select__input').val('');
                $('#new_store .mdl-textfield').removeClass('is-dirty');
                $('#new_store')[0].close();
            });
        },
        _updateStore: function () {

        },
        _deleteStore: function () {

        },
        _readAllItem: function () {

        },
        _updateItem: function ($key, $data, $node) {
            _db._current_table_store.keys().then(function (keys) {
                if (!$key) {
                    var last_key = parseInt(keys[keys.length - 1]) || 0;
                    $key = last_key + 1;
                }
                console.info(keys);
                _db._current_table_store.setItem($key.toString(), $data).then(function (value) {
                    console.log(value);
                    _dataTable._synchronized($node, $key);
                }).catch(function (err) {
                    console.log(err);
                });
            });
        },
        _deleteItem: function ($key) {
            _db._current_table_store.removeItem($key, function () {
                _dataTable._table.row($('.dataTable tbody tr[data-id="'+$key+'"]')).remove().draw();
            });
        },
        _get_columns_title: function (callback) {
            var $columns = [];
            localforage.getItem(_db._current_table_name).then(function (value) {
                console.log(value);
                for (var i = 0; i < value.title.length; i++) {
                    $columns.push({title: value.title[i]});
                }
                $columns.push({title: '', orderable: false});

                if (callback) callback($columns);
            }).catch(function (err) {
                console.error(err);
            });
        },
        _exportStore: function (callback) {

            // var str = "栏位1,栏位2,栏位3\n值1,值2,值3";
            var str = "";
            localforage.getItem(_db._current_table_name).then(function (value) {
                console.log(value);
                for (var i = 0; i < value.title.length; i++) {
                    if(i>0) str += "," + value.title[i];
                    else str += value.title[i];
                }

                _db._current_table_store.iterate(function(value, key, iterationNumber) {
                    for(var i=0; i<value.length; i++){
                        if(i>0) str += "," + value[i];
                        else str += "\n" + value[i];
                    }
                }).then(function() {
                    if(callback) callback(str);
                }).catch(function (err) {
                    console.error(err);
                });
            }).catch(function (err) {
                console.error(err);
            });

        },
        _importStore: function () {

        }
    };

    var _dataTable = {
        _table: null,
        _new_row_data: [],
        _node: $('.dataTable'),
        _control_column_html: '<div class="d-flex justify-content-end">' +
                            '   <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-color--green color-white edit_row_btn mr-3 ml-3" id="edit_row_btn" data-upgraded=",MaterialButton"><i class="material-icons">edit</i></button>' +
                            '   <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab mdl-button--colored del_row_btn mr-3 ml-3" id="del_row_btn" data-upgraded=",MaterialButton"><i class="material-icons">delete</i></button>' +
                            '</div>',
        // _text_column_html: '<div class="mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" id="' + uuid + '"><label class="mdl-textfield__label" for="' + uuid + '">&nbsp;</label></div>',

        _init: function ($ids, $data) {
            _dataTable._new_row_data = [];

            _db._get_columns_title(function ($columns) {
                if (_dataTable._table) _dataTable._table.destroy();

                _dataTable._table = $('#main-table').DataTable({
                    autoWidth: true,
                    scrollCollapse: true,
                    paging: false,
                    pageLength: -1,
                    dom: 't',
                    data: $data,
                    columns: $columns,
                    drawCallback: function (settings) {
                        window.setTimeout(function () {
                            _dataTable._draw_callback($ids);
                        }, 20);
                    }
                });

                _dataTable._node.on('blur mouseleave', '.unsync td', function () {
                    _dataTable._update_item($(this).parents('tr'));
                });

                _dataTable._node.on('click', '#edit_row_btn', function () {
                    _dataTable._update_item($(this).parents('tr'));
                });

                _dataTable._node.on('input', '.mdl-textfield__input', function () {
                    $(this).parents('tr').addClass('unsync');
                });

                _dataTable._node.on('click', '#del_row_btn', function () {
                    var id = $(this).parents('tr').attr('data-id');
                    if (id) {
                        _db._deleteItem(id);
                    } else {
                        _dataTable._table.row($(this).parents('tr')).remove().draw();
                    }
                });

            });
        },
        _update_item: function($parentNode){
            var data = [];
            var $id = $parentNode.attr('data-id') || null;
            $parentNode.find('.mdl-textfield__input').each(function () {
                console.info($(this).val());
                data.push($(this).val());
            });
            _db._updateItem($id, data, $parentNode);
        },
        _draw_callback: function($ids){
            $('.main-table-card').addClass('show');
            _dataTable._get_new_row();
            _dataTable._upgraded_input();
            if($('.dataTable tbody tr').length == $ids.length) $('.dataTable tbody tr').each(function (i) {
                $(this).attr('data-id', $ids[i]);
            });
        },
        _get_new_row: function () {
            _dataTable._new_row_data = [];
            var columns_header = _dataTable._table.columns().header();
            for(var i=0; i<columns_header.length; i++){
                var uuid = _app._Guuid();
                var title = columns_header[i].innerText;
                if(i==columns_header.length-1) {
                    _dataTable._new_row_data.push(_dataTable._control_column_html);
                }else{
                    _dataTable._new_row_data.push('<div class="mdl-textfield mdl-js-textfield"><input class="mdl-textfield__input" type="text" id="' + uuid + '"><label class="mdl-textfield__label" for="' + uuid + '">&nbsp;</label></div>');
                }
            }
        },
        _synchronized: function ($node, $id) {
            $node.removeClass('unsync').attr('data-id', $id);
        },
        _upgraded_input: function () {
            $('.dataTable .mdl-textfield:not([data-upgraded])').each(function () {
                componentHandler.upgradeElement(this); // mdl components upgrade
            })
        }
    };

    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "h+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    _app._init();

});