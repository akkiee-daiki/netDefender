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
- `manifest.json`: 対象サイトを変えるときは `host_permissions`・`content_scripts.matches`・`web_accessible_resources.matches` を揃えて更新する（現在は example.com のみ）
- `shared/constants.js`: ESModule。`chrome.storage.sync` のキー（`TIME_LIMIT_MINUTES` / `TARGET_DOMAINS` / `WHITELIST`）、デフォルト値、`loadSettings()` / `saveSettings()`
- `background/service_worker.js`: アイコンのクリックで設定画面を開く
- `options/`: 設定画面（Optionsページ）。`shared/constants.js` を static import する
- `content/main.js`: content script（classic script）。`shared/constants.js` は `import(chrome.runtime.getURL(...))` で読み込むため、web_accessible_resources に含める必要がある。`WatchGuard` クラスが表示中の経過時間を計測し、制限時間に達するとモーダルを表示する
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