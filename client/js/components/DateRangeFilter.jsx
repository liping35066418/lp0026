const { DatePicker, Button, Space, Select } = antd;
const { RangePicker } = DatePicker;
const { Option } = Select;

function DateRangeFilter({ value, onChange, presets = [], showPresets = true, extra }) {
  const defaultPresets = dateUtils.getDateRangePresets();
  const allPresets = presets.length > 0 ? presets : defaultPresets;

  const handlePresetChange = (presetValue) => {
    const preset = allPresets.find(p => p.value === presetValue);
    if (preset) {
      onChange([dayjs(preset.start), dayjs(preset.end)]);
    }
  };

  const handleRangeChange = (dates) => {
    onChange(dates);
  };

  const currentPreset = () => {
    if (!value || value.length !== 2) return undefined;
    const start = value[0].format('YYYY-MM-DD');
    const end = value[1].format('YYYY-MM-DD');
    const preset = allPresets.find(p => p.start === start && p.end === end);
    return preset?.value;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      {showPresets && (
        <Select
          value={currentPreset()}
          onChange={handlePresetChange}
          style={{ width: 120 }}
          placeholder="快捷选择"
        >
          {allPresets.map(preset => (
            <Option key={preset.value} value={preset.value}>{preset.label}</Option>
          ))}
        </Select>
      )}
      
      <RangePicker
        value={value}
        onChange={handleRangeChange}
        allowClear={false}
      />
      
      {extra}
    </div>
  );
}

window.DateRangeFilter = DateRangeFilter;
