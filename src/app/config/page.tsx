'use client';

import { Button, Layout, Menu } from 'tdesign-react'
import {
  SaveIcon,
} from 'tdesign-icons-react'

const { Content, Footer, Aside } = Layout
const { MenuItem } = Menu

export default function ConfigPage() {

  return (
    <main className="p-6 w-full h-full">
      <Layout className="w-full h-full">
        <Aside width="150px">
          <Menu style={{ width: '100%', height: '100%', boxShadow: 'none' }}>
            <MenuItem value="1">侧边内容一</MenuItem>
            <MenuItem value="2">侧边内容二</MenuItem>
            <MenuItem value="3">侧边内容三</MenuItem>
            <MenuItem value="4">侧边内容四</MenuItem>
            <MenuItem value="5">侧边内容无</MenuItem>
          </Menu>
        </Aside>
        <Layout>
          <Content>
            <div>Content</div>
          </Content>
          <Footer className="flex justify-end">
            <Button
              shape="rectangle"
              size="large"
              type="button"
              variant="base"
              icon={<SaveIcon />}
            >
              确定
            </Button>
          </Footer>
        </Layout>
      </Layout>
    </main>
  )
}