type PointCardProps = {
  /** 类型 */
  type: "active" | "neutrality" | "preparing"
  /** 指定颜色 */
  specifyColor?: string
  /** 据点等级 */
  ptLv?: string
  /** 据点名称 */
  ptName: string
  /** 据点进度 */
  ptProgress?: number
  /** 据点描述 */
  ptDescription: string
}

export default function GcCard({
  type, specifyColor, ptLv, ptName, ptProgress, ptDescription
}: PointCardProps) {
  let color = ''
  if (type === 'active') {
    color = '#1D3734'
  } else if (type === 'neutrality') {
    color = '#303033'
  } else {
    color = '#203446'
  }
  if (specifyColor) color = specifyColor

  const progress = ptProgress ?? 100

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '8px',
    gap: '4px',
    borderRadius: '4px',
    boxShadow: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: `2px solid ${color}`,
    overflow: 'hidden',
  }

  const progressBgStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${progress}%`,
    backgroundColor: color,
    opacity: 0.3,
    zIndex: 0,
    transition: 'width 0.3s',
    pointerEvents: 'none',
  }

  const contentStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div style={containerStyle}>
      <div style={progressBgStyle}></div>
      <div style={contentStyle}>
        <div style={{
          width: '30px',
          fontSize: '20px',
          textAlign: 'center',
        }}>
          {ptLv && <span>{ptLv}</span>}
        </div>
        <div style={{
          fontSize: '24px',
          lineHeight: 1.5,
          fontWeight: 'bold',
          color: 'white',
        }}>
          {ptName}
        </div>
        <div style={{
          marginLeft: 'auto',
          marginRight: '4px',
          fontSize: '24px',
          color: 'white',
        }}>
          {ptDescription}
        </div>
      </div>
    </div>
  )
}