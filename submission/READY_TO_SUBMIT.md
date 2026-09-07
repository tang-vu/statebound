# Statebound — gói nộp Binance Agent OS Mini Hackathon

Chuẩn bị ngày 07/09/2026. Mã nguồn, demo và bằng chứng đã sẵn sàng. **Chưa có bài đăng dự thi hoặc xác nhận nộp form.**

## Những việc còn cần tài khoản của bạn

1. Kiểm tra điều kiện tham gia trong [thông báo chính thức](https://www.binance.com/en/square/post/362885563835358). Không suy ra điều kiện hợp lệ chỉ từ múi giờ hoặc nơi đang truy cập.
2. Trên X, follow **@Binance** và repost thông báo hackathon từ tài khoản chính thức. Sau đó reply hoặc quote-repost thông báo đó bằng nội dung trong [POST.txt](POST.txt). Có thể đính kèm [demo.mp4](demo.mp4).
3. Sao chép URL bài vừa đăng. Đăng nhập Binance và hoàn tất [survey chính thức](https://www.binance.com/en/survey/2913aa200aac462c89a737779393f3d4).
4. Lưu xác nhận nộp thành công, URL bài đăng và thời điểm nộp. Chưa coi là đã dự thi chỉ vì website đã online.

**Hạn nộp: 08/09/2026 23:59 UTC = 09/09/2026 06:59 giờ Việt Nam.** Nên nộp trước tối 08/09 theo giờ Việt Nam.

Form đã được mở kiểm tra: Binance yêu cầu đăng nhập trước khi hiển thị các câu hỏi. Các đoạn bên dưới là nội dung chuẩn bị sẵn để dùng theo câu hỏi thực tế, không phải bản sao cấu trúc form. Phiên làm việc hiện tại không có kết nối tài khoản X/Binance để thực hiện đăng bài hoặc gửi survey.

## Đường dẫn dùng khi nộp

| Mục | Giá trị |
| --- | --- |
| Track dự kiến | Track A — Build an AI agent with Agent OS |
| Tên dự án | Statebound |
| Demo | https://statebound.tangvu.dev |
| Video | https://statebound.tangvu.dev/demo.mp4 |
| GitHub | https://github.com/tang-vu/statebound |
| Bằng chứng replay | https://statebound.tangvu.dev/evidence.json |
| Chi tiết tích hợp | https://github.com/tang-vu/statebound/blob/main/docs/BINANCE_INTEGRATION.md |

Video dài 101.4 giây, có thuyết minh tổng hợp, phụ đề và nhãn tốc độ 1.35×. Trang demo chỉ phục vụ nội dung đã ghi; workbench tương tác chạy từ repository. Không cần nạp tiền hoặc giao dịch thật cho phần demo này. Không đăng ký Track B chỉ để nộp dự án Track A.

## Nội dung tiếng Anh dùng trong form

**One-line pitch**

Statebound finds how uncertain order execution can break an AI trading budget, checks a reconciliation repair, and exports independently replayable evidence.

**Project description**

An order fills, but its reply is lost. A blind retry spends 30 USDT against a 20 USDT mandate. Statebound computes this counterexample from a typed execution plan and a finite fault model, validates a reconciliation repair authored in a development Codex session, and replays it through an executor with durable budget reservations. The checker and executor share transition semantics. Recoverable ambiguity can complete; inconclusive lookup stays unresolved without releasing the pending exposure. Exported evidence can be independently replayed and rechecked without an LLM. The responsive workbench exposes agent knowledge separately from hidden exchange reality, with a recorded walkthrough and downloadable evidence.

**How it uses Binance Agent OS**

Statebound uses the documented Binance Skills Hub route and official Binance CLI 2.1.1 for genuine public Spot testnet quote and exchange-info reads. The repository preserves the captured responses and integration route. These recorded official reads are displayed separately from the synthetic order fixture. The project focuses on inspectable execution and reconciliation for AI trading workflows. Hosted Binance MCP is not connected; order execution is simulated. The saved Codex candidate is an actual development-session repair, not a live hosted-model call.

**What makes it different**

Statebound tracks confirmed debit separately from possible execution exposure. A timeout or stale balance does not erase a potentially filled order. A structural repair queries the original attempt before spending the remaining budget. The result includes the exact plan, mandate, search bounds, observations and replay evidence, rather than a free-form safety claim. Persistent reservations survive ambiguous outcomes, and the UI reports safety and progress separately.

**Validation and limits**

The 16-test core suite, production build, lint, HTTP gates and browser workflows passed. Responsive and recovery checks cover 360, 390, 768 and 1440 pixel widths. A separate regression corpus has 48 scenarios per variant: the repaired variant has 0 budget violations, 36 completions and 12 unresolved outcomes. These results cover the declared finite synthetic IOC model, not all market conditions. No real order is placed and no mainnet or testnet write adapter is enabled. Binance's organizers determine eligibility and judging; this packet does not claim acceptance.

## Duy trì demo online

Trang public được phục vụ từ máy build qua Cloudflare Tunnel. Giữ máy bật, có mạng và các tiến trình Statebound hoạt động trong thời gian chấm bài. Khả năng tự phục hồi sau reboot chưa được kiểm chứng. Xem [OPERATIONS.md](../docs/OPERATIONS.md) để kiểm tra hoặc khởi động lại đúng các tiến trình của dự án.
