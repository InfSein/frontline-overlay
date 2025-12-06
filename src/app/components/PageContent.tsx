'use client';

import TopToolbar from './TopToolbar';
import SituationTab from './tabs/SituationTab';
import KnockoutTab from './tabs/KnockoutTab';
import DeathTab from './tabs/DeathTab';
import GoodBoyTab from './tabs/GoodBoyTab';
import BadBoyTab from './tabs/BadBoyTab';
import StatisticsTab from './tabs/StatisticsTab';
import AboutTab from './tabs/AboutTab';
import CalendarTab from './tabs/CalendarTab';
import { useOverlayData } from './OverlayDataProvider';

export default function PageContent() {
  const {
    collapsed,
    activeTab,
  } = useOverlayData();

  return (
    <div
      className="flex flex-col h-full items-center justify-items-center gap-2 p-1 bg-transparent"
      style={{
        width: 'calc(100% - 8px)',
      }}
    >
      {/* 顶部操作栏 */}
      <TopToolbar />

      {/* 主要内容区 */}
      {!collapsed && (
        <main className="w-full flex flex-1 flex-col gap-1 items-center overflow-y-auto">
          {/* 战况 */}
          {activeTab === 'situation' && <SituationTab />}
          {/* 击倒 */}
          {activeTab === 'knockout' && <KnockoutTab />}
          {/* 死亡 */}
          {activeTab === 'death' && <DeathTab />}
          {/* 好人 */}
          {activeTab === 'goodboy' && <GoodBoyTab />}
          {/* 坏人 */}
          {activeTab === 'badboy' && <BadBoyTab />}
          {/* 统计 */}
          {activeTab === 'statistics' && <StatisticsTab />}
          {/* 日历 */}
          {activeTab === 'calendar' && <CalendarTab />}
          {/* 关于 */}
          {activeTab === 'about' && <AboutTab />}
        </main>
      )}
    </div>
  );
}