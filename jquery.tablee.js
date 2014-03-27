(function($){
    $.Tablee = function(el, options){
        // To avoid scope issues, use 'base' instead of 'this'
        // to reference this class from internal events and functions.
        var base = this;
        var _tablee = base;
        
        // Access to jQuery and DOM versions of element
        base.$el = $(el);
        base.el = el;
        
        base.$el.hide();
        
        // Add a reverse reference to the DOM object
        base.$el.data("Tablee", base);
        
        
        ///////////////// INIT /////////////////////
        base.init = function(){
          base.options = $.extend({},$.Tablee.defaultOptions, options);
          
          base.t = base.$el;
          base.controlbar = $('<div class="tb-controlbar" />');
          base.header = $('<div class="tb-header" />');
          base.content = $('<div class="tb-content" />');
          base.footer = $('<div class="tb-footer" />');
          base.pager = $('<div class="tb-pager" />');
          base.currentPageSpan = $('<span />');
          
          base.widths = {};
          base.noDefWidthColumns = 0;
          base.totalWidth = 100.00;
          base.sorts = base.options.orderby || [];
          
          base.currentAsync = false;
          base.pendingRender = false;
          
          base.filters = [];
          base.view = [];
          base.selectedData = []; 
          
          //console.log(base.options.callbacks);
          
          base.nextPage = function(){
            //console.log(base)
            var ppage = base.options.paging.currentPage; 
            base.options.paging.currentPage++;
            
            var lastPage = base.getLastPageNum();
            if (base.options.paging.currentPage > lastPage)
              base.options.paging.currentPage = lastPage;
              
            if (base.options.callbacks['next_page'] !== undefined) {
              base.$el.trigger('next_page', [ base, ppage, base.options.paging.currentPage, function(){
                console.log('---- done_callback');
                base.render();  
              }]);
            }
            else base.render();
          }
          
          base.prevPage = function(){
            //console.log(base); 
            var ppage = base.options.paging.currentPage;
            base.options.paging.currentPage--;
            
            if (base.options.paging.currentPage <= 0)
              base.options.paging.currentPage = 1;
              
            if (base.options.callbacks['previous_page'] !== undefined) {
              base.$el.trigger('previous_page', [ base, ppage, base.options.paging.currentPage, function(){
                console.log('---- done_callback');
                base.render();  
              }]);
            }
            else base.render();
          }
          
          if (base.options.callbacks !== null &&
              base.options.callbacks !== undefined &&
              typeof(base.options.callbacks) === 'object') 
          {
            for(var p in base.options.callbacks) {
              
              var cb = base.options.callbacks[p];
              var typeOfCB = typeof(cb);
              if (typeOfCB === 'function') {
                base.$el.on(p, cb);
                
                console.log('Function callback defined: ' + p)
              }
              else if (typeOfCB === 'string')
              {
                base.$sl.on(p, function(type, url){
                  $.ajax({
                    type: 'GET',
                    url: url
                  });
                });
              }
            }
          }
            
          if (!base.options.columns && base.options.data
            && base.options.data.length > 0) {
            base.options.columns = [];
            
            for(var p in base.options.data[0]) {
              base.options.columns.push({ name: p});
            }
          } 
          
          //Collect widths
          $.each(base.options.columns || [], function(index, data){
            base.widths[index] = data.width;
            
            if (!data.width) base.noDefWidthColumns++;
            else base.totalWidth -= data.width;
          });
          
          console.log('totalWidth: ' + base.totalWidth);
          console.log('noDefWidthColumns: ' + base.noDefWidthColumns);
          
          var autoWidth = (base.totalWidth / base.noDefWidthColumns) + '%';
          //console.log('autoWidth: ' + autoWidth);
          
          //Define sorting
          if(base.options.orderby &&
             base.options.orderby.length > 0) {
               
            for(var i = 0; i < base.options.orderby.length; i++) {
              var ob = base.options.orderby[i];
              base.sorts[ob.name] = ob.direction || 'asc';
            }
          }
          
          //Fill header
          base.$el.trigger('header_before_render', [ base, '-- header_before_render' ]);
          $.each(base.options.columns, function(index, data){
            
            var width = base.widths[index] ? base.widths[index] + '%' : autoWidth;
            
            var c = $('<div class="tb-col header" />');
            c.html(data.displayName || data.name);
            c.css('width', width);
            c.attr('data-cid', data.name);
            c.attr('data-cindex', index);
            
            if (data.name !== $.Tablee.Constants.ROWNUM_ID) {
              c.dblclick(base.headerDoubleClick);
              c.click(base.headerClick);
              
              var pinBtn = $('<button class="tb-btn-pin">&bullet;</button>')
              pinBtn.dblclick(function(e){
                e.stopPropagation();
              })
              
              pinBtn.click(function(e){
                e.stopPropagation();
              });
              
              c.append(pinBtn);
            }
            
            if (data.name === $.Tablee.Constants.ROWNUM_ID) {
              c.addClass('tb-col-rownum');
            }
            
            c//onsole.log(data);
            base.header.append(c);
          });
          
          base.header.append($('<div class="clear" />'));
          base.$el.trigger('header_after_render', [ base, '-- header_after_render' ]);
          
          //Fill rows
          if (base.options.data !== undefined && 
              base.options.data !== null) {
            base.sort();
            base.render();
          }
          
          var cnt = $('<div class="tb-pager-content" />');
          cnt.html(base.options.paging.totalItems + ' records');
          
          var nxt = $('<a href="javascript:;" class="tb-pager-next">&gt;&gt;</a>');
          var prv = $('<a href="javascript:;" class="tb-pager-prev">&lt;&lt;</a>');
          
          nxt.click(base.nextPage);
          prv.click(base.prevPage);
          
          base.pager.append(cnt);
          base.pager.append(base.currentPageSpan);
          base.pager.append(prv);
          base.pager.append(nxt); 
          
          var selectAllButton = $('<button class="btn-select-all">Select all</button>');
          selectAllButton.click(function(){
            
            if (base.selectedData.length !== base.view.length)
              base.selectedData = base.view.slice(0);
            else 
              base.selectedData = []; 
            
            base.$el.trigger('select_all', [ base, base.selectedData ]);
            
            base.render();
          });
          
          var resetButton = $('<button class="btn-reset">Reset</button>');
          resetButton.click(function(e){
            base.sort();
            base.render();
            
            base.$el.trigger('reset', [ base ]);
          });
          
          var pageInput = $('<button class="btn-reset">Reset</button>');
          
          base.controlbar.append(selectAllButton);
          base.controlbar.append(resetButton);
          
          base.t.append(base.controlbar); 
          base.t.append(base.header);
          base.t.append(base.content);
          base.t.append(base.pager);
          base.t.append(base.footer);
          
          base.$el.trigger('after_init', [ base ]);
        }; 
        ///////////////// INIT /////////////////////
         
        //events
        base.headerDoubleClick = function(e){
          
          e.preventDefault();
          
          var dName = $(this).attr('data-cid');
          
          var prev = $.grep(base.sorts, function(item, index) {
            return item.name === dName
          });
          
          if (prev && prev.length > 0) {
            var pindex = base.sorts.indexOf(prev[0]);
            base.sorts.splice(pindex, 1);
          }
          
          base.$el.trigger('header_dblclick', [ base, dName ]);
          
          base.sort();
          base.render();
        }
        
        base.headerClick = function(e){
          
          e.preventDefault();
          
          var dName = $(this).attr('data-cid');
          var st = { name: dName, direction: 'asc' };
          
          var prev = $.grep(base.sorts, function(item, index) {
            return item.name === dName
          });
          
          //console.log('prev:');
          //console.log(prev);
          
          if (prev && prev.length > 0) {
            if (prev[0].direction === 'desc')
              st.direction = 'asc';
            else
              st.direction = 'desc';
            
            var pindex = base.sorts.indexOf(prev[0]);
            base.sorts.splice(pindex, 1);
          }
          
          base.$el.trigger('header_click', [ base, st]);
          
          //console.log(base.sorts);
          base.sorts.push(st);
          //console.log(base.sorts);
          
          base.sort();
          base.render();
            
          //console.log(base.sorts);
        }
        
        base.rowClick = function(){
          $(this).toggleClass('tb-selected');
          var idx = $(this).attr('data-rindex');
          var data = base.view[idx];
          
          var iod = base.selectedData.indexOf(data);
          if (iod > -1) base.selectedData.splice(iod, 1);
          else base.selectedData.push(data);
          
          base.$el.trigger('select', [ base, data, $(this).is('.tb-selected'), idx ]);
        }
        
        base.editRow = function(e){
          
          e.stopPropagation();
          
          var elm = $(this);
          var idx = $(elm.parent()).attr('data-rindex');
          var data = base.view[idx];
          base.$el.trigger('row_edit', [ base, data, idx ]);
        }
        
        base.deleteRow = function(e){
          
          e.stopPropagation();
          
          var elm = $(this);
          var idx = $(elm.parent()).attr('data-rindex');
          var data = base.view[idx];
          base.$el.trigger('row_delete', [ base, data, idx ]);
        }
        
        base.viewRow = function(e){
          
          e.stopPropagation();
          
          var elm = $(this);
          var idx = $(elm.parent()).attr('data-rindex');
          var data = base.view[idx];
          base.$el.trigger('row_view', [ base, data, idx ]);
        }
        
        //Method
        base.getLastPageNum = function(){
          var pages = base.view.length / base.options.paging.itemsPerPage;
          return Math.ceil(pages);
        }
        
        this.sortData = function(sortIndex, sorts) {
          
          if (base.view !== undefined) {
            var currentSort = sorts[sortIndex];
            currentSort.direction = currentSort.direction || 'asc';
            
            //console.log('current sort');
            //console.log(currentSort);
            
            base.view = base.view.sort(function(a, b) {  
              var direction = currentSort.direction === 'desc' ? -1 : 1;
              
              var _a_v = a[currentSort.name];
              var _b_v = b[currentSort.name];
              
              var r = 0; 
              
              if (_a_v < _b_v) r = (-1 * direction);
              else if (_a_v > _b_v) r = (1 * direction);
              
              //console.log(_a_v + ' ? ' + _b_v + ' : ' + r);
              
              return r;
            })
          }
        }
        
        //Method
        base.sort = function(){
          //console.log(typeof (base.options.data));
          
          base.$el.trigger('before_sort', [ base ]);
          
          if (typeof (base.options.data) === 'object') {
            base._dataSort(base.options.data);
            
            base.$el.trigger('after_sort', [ base ]);
          } 
          else if (typeof (base.options.data) === 'string') 
          {
            base.currentAsync = true;
            base.pendingRender = true;
            
            //console.log('ajax request');
            $.ajax({
              url: base.options.data,
              type: 'GET'
            }).success(function(data){
              base.currentAsync = false;
              base._dataSort(data);
            }).error(function(d, e, xhr){
              console.log('error');
              console.log(xhr);
              console.log(e);
              console.log(d);
            }).always(function(){
              base.$el.trigger('after_sort', [ base ]);
            });
            
          }
        }
        
        base._dataSort = function(data) {
          base.view = data;
    //      var sortzz = [];
    //      for(var i in base.sorts)
    //        sortzz.unshift({ name: i, direction: base.sorts[i]});
          
          var sortzz = base.sorts;
          
          for(var i = 0; i < sortzz.length; i++) {
            //console.log('orderby: ' + sortzz[i].name + '/' + sortzz[i].direction);
            
            base.$el.trigger('sort_step', [ base, sortzz[i]]);
            base.sortData(i, sortzz);
          }
          
          if (base.pendingRender) {
            base.render();
          }
        }
        
        //Method
        base.render = function() {
          
          if (base.currentAsync) {
            base.pendingRender = true;
            base.$el.trigger('before_render', [ base, 'before_render_async' ]);
            return;
          }
          
          base.$el.trigger('before_render', [ base, 'before_render' ]);
          
          base.content.html('');
          
          var startIndex = (base.options.paging.currentPage - 1) * base.options.paging.itemsPerPage;
          var endIndex = startIndex + base.options.paging.itemsPerPage;
          var pageItems = base.view.slice(startIndex, endIndex);
    
          $.each(pageItems, function(rowIndex, rowData) {
            
            var viewRowIndex = base.view.indexOf(rowData);
            
            base.$el.trigger('row_before_render', [ base, rowData, rowIndex, viewRowIndex ] );
            
            var rowEl = $('<div class="tb-row" />');
            rowEl.click(base.rowClick);
            rowEl.attr('data-rindex', viewRowIndex);
            
            if (base.selectedData.indexOf(rowData) > -1)
              rowEl.addClass('tb-selected');  
            
            $.each(base.options.columns, function(colIndex, colData){
              
              var col = $('<div class="tb-col" />');
              
              if (colData.name === '__rownum__') {
                col.html(base.view.indexOf(rowData) + 1);
                col.addClass('tb-col-rownum');
              }
              else col.html(rowData[colData.name]);
              
              var width = base.widths[colIndex] ? base.widths[colIndex] + '%' : base.autoWidth;
              col.css('width', width);
                
              rowEl.append(col);
            });
            
            
            if (base.options.actions.indexOf('delete') > -1)
            {
              var _delete = $('<a class="tb-row-action" href="javascript:void(0);">Delete</a>');
              _delete.click(base.deleteRow);
              rowEl.append(_delete);
            }
            
            if (base.options.actions.indexOf('edit') > -1)
            {
              var edit = $('<a class="tb-row-action" href="javascript:void(0);">Edit</a>');
              edit.click(base.editRow);
              rowEl.append(edit);
            }
            
            if (base.options.actions.indexOf('view') > -1)
            {
              var view = $('<a class="tb-row-action" href="javascript:void(0);">View</a>');
              view.click(base.viewRow);
              rowEl.append(view);
            }
            
            rowEl.append($('<div class="clear" />'));
            
            base.content.append(rowEl);
            base.$el.trigger('row_after_render', [ base, rowData, rowIndex, viewRowIndex ] );
          });
          
          base.currentPageSpan.html(base.options.paging.currentPage + '/' + base.getLastPageNum());
          
          $(".tb-col", base.header).each(function(index, el)
          {
            var $el = $(el);
            $el.removeClass('orderby-desc');
            $el.removeClass('orderby-asc');
            var cid = $el.attr('data-cid');
            
            $.each(base.sorts, function(index, item) {
              if (item.name === cid)
                $el.addClass('orderby-' + item.direction);
            });
          })
          
          base.pendingRender = false;
          base.$el.show();
          base.$el.trigger('after_render', [ base, 'after_render' ]);
        } 
        
        // Run initializer
        base.init();
    };
    
    $.Tablee.defaultOptions = {
      columns: [{ name: "__rownum__", displayName: "#", width: '8' },
                { name: "id", displayName: "ID", width: '20' },
                { name: "descr", displayName: "Descr" }
               ],
      orderby: [ { name: 'id', direction: 'desc' }, { name: 'descr' } ],
      css: { header: ''},
      paging: { 
        itemsPerPage: 5,
        currentPage: 1,
        totalItems: 7
      },
      data: 'data.json' //[ 
      //  { "id": 112, "descr": 'ATeste', "internalID": 'afcdo89087312fgabD' },
      //  { "id": 112, "descr": 'BTeste' },
      //  { "id": 3858, "descr": 'CTeste' },
      //  { "id": 4696, "descr": 'CTeste' },
      //  { "id": 4612396, "descr": 'ETesasxxxte' },
      //  { "id": 46946, "descr": 'FTesasdte' },
      //  { "id": 46596, "descr": 'GTest213e' },
      //]
      ,
      callbacks: {},
      actions: [ 'select', 'edit', 'view', 'delete' ]
    };
    
    $.Tablee.Constants = {
      ROWNUM_ID: '__rownum__'
    }
    
    $.fn.tablee = function(options){
        return this.each(function(){
            (new $.Tablee(this, options));
        });
    };
    
    // This function breaks the chain, but returns
    // the Tablee if it has been attached to the object.
    $.fn.getTablee = function(){
        this.data("Tablee");
    };
    
})(jQuery);