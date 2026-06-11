const { Table, Spin, Empty } = antd;

function DataTable({ 
  columns, 
  dataSource, 
  loading = false, 
  pagination = true,
  currentPage = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  rowKey = 'id',
  scroll,
  expandable,
  rowSelection,
  ...rest 
}) {
  const handleTableChange = (pagination) => {
    if (onPageChange) {
      onPageChange(pagination.current, pagination.pageSize);
    }
  };

  const tablePagination = pagination ? {
    current: currentPage,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条记录`,
    pageSizeOptions: ['10', '20', '50', '100'],
    position: ['bottomRight']
  } : false;

  return (
    <div className="data-table-wrapper">
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey={rowKey}
          pagination={tablePagination}
          onChange={handleTableChange}
          scroll={scroll}
          expandable={expandable}
          rowSelection={rowSelection}
          locale={{
            emptyText: <Empty description="暂无数据" />
          }}
          {...rest}
        />
      </Spin>
    </div>
  );
}

window.DataTable = DataTable;
