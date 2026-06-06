# 📊 analytics-tracking 使用指南

> **Skill 定位**：埋点方案设计、统一事件命名规范

---

## 🎯 这个Skill解决什么问题

| 普通人做埋点 | 用这个Skill |
|------------|------------|
| ❌ 上线后才发现忘了埋 | ✅ 系统性的检查清单，一个都漏不掉 |
| ❌ 每个人埋点命名不一样 | ✅ 统一命名规范，跨项目可复用 |
| ❌ 埋了100个点，分析的时候不知道用哪个 | ✅ 区分核心埋点和探索性埋点 |

---

## 🚀 使用方法

```
/skill analytics-tracking

功能版本：门店报表V1.0
核心行为：用户查看报表、导出Excel、配置推送规则

请输出：
1. 完整的埋点矩阵
2. 每个事件的参数
3. 触发时机
4. 验收标准
5. 数据验证SQL
```

---

## 💡 统一命名规范

### 事件命名法则：`[模块]_[动作]_[对象]`

| ✅ 好的命名 | ❌ 不好的命名 |
|-----------|-------------|
| `report_export_click` | `baobiao`、`daochu` |
| `report_page_view` | `kankanbao` |
| `report_config_save` | `tijiao` |

### 参数规范

每个事件必须带的通用参数：
- `user_id`：用户ID
- `store_id`：门店ID
- `role`：用户角色
- `page_url`：当前页面
- `timestamp`：精确到毫秒

---

## 📦 输出格式

| 事件ID | 事件名称 | 触发时机 | 参数 | 优先级 |
|--------|---------|---------|------|--------|
| report_page_view | 查看报表页面 | 页面加载完成 | page_type, time_range | P0 |
| report_export_click | 点击导出按钮 | 点击瞬间 | file_format | P0 |
| report_config_save | 保存推送配置 | 点击保存 | is_open, frequency | P1 |

加上每个埋点的验收测试用例。
