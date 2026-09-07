# Statebound: nâng cấp bằng chứng, không chỉ giao diện

Ngày nghiên cứu: 07/09/2026. Đối tượng: chủ dự án và người chuẩn bị bài dự thi Binance Agent OS Mini Hackathon. Phạm vi: tiêu chí công khai, tính khác biệt kỹ thuật, trải nghiệm tự kiểm tra bằng chứng và khả năng tiếp cận.

## Kết luận để hành động

Cải tiến đáng làm nhất là giúp người xem tự quan sát **agent biết gì, sàn thực sự đã làm gì và ngân sách còn chịu được bao nhiêu**. Giao diện hiện tại đã có bản sắc; thêm trang trí không giải quyết nút thắt quan trọng hơn: phần khác biệt kỹ thuật còn nằm sau video hoặc file JSON.

Đã triển khai Evidence Lab ngay trên trang public: bốn trace dựng trước từ engine thật của dự án, điều khiển từng bước, hiển thị đồng thời nhận thức của agent và trạng thái ẩn của simulator, trạng thái kết thúc và liên kết chia sẻ đến đúng bước. Đây là trải nghiệm khám phá trace đã tính, không phải một API giao dịch hay checker chạy live.

## 1. Bài toán có căn cứ thực tế

Tài liệu Binance Spot mô tả timeout có thể để kết quả thực thi chưa xác định và hướng dẫn query trạng thái nếu chưa có thông tin từ User Data Stream. Điều này xác nhận lớp lỗi mà Statebound mô hình hóa. Nó không chứng minh chuỗi lỗi cụ thể của fixture đã từng xảy ra trên tài khoản thật. [Binance: General REST API Information](https://developers.binance.com/en/docs/products/spot/rest-api).

AWS giải thích rằng retry sau phản hồi bị mất có thể tạo tác động trùng; thiết kế idempotency phải xử lý tương quan request và ý định người gọi. Đây là nền tảng để giải thích tại sao chỉ thêm retry hoặc backoff chưa đủ. Không suy diễn quy tắc token của AWS thành bảo đảm order ID trên Binance. [Malcolm Featonby, AWS Builders’ Library](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).

Thông báo hackathon yêu cầu Track A xây agent bằng Agent OS và cung cấp demo/video, cùng GitHub khi phù hợp. Trang công khai đã đọc không đưa ra trọng số chấm điểm chi tiết. Vì vậy, ưu tiên dưới đây là phán đoán sản phẩm dựa trên bằng chứng, không phải công thức để thắng giải. [Binance: Agent OS Mini Hackathon](https://www.binance.com/en/square/post/362885563835358).

## 2. Khác biệt nào bảo vệ được?

AgentCheck đã có workflow tái hiện, can thiệp và giảm thiểu lỗi cho agent qua MCP. TraceFix đã dùng counterexample từ TLA+/TLC để sửa protocol phối hợp. Vì vậy không nên gọi deterministic checks hay counterexample-driven repair là phát minh riêng của Statebound. [AgentCheck, Mazumder và Lia, 2026](https://arxiv.org/html/2607.11098); [TraceFix, Xia và cộng sự, 2026](https://arxiv.org/html/2605.07935v1).

CoW intents là ví dụ về tách ràng buộc người dùng khỏi lựa chọn thực thi. Temporal saga xử lý các hành động bù trừ trong workflow; bù trừ và đối soát có thể cùng tồn tại. Statebound không triển khai settlement của CoW và không phải một hệ thống Temporal. [CoW Protocol: Intents](https://docs.cow.fi/cow-protocol/concepts/introduction/intents); [Temporal: Saga Pattern](https://docs.temporal.io/design-patterns/saga-pattern).

Định vị nên dùng: **Statebound làm phơi nhiễm của lệnh chưa rõ kết quả trở nên kiểm tra được: tìm đường đi phá ngân sách trong mô hình IOC rời rạc, kiểm tra bản sửa bị ràng buộc và replay mà không giải phóng reservation chỉ vì thiếu phản hồi.** Đây là sự chuyên biệt hóa vào tiền, tri thức agent và ngữ nghĩa thực thi chung; không phải tuyên bố an toàn cho toàn bộ thị trường.

## 3. Những cải tiến đã chọn

| Cải tiến | Lý do chọn | Bằng chứng thực hiện |
| --- | --- | --- |
| Bốn kết cục đặt cạnh nhau | Cho thấy guard giữ ngân sách nhưng chưa đủ để xác nhận tiến độ | Blind retry, guard only, reconciled, still unknown |
| Hai bảng trạng thái ở cùng một bước | Làm lộ khác biệt giữa thực tế và thông tin đến agent | Confirmed debit, possible debit, actual debit, mandate headroom |
| Điều khiển từng bước và link chia sẻ | Người xem có thể kiểm tra đúng thời điểm thay vì tìm trong video | Slider gốc của trình duyệt, Previous/Next, Jump to outcome, deep link |
| Nguồn và cách tái lập ở lớp chi tiết | Giữ trang dễ đọc mà vẫn cho phép kiểm toán | Điều kiện fault, bounds, trace hash, tải JSON, lệnh gallery:check |

Progressive disclosure giúp phần thông tin cần thiết xuất hiện trước và phần kỹ thuật sâu nằm ở lớp mở rộng. Đây là nguyên tắc thiết kế được áp dụng, chưa phải bằng chứng rằng người dùng của Statebound sẽ hiểu nhanh hơn bao nhiêu phần trăm. [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/).

W3C yêu cầu ý nghĩa không phụ thuộc riêng vào màu sắc; lab sử dụng nhãn chữ, số tiền và trạng thái cùng màu. Slider có hỗ trợ phím và có nút bước thay thế vì hướng dẫn ARIA lưu ý các khó khăn trên thiết bị cảm ứng dùng công nghệ hỗ trợ. Không tự động phát trace; người xem kiểm soát tiến trình. Đây là các lựa chọn theo hướng dẫn, chưa phải chứng nhận WCAG toàn diện. [W3C: Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html); [W3C: Slider Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/); [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

## 4. Số liệu và giới hạn của lab

Trong các trace đã sinh, mandate giữ nguyên 20 USDT, giá synthetic 600 USDT, phí 0 bps. Lệnh đầu tiên đều fill nhưng mất phản hồi. Retry mù kết thúc với 30 USDT debit; guard chặn retry ở 15; bản sửa xác nhận hoàn tất ở 15; lookup liên tục không đủ bằng chứng kết thúc unresolved và vẫn giữ 15 USDT phơi nhiễm. Case cuối thay đổi cả bằng chứng lookup, không được trình bày như chỉ đổi plan trong cùng mọi điều kiện.

Đây là bốn tình huống giải thích cơ chế, không phải một benchmark mới. Tập regression 48 tình huống mỗi biến thể vẫn là tập riêng. Hash của trace phục vụ kiểm tra tính nhất quán; không chứng thực rằng sàn đã thực hiện một lệnh thật. Nguồn số liệu: scripts/replay-gallery.ts, preview/replay-gallery.json và engine trong repository.

Kiểm tra thực hiện: tái sinh bốn trace và replay lại chính xác; so từng bước và từng số tiền trong trình duyệt; kiểm tra Home/ArrowRight, link mở lại đúng case/bước, clipboard fallback, lỗi tải dữ liệu và bố cục 390/1440 px. Ảnh chụp lab ở desktop và mobile đã được xem trực tiếp. Chưa thực hiện nghiên cứu với người dùng hoặc giám khảo thật, và chưa thử toàn bộ thiết bị/công nghệ hỗ trợ.

## 5. Những việc chưa nên mở rộng trước khi nộp

Không thêm live trading chỉ để demo ấn tượng hơn: dự án chưa có write adapter đạt các giả định đối soát và fee bounds. Không gắn một model live rồi gọi đó là bảo đảm an toàn. Không tuyên bố vượt trội các công trình liên quan khi chưa có phép so sánh độc lập. Không thay hướng thẩm mỹ đã được người dùng chấp nhận để chạy theo một phong cách mới.

Giá trị của bản nâng cấp là người xem có thể kiểm tra lập luận trực tiếp. Bước nghiên cứu tiếp theo hợp lý sau khi nộp là thử với người dùng mới: họ có giải thích đúng khác biệt giữa confirmed và possible debit, và giữa refusal với completion, sau khi dùng lab hay không. Chưa có dữ liệu để khẳng định hiệu quả đó hiện tại.

## Phương pháp và mức chắc chắn

Đã đọc tài liệu chính thức Binance, các tài liệu gốc W3C, hướng dẫn UX của NN/G, AWS Builders’ Library và bốn nguồn related work. Đã đối chiếu các kết luận quan trọng với code, trace và kết quả test tại chỗ. Các nguồn được truy cập ngày 07/09/2026; ngày xuất bản không hiển thị thì không tự suy đoán. Không tìm thấy tiêu chí chấm điểm chi tiết trong thông báo đã đọc; các khuyến nghị về sức thuyết phục là suy luận được đánh dấu rõ.

Nghiên cứu dừng khi lớp lỗi, ranh giới tính mới, lựa chọn tương tác và cách tái lập đều có nguồn gốc rõ hoặc giới hạn cụ thể. Đây là nghiên cứu có phạm vi phục vụ một quyết định triển khai, không phải tổng quan toàn bộ lĩnh vực agent verification.
