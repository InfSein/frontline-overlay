import React from 'react'
import IconInfo from './icon/IconInfo';

interface AlertCardProps {
  msg: string
}

const AlertCard : React.FC<AlertCardProps> = ({
  msg,
}) => {
  return (
    <div
      className="w-full flex gap-1 items-center text-[1.25rem] self-baseline text-white px-1 py-0.5 rounded border"
      style={{
        backgroundColor: 'rgba(56, 137, 197, 0.25)',
        borderColor: 'rgba(56, 137, 197, 0.35)',
      }}
    >
      <IconInfo />
      { msg }
    </div>
  )
}

export default AlertCard
