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
    color = '#70ACFFFF'
  } else if (type === 'neutrality') {
    color = '#ADADADFF'
  } else {
    color = '#ADADADFF'
  }
  if (specifyColor) color = specifyColor

  const progress = ptProgress ?? 100

  return (
    <div
      className="relative flex items-center gap-1 p-2 rounded overflow-hidden"
      style={{
        backgroundColor: 'transparent',
        border: `2px solid ${color}`,
        boxShadow: '0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a',
      }}
    >
      <div
        className="absolute left-0 top-0 h-full opacity-30 z-0 transition-all pointer-events-none"
        style={{ width: `${progress}%`, backgroundColor: color }}
      />
      <div className="relative z-10 px-1 flex items-center w-full text-[20px] text-white">
        <div className="text-[22px]">
          <span className="font-bold">{ptLv}</span>
          <span>　{ptName}</span>
        </div>
        <div className="ml-auto">
          {ptDescription}
        </div>
      </div>
    </div>
  )
}