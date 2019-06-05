export const cropId = id => (id ? id.slice(0, 7).toUpperCase() : '');

const range = ['dueDate', 'paymentDate', 'totalDue', 'rate', 'amount'];

export const filterData = ({
  type, status, search, filterOptions, tableData
}) => {
  let data = tableData.concat([]).sort((a, b) => b.timestamp - a.timestamp);
  if (status) {
    data = data.filter(item => item.state === status);
  }
  if (search) {
    data = data.filter(item => item[type].toLowerCase().includes(search));
  }

  if (filterOptions) {
    Object.keys(filterOptions).forEach((opt) => {
      if (range.includes(opt)) {
        if (filterOptions[opt].from) {
          data = data.filter(i => i[opt] >= filterOptions[opt].from);
        }
        if (filterOptions[opt].to) {
          data = data.filter(i => i[opt] <= filterOptions[opt].to);
        }
        return;
      }
      if (opt === 'shipmentID') {
        if (filterOptions[opt]) {
          data = data.filter(i => i[opt].toLowerCase().includes(filterOptions[opt]));
          return;
        }
      }

      if (filterOptions[opt]) {
        data = data.filter(i => i[opt] === filterOptions[opt]);
      }
    });
  }

  return data;
};
