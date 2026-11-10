# プロジェクトの目的・概要
- 無駄な時間を過ごすネットサーフィンの時間を削減する
- YouTubeの動画サイトを意識せずに長時間視聴することを防ぐ
- しかし有意義な動画と判断できるものはユーザー側で視聴して視聴できるようにする
- この拡張機能の役割は動画視聴を禁止することではなく、無意識的に動画を長時間視聴してしまうことを防ぐ
# 機能
- ユーザーは設定画面（Optionsページ）で以下を指定できる
  - 連続視聴の制限時間（例: 30分）
  - 制限対象のウェブサイト（ドメイン）
  - ホワイトリスト（制限対象外とする特定のチャンネルURLや動画パス）
- 制限時間への到達時の挙動
  - 対象のタブで動画要素を覆い隠すようにモーダル（UI）を表示する
  - モーダル表示と同時に `<video>` 要素の再生を一時停止（`.pause()`）する
  - モーダルには「視聴を継続する」ボタンを配置し、意識的なアクションがあれば制限をリセットして視聴を再開できる
# ディレクトリ構成と各フォルダの役割
- `manifest.json`: 静的な `content_scripts` / `host_permissions` は持たない。ホスト権限は `optional_host_permissions` から、設定画面での保存時に対象ドメインごとに要求する
- `shared/constants.js`: ESModule。storage のキー・デフォルト値・読み書きヘルパー
  - `chrome.storage.sync`: ユーザー設定（`TIME_LIMIT_MINUTES` / `TARGET_DOMAINS` / `WHITELIST`）
  - `chrome.storage.local`: `WATCH_STATE`（`{ elapsedMs, lastTickAt }`）。全タブ共通の連続視聴時間
- `shared/domain.js`: ドメインの正規化、マッチパターン生成（`*://*.<domain>/*`）、ホワイトリストのURLプレフィックス照合
- `background/service_worker.js`: `TARGET_DOMAINS` と許可済み権限に合わせて `chrome.scripting.registerContentScripts` で content script を動的登録し、開いているタブにも注入する。アイコンのクリックで設定画面を開く
- `options/`: 設定画面。`chrome.permissions.request` はユーザー操作の直後（await より前）に呼ぶ必要がある
- `content/main.js`: content script（classic script）。`shared/*.js` は `import(chrome.runtime.getURL(...))` で読み込むため web_accessible_resources に含める
  - `WatchGuard` クラスが1秒ごとに計測する。タブが表示中、または動画が再生中のときに、前回の計測（どのタブからでも）からの差分を `WATCH_STATE` に加算するので、複数タブでも二重に数えない。`BREAK_RESET_MINUTES` 以上間が空くとリセットされる
  - 制限時間に達するとモーダルを表示し、`<video>` を pause、フルスクリーンを解除し、キー操作を遮断する。「視聴を継続する」で `WATCH_STATE` を0に戻し、`storage.onChanged` 経由で全タブのモーダルが閉じる
  - SPA（YouTube）の遷移には毎 tick の `location.href` の判定で追従する。YouTube の動画ページではチャンネルリンクのURLもホワイトリスト判定に使う
  - 再注入時は `net-defender:takeover` イベントで古いインスタンスを停止させる
- `content/content.html` / `content.css`: モーダルのテンプレート。Shadow DOM 内に描画するため、CSS はホストページに漏れない
# 使用している技術スタック・ライブラリ
- Vanilla JavaScript (ESModules)
- HTML / CSS
- Chrome Extensions API (Manifest V3 必須)
# ビルド・テスト・デプロイのコマンド
- ネイティブJSのためビルドコマンドは特になし。
- Claudeはファイルの変更を直接行い、ユーザーが手動でChromeの「拡張機能を再読み込み」してテストする。
# 命名規則やコーディングの取り決め
- JSの変数・関数名は `camelCase` を使用する
- 定数や `chrome.storage` のキー名は `UPPER_SNAKE_CASE` を使用する
- クラス名は `PascalCase` を使用する
# やるべきこと・やってはいけないこと（DO/DON’Tリスト）
- [DO] 状態管理（タイマーや設定値）には必ず `chrome.storage.local` または `chrome.storage.sync` を使用すること。
- [DO] バックグラウンド処理は Manifest V3 の Service Worker のライフサイクルに従うこと。永続的なバックグラウンドページを前提としないこと。
- [DO] モーダルの `z-index` は、YouTubeのフルスクリーン要素などを考慮して十分に高い値を設定すること（2147483647 など）。
- [DON'T] Manifest V2 のAPI（`chrome.browserAction` など）は絶対に使用しないこと。必ず `chrome.action` などのV3 APIを使うこと。
- [DON'T] 外部ライブラリ（jQueryやReactなど）はCDN含めて導入しないこと。Vanilla JSと標準のDOM APIで完結させること。