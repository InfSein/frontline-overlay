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
    <div className="w-full bg-white/10 p-2 rounded text-white flex flex-col gap-2">
      <div className="font-bold">设置选项</div>

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
        className="px-3 py-1.5 border-none rounded bg-white/30 text-white cursor-pointer"
        onClick={handleSave}
      >
        保存
      </button>
    </div>
  );
}

const labelStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.25rem',
};

const inputStyle = {
  padding: '0.25rem',
  borderRadius: '4px',
  border: 'none',
};
