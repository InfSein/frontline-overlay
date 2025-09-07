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

  const containerStyle: React.CSSProperties = {
    //width: '100%',
    padding: '0.5rem',
    gap: '0.25rem',
    borderRadius: '4px',
    boxShadow: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: color,
    backgroundImage: `url(${flag})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
  }

  return (
    <div style={containerStyle}>
      <div>
        <div
          className="text-[1.75rem] leading-[1.5] font-medium text-white"
          style={{ textShadow: '1px 1px 2px black' }}
        >
          {getGrandCompanyName(gc)}
        </div>
        <p className="text-[#cad5e2] m-0">
          {me ? '⭐我方' : '　敌方'}
        </p>
      </div>
      <div className="ml-auto mr-1 text-[2.625rem] font-bold text-white">
        {floatPoints}
      </div>
    </div>
  )
}