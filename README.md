# Portfolio cá nhân BT-02

Website portfolio một trang dùng React + TypeScript + Vite, Flask REST API, SQLite và mascot raccoon từ [`page-mascot`](https://www.npmjs.com/package/page-mascot). Compose khởi động frontend Nginx và backend; Cloudflare Tunnel là profile tùy chọn. Thông tin cá nhân và dự án chưa được điền để tránh hiển thị dữ liệu bịa đặt.

## Yêu cầu

- Local: Node.js 20+, npm, Python 3.11+ và pip.
- Docker: Docker Engine + Docker Compose plugin.
- Để gửi lời nhắn thật: tài khoản Pushbullet và Access Token.
- Để truy cập công khai: tên miền trên Cloudflare và Cloudflare Tunnel token.

## Cấu hình cá nhân

```bash
cp .env.example .env
```

Tạo token quản trị an toàn, tối thiểu 32 ký tự:

```bash
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
```

Dán kết quả vào `ADMIN_TOKEN` trong `.env`, không chia sẻ và không commit file `.env`. Điền `PORTFOLIO_NAME`, `PORTFOLIO_ROLE`, `PORTFOLIO_MAJOR` và các liên hệ muốn công khai. Giá trị này được nhúng vào frontend lúc build nên thay đổi hồ sơ cần build lại frontend. `PUSHBULLET_TOKEN` chỉ được dùng bởi backend và không được gửi đến trình duyệt.

Kỹ năng, dự án và học vấn được sửa trong `frontend/src/content.ts`. Danh sách liên hệ chỉ hiện những trường đã cấu hình. Avatar hình học trong hero là vị trí thay ảnh của bạn, không đại diện cho một người thật.

## Chạy local

Terminal 1, backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_PATH=../data/portfolio.sqlite3
export ADMIN_TOKEN='điền-token-ít-nhất-32-ký-tự'
export PUSHBULLET_TOKEN='điền-pushbullet-access-token'
python -m flask --app app run --debug --port 5000
```

Terminal 2, frontend:

```bash
cd frontend
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal, thường là `http://localhost:5173`. Vite chuyển tiếp `/api` và `/health` tới Flask. Để hiện hồ sơ riêng trong chế độ dev, tạo `frontend/.env.local` với các biến `VITE_PORTFOLIO_NAME`, `VITE_PORTFOLIO_ROLE`, `VITE_PORTFOLIO_MAJOR` và các biến `VITE_PORTFOLIO_*` tương ứng; chế độ Compose tự map các giá trị không có tiền tố `VITE_` từ file gốc `.env`. Bỏ `--debug` khi chạy dịch vụ dùng chung hoặc public.

## Kiểm thử

```bash
cd backend
python -m pip install pytest
python -m pytest -q
cd ../frontend
npm run build
```

API kiểm tra nhanh:

```bash
curl -i http://localhost:5000/health
curl -i http://localhost:5000/api/banner
curl -i -X POST http://localhost:5000/api/admin/banner -H 'Content-Type: application/json' -d '{"message":"Lời nhắn mới"}'
curl -i -X POST http://localhost:5000/api/admin/banner -H 'Authorization: Bearer <ADMIN_TOKEN>' -H 'Content-Type: application/json' -d '{"message":"Lời nhắn mới"}'
curl -i -X POST http://localhost:5000/api/messages -H 'Content-Type: application/json' -d '{"name":"Khách","message":"Xin chào!"}'
```

Yêu cầu đầu tiên tới endpoint admin không có token phải nhận `401`. Khi cấu hình thành công, endpoint trả `200`; lời nhắn khách chỉ trả `201` khi Pushbullet thực sự chấp nhận. Thiếu token Pushbullet trả `503`; lỗi dịch vụ trả `502`. Các lần gửi message bị giới hạn 3 lần/5 phút/IP, cập nhật banner 5 lần/5 phút/IP. Test message mock Pushbullet để không cần gửi thông báo thật.

## Pushbullet

1. Cài ứng dụng Pushbullet trên điện thoại và đăng nhập cùng tài khoản.
2. Tạo Access Token tại [Pushbullet settings](https://www.pushbullet.com/#settings/account), đặt vào `PUSHBULLET_TOKEN` trong `.env` trên máy chủ.
3. Có thể đặt `PUSHBULLET_DEVICE_IDEN` để chỉ gửi đến một thiết bị; để trống sẽ gửi theo hành vi mặc định của Pushbullet.
4. Khởi động lại/recreate backend sau khi thay secret: `docker compose up -d --force-recreate backend`.
5. Gửi lời nhắn thử từ form. Không paste token vào giao diện, URL, GitHub hoặc ảnh chụp màn hình.

Pushbullet cần cấu hình hợp lệ để form gửi thành công. Không có fallback giả lập.

## Docker Compose

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

Website local tại `http://localhost:8080`; admin tại `http://localhost:8080/admin`. Backend không publish cổng ra host. SQLite banner và bộ đếm rate limit nằm trong named volume `portfolio-data`, giữ nguyên sau khi restart/recreate container. `docker compose down` không xóa volume; `docker compose down -v` sẽ xóa dữ liệu và chỉ dùng khi chủ động muốn xóa sạch.

Frontend build args nhận thông tin công khai từ `.env`; chỉ secret backend đi vào runtime backend. `.env` không được COPY vào image. Container chạy user non-root, filesystem read-only, bỏ Linux capabilities và có health check.

## Admin trên điện thoại

Mở `https://<tên-miền>/admin` sau khi cấu hình HTTPS, nhập `ADMIN_TOKEN` rồi gửi nội dung (tối đa 180 ký tự). Token chỉ được lưu trong `sessionStorage` sau khi cập nhật thành công và bị xóa khi xác thực sai; không nằm trong URL hay localStorage. Backend so sánh Bearer token constant-time và giới hạn 5 lần thử mỗi 5 phút trên mỗi IP. Dùng HTTPS khi public; không mở cổng Flask trực tiếp Internet.

## Ubuntu Server và Cloudflare Tunnel

1. Cài Docker Engine và Compose plugin theo [hướng dẫn Docker Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Clone repository, `cd bt02-website`, tạo `.env` và điền secret.
2. Trong Cloudflare Zero Trust, tạo tunnel, thêm Public Hostname cho domain. Nếu chạy cloudflared trên máy chủ/VM, đặt service đích là `http://localhost:8080`.
3. Hoặc chạy tunnel trong Compose: đặt tunnel token vào `CLOUDFLARE_TUNNEL_TOKEN`, chỉnh Public Hostname trong dashboard thành `http://frontend:8080`, rồi chạy:

   ```bash
   docker compose --profile cloudflare up -d --build
   ```

4. Trỏ DNS hostname qua Cloudflare, bật proxy và kiểm tra chứng chỉ HTTPS ở chế độ Full (strict) nếu origin có TLS; tunnel tới Nginx nội bộ dùng HTTP, TLS kết thúc tại Cloudflare.
5. Mở `https://<tên-miền>`, `/admin`, `/health`; kiểm tra gửi lời nhắn bằng Pushbullet đã cấu hình. Không expose cổng backend `5000`.

Cloudflare Tunnel tạo kết nối outbound, không cần mở port inbound ở router/VMware NAT. Token tunnel là secret tương đương credential, giữ riêng trong `.env`.

## Đẩy source lên GitHub

Tạo một repository trống trên GitHub, không tạo README/license ở bước tạo repository, sau đó chạy tại thư mục dự án:

```bash
git init
git add .
git status
git commit -m "feat: add BT-02 personal portfolio"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

`.gitignore` loại trừ `.env`, SQLite, dependencies và build output. Kiểm tra `git status` trước commit; không commit token, database local hoặc ảnh chụp chứa thông tin bí mật.

## Docker Hub / registry và máy chủ khác

Đổi `FRONTEND_IMAGE` và `BACKEND_IMAGE` trong `.env` thành tên image bạn có quyền push. Thay `ghcr.io/your-github-user` bằng namespace thực tế. Build và push:

```bash
docker compose build
docker login ghcr.io
docker compose push
```

Để dùng Docker Hub, đổi registry prefix thành `docker.io/<username>/bt02-portfolio-frontend:latest` và `docker.io/<username>/bt02-portfolio-backend:latest`, sau đó `docker login` và `docker compose push`. Trên server khác, copy `compose.yaml`, `.env` (qua kênh an toàn) và chạy:

```bash
docker compose pull
docker compose up -d
```

Sao lưu dữ liệu trước khi thay máy: `docker run --rm -v bt02-portfolio_portfolio-data:/data -v "$PWD":/backup alpine tar czf /backup/portfolio-data.tgz -C /data .`. Tên volume thực tế có tiền tố Compose project; xem bằng `docker volume ls`. Khôi phục volume trước khi khởi động backend.

## Kiểm tra nghiệm thu và ảnh BT-02

- Desktop: trang đầu, announcement, avatar placeholder và mascot raccoon.
- Mobile: trang đầu, menu dưới màn hình, form liên hệ và trang `/admin`.
- API `GET /health`, `GET /api/banner`; chụp response không chứa secret.
- Admin không token nhận `401`; admin token hợp lệ cập nhật banner; trang công khai tự đổi trong tối đa 30 giây.
- Form thành công với notification thật trên điện thoại; chụp thông báo Pushbullet, che thông tin nhạy cảm.
- Rate limit trả `429` khi vượt ngưỡng; nội dung quá dài bị từ chối.
- `docker compose ps` hiển thị các container healthy; restart backend và xác nhận banner vẫn còn.
- Cloudflare hostname mở HTTPS thành công; chụp thanh địa chỉ có HTTPS.
- Không chụp token/secret. Dùng ảnh chụp màn hình thật sau khi cấu hình, không dùng mockup.

## Ghi chú vận hành

`page-mascot` hỗ trợ React 18 trở lên. Tích hợp dùng API công khai `directions`, `reactions`, `label`, `className`; hai sprite raccoon được phục vụ tại `/mascots/` từ `frontend/public/mascots/`. Thư viện tự theo dõi con trỏ trên thiết bị có fine pointer và phản ứng khi click; kích thước đặt mặc định 140px, ẩn trên màn hình hẹp để tránh cản thao tác, reduced-motion được tôn trọng.

Banner tự đồng bộ mỗi 30 giây; thay đổi không cần refresh trang. API cùng origin nên không bật CORS. Log không ghi nội dung lời nhắn, Pushbullet token hay admin token. SQLite phù hợp một instance nhỏ cho VM sinh viên; nếu scale nhiều backend instance, chuyển rate limit sang Redis.
