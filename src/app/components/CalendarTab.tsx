import { useEffect, useState } from 'react'
import PageStyle from '../page.module.css'
import { getFrontlineBackground, getFrontlineBackgroundColor, getFrontlineForeColor, getFrontlineNames } from '../tools';
import { Frontline } from '../types';

/* 
 * 轮换算法参考了 https://github.com/NekoWoods/what-zc-today/blob/main/sketch.js
 */

const startDate = new Date('2025-07-17T15:00:00Z') // 此时间节点是 尘封秘岩
const showFuture = [0, 1, 2] as const

function daysBetween(from: Date, to: Date) {
  const diffMs = getDtVal(to) - getDtVal(from)
  return Math.floor(diffMs / (1000 * 3600 * 24))

  function getDtVal(date: Date) {
    return date.getTime() + date.getTimezoneOffset() * 1000 * 60
  }
}

export default function CalendarTab() {
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
  const getCardForeColor = (index: number) => {
    switch (index) {
      case 0: return getFrontlineForeColor(Frontline.seize)
      case 1: return getFrontlineForeColor(Frontline.shatter)
      case 2: return getFrontlineForeColor(Frontline.naadam)
      case 3: return getFrontlineForeColor(Frontline.secure)
      default: throw new Error('Invalid remainder value')
    }
  }
  const getCardBackgroundColor = (index: number) => {
    switch (index) {
      case 0: return getFrontlineBackgroundColor(Frontline.seize)
      case 1: return getFrontlineBackgroundColor(Frontline.shatter)
      case 2: return getFrontlineBackgroundColor(Frontline.naadam)
      case 3: return getFrontlineBackgroundColor(Frontline.secure)
      default: throw new Error('Invalid remainder value')
    }
  }
  const getCardBackgroundImage = (index: number) => {
    switch (index) {
      case 0: return getFrontlineBackground(Frontline.seize)
      case 1: return getFrontlineBackground(Frontline.shatter)
      case 2: return getFrontlineBackground(Frontline.naadam)
      case 3: return getFrontlineBackground(Frontline.secure)
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
    <div className={PageStyle.panel}>
      <div className={PageStyle.title}>
        <div className="flex w-full items-center">
          <div>当前战场</div>
          <div className="ml-auto">{ `(还剩${timeUntilNext23(now)})` }</div>
        </div>
      </div>
      <div
        className="relative p-2 gap-1 rounded shadow-xl flex items-center"
        style={{
          color: getCardForeColor(remainder),
          backgroundColor: getCardBackgroundColor(remainder),
          backgroundImage: `url(${getCardBackgroundImage(remainder)})`,
          backgroundSize: '70%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: '1% center',
        }}
      >
        <div className="ml-auto">
          <div className="text-[1.75rem] leading-[1.5] font-medium text-white text-shadow">
            { getFrontline(remainder)[1] }
          </div>
          <p className="text-[#cad5e2] m-0 mr-1 text-right">
            { getFrontline(remainder)[2] }
          </p>
        </div>
      </div>
      <div className={PageStyle.title}>未来战场</div>
      <div className="flex flex-col gap-0.5 text-[1.125rem]">
        {
          showFuture.map(val => {
            const rm = (remainder + val + 1) % 4
            return (
              <div
                key={'future' + val}
                className="flex items-center border border-black/50 rounded px-1 py-0.5"
                style={{
                  color: getCardForeColor(rm),
                  backgroundColor: getCardBackgroundColor(rm),
                }}
              >
                <div>
                  <span className="mx-[0.3em] ml-[0.5em]"> · </span>
                  <span>{ getFrontline(rm)[1] }</span>
                </div>
                <div className="ml-auto">
                  {`　(${formatDate(getNext23(now, val))}／${timeUntilNext23(now, val)}后)`}
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}