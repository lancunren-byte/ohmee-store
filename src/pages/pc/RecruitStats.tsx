import React from 'react'
import { Card, Empty, Typography } from 'antd'

const { Title } = Typography

export default function RecruitStats() {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 16 }}>
        人员招聘统计
      </Title>
      <Card>
        <Empty description="人员招聘统计：HR 查看各门店提报的应聘人员，录入面试结果。店长通过移动端门店招聘提报。对接后端后完善。" />
      </Card>
    </div>
  )
}
