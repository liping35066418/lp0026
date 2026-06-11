const { Pagination: AntdPagination } = antd;

function Pagination({ current, pageSize, total, onChange, showSizeChanger = true, showTotal = true }) {
  const handleChange = (page, size) => {
    onChange(page, size);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
      <AntdPagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={handleChange}
        showSizeChanger={showSizeChanger}
        showQuickJumper
        showTotal={showTotal ? (total) => `共 ${total} 条记录` : undefined}
        pageSizeOptions={['10', '20', '50', '100']}
      />
    </div>
  );
}

window.Pagination = Pagination;
