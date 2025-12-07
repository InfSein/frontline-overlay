'use client';

import OverlayDataProvider from './components/OverlayDataProvider';
import PageContent from './components/PageContent';

export default function Home() {
  return (
    <OverlayDataProvider>
      <PageContent />
    </OverlayDataProvider>
  );
}