const { getCurrentChild, getConsumptionRecords, deleteConsumptionRecord, isLoggedIn } = require('../../utils/storage')
const { formatDate, showToast, showModal } = require('../../utils/util')

function getDayRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const start = d.getTime()
  const end = start + 24 * 60 * 60 * 1000 - 1
  return { start, end }
}

function getMonthRange(monthStr) {
  const [year, month] = monthStr.split('-').map(Number)
  const start = new Date(year, month - 1, 1).getTime()
  const end = new Date(year, month, 0).getTime() + 24 * 60 * 60 * 1000 - 1
  return { start, end }
}

function getDefaultDates() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return {
    dayDate: `${y}-${m}-${d}`,
    monthDate: `${y}-${m}`,
    customStart: `${y}-${m}-01`,
    customEnd: `${y}-${m}-${d}`
  }
}

Page({
  data: {
    filterMode: 'day',
    dayDate: '',
    monthDate: '',
    customStart: '',
    customEnd: '',
    totalPoints: 0,
    recordCount: 0,
    records: []
  },

  onLoad() {
    const defaults = getDefaultDates()
    this.setData({ ...defaults })
  },

  onShow() {
    if (!isLoggedIn()) {
      wx.switchTab({ url: '/pages/mine/mine' })
      return
    }
    this.loadData()
  },

  loadData() {
    const child = getCurrentChild()
    if (!child) return

    const { filterMode, dayDate, monthDate, customStart, customEnd } = this.data
    let start, end

    if (filterMode === 'day') {
      const range = getDayRange(dayDate)
      start = range.start
      end = range.end
    } else if (filterMode === 'month') {
      const range = getMonthRange(monthDate)
      start = range.start
      end = range.end
    } else {
      const s = getDayRange(customStart)
      const e = getDayRange(customEnd)
      start = s.start
      end = e.end
    }

    const allRecords = getConsumptionRecords(child.id)
    const records = allRecords
      .filter(r => r.timestamp >= start && r.timestamp <= end)
      .map(r => ({
        ...r,
        dateStr: formatDate(r.timestamp, 'MM-DD HH:mm')
      }))
      .reverse()

    const totalPoints = records.reduce((sum, r) => sum + (r.points || 0), 0)

    this.setData({
      totalPoints,
      recordCount: records.length,
      records
    })
  },

  onFilterModeChange(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ filterMode: mode })
    this.loadData()
  },

  onDayDateChange(e) {
    this.setData({ dayDate: e.detail.value })
    this.loadData()
  },

  onMonthDateChange(e) {
    this.setData({ monthDate: e.detail.value })
    this.loadData()
  },

  onCustomStartChange(e) {
    this.setData({ customStart: e.detail.value })
    this.loadData()
  },

  onCustomEndChange(e) {
    this.setData({ customEnd: e.detail.value })
    this.loadData()
  },

  onDeleteRecord(e) {
    const recordId = e.currentTarget.dataset.id
    const child = getCurrentChild()
    if (!child || !recordId) return

    showModal('删除后对应积分将退回，是否确认删除？', '确认删除').then(confirmed => {
      if (confirmed) {
        const ok = deleteConsumptionRecord(recordId, child.id)
        if (ok) {
          showToast('已删除', 'success')
          this.loadData()
        } else {
          showToast('删除失败')
        }
      }
    })
  }
})
