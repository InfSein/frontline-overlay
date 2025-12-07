import AlertCard from '../AlertCard';
import PageStyle from '@/app/page.module.css';
import { useOverlayData } from '../OverlayDataProvider';
import JobSpan from '../JobSpan';

const GoodBoyTab: React.FC = () => {
  const {
    goodboys,
    onConflict,
    zone,
    formatTime
  } = useOverlayData();

  return (
    <div className={PageStyle.panel}>
      {!goodboys.length && <div className={PageStyle.title}>暂无记录</div>}
      {goodboys.length > 0 && !onConflict && !zone && (
        <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
      )}
      {goodboys.map((log, logIndex) => (
        <div key={'goodboy' + logIndex} className={PageStyle.title}>
          <div>{formatTime(log.happenTime)}　</div>
          <div className="flex flex-wrap flex-1">
            <div className="flex items-center">
              {!!log.perpetratorJob && (
                <JobSpan job={log.perpetratorJob} />
              )}
              <span className="text-orange-700">{log.perpetratorName}</span>
            </div>
            <span>对你发动了</span>
            <span className="text-orange-700">{log.actionName}</span>
            {!!log.actionDamage && (
              <>
                <span>，回复了</span>
                <span className="text-orange-700">{log.actionDamage.toLocaleString()}</span>
                <span>体力</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GoodBoyTab;