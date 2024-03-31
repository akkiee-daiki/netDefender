window.onload = function(){
    const bodyTag = document.getElementsByTagName("body")[0];
    bodyTag.innerHTML = `
    <style>
    .modal-container.active {
        opacity: 1;
        visibility: visible;
    }
    
    .modal-container {
        width: 100%;
        height: 100%;
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
        position: relative;
        display: inline-block;
        vertical-align: middle;
        max-width: 500px;
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
    
    @media only screen and (min-width: 641px) {
        a, a::before, a::after, button, button::before, button::after {
            -webkit-transition: 0.3s ease-in-out;
            transition: 0.3s ease-in-out;
        }
    }
    
    .modal-content {
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
        font-size: 12px;
    }
    
    .modal-content .txt {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
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
                    </div
                </div>
            </div>
        </div>
        <script src="content.js" defer></script>
    `;
}

// modalが表示されている場合のみに処理を限定
const netDefModal = document.getElementById("js-netDefModal");
const netDefModalCloseBtn = document.getElementById("js-netDefModalClose");
netDefModalCloseBtn.addEventListener("click", () => {
    netDefModal.style.display = "none";
});

