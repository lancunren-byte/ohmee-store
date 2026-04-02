import React from 'react'
import { Card, Empty, Typography } from 'antd'

const { Title } = Typography

export default function TaskDispatch() {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        任务下发记录
      </Title>
      <Card>
        <Empty description="任务下发记录：记录每次任务自动下发的执行情况。对接后端后完善。" />
      </Card>
    </div>
  )
}
