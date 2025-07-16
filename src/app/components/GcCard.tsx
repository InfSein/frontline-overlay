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
  floatPoints: number
}

export default function GcCard({
  gc, me, floatPoints
}: GcCardProps) {
  const color = getGrandCompanyColor(gc)
  const flag = getGrandCompanyFlag(gc)

  return (
    <div
      className="w-full p-6 mx-auto rounded-xl shadow-lg flex items-center gap-x-4"
      style={{
        backgroundColor: color,
        backgroundImage: `url(${flag})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
      }}
    >
      <div>
        <div className="text-2xl font-medium text-white">
          { getGrandCompanyName(gc) }
        </div>
        <p className="text-slate-300">
          { me ? '⭐我方' : '　敌方' }
        </p>
      </div>
      <div className="ml-auto text-4xl font-bold text-white">
        { floatPoints }
      </div>
    </div>
  )
}