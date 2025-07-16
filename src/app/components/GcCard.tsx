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
    padding: '8px',
    gap: '4px',
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
          style={{
            fontSize: '28px',
            lineHeight: 1.5,
            fontWeight: 500,
            color: 'white',
          }}
        >
          { getGrandCompanyName(gc) }
        </div>
        <p style={{
          color: '#cad5e2',
          margin: 0
        }}>
          { me ? '⭐我方' : '　敌方' }
        </p>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          marginRight: '4px',
          fontSize: '42px',
          fontWeight: 'bold',
          color: 'white',
        }}
      >
        { floatPoints }
      </div>
    </div>
  )
}