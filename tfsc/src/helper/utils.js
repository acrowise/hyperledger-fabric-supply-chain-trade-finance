export const cropId = id => id.slice(0, 7).toUpperCase();

export const filterData = (filterOptions, tableData) => {
  let data = tableData.concat([]);
  Object.keys(filterOptions).forEach((opt) => {
    if (opt === 'dueDate' || opt === 'paymentDate' || opt === 'totalDue') {
      if (filterOptions[opt].from) {
        data = data.filter(i => i[opt] >= filterOptions[opt].from);
      }
      if (filterOptions[opt].to) {
        data = data.filter(i => i[opt] <= filterOptions[opt].to);
      }
      return;
    }
    if (filterOptions[opt]) {
      data = data.filter(i => i[opt] === filterOptions[opt]);
    }
  });
  return data;
};
