import AlertCard from '../AlertCard';
import PageStyle from '@/app/page.module.css';
import { useOverlayData } from '../OverlayDataProvider';

const BadBoyTab: React.FC = () => {
  const {
    badboys,
    onConflict,
    zone,
    formatTime
  } = useOverlayData();

  return (
    <div className={PageStyle.panel}>
      {!badboys.length && <div className={PageStyle.title}>暂无记录</div>}
      {badboys.length > 0 && !onConflict && !zone && (
        <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
      )}
      {badboys.map((log, logIndex) => (
        <div key={'badboy' + logIndex} className={PageStyle.title}>
          <div>{formatTime(log.happenTime)}　</div>
          <div className="flex flex-wrap flex-1">
            <span className="text-orange-700">{log.perpetratorName}</span>
            <span>对你发动了</span>
            <span className="text-orange-700">{log.actionName}</span>
            {!!log.actionDamage && (
              <>
                <span>，造成了</span>
                <span className="text-orange-700">{log.actionDamage.toLocaleString()}</span>
                <span>伤害</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadBoyTab;