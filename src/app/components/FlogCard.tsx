import React from 'react'
import { FrontlineLog } from '@/app/types'
import { formatTimestamp, getFrontlineBackground, getFrontlineBackgroundColor, getFrontlineForeColor, getFrontlineNames, getFrontlineResultBackgroundColor } from '@/app/tools'

interface FlogCardProps {
  frontlineLog: FrontlineLog
}

const FlogCard : React.FC<FlogCardProps> = ({
  frontlineLog
}) => {
  /*
  const getResultText = () => {
    switch (frontlineLog.result) {
      case '1st': return '冠军'
      case '2nd': return '亚军'
      case '3rd': return '季军'
      default: return ''
    }
  }
  */

  return (
    <div
      className="relative p-2 gap-1 rounded shadow-xl flex items-center"
      style={{
        color: getFrontlineForeColor(frontlineLog.zone),
        backgroundColor: getFrontlineBackgroundColor(frontlineLog.zone),
        backgroundImage: `url(${getFrontlineBackground(frontlineLog.zone)})`,
        backgroundSize: '70%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '1% center',
      }}
    >
      <div>
        <div className="text-[24px] leading-[1] font-medium text-white text-shadow">
          { getFrontlineNames(frontlineLog.zone)[1] }
          {
            frontlineLog.result &&
            <span
              data-color={frontlineLog.result === 'win' ? 'green' : 'red'}
              className="text-[16px] text-white ml-2 rounded"
              style={{
                backgroundColor: getFrontlineResultBackgroundColor(frontlineLog.result)
              }}
            >
              { frontlineLog.result === 'win' ? '胜' : frontlineLog.result === 'lose' ? '负' : frontlineLog.result }
            </span>
          }
        </div>
        <p className="text-[16px] text-[#cad5e2] leading-[1] m-0 mr-1 text-shadow">
          { formatTimestamp(frontlineLog.start_time) }
        </p>
      </div>
      <div className="ml-auto mr-4 flex items-center gap-1 text-[24px] font-bold">
        <div className="w-[72px] text-right">{ frontlineLog.knockouts.length }</div>
        <div className="w-[72px] text-right">{ frontlineLog.deaths.length }</div>
      </div>
    </div>
  )
}

export default FlogCard