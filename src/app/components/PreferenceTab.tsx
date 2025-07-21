'use client';

import { useState } from 'react';

export interface PreferenceForm {
  username: string;
  theme: 'light' | 'dark';
}

export default function Preference(props: {
  onSave: (form: PreferenceForm) => void;
}) {
  const [form, setForm] = useState<PreferenceForm>({
    username: '',
    theme: 'light',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, username: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, theme: e.target.value as 'light' | 'dark' });
  };

  const handleSave = () => {
    props.onSave(form);
  };

  return (
    <div
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.1)',
        padding: '8px',
        borderRadius: '4px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>设置选项</div>

      <label style={labelStyle}>
        用户名：
        <input
          type="text"
          value={form.username}
          onChange={handleInputChange}
          style={inputStyle}
        />
      </label>

      <label style={labelStyle}>
        主题：
        <select
          value={form.theme}
          onChange={handleSelectChange}
          style={inputStyle}
        >
          <option value="light">明亮</option>
          <option value="dark">暗黑</option>
        </select>
      </label>

      <button
        onClick={handleSave}
        style={{
          padding: '6px 12px',
          border: 'none',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.3)',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        保存
      </button>
    </div>
  );
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '4px',
};

const inputStyle = {
  padding: '4px',
  borderRadius: '4px',
  border: 'none',
};
