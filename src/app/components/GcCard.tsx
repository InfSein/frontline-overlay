import { GrandCompany } from '@/app/types'
import {
  getGrandCompanyName,
  getGrandCompanyColor,
  getGrandCompanyFlag,
} from '@/app/tools'

type GcCardProps = {
  gc: GrandCompany
  active: boolean
}

export default function GcCard({
  gc, active,
}: GcCardProps) {
  const color = getGrandCompanyColor(gc)
  const flag = getGrandCompanyFlag(gc)

  return (
    <div
      className="p-6 max-w-sm mx-auto rounded-xl shadow-lg flex items-center gap-x-4"
      style={{
        backgroundColor: color,
        backgroundImage: `url(${flag})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
      }}
    >
      <div>
        <div className="text-xl font-medium text-white">
          { getGrandCompanyName(gc) }
        </div>
        <p className="text-slate-500">
          { active ? '我方' : '&nbsp;' }
        </p>
      </div>
    </div>
  )
}