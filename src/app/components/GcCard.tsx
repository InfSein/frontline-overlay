import { Divider } from 'tdesign-react'
import { GrandCompany } from '@/app/types'
import {
  getGrandCompanyName,
  getGrandCompanyColor,
  getGrandCompanyFlag,
} from '@/app/tools'

type GcCardProps = {
  /** 大国防联军 */
  gc: GrandCompany
  /** 是否为己方 */
  me: boolean
  /** 点分 */
  floatPoints: number | string
  /** 增长速度 */
  increaseSpeed: number
}

export default function GcCard({
  gc, me, floatPoints, increaseSpeed
}: GcCardProps) {
  const color = getGrandCompanyColor(gc)
  const flag = getGrandCompanyFlag(gc)

  return (
    <div
      className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-center bg-no-repeat bg-contain"
      style={{
        backgroundColor: color,
        backgroundImage: `url(${flag})`,
      }}
    >
      <div
        className="flex items-center p-2 pb-0"
      >
        <div>
          <div className="text-[1.75rem] leading-[1.2] font-medium text-white drop-shadow-[1px_1px_2px_black]">
            {getGrandCompanyName(gc)}
          </div>
          <p className="text-[#cad5e2] m-0 leading-1">{me ? '⭐我方' : '　敌方'}</p>
        </div>
        <div className="ml-auto mr-1 text-[2.625rem] leading-[1.3] font-bold text-white">
          {floatPoints}
        </div>
      </div>
      <Divider style={{ margin: 0 }} />
      <div
        className="text-right text-white font-medium leading-1 p-1 pt-0 mr-2"
        style={{ fontFamily: '"Eurostar Regular"' }}
      >
        +<span className="font-bold">{increaseSpeed}</span>/t
      </div>
    </div>
  )
}
