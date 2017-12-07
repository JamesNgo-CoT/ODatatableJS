(function($) {

  // Frequently used options.
  const defaultOptions = {
    ajax: {},
    buttons: ['copy', 'csv', 'excel', 'pdf', 'print'],
    dom: `<'row'<'col-sm-6'l><'col-sm-6'f>><'row'<'col-sm-12'tr>><'row'<'col-sm-5'i><'col-sm-7'p>>B`,
    serverSide: true
  };

  // JQuery Plugin.
  // Options argument is used as Datatables options.
  // Read more here: https://datatables.net/reference/option/
  $.fn.oDataTable = function(options) {
    options = $.extend({}, defaultOptions, options);

    // Sort Order
    const columns = options.columns || [];
    const columnsLength = columns.length;
    const order = [];
    for (let i = 0; i < columnsLength; i++) {
      if (columns[i].sortOrder) {
        order.push([index, columns[i].sortOrder]);
      }
    }
    if (order.length) {
      options.order = order;
    }

    // Add default initComplete option.
    // Implementation adds header and footer search filter.
    // Add searchType options in option.columns to alter search filter type.
    options.initComplete = function() {
      if (options.onInitComplete) {
        options.onInitComplete.apply(null, arguments);
      }

      if (options.searching != false) {
        this.api().columns().every(function() {
          const column = this;
          const columnOptions = options.columns[column.index()];

          if (columnOptions.searchable != false) {
            let searchType = columnOptions.searchType;
            if (!searchType || !$.fn.oDataTable.SearchTypes[searchType]) {
              searchType = 'default';
            }
            const searchChoices = columnOptions.searchChoices;
            if (searchChoices) {
              $.fn.oDataTable.SearchTypes[searchType].setHeaderFooter_searchChoices(column, options, columnOptions, searchChoices);
            } else {
              $.fn.oDataTable.SearchTypes[searchType].setHeaderFooter(column, options, columnOptions);
            }
          }
        });
      }
    };

    // Standard JQuery plugin implementation.
    return this.each(function() {
      const $table = $(this);

      // Destroy datatable if previously implemented.
      if ($.fn.DataTable.isDataTable($table)) {
        $table.dataTable().api().destroy();
      }

      // Initialize table.
      $table.empty();
      if (options.searching != false) {
        $table.append('<thead><tr>' + options.columns.map(() => '<th style="vertical-align: top;"></th>').join('') + '</tr></thead>');
        $table.append('<tfoot><tr>' + options.columns.map(() => '<td style="position: relative; z-index: 1000;"></td>').join('') + '</tr></tfoot>');
      }

      // oData Bridge. Allow datatable to access odata values.
      let draw;

      options.ajax.data = (data) => {
        if (options.ajax.onData) {
          options.ajax.onData.call(null, data);
        }

        draw = data.draw;

        const retData = {};

        // $COUNT parameter.
        retData['$count'] = 'true';

        // $FILTER parameter.
        retData['$filter'] = data.columns.filter((column, index) => {
          if (column.searchable && column.search != null && column.search.value) {
            let searchType = options.columns[index].searchType;
            if (!searchType || !$.fn.oDataTable.SearchTypes[searchType]) {
              searchType = 'default';
            }
            column.filterString = $.fn.oDataTable.SearchTypes[searchType].getFilterString(column.data, column.search.value);
            return column.filterString;
          }
          return false;
        }).map((column) => {
          return column.filterString;
        }).join(' and ') || null;

        if (options['$filter']) {
          retData['$filter'] = retData['$filter'] ? `(${retData['$filter']}) and ${options['$filter']}` : options['$filter'];
        }

        // $ORDERBY parameter.
        retData['$orderby'] = data.order.map((order) => {
          return `${data.columns[order.column].data} ${order.dir}`;
        }).join(',') || null;

        if (options['$orderby']) {
          retData['$orderby'] = retData['$orderby'] ? `(${retData['$orderby']}),${options['$orderby']}` : options['$orderby'];
        }

        // $SEARCH parameter.
        retData['$search'] = (() => data.search && data.search.value ? '"' + data.search.value + '"' : null)();

        // $SELECT parameter.
        retData['$select'] = data.columns.filter((column, index, array) => {
          return array.indexOf(column) === index;
        }).map((column) => {
          return column.data;
        }).join(',');

        if (options['$select']) {
          retData['$select'] = retData['$select'] ? `${retData['$select']},${options['$select']}` : options['$select'];
        }

        // $SKIP parameter.
        retData['$skip'] = data.start;

        // $TOP parameter.
        retData['$top'] = data.length;

        const retVal = [];
        for (var k in retData) {
          if (retData[k] != null) {
            retVal.push(k + '=' + retData[k]);
          }
        }

        return retVal.join('&');
      };

      options.ajax.dataFilter = (data) => {
        data = JSON.parse(data);

        const retValue = JSON.stringify({
          draw: draw,
          recordsTotal: data['@odata.count'],
          recordsFiltered: data['@odata.count'],
          data: data.value
        });

        if (options.ajax.onDataFilter) {
          options.ajax.onDataFilter.call(null, data, retValue);
        }

        return retValue;
      };

      // Turn table into datatable.
      $table.DataTable(options);
    });
  }

  $.fn.oDataTable.headerWrapperString = '<div>';

  $.fn.oDataTable.SearchTypes = {};

  $.fn.oDataTable.SearchTypes['default'] = $.fn.oDataTable.SearchTypes['string'] = $.fn.oDataTable.SearchTypes['string-contains'] = {
    getFilterString: (column, value) => {
      return `contains(tolower(${column}), '${value.toLowerCase()}')`;
    },
    setHeaderFooter: (column, options, columnOptions) => {
      let initialValue = '';
      const index = column.index();
      if (options && options.searchCols && options.searchCols[index] && options.searchCols[index].search) {
        initialValue = options.searchCols[index].search;
      }

      const $input = $(`<input type="text" style="font-weight: normal; padding: 4px; width: 100%; border-radius: 4px; border: 1px solid #ddd;" value="${initialValue}">`);
      $input.on('change keyup', function(e) {
        column.search($(this).val());
        column.draw();
      });

      const $headerInput = $input.clone(true);
      $headerInput.on('click', function(e) {
        e.stopPropagation();
      });
      $headerInput.on('change keyup', function(e) {
        $footerInput.val($(this).val());
      });
      $(column.header()).append($($.fn.oDataTable.headerWrapperString).append($headerInput));

      const $footerInput = $input.clone(true);
      $footerInput.on('change keyup', function(e) {
        $headerInput.val($(this).val());
      });
      $(column.footer()).append($footerInput);
    },
    setHeaderFooter_searchChoices: (column, options, columnOptions, searchChoices) => {
      let initialValue = '';
      const index = column.index();
      if (options && options.searchCols && options.searchCols[index] && options.searchCols[index].search) {
        initialValue = options.searchCols[index].search;
      }

      for (let i = 0; i < searchChoices.length; i++) {
        if (searchChoices[i] == null) {
          searchChoices[i] = {
            text: '-',
            value: '',
            selected: initialValue == ''
          }
          continue;
        }
        if (typeof searchChoices[i] == 'object') {
          if (typeof searchChoices[i].value == 'function') {
            searchChoices[i].value = searchChoices[i].value(column, options, columnOptions, searchChoices);
          }
          searchChoices[i].selected = initialValue == searchChoices[i].value;
          continue;
        }
        searchChoices[i] = {
          text: searchChoices[i],
          value: searchChoices[i],
          selected: initialValue == searchChoices[i]
        }
      }

      const selectOptions = searchChoices.map((choice) => `<option value="${choice.value}"${(() => choice.selected ? 'selected' : '')()}>${choice.text}</option>`).join('');
      const $select = $(`<select style="font-weight: normal; padding: 4px; width: 100%; border-radius: 4px; border: 1px solid #ddd;">${selectOptions}</select>`);
      $select.on('change', function(e) {
        if ($(this).val()) {
          column.search($(this).val());
        } else {
          column.search('');
        }
        column.draw();
      });

      const $headerSelect = $select.clone(true).on('click', function(e) {
        e.stopPropagation();
      }).on('change', function(e) {
        $footerSelect.val($(this).val());
      });
      $(column.header()).append($($.fn.oDataTable.headerWrapperString).append($headerSelect));

      const $footerSelect = $select.clone(true).on('change', function(e) {
        $headerSelect.val($(this).val());
      });
      $(column.footer()).append($footerSelect);
    }
  };

  $.fn.oDataTable.SearchTypes['string-equals'] = {
    getFilterString: (column, value) => {
      return `${column} eq '${value}'`;
    },
    setHeaderFooter: $.fn.oDataTable.SearchTypes['default'].setHeaderFooter,
    setHeaderFooter_searchChoices: $.fn.oDataTable.SearchTypes['default'].setHeaderFooter_searchChoices
  };

  $.fn.oDataTable.SearchTypes['date'] = $.fn.oDataTable.SearchTypes['date-between'] = {
    getFilterString: (column, value) => {
      if (value.indexOf(' - ') == -1) {
        return '';
      }

      const dates = value.split(' - ');
      if (dates.length < 2 || dates[0].replace(/\s+/g, '').length == 0 || dates[1].replace(/\s+/g, '').length == 0) {
        return '';
      }

      const start = moment(dates[0], 'MM/DD/YYYY').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      const end = moment(dates[1], 'MM/DD/YYYY').format('YYYY-MM-DDTHH:mm:ss.SSSZ');
      if (start == 'Invalid date' || end == 'Invalid date') {
        return '';
      }

      return `(${column} ge ${start} and ${column} le ${end})`;
    },
    setHeaderFooter: (column, options, columnOptions) => {
      let initialValue = '';
      const index = column.index();
      if (options && options.searchCols && options.searchCols[index] && options.searchCols[index].search) {
        initialValue = options.searchCols[index].search;
      }

      const $input = $(`<input type="text" style="font-weight: normal; padding: 4px; width: 100%; border-radius: 4px; border: 1px solid #ddd;" value="${initialValue}">`);
      $input.on('change keyup', function(e) {
        column.search($(this).val());
        column.draw();
      });

      const $headerInput = $input.clone(true);
      $headerInput.on('click', function(e) {
        e.stopPropagation();
      });
      $headerInput.on('change keyup', function(e) {
        $footerInput.val($(this).val());
      });
      $headerInput.daterangepicker({
        autoUpdateInput: false
      });
      $headerInput.on('apply.daterangepicker', (e, p) => {
        $headerInput.val(`${p.startDate.format('MM/DD/YYYY')} - ${p.endDate.format('MM/DD/YYYY')}`);
        $headerInput.trigger('change');
      });
      $(column.header()).append($($.fn.oDataTable.headerWrapperString).append($headerInput));

      const $footerInput = $input.clone(true);
      $footerInput.on('click', function(e) {
        e.stopPropagation();
      });
      $footerInput.on('change keyup', function(e) {
        $headerInput.val($(this).val());
      });
      $footerInput.daterangepicker({
        autoUpdateInput: false
      });
      $footerInput.on('apply.daterangepicker', (e, p) => {
        $footerInput.val(`${p.startDate.format('MM/DD/YYYY')} - ${p.endDate.format('MM/DD/YYYY')}`);
        $footerInput.trigger('change');
      });
      $(column.footer()).append($footerInput);
    },
    setHeaderFooter_searchChoices: $.fn.oDataTable.SearchTypes['default'].setHeaderFooter_searchChoices
  };
})(jQuery);
