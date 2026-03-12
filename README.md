# opcli

CLI tool để tương tác với OpenProject, hỗ trợ quản lý task, cập nhật trạng thái, log time và tạo branch từ task.

## Cài đặt

```bash
npm install
npm run build
npm link
```

Yêu cầu Node.js >= 18.

## Cấu hình

```bash
opcli config setup
```

Nhập URL OpenProject, username và password. Session được lưu tại `~/.opcli/config.json`.

## Sử dụng

### Danh sách task

```bash
# Task được gán cho mình
opcli tasks list

# Tìm kiếm theo tên/ID
opcli tasks list "keyword"

# Lọc theo status
opcli tasks list -s "In progress"

# Lọc theo người khác
opcli tasks list -a "username"

# Tất cả task (không lọc assignee)
opcli tasks list -a all
```

### Xem chi tiết task

```bash
opcli tasks view <id>

# Kèm activities
opcli tasks view <id> --activities

# Kèm relations
opcli tasks view <id> --relations

# Cả hai
opcli tasks view <id> --activities --relations
```

### Cập nhật task

```bash
# Cập nhật status
opcli tasks update <id> -s "In progress"

# Cập nhật assignee
opcli tasks update <id> -a "username"
opcli tasks update <id> -a me

# Cập nhật ngày
opcli tasks update <id> --start 2026-03-12 --due 2026-03-15

# Cập nhật description
opcli tasks update <id> --description "Nội dung mới"

# Log time
opcli tasks update <id> --log-time 4 --log-date 2026-03-12 --log-comment "Nội dung"

# Kết hợp nhiều thay đổi
opcli tasks update <id> -s "In progress" --start 2026-03-12 --due 2026-03-15 --log-time 2
```

### Tạo branch từ task

```bash
# Mặc định prefix là feature
opcli tasks create-branch <id> <slug>
# → feature/op-<id>-<slug>

# Chỉ định prefix
opcli tasks create-branch <id> <slug> -p fix
# → fix/op-<id>-<slug>

# Ví dụ
opcli tasks create-branch 54379 fix-ad-clicks -p fix
# → fix/op-54379-fix-ad-clicks
```

## Các status có sẵn

New, In specification, Specified, Confirmed, To be scheduled, Scheduled, In progress, Developed, In testing, Tested, Test failed, Closed, On hold, Rejected, Staging, Production, Fixed

## Development

```bash
npm run dev      # Watch mode
npm test         # Chạy test
npm run build    # Build TypeScript
```
