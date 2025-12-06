import { Button } from 'tdesign-react/lib/';
import { ShareIcon } from 'tdesign-icons-react';
import FlogCard from '../FlogCard';
import PieChart from '../PieChart';
import AlertCard from '../AlertCard';
import PageStyle from '@/app/page.module.css';
import { useOverlayData } from '../OverlayDataProvider';

const StatisticsTab: React.FC = () => {
  const {
    frontlineLog,
    resolveLog
  } = useOverlayData();

  const logInfo = resolveLog();

  const handleCopyStatisticsImage = async () => {
    /*
    const screenshotArea = document.getElementById('statistics-tab')
    if (!screenshotArea) {
      showToast('页面未加载，请等待……'); return
    }
    const err = await captureAndCopy(screenshotArea)
    if (err) showToast(`复制失败：${err}`)
    else showToast('已复制！')
    */
  };

  return (
    <div id="statistics-tab" className={PageStyle.panel}>
      {!frontlineLog.length && (
        <AlertCard msg="暂无记录。请完成至少一场纷争前线后再来查看。" />
      )}
      <div className={PageStyle.title}>
        参战统计
        <div className="ml-auto mr-5 flex items-center gap-1">
          <div className="w-[4.5rem] text-right">K</div>
          <div className="w-[4.5rem] text-right">D</div>
        </div>
      </div>
      {frontlineLog.length ? frontlineLog.map((log, logIndex) => (
        <FlogCard key={logIndex} frontlineLog={log} />
      )) : <div className={PageStyle.content}>暂无数据</div>}
      <div className={PageStyle.title}>
        K/D统计
      </div>
      <div className={PageStyle.content}>
        <div className="w-full grid grid-cols-3">
          <div>参战<span className="text-orange-700">{frontlineLog.length}</span>场</div>
          <div>击倒数 <span className="text-orange-700">{logInfo.knockouts.length}</span></div>
          <div>死亡数 <span className="text-orange-700">{logInfo.deaths.length}</span></div>
          <div>K/D <span className="text-orange-700">{logInfo.kd}</span></div>
          <div>场均击倒 <span className="text-orange-700">{logInfo.knockoutEachMatch}</span></div>
          <div>场均死亡 <span className="text-orange-700">{logInfo.deathEachMatch}</span></div>
        </div>
      </div>
      <div className={PageStyle.title}>
        击倒统计
      </div>
      <div className={PageStyle.content}>
        {logInfo.knockoutDataForPie.length
          ? <PieChart data={logInfo.knockoutDataForPie} />
          : '暂无数据'}
      </div>
      <div className={PageStyle.title}>
        死亡统计
      </div>
      <div className={PageStyle.content}>
        {logInfo.deathDataForPie.length
          ? <PieChart data={logInfo.deathDataForPie} />
          : '暂无数据'}
      </div>
      <div className="fixed bottom-4 right-8 hidden">
        <Button
          size="large"
          shape="circle"
          theme="success"
          icon={<ShareIcon />}
          onClick={handleCopyStatisticsImage}
        />
      </div>
    </div>
  );
};

export default StatisticsTab;