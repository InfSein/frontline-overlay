import { IconFont } from 'tdesign-icons-react';
import { useOverlayData } from './OverlayDataProvider';

const TopToolbar: React.FC = () => {
  const {
    collapsed,
    setCollapsed,
    activeTab,
    setActiveTab
  } = useOverlayData();

  const tabPages = {
    situation: '战况',
    knockout: '击倒',
    death: '阵亡',
    goodboy: '好人',
    badboy: '坏人',
    statistics: '统计',
    calendar: '日历',
    about: '关于',
  } as const;
  type TabPage = keyof typeof tabPages;
  const availableTabs = Object.keys(tabPages) as TabPage[];

  return (
    <div className="w-full flex justify-between items-center p-1 px-2 rounded"
      style={{
        backgroundColor: collapsed ? 'transparent' : 'rgb(0 0 0 / 0.3)',
      }}
    >
      <div className="flex gap-2">
        {!collapsed && availableTabs.map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            data-active={activeTab === tab}
            className="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
            hover:bg-gray-700 data-[active=true]:bg-white/30 transition-colors duration-200"
          >
            {tabPages[tab as keyof typeof tabPages]}
          </div>
        ))}
      </div>
      <div
        className="flex gap-2"
      >
        {!collapsed && (
          <div
            className="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white hover:bg-gray-700 cursor-pointer text-shadow transition-colors duration-200"
            onClick={() => window.open('./config')}
          >
            <IconFont name="setting-1" />
          </div>
        )}
        <div
          data-active={collapsed}
          className="text-[1.25rem] px-2 py-1 border border-transparent rounded text-white cursor-pointer text-shadow
          hover:bg-gray-700 data-[active=true]:bg-white/30 transition-colors duration-200"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <IconFont name="chevron-down" /> : <IconFont name="chevron-up" />}
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;