import { merge } from 'lodash-es'
import { staticMessages as enBase } from './en'
import userGenerated from './generated/user.vi'
import bpmGenerated from './generated/bpm.vi'
import systemGenerated from './generated/system.vi'

/**
 * Bản dịch tiếng Việt.
 *
 * Chiến lược: lấy cấu trúc tiếng Anh (enBase) làm nền để KHÔNG thiếu key,
 * rồi override dần bằng bản dịch tiếng Việt trong `viOverrides`.
 * Những key chưa có trong viOverrides sẽ tạm hiển thị tiếng Anh.
 *
 * Khi dịch thêm, chỉ cần bổ sung vào viOverrides theo đúng cấu trúc.
 */
const viOverrides = {
  common: {
    inputText: 'Vui lòng nhập',
    selectText: 'Vui lòng chọn',
    startTimeText: 'Thời gian bắt đầu',
    endTimeText: 'Thời gian kết thúc',
    login: 'Đăng nhập',
    required: 'Trường này là bắt buộc',
    loginOut: 'Đăng xuất',
    document: 'Tài liệu',
    profile: 'Trung tâm cá nhân',
    reminder: 'Nhắc nhở',
    loginOutMessage: 'Thoát khỏi hệ thống?',
    back: 'Quay lại',
    ok: 'Xác nhận',
    save: 'Lưu',
    cancel: 'Hủy',
    close: 'Đóng',
    reload: 'Tải lại',
    success: 'Thành công',
    query: 'Tìm kiếm',
    reset: 'Đặt lại',
    shrink: 'Thu gọn',
    expand: 'Mở rộng',
    confirmTitle: 'Thông báo hệ thống',
    exportMessage: 'Xác nhận xuất dữ liệu?',
    importMessage: 'Xác nhận nhập dữ liệu?',
    createSuccess: 'Thêm thành công',
    updateSuccess: 'Cập nhật thành công',
    delMessage: 'Xóa dữ liệu đã chọn?',
    delDataMessage: 'Xóa dữ liệu?',
    delNoData: 'Vui lòng chọn dữ liệu cần xóa',
    delSuccess: 'Xóa thành công',
    index: 'STT',
    status: 'Trạng thái',
    createTime: 'Thời gian tạo',
    updateTime: 'Thời gian cập nhật',
    copy: 'Sao chép',
    copySuccess: 'Sao chép thành công',
    copyError: 'Sao chép thất bại'
  },
  action: {
    create: 'Thêm mới',
    add: 'Thêm',
    del: 'Xóa',
    delete: 'Xóa',
    edit: 'Sửa',
    update: 'Cập nhật',
    preview: 'Xem trước',
    more: 'Thêm',
    save: 'Lưu',
    detail: 'Chi tiết',
    export: 'Xuất',
    import: 'Nhập'
  }
}

export default merge({}, enBase, viOverrides, userGenerated, bpmGenerated, systemGenerated)
