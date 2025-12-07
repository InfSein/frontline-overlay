import { Button } from 'tdesign-react/lib/';
import { BrowseIcon, BrowseOffIcon } from 'tdesign-icons-react';
import AlertCard from '../AlertCard';
import PageStyle from '@/app/page.module.css';
import { useOverlayData } from '../OverlayDataProvider';
import JobSpan from '../JobSpan';

const KnockoutTab: React.FC = () => {
  const {
    getKnockouts,
    onConflict,
    zone,
    showDamageInKD,
    setShowDamageInKD,
    showToast,
    formatTime
  } = useOverlayData();

  const getShowDamageInKdButton = () => {
    return (
      <Button
        size="large"
        shape="circle"
        theme="primary"
        icon={showDamageInKD ? <BrowseOffIcon /> : <BrowseIcon />}
        onClick={() => {
          const action = showDamageInKD ? '隐藏' : '显示';
          showToast('已' + action + '伤害');
          setShowDamageInKD(!showDamageInKD);
        }}
      />
    );
  };

  return (
    <div className={PageStyle.panel}>
      {!getKnockouts().length && <div className={PageStyle.title}>暂无击倒记录</div>}
      {getKnockouts().length > 0 && !onConflict && !zone && (
        <AlertCard msg="此处展示的是上一场的记录，下次进入对战时会被清除。" />
      )}
      {getKnockouts().map((death, deathIndex) => (
        <div key={'knockout' + deathIndex} className={PageStyle.title}>
          <div>{formatTime(death.happenTime)}　</div>
          <div className="flex flex-wrap flex-1">
            <span>使用</span>
            {death.summonedBy && (
              <>
                <span className="text-orange-700">{death.perpetratorName}</span>
                <span>发动的</span>
              </>
            )}
            <span className="text-orange-700">{death.lasthitActionName}</span>
            {showDamageInKD && (
              <>
                <span>造成了</span>
                <span className="text-orange-700">{death.lasthitActionDamage.toLocaleString()}</span>
                <span>伤害，</span>
              </>
            )}
            <span>击倒了</span>
            <div className="flex items-center">
              {!!death.victimJob && (
                <JobSpan job={death.victimJob} />
              )}
              <span className="text-orange-700">{death.victimName}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="fixed bottom-4 right-8 z-10">
        {getKnockouts().length > 0 && getShowDamageInKdButton()}
      </div>
    </div>
  );
};

export default KnockoutTab;