import { Button } from 'tdesign-react/lib/';
import { CopyIcon } from 'tdesign-icons-react';
import { GrandCompany, Frontline } from '../../types';
import { getFrontlineNames } from '@/app/tools';
import GcCard from '../GcCard';
import PageStyle from '@/app/page.module.css';
import { useOverlayData } from '../OverlayDataProvider';

const SituationTab: React.FC = () => {
  const {
    gc,
    zone,
    getGcPoint,
    getGcIncreaseSpeed,
    getPointCards,
    appConfig,
    handleCopySituation,
    lockSituationMsg
  } = useOverlayData();

  return (
    <div className={PageStyle.panel}>
      {lockSituationMsg() && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="text-center text-white">
            <div className="text-4xl mb-2">⛓️🔒⛓️</div>
            <div className="text-2xl font-semibold">{lockSituationMsg()}</div>
          </div>
        </div>
      )}
      <div className={PageStyle.title}>剩余点分</div>
      <div className="w-full grid grid-cols-3 gap-2">
        {Object.values(GrandCompany).map(company => (
          <GcCard 
            key={company} 
            gc={company} 
            me={gc === company} 
            floatPoints={getGcPoint(company)} 
            increaseSpeed={getGcIncreaseSpeed(company)} 
          />
        ))}
      </div>
      <div className={PageStyle.title}>当前据点</div>
      {zone === Frontline.shatter && (
        <div className="w-full text-[1.25rem] self-baseline text-white px-1 py-0.5 rounded bg-gray-400/90 border border-black/50">
          暂不支持解析{getFrontlineNames(zone)[1]}的当前据点数据。
        </div>
      )}
      <div className="w-full flex flex-col gap-0.5">{getPointCards()}</div>
      <div className="fixed bottom-4 right-8 z-10">
        {!appConfig.hide_situation_copy_btn && (
          <Button
            size="large"
            shape="circle"
            theme="success"
            icon={<CopyIcon />}
            onClick={handleCopySituation}
          />
        )}
      </div>
    </div>
  );
};

export default SituationTab;