import React from 'react'
import { Card, Empty, Typography } from 'antd'

const { Title } = Typography

export default function TaskConfig() {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        任务配置
      </Title>
      <Card>
        <Empty description="任务配置功能：创建门店执行任务模板，配置周期与下发范围。对接后端后完善。" />
      </Card>
    </div>
  )
}
