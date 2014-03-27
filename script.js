// Code goes here

$(document).ready(function() {
  
  var options1 = {
    //actions: [ 'edit' ],
    callbacks: {
      'select': function(type, tablee, data, selected, index) {
        console.log('-- select[' + index + ']: ' + selected);
        console.log(data);
      },
      'select_all': function(type, tablee, data) {
        console.log(data)
      },
      'header_after_render': function(type, tablee, data) {
        console.log(data)
      },
      'header_before_render': function(type, tablee, data) {
        console.log(data);
      },
      'after_render': function(type, tablee, data) {
        console.log(data)
      },
      'before_render': function(type, tablee, data) {
        console.log(data);
      },
      'reset': function(type, tablee, data) {
        console.log('reset');
      },
      'header_click': function(type, tablee, data) {
        console.log('header_click: ' + data.name);
        console.log(data);
      },
      'header_dblclick': function(type, tablee, data) {
        console.log('header_dblclick: ' + data);
      },
      'sort_step': function(type, tablee, data) {
        console.log(' -- sort-step');
        console.log(data);
      },
      'after_sort': function(type, tablee, data) {
        console.log('after sort');
      },
      'before_sort': function(type, tablee, data) {
        console.log('before sort');
      },
      'after_init': function(type, tablee) {
        console.log('-- after init --'); 
      },
      'row_before_render': function(type, tablee, data, index, glogalIndex) {
        console.log('-- row_before_render: ' + glogalIndex);
        console.log(data);
      },
      'row_after_render': function(type, tablee, data, index, glogalIndex) {
        console.log('-- row_after_render: ' + glogalIndex);
      },
      'previous_page': function(type, tablee, _old, _new, done) {
        console.log('-- previous page');
        done();
      },
      'next_page': function(type, tablee, _old, _new, done) {
        console.log('-- next page');
        done();
      },
      'row_edit': function(type, tablee, data, index){
        console.log('-- row edit');
        console.log(data);
      },
      'row_delete': function(type, tablee, data, index){
        console.log('-- row delete');
        console.log(data);
      },
      'row_view': function(type, tablee, data, index){
        console.log('-- row view');
        console.log(data);
      }
    }
  } 
  //new Tablee('.tablee', options1);
  
  $('.tablee').tablee(options1); 
  
});