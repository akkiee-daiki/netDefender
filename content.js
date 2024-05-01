window.onload = function () {
  const bodyTag = document.getElementsByTagName("body")[0];
  let nfCloseBtnHiddenTime = 5000;
  let defenseSiteDomainList = [
    "example.com",
    "www.youtube.com",
    "example.com"
  ];

  let currentUri = new URL(window.location.href);
  let currentDomain = currentUri.hostname;


  // 許可されているYouTube等のURLを修正(playListなど(YouTube APIから取得))
  let allowedTitleAndUrlList = [
    // name: 'URL'
    {title: "【2分】胸の上部・中部・下部を鍛える大胸筋トレ【プッシュアップバー自重トレ】", url: "https://www.youtube.com/watch?v=ZI7URsS6VrA&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=10"},
    {title: "【たった1セット】誰でも必ず効く！大胸筋がパンパンになるやばいメニュー", url: "https://www.youtube.com/watch?v=bDz45AJjpEM&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=2"},
    {title: "【筋トレ】本気で腹筋を割りたい人必見！最強腹筋トレーニング", url: "https://www.youtube.com/watch?v=ZEucxLf5x-c&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=3"}, 
    {title: "【3分30秒】強靭な体を作り上げる体幹トレーニング8種目!!【インナーマッスル】", url: "https://www.youtube.com/watch?v=Vcb2NrOyMxY&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=4"},
    {title: "【こりゃやべぇww】腹筋バキバキ!!追い込みまくる地獄の4分間？？", url: "https://www.youtube.com/watch?v=nh7zNUq2MzM&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=5"}, 
    {title: "【ルーティーン】12分間の大臀筋(お尻)トレーニング！1週間で全身を鍛える！", url: "https://www.youtube.com/watch?v=2p7tHVT4pO8&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=6"},
    {title: "ダンベルを使った筋トレ｜おしり【公式】", url: "https://www.youtube.com/watch?v=wwIlWyuo9DA&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=7"},
    {title: "【7分】これ一回で十分！超高強度下半身トレーニング【筋トレ】", url: "https://www.youtube.com/watch?v=LOuh44mpQRg&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=11"},
    {title: "【静かにできるHIIT】スクワットだけ!!脂肪がガンガン燃える自宅トレ!!", url: "https://www.youtube.com/watch?v=iWlpOVUTjag&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=12"},
    {title: "肩全体に効きまくる！7分間ダンベルトレーニング", url: "https://www.youtube.com/watch?v=wpKUHfReW-0&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=13"},
    {title: "３分間で肩全体に効く！ダンベルだけで６種目の肩トレーニングをご一緒に【初心者向け】解説なし", url: "https://www.youtube.com/watch?v=f6CeYdgX02U&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=14"},
    {title: "肩の筋肉だけにめっちゃ効く！3分6種目のダンベルトレーニング", url: "https://www.youtube.com/watch?v=gty-g-9lwJY&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=15"},
    {title: "自宅で最強背中トレ！ダンベルだけで背中全体に効く３分間メニュー！広背筋、僧帽筋、大円筋全てに効きます。", url: "https://www.youtube.com/watch?v=_qZccBRFm6I&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=16"},
    {title: "【めちゃ効く】最速でシックスパックを作る腹筋トレーニング6分間！", url: "https://www.youtube.com/watch?v=yfF-Q2NhVnE&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=17"},
    {title: "【最強背中トレ】ダンベルだけで背中の全てが鍛えられる5種目のトレーニング！解説Ver.", url: "https://www.youtube.com/watch?v=_wkW3kqzyvU&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=18"},
    {title: "【4分】腹回りの脂肪を燃焼させる腹筋サーキット【腰と横腹も鍛える７種目】", url: "https://www.youtube.com/watch?v=ihsZ5mylHk0&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=19"},
    {title: "初心者が背中に筋肉を付けるためのベストメニュー【ダンベルだけ】", url: "https://www.youtube.com/watch?v=6M7MyNE5gZo&list=PLJqbpYzIaQTRdfs4wgRPFAD48pGljciTH&index=20"}
  ];

  var allowedUlElement = '<ul>';
  for (let index = 0; index < allowedTitleAndUrlList.length; index++) {
    allowedUlElement += '<li>';
    allowedUlElement += '<a href="' + allowedTitleAndUrlList[index]['url'] + '">' + allowedTitleAndUrlList[index]['title'] + '</a>'
    allowedUlElement += '</li>';
    if (index === 4) {
        break;
    }
  }
  allowedUlElement += '</ul>';

  bodyTag.innerHTML += `
    <style>
    .modal-container.active {
        opacity: 1;
        visibility: visible;
    }
    
    .modal-container {
        width: 100%;
        height: 80vh;
        position: fixed;
        top: 0;
        left: 0;
        text-align: center;
        background: rgba(0, 0, 0, 0.5);
        overflow: auto;
        opacity: 0;
        visibility: hidden;
        transition: .3s ease-out;
        z-index: 9;
    }
    
    .modal-container:before {
        content: "";
        display: inline-block;
        vertical-align: middle;
        height: 100%;
    }
    
    .modal-body {
        margin: 1em auto;
        position: relative;
        display: inline-block;
        vertical-align: middle;
        max-width: 1000px;
        width: 90%;
    }
    
    .modal-close {
        position: absolute;
        top: -30px;
        right: 0;
        font-size: 14px;
        color: #fff;
        background: rgba(0, 0, 0, 60%);
        padding: 4px 15px;
        cursor: pointer;
        border-radius: 5px 5px 0 0;
    }

    #js-netDefModalClose {
        display: none
    }
    
    @media only screen and (min-width: 641px) {
        a, a::before, a::after, button, button::before, button::after {
            -webkit-transition: 0.3s ease-in-out;
            transition: 0.3s ease-in-out;
        }
    }
    
    .modal-content {
        width: 80%
        background: #fff;
        border: 2px solid #000;
        text-align: left;
        padding: 30px;
        font-weight: bold;
    }
    
    .modal-content .en {
        font-family: "Inter";
        margin-right: 15px;
        display: block;
        text-align: center;
        color: #CA353B;
    }
    
    .modal-content .txt {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
    }
    
    p {
        margin: 0;
        padding: 0;
    }
    
    .modal-content .gray-bg {
        margin-top: 15px;
        background: #eee;
        border-radius: 10px;
        padding: 20px;
        text-align: left;
    }
    
    modal-content .gray-bg .txt {
        width: 80%;
        font-size: 12px;
    }
    
    .modal-content .txt {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
    }

    .modal-content .allowed-list {
        font-size: 14px
    }

    .btn-area {
        width: 80%
    }
    
    .btn-area>a {
        font-size: 16px;
        font-weight: bold;
        display: block;
        text-align: center;
        background: #CA353B;
        padding: 12px 25px;
        color: #fff;
        max-width: 260px;
        margin-top: 20px;
        margin-inline: auto;
        border: 2px solid #CA353B;
    }

    .modal-content>.inn, .gray-bg, .btn-area {
        width: 80%
    }
    </style>
        <div id="js-netDefModal" class="modal-container active">
            <div class="modal-body">
                <button type="button" id="js-netDefModalClose" class="modal-close">close</button><!-- 閉じるボタン -->
                <!-- モーダル内のコンテンツ -->
                <div class="modal-content">
                    <div class="inn">
                        <span class="en">WARNING</span>
                        <p class="txt">WARNING</p>
                    </div>
                    <div class="gray-bg">
                        <p class="txt">節度ある視聴をしてください。</p>
                    </div>
                    <!-- ここで許可されているYouTube動画へのリンク -->
                    <div class="btn-area">
                        <a href="">お問い合わせはこちらから</a>
                        ${allowedUlElement}
                    </div
                </div>
            </div>
        </div>
        <script src="content.js" defer></script>
    `;

  setTimeout(() => {
    // modalが表示されている場合のみに処理を限定
    const netDefModal = document.getElementById("js-netDefModal");
    const netDefModalCloseBtn = document.getElementById("js-netDefModalClose");

    netDefModalCloseBtn.style.display = 'inline-block';

    if (netDefModal !== null && netDefModalCloseBtn !== null) {
        netDefModalCloseBtn.addEventListener("click", () => {
          netDefModal.style.display = "none";
        });
      }
  }, nfCloseBtnHiddenTime);
  
};
