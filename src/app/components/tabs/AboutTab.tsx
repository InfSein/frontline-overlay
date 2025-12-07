import { useState } from 'react';
import { Button } from 'tdesign-react/lib/';
import { LogoGithubIcon, SystemLogIcon, CopyIcon } from 'tdesign-icons-react';
import { AppConstants } from '../../types';
import { checkAppUpdates, copyToClipboard } from '@/app/tools';
import PageStyle from '@/app/page.module.css';
import { useOverlayData } from '../OverlayDataProvider';

const AboutTab: React.FC = () => {
  const { showToast } = useOverlayData();
  const [appNewVersion, setAppNewVersion] = useState<string>('');
  const [checkingAppUpdate, setCheckingAppUpdate] = useState(false);

  const checkAppUpdate = async () => {
    try {
      setCheckingAppUpdate(true);
      const { needUpdate, latestVersion } = await checkAppUpdates();
      if (needUpdate) setAppNewVersion(latestVersion);
      else setAppNewVersion('');
    } catch (e) {
      console.error('检查应用新版本时发生错误：', e);
    } finally {
      setCheckingAppUpdate(false);
    }
  };

  const handleCheckAppUpdate = async () => {
    if (checkingAppUpdate) {
      showToast('正在检测中，请稍候'); return;
    }
    await checkAppUpdate();
    if (appNewVersion) {
      showToast('检测到新版本');
    } else {
      showToast('已是最新版本', 'success');
    }
  };

  const handleUpdateApp = async () => {
    const cacheKeys = await caches.keys();
    for (const name of cacheKeys) {
      await caches.delete(name);
    }
    location.reload();
  };

  const getConnectionButtons = () => {
    const list = [
      { key: 'githubRepo', icon: (<LogoGithubIcon />), label: 'Github' },
      { key: 'changelogDoc', icon: (<SystemLogIcon />), label: '更新日志' },
    ] as const;
    return list.map(item => (
      <div key={item.key} className="flex gap-1">
        <Button
          size="large"
          icon={item.icon}
          onClick={() => window.open(AppConstants[item.key])}
          style={{
            fontFamily: 'unset',
            fontSize: '1.25rem',
            paddingLeft: 'auto',
            paddingRight: 'auto',
            width: '12.5rem',
          }}
        >{item.label}</Button>
        <Button
          size="large"
          icon={<CopyIcon />}
          onClick={() => {
            copyToClipboard(AppConstants[item.key]);
            showToast('已复制链接');
          }}
        />
      </div>
    ));
  };

  return (
    <div className={PageStyle.panel}>
      <div className={PageStyle.title}>
        <span>当前版本：</span>
        <span className="text-orange-700 font-bold">{process.env.APP_VERSION}</span>
      </div>
      <div
        className={PageStyle.content}
        style={{
          flexDirection: 'column',
          alignItems: 'start',
          paddingBottom: '0.375rem',
        }}
      >
        {appNewVersion ? (
          <>
            <div>检测到新版本：{appNewVersion}</div>
            <Button
              size="large"
              theme="success"
              loading={checkingAppUpdate}
              onClick={handleUpdateApp}
              style={{
                fontFamily: 'unset',
                fontSize: '1.25rem',
                paddingLeft: '2.25rem',
                paddingRight: '2.25rem',
              }}
            >
              点此更新
            </Button>
            <div className="text-red-600">※当前数据和已记录的场次统计将会丢失。</div>
          </>
        ) : (
          <>
            <div>已是最新版本</div>
            <Button
              size="large"
              theme="primary"
              loading={checkingAppUpdate}
              onClick={handleCheckAppUpdate}
              style={{
                fontFamily: 'unset',
                fontSize: '1.25rem',
                paddingLeft: '2.25rem',
                paddingRight: '2.25rem',
              }}
            >
              检查更新
            </Button>
          </>
        )}
      </div>
      <div className={PageStyle.title}>保持联系</div>
      <div className={PageStyle.content}>
        <div>点击左侧按钮来打开子窗口访问，或是点击右侧按钮复制链接。</div>
        <div className="flex flex-col gap-1">
          {getConnectionButtons()}
        </div>
      </div>
    </div>
  );
};

export default AboutTab;