# Bảo mật & dependency

## npm audit

`npm audit` có thể báo lỗ hổng mức **high** trên một số gói transitive. Hiện **chấp nhận rủi ro** cho đến khi nâng phiên bản dependency sau khi test regression (bot Zalo, Web UI, SQLite).

Trước khi chạy `npm audit fix --force` trên production, nên thử trên môi trường dev vì có thể phá breaking change.

## Web UI

Khi bật `WEBUI_BASIC_USER` / `WEBUI_BASIC_PASSWORD`, toàn bộ HTTP và WebSocket upgrade đều yêu cầu Basic Auth. Kết hợp Tailscale để giảm bề mặt tấn công.
