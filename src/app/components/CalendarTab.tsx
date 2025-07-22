import { useEffect, useState } from 'react'
import { getFrontlineNames } from '../tools';
import { Frontline } from '../types';

interface CalendarTabProps {
  panelStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
}

const startDate = new Date('07/17/2025 23:00:00') // 此时间节点是 尘封秘岩
const showFuture = [0, 1, 2] as const

function daysBetween(from: Date, to: Date) {
  const diffMs = to.getTime() - from.getTime()
  return Math.floor(diffMs / (1000 * 3600 * 24))
}

export default function CalendarTab({
  panelStyle, titleStyle,
}: CalendarTabProps) {
  const [now, setNow] = useState<Date>(new Date())
  const [days, setDays] = useState<number>(daysBetween(startDate, new Date()))
  const [remainder, setRemainder] = useState<number>(days % 4)

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date()
      setNow(current)

      const dayCount = daysBetween(startDate, current)
      setDays(dayCount)
      setRemainder(dayCount % 4)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getFrontline = (index: number) => {
    switch (index) {
      case 0: return getFrontlineNames(Frontline.seize)
      case 1: return getFrontlineNames(Frontline.shatter)
      case 2: return getFrontlineNames(Frontline.naadam)
      case 3: return getFrontlineNames(Frontline.secure)
      default: throw new Error('Invalid remainder value')
    }
  }
  const getCardBackgroundColor = (index: number) => {
    switch (index) {
      case 0: return '#9F9E44' // 尘封秘岩
      case 1: return '#285FB7' // 荣誉野
      case 2: return 'green' // 昂萨哈凯尔
      case 3: return '#942110' // 周边遗迹群
      default: throw new Error('Invalid remainder value')
    }
  }
  const getNext23 = (now: Date, addDay?: number) => {
    const next23 = new Date(now)
    next23.setHours(23, 0, 0, 0)
    // 如果已经过了今天23:00，则目标是明天的23:00
    if (now.getTime() >= next23.getTime()) {
      next23.setDate(next23.getDate() + 1)
    }
    if (addDay) {
      next23.setDate(next23.getDate() + addDay)
    }
    return next23
  }
  const timeUntilNext23 = (now: Date, addDay?: number) => {
    const next23 = getNext23(now, addDay)
    const diffMs = next23.getTime() - now.getTime()

    const hours = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, '0')
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, '0')

    return `${hours}小时${minutes}分${seconds}秒`
  }
  const formatDate = (date: Date) => {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\//g, '/').replace(',', '');
  }

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>
        <div style={{
          display: 'flex',
        }}>
          <div>当前战场</div>
          <div style={{ marginLeft: 'auto' }}>{ `(还剩${timeUntilNext23(now)})` }</div>
        </div>
      </div>
      <div style={{
        padding: '8px',
        gap: '4px',
        borderRadius: '4px',
        boxShadow: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: getCardBackgroundColor(remainder),
      }}>
        <div style={{
          marginLeft: 'auto',
        }}>
          <div
            style={{
              fontSize: '28px',
              lineHeight: 1.5,
              fontWeight: 500,
              color: 'white',
              textShadow: '1px 1px 2px black'
            }}
          >
            { getFrontline(remainder)[1] }
          </div>
          <p style={{
            color: '#cad5e2',
            margin: 0,
            marginRight: '4px',
            textAlign: 'right',
          }}>
            { getFrontline(remainder)[2] }
          </p>
        </div>
      </div>
      <div style={titleStyle}>未来战场</div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontSize: '18px',
      }}>
        {
          showFuture.map(val => {
            return (
              <div
                key={'future' + val}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: getCardBackgroundColor((remainder + val + 1) % 4),
                  border: '1px solid rgba(0, 0, 0, 0.5)',
                  borderRadius: '4px',
                  padding: '2px 4px',
                  //marginLeft: '16px',
                }}
              >
                <div>
                  <span style={{ margin: '0 0.3em 0 0.5em' }}> · </span>
                  <span>{ getFrontline((remainder + val + 1) % 4)[1] }</span>
                </div>
                <div style={{ marginLeft: 'auto' }}>{ `　(${formatDate(getNext23(now, val))}／${timeUntilNext23(now, val)}后)` }</div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}