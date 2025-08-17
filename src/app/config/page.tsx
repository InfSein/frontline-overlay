'use client';

import { useEffect, useState } from 'react'
import { Button, Switch, Input, InputNumber, Select, Card, Divider } from 'tdesign-react'
import {
  IconFont,
  SaveIcon, SettingIcon,
} from 'tdesign-icons-react'
import { AppConfig, ConfigGroup, ConfigItem, fixAppConfig } from '../types/config'
import { deepCopy } from '../tools'
import { loadConfig, saveConfig } from '../tools/config'

const groups: ConfigGroup[] = [
  {
    key: 'general',
    name: '通用设置',
    icon: (<SettingIcon />),
    items: [
      {
        key: 'auto_collapse_when_launch',
        name: '启动时自动折叠',
        desc: [
          '在悬浮窗初次加载时自动折叠悬浮窗。',
          '这也包括刷新悬浮窗的场合。'
        ],
        type: 'switch',
      },
    ]
  },
]

export default function ConfigPage() {
  const [formConfig, setFormConfig] = useState<AppConfig>(fixAppConfig())
  const [groupCollapsed, setGroupCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const cachedConfig = loadConfig()
    setFormConfig(deepCopy(cachedConfig))
    setGroupCollapsed(Object.fromEntries(groups.map(group => [group.key, false])))
  },[
    setFormConfig
  ])

  const handleCollapseGroup = (key: string) => {
    setGroupCollapsed(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }
  const handleChange = (key: string, value: any) => {
    setFormConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    saveConfig(formConfig)
    if (window.opener) {
      window.opener.postMessage(
        { type: "config:update" },
        window.location.origin
      )
    }
    window.close()
  }

  const renderControl = (item: ConfigItem) => {
    switch (item.type) {
      case "switch":
        return (
          <Switch
            value={formConfig[item.key]}
            onChange={(v) => handleChange(item.key, v)}
          />
        )
      case "string":
        return (
          <Input
            value={(formConfig as any)[item.key]}
            onChange={(v) => handleChange(item.key, v)}
            className="w-60"
          />
        )
      case "number":
        return (
          <InputNumber
            value={(formConfig as any)[item.key]}
            onChange={(v) => handleChange(item.key, v)}
            min={0}
            className="w-40"
          />
        )
      case "select":
        return (
          <Select
            value={formConfig[item.key]}
            onChange={(v) => handleChange(item.key, v)}
            options={item.options}
            className="w-48"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="text-2xl font-bold flex items-center">
        设置
        <div className="ml-auto">
          <Button
            shape="rectangle"
            size="large"
            theme="success"
            variant="base"
            icon={<SaveIcon />}
            onClick={handleSave}
          >
            保存
          </Button>
        </div>
      </div>
      <Divider style={{
        marginTop: '0.25rem',
        marginBottom: '0.25rem',
      }} />
      {groups.map((group) => (
        <Card
          key={group.key}
          className="shadow-sm rounded-2xl border border-gray-100"
          bordered
          headerBordered
          title={
            <div className="flex items-center gap-2">
              {group.icon}
              <span className="font-semibold">{group.name}</span>
            </div>
          }
          actions={
            <Button theme="default" variant="text" onClick={() => handleCollapseGroup(group.key)}>
              {groupCollapsed[group.key] ? <IconFont name="chevron-down" /> : <IconFont name="chevron-up" />}
            </Button>
          }
        >
          {
            !groupCollapsed[group.key] &&
            <div className="divide-y divide-gray-100">
              {(group.items).map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-1 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {!!item.desc && item.desc.map((d, i) =>
                      typeof d === "string" ? (
                        <span key={i} className="text-sm text-gray-500">
                          {d}
                        </span>
                      ) : (
                        <span
                          key={i}
                          className={d.className}
                          style={d.style}
                        >
                          {d.content}
                        </span>
                      )
                    )}
                  </div>
                  <div>{renderControl(item)}</div>
                </div>
              ))}
            </div>
          }
        </Card>
      ))}
    </div>
  )
}