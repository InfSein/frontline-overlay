/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { FrontlineLog } from '@/app/types'
import { formatTimestamp, getFrontlineBackground, getFrontlineBackgroundColor, getFrontlineForeColor, getFrontlineNames, getFrontlineResultBackgroundColor, getJobInfo } from '@/app/tools'
import { Divider } from 'tdesign-react'

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

  const {
    job_icon: jobIcon,
    job_name: jobName
  } = getJobInfo(frontlineLog.job)

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
        <div className="flex items-center text-[1.5rem] leading-[1] font-medium text-white text-shadow">
          { getFrontlineNames(frontlineLog.zone)[1] }
          {
            frontlineLog.result &&
            <span
              data-color={frontlineLog.result === 'win' ? 'green' : 'red'}
              className="text-[1rem] leading-[1] font-normal p-1 text-white ml-1 rounded"
              style={{
                backgroundColor: getFrontlineResultBackgroundColor(frontlineLog.result)
              }}
            >
              { frontlineLog.result === 'win' ? '胜' : frontlineLog.result === 'lose' ? '负' : frontlineLog.result }
            </span>
          }
        </div>
        <div className="flex items-center gap-1 text-[1.1rem] text-gray-200 leading-[1] m-0 text-shadow">
          { formatTimestamp(frontlineLog.start_time) }
          <Divider layout="vertical" style={{ margin: '0 0.25rem'}} />
          <img src={`/icon/game-job/${jobIcon}.png`} className="inline-block w-[1.1em] h-[1.1em] vertical-align:middle" />
          { jobName }
        </div>
      </div>
      <div className="ml-auto mr-4 flex items-center gap-1 text-[1.5rem] font-bold">
        <div className="w-[4.5rem] text-right">{ frontlineLog.knockouts.length }</div>
        <div className="w-[4.5rem] text-right">{ frontlineLog.deaths.length }</div>
      </div>
    </div>
  )
}

export default FlogCard