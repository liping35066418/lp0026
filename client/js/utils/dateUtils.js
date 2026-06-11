function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  return dayjs(date).format(format);
}

function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
}

function getToday() {
  return dayjs().format('YYYY-MM-DD');
}

function getYesterday() {
  return dayjs().subtract(1, 'day').format('YYYY-MM-DD');
}

function getThisMonthStart() {
  return dayjs().startOf('month').format('YYYY-MM-DD');
}

function getThisMonthEnd() {
  return dayjs().endOf('month').format('YYYY-MM-DD');
}

function getLastMonthStart() {
  return dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
}

function getLastMonthEnd() {
  return dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
}

function getLastNDays(n) {
  return {
    start: dayjs().subtract(n - 1, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  };
}

function getDateRange(type) {
  const today = getToday();
  switch (type) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'yesterday':
      const y = getYesterday();
      return { startDate: y, endDate: y };
    case '7days':
      const d7 = getLastNDays(7);
      return { startDate: d7.start, endDate: d7.end };
    case '30days':
      const d30 = getLastNDays(30);
      return { startDate: d30.start, endDate: d30.end };
    case 'thisMonth':
      return { startDate: getThisMonthStart(), endDate: today };
    case 'lastMonth':
      return { startDate: getLastMonthStart(), endDate: getLastMonthEnd() };
    default:
      return { startDate: today, endDate: today };
  }
}

function getDateRangePresets() {
  const today = getToday();
  
  return [
    { label: '今日', value: 'today', start: today, end: today },
    { label: '昨日', value: 'yesterday', start: getYesterday(), end: getYesterday() },
    { label: '近7天', value: '7days', ...getLastNDays(7) },
    { label: '近30天', value: '30days', ...getLastNDays(30) },
    { label: '本月', value: 'thisMonth', start: getThisMonthStart(), end: today },
    { label: '上月', value: 'lastMonth', start: getLastMonthStart(), end: getLastMonthEnd() }
  ];
}

function getBetweenDays(startDate, endDate) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return end.diff(start, 'day') + 1;
}

function generateDateArray(startDate, endDate, format = 'YYYY-MM-DD') {
  const dates = [];
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  
  let current = start.clone();
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format(format));
    current = current.add(1, 'day');
  }
  
  return dates;
}

function generateHourArray() {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
}

function getWeekdayName(date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[dayjs(date).day()];
}

function getRelativeTime(date) {
  const diff = dayjs().diff(dayjs(date), 'minute');
  
  if (diff < 1) return '刚刚';
  if (diff < 60) return `${diff}分钟前`;
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}天前`;
  
  return formatDate(date);
}

function isExpiring(expireDate, warningDays = 30) {
  if (!expireDate) return false;
  const diff = dayjs(expireDate).diff(dayjs(), 'day');
  return diff <= warningDays && diff >= 0;
}

function isExpired(expireDate) {
  if (!expireDate) return false;
  return dayjs(expireDate).isBefore(dayjs(), 'day');
}

function getDaysToExpire(expireDate) {
  if (!expireDate) return null;
  return dayjs(expireDate).diff(dayjs(), 'day');
}

window.dateUtils = {
  formatDate,
  formatDateTime,
  getToday,
  getYesterday,
  getThisMonthStart,
  getThisMonthEnd,
  getLastMonthStart,
  getLastMonthEnd,
  getLastNDays,
  getDateRange,
  getDateRangePresets,
  getBetweenDays,
  generateDateArray,
  generateHourArray,
  getWeekdayName,
  getRelativeTime,
  isExpiring,
  isExpired,
  getDaysToExpire
};
