const { db } = require('../models/db');

function paginate(sql, params = [], page = 1, pageSize = 20, options = {}) {
  const {
    countField = '*',
    countDistinct = false,
    countSql = null
  } = options;
  
  const offset = (page - 1) * pageSize;
  
  const countQuery = countSql || `SELECT ${countDistinct ? 'COUNT(DISTINCT ' : 'COUNT('}${countField}${countDistinct ? ')' : ')'} as total FROM (${sql})`;
  const total = db.prepare(countQuery).get(...params).total;
  
  const querySql = `${sql} LIMIT ? OFFSET ?`;
  const queryParams = [...params, pageSize, offset];
  const list = db.prepare(querySql).all(...queryParams);
  
  return {
    list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

function cursorPaginate(table, lastId, pageSize = 20, conditions = {}, options = {}) {
  const {
    sortField = 'id',
    sortOrder = 'DESC',
    selectFields = '*'
  } = options;
  
  const operator = sortOrder.toUpperCase() === 'DESC' ? '<' : '>';
  
  let sql = `SELECT ${selectFields} FROM ${table} WHERE 1=1`;
  const params = [];
  
  if (lastId !== undefined && lastId !== null) {
    sql += ` AND ${sortField} ${operator} ?`;
    params.push(lastId);
  }
  
  for (const [key, value] of Object.entries(conditions)) {
    if (Array.isArray(value)) {
      sql += ` AND ${key} IN (${value.map(() => '?').join(',')})`;
      params.push(...value);
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  
  sql += ` ORDER BY ${sortField} ${sortOrder} LIMIT ?`;
  params.push(pageSize + 1);
  
  const results = db.prepare(sql).all(...params);
  
  let hasMore = false;
  if (results.length > pageSize) {
    hasMore = true;
    results.pop();
  }
  
  const lastItem = results[results.length - 1];
  const nextCursor = lastItem ? lastItem[sortField] : null;
  
  return {
    list: results,
    hasMore,
    nextCursor,
    pageSize
  };
}

function keysetPaginate(table, lastValue, pageSize = 20, keyField = 'id', conditions = {}) {
  let sql = `SELECT * FROM ${table} WHERE 1=1`;
  const params = [];
  
  if (lastValue !== undefined && lastValue !== null) {
    sql += ` AND ${keyField} > ?`;
    params.push(lastValue);
  }
  
  for (const [key, value] of Object.entries(conditions)) {
    sql += ` AND ${key} = ?`;
    params.push(value);
  }
  
  sql += ` ORDER BY ${keyField} ASC LIMIT ?`;
  params.push(pageSize);
  
  const results = db.prepare(sql).all(...params);
  
  return {
    list: results,
    lastKey: results.length > 0 ? results[results.length - 1][keyField] : null,
    hasMore: results.length === pageSize
  };
}

module.exports = {
  paginate,
  cursorPaginate,
  keysetPaginate
};
