import React from 'react'
import { Card, Empty, Typography } from 'antd'

const { Title } = Typography

export default function TaskStats() {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        任务执行统计
      </Title>
      <Card>
        <Empty description="任务执行统计：按任务类型、门店、督导维度统计完成率、合格率、整改率。对接后端后完善。" />
      </Card>
    </div>
  )
}
