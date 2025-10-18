'use client';

import { useEffect, useState } from 'react'
import { Button, Switch, Slider, Input, InputNumber, Select, Card, Divider, Tooltip } from 'tdesign-react'
import {
  IconFont,
  SaveIcon,
} from 'tdesign-icons-react'
import { AppConfig, ConfigGroup, ConfigItem, fixAppConfig } from '../types/config'
import { deepCopy } from '../tools'
import { loadConfig, saveConfig } from '../tools/config'

const groups: ConfigGroup[] = [
  {
    key: 'general',
    name: '通用',
    icon: 'system-setting',
    items: [
      {
        key: 'app_scale',
        name: '悬浮窗缩放',
        desc: [
          '调整悬浮窗的显示大小倍数。',
          '当你使用了infsein.github.io提供的其他悬浮窗时，请使用此处而非ACT的设置来调整缩放。',
        ],
        type: 'slider-number',
        min: 0.5, max: 2, step: 0.1,
      },
      {
        key: 'auto_collapse_when_launch',
        name: '启动时自动折叠',
        desc: [
          '在悬浮窗初次加载时自动折叠悬浮窗。',
          '这也包括刷新悬浮窗的场合。'
        ],
        type: 'switch',
      },
      {
        key: 'auto_expand_when_enter_battlefield',
        name: '进入对战时自动展开',
        desc: [
          '在对战开始时自动展开悬浮窗。',
        ],
        type: 'switch',
      },
      {
        key: 'auto_collapse_when_leave_battlefield',
        name: '离开对战时自动折叠',
        desc: [
          '在离开对战区域时自动折叠悬浮窗。',
          '初次加载或是在PvE区域内切换地图时不会触发。',
        ],
        type: 'switch',
      },
    ]
  },
  {
    key: 'situation',
    name: '战况',
    icon: 'map-distance',
    items: [
      {
        key: 'hide_situation_copy_btn',
        name: '隐藏复制点分按钮',
        desc: [
          '如果你不需要战况选项卡中的复制点分按钮，可以打开此选项将其隐藏。',
        ],
        type: 'switch',
      },
    ]
  },
  {
    key: 'monitor',
    name: '监控',
    icon: 'precise-monitor',
    items: [
      {
        key: 'badboy_threshold',
        name: '坏人阈值',
        desc: [
          '设置一个10000～99999之间的数字作为阈值。',
          '当你受到超过阈值的伤害时，即使此技能不在坏人监控之列，也仍然会进入坏人统计。',
        ],
        type: 'number',
        min: 10000, max: 99999,
        step: 1000, decimalPlaces: 0,
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
            min={item.min} max={item.max}
            step={item.step}
            decimalPlaces={item.decimalPlaces}
            allowInputOverLimit={false}
            className="w-40"
          />
        )
      case "slider-number":
        return (
          <Slider
            value={(formConfig as any)[item.key]}
            onChange={(v) => handleChange(item.key, v)}
            min={item.min} max={item.max}
            step={item.step}
            className="min-w-[9rem]"
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
              <IconFont name={group.icon} />
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
                    <div className="text-base font-medium">
                      {item.name}
                      {
                        item.beta && <Tooltip content="此设置项仅作测试之用，随时可能被更改或删除。" showArrow={false}>
                          <span className="text-[12px] leading-[1] font-normal p-1 text-white bg-[#E37318] ml-1 rounded">BETA</span>
                        </Tooltip>
                      }
                    </div>
                    {!!item.desc && item.desc.map((d, i) =>
                      typeof d === "string" ? (
                        <span key={i} className="text-xs text-gray-500">
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