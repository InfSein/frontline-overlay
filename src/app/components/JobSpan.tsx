/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import React from 'react'
import { getJobInfo } from '@/app/tools'

interface JobSpanProps {
  job?: number
  showJobName?: boolean
  size?: string
}

const JobSpan : React.FC<JobSpanProps> = ({
  job, showJobName, size
}) => {
  const {
    job_icon: jobIcon,
    job_name: jobName
  } = getJobInfo(job)

  const _size = size || '1.1em'

  const imgClassName = `inline-block w-[${_size}] h-[${_size}] vertical-align:middle`

  return showJobName ? (
    <div className="flex items-center gap-1 text-[1.1rem] text-gray-200 leading-[1] m-0 text-shadow">
      <img src={`./icon/game-job/${jobIcon}.png`} className={imgClassName} />
      { jobName }
    </div>
  ) : (
    <img src={`./icon/game-job/${jobIcon}.png`} className={imgClassName} />
  )
}

export default JobSpan