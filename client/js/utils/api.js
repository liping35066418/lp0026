const API_BASE = '/api';

async function request(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const config = { ...defaultOptions, ...options };
  
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    delete config.params;
  }
  
  try {
    const response = await axios(`${API_BASE}${url}`, config);
    const data = response.data;
    
    if (data.code === 200) {
      return data.data;
    } else {
      throw new Error(data.message || '请求失败');
    }
  } catch (error) {
    console.error(`API Error [${url}]:`, error);
    throw error;
  }
}

const api = {
  dashboard: {
    getOverview: (params) => request('/dashboard/overview', { params }),
    getTrends: (params) => request('/dashboard/trends', { params }),
    getAlerts: (params) => request('/dashboard/alerts', { params }),
    getTopProducts: (params) => request('/dashboard/top-products', { params }),
    getCategorySales: (params) => request('/dashboard/category-sales', { params }),
    refreshAlerts: () => request('/dashboard/refresh-alerts', { method: 'POST' })
  },
  
  sales: {
    getOverview: (params) => request('/sales/overview', { params }),
    getAnalysis: (data) => request('/sales/analysis', { method: 'POST', data }),
    getTrend: (params) => request('/sales/trend', { params }),
    getByCategory: (params) => request('/sales/by-category', { params }),
    getByStaff: (params) => request('/sales/by-staff', { params }),
    getDetail: (params) => request('/sales/detail', { params }),
    getHourly: (params) => request('/sales/hourly', { params })
  },
  
  inventory: {
    getCurrent: (params) => request('/inventory/current', { params }),
    getFlow: (params) => request('/inventory/flow', { params }),
    calculate: (data) => request('/inventory/calculate', { method: 'POST', data }),
    checkAlerts: () => request('/inventory/alert/check', { method: 'POST' }),
    redOffset: (data) => request('/inventory/red-offset', { method: 'POST', data }),
    update: (data) => request('/inventory/update', { method: 'POST', data })
  },
  
  purchase: {
    createOrder: (data) => request('/purchase/order', { method: 'POST', data }),
    getOrders: (params) => request('/purchase/order', { params }),
    getOrderDetail: (id) => request(`/purchase/order/${id}`),
    confirmWarehouse: (id, data) => request(`/purchase/order/${id}/warehouse`, { method: 'POST', data }),
    purchaseReturn: (id, data) => request(`/purchase/order/${id}/return`, { method: 'POST', data }),
    
    getSuppliers: (params) => request('/purchase/supplier', { params }),
    saveSupplier: (data) => request('/purchase/supplier', { method: 'POST', data }),
    deleteSupplier: (id) => request(`/purchase/supplier/${id}`, { method: 'DELETE' })
  },
  
  stocktake: {
    createOrder: (data) => request('/stocktake/create', { method: 'POST', data }),
    getOrders: (params) => request('/stocktake/order', { params }),
    getOrderDetail: (id) => request(`/stocktake/order/${id}`),
    inputActualQty: (id, data) => request(`/stocktake/order/${id}/input`, { method: 'POST', data }),
    redoStocktake: (id, data) => request(`/stocktake/order/${id}/redo`, { method: 'POST', data }),
    confirmAdjust: (id, data) => request(`/stocktake/order/${id}/adjust`, { method: 'POST', data }),
    voidSalesOrder: (id, data) => request(`/stocktake/order/${id}/void`, { method: 'POST', data }),
    recalculateInventory: (data) => request('/stocktake/recalculate', { method: 'POST', data })
  },
  
  report: {
    getTemplates: (params) => request('/report/templates', { params }),
    saveTemplate: (data) => request('/report/templates', { method: 'POST', data }),
    deleteTemplate: (id) => request(`/report/templates/${id}`, { method: 'DELETE' }),
    generateReport: (data) => request('/report/generate', { method: 'POST', data }),
    exportExcel: (data) => {
      return axios.post(`${API_BASE}/report/export/excel`, data, { responseType: 'blob' });
    },
    exportPDF: (data) => {
      return axios.post(`${API_BASE}/report/export/pdf`, data, { responseType: 'blob' });
    },
    batchExport: (data) => request('/report/export/batch', { method: 'POST', data })
  },
  
  system: {
    getConfigList: () => request('/system/config'),
    getConfig: (key) => request(`/system/config/${key}`),
    setConfig: (data) => request('/system/config', { method: 'POST', data }),
    deleteConfig: (key) => request(`/system/config/${key}`, { method: 'DELETE' }),
    
    getUsers: (params) => request('/system/users', { params }),
    saveUser: (data) => request('/system/users', { method: 'POST', data }),
    deleteUser: (id) => request(`/system/users/${id}`, { method: 'DELETE' }),
    
    getCategories: (params) => request('/system/categories', { params }),
    getCategoryTree: () => request('/system/categories/tree'),
    saveCategory: (data) => request('/system/categories', { method: 'POST', data }),
    deleteCategory: (id) => request(`/system/categories/${id}`, { method: 'DELETE' }),
    
    getProducts: (params) => request('/system/products', { params }),
    saveProduct: (data) => request('/system/products', { method: 'POST', data }),
    deleteProduct: (id) => request(`/system/products/${id}`, { method: 'DELETE' }),
    
    getStaff: (params) => request('/system/staff', { params }),
    saveStaff: (data) => request('/system/staff', { method: 'POST', data }),
    deleteStaff: (id) => request(`/system/staff/${id}`, { method: 'DELETE' }),
    
    getCustomers: (params) => request('/system/customers', { params }),
    saveCustomer: (data) => request('/system/customers', { method: 'POST', data }),
    deleteCustomer: (id) => request(`/system/customers/${id}`, { method: 'DELETE' })
  }
};

window.api = api;
