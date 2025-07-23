// 高度なスクロールアニメーションとエフェクト - 完全統合版
document.addEventListener('DOMContentLoaded', function() {
    // アニメーション管理用変数
    let animatedCards = 0;
    let floatingElementsCount = 0;
    let conceptAnimated = false;

    // ぷらっとくん設定をHTMLから読み込む関数（ビューポート基準）
    function loadPurattokunsettings() {
        const configElement = document.getElementById('purattokun-config');
        
        // デフォルト設定（HTMLに設定がない場合のフォールバック・ビューポート基準）
        const defaultConfig = {
            x: 18,      // 左から18vw（画面幅の18%）
            y: 20,      // 上から20vh（画面高さの20%）
            scale: 0.75,
            fadeDelay: 1500,
            fadeDuration: 2000
        };

        if (!configElement) {
            console.warn('⚠️ purattokun-config not found, using default settings');
            return defaultConfig;
        }

        // HTMLから設定を読み取り（エラー耐性付き）
        const config = {
            x: parseInt(configElement.dataset.x) || defaultConfig.x,
            y: parseInt(configElement.dataset.y) || defaultConfig.y,
            scale: parseFloat(configElement.dataset.scale) || defaultConfig.scale,
            fadeDelay: parseInt(configElement.dataset.fadeDelay) || defaultConfig.fadeDelay,
            fadeDuration: parseInt(configElement.dataset.fadeDuration) || defaultConfig.fadeDuration
        };

        console.log('📋 Purattokun settings loaded from HTML:', config);
        return config;
    }

    // スクロール連動アニメーション設定読み込み完了

    // ヒーローセクションのパララックス効果
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.querySelector('.hero-image');
    
    // スクロール連動アニメーションの設定
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const animationObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('要素が画面に入りました:', entry.target.className);
                
                if (entry.target.classList.contains('service-card')) {
                    // サービスカードは少し遅らせて順次表示
                    const cards = document.querySelectorAll('.service-card');
                    const index = Array.from(cards).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.classList.add('animate');
                        animatedCards++;
                        console.log(`サービスカード${index + 1}がアニメーション開始`);
                        (window.pageYOffset);
                    }, index * 150);
                } else if (entry.target.classList.contains('concept-text') || 
                          entry.target.classList.contains('concept-image')) {
                    // コンセプト要素
                    entry.target.classList.add('animate');
                    conceptAnimated = true;
                    console.log('コンセプト要素がアニメーション開始:', entry.target.className);
                    (window.pageYOffset);
                } else {
                    entry.target.classList.add('animate');
                    console.log('要素がアニメーション開始:', entry.target.className);
                }
            }
        });
    }, observerOptions);
    
    // アニメーション対象要素の監視
    const serviceCards = document.querySelectorAll('.service-card');
    const conceptText = document.querySelector('.concept-text');
    const conceptImage = document.querySelector('.concept-image');
    
    // 各要素を監視対象に追加
    serviceCards.forEach((card, index) => {
        animationObserver.observe(card);
        console.log('サービスカードを監視対象に追加:', card);
        
        // サービスカードのインタラクション効果
        card.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, #fff 0%, #fff5f5 100%)';
            createSparkles(this);
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.background = '#fff';
        });
        
        // アニメーション遅延の設定
        card.style.animationDelay = `${index * 0.1}s`;
    });

    if (conceptText) {
        animationObserver.observe(conceptText);
        console.log('コンセプトテキストを監視対象に追加');
    }
    if (conceptImage) {
        animationObserver.observe(conceptImage);
        console.log('コンセプト画像を監視対象に追加');
    }
    
    // キラキラエフェクト関数
    function createSparkles(element) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const sparkle = document.createElement('div');
                sparkle.textContent = '✨';
                sparkle.style.cssText = `
                    position: absolute;
                    font-size: 1rem;
                    pointer-events: none;
                    z-index: 100;
                    left: ${Math.random() * element.offsetWidth}px;
                    top: ${Math.random() * element.offsetHeight}px;
                    opacity: 1;
                    transition: all 1s ease-out;
                `;
                
                element.style.position = 'relative';
                element.appendChild(sparkle);
                
                setTimeout(() => {
                    sparkle.style.transform = 'translateY(-20px) scale(0)';
                    sparkle.style.opacity = '0';
                }, 50);
                
                setTimeout(() => {
                    if (element.contains(sparkle)) {
                        element.removeChild(sparkle);
                    }
                }, 1050);
            }, i * 200);
        }
    }
    
    // 高度なスクロールエフェクト
    let ticking = false;
    
    function updateOnScroll() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // スクロール位置処理
        // scrolled position: updated
        
        // ヒーローセクションのパララックス効果
        if (hero) {
            hero.style.transform = `translateY(${rate * 0.3}px)`;
        }
        
        // ヘッダーの動的背景
        const navbar = document.querySelector('.navbar');
        if (scrolled > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#fff';
            navbar.style.backdropFilter = 'none';
        }
        
        // スクロールに基づく浮遊要素の生成
        createFloatingElements(scrolled);
        
        ticking = false;
    }
    
    function createFloatingElements(scrollY) {
        if (Math.random() > 0.96 && scrollY > 200) {
            const elements = ['🐾', '🐱', '🏠', '❤️'];
            const element = elements[Math.floor(Math.random() * elements.length)];
            
            floatingElementsCount++;
            console.log('浮遊要素を作成:', element, '（合計:', floatingElementsCount, '個）');
            
            const floatingEl = document.createElement('div');
            floatingEl.textContent = element;
            floatingEl.style.cssText = `
                position: fixed;
                right: -50px;
                top: ${Math.random() * (window.innerHeight - 100)}px;
                font-size: ${1.5 + Math.random() * 1.5}rem;
                opacity: 0.8;
                pointer-events: none;
                z-index: 999;
                transition: all 5s ease-out;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            `;
            
            document.body.appendChild(floatingEl);
            
            setTimeout(() => {
                floatingEl.style.right = (window.innerWidth + 100) + 'px';
                floatingEl.style.transform = 'rotate(360deg) scale(1.2)';
                floatingEl.style.opacity = '0';
            }, 100);
            
            setTimeout(() => {
                if (document.body.contains(floatingEl)) {
                    document.body.removeChild(floatingEl);
                }
            }, 5100);
        }
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateOnScroll);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);

    // スムーズスクロール機能
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // CTAボタンのスクロール機能
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            const servicesSection = document.querySelector('#services');
            if (servicesSection) {
                const offsetTop = servicesSection.offsetTop - 70;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // お問い合わせフォームの処理
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const message = this.querySelector('textarea').value;
            
            // 簡単なバリデーション
            if (!name || !email || !message) {
                alert('すべての項目を入力してください。');
                return;
            }
            
            if (!isValidEmail(email)) {
                alert('有効なメールアドレスを入力してください。');
                return;
            }
            
            // フォーム送信のシミュレーション
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.textContent = '送信中...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                alert('お問い合わせありがとうございます。\n2営業日以内にご返信いたします。');
                this.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 1500);
        });
    }

    // マウスカーソルトレイル効果
    let mouseTrail = [];
    const maxTrailLength = 10;
    
    document.addEventListener('mousemove', function(e) {
        mouseTrail.push({x: e.clientX, y: e.clientY, time: Date.now()});
        
        if (mouseTrail.length > maxTrailLength) {
            mouseTrail.shift();
        }
        
        // たまにカーソル位置に足跡を作成
        if (Math.random() > 0.992) {
            createPawPrint(e.clientX, e.clientY);
        }
    });
    
    function createPawPrint(x, y) {
        const paw = document.createElement('div');
        paw.textContent = '🐾';
        paw.style.cssText = `
            position: fixed;
            left: ${x - 15}px;
            top: ${y - 15}px;
            font-size: 1.2rem;
            pointer-events: none;
            z-index: 1000;
            opacity: 0.7;
            transition: all 2s ease-out;
        `;
        
        document.body.appendChild(paw);
        
        setTimeout(() => {
            paw.style.opacity = '0';
            paw.style.transform = 'scale(0.5)';
        }, 100);
        
        setTimeout(() => {
            if (document.body.contains(paw)) {
                document.body.removeChild(paw);
            }
        }, 2100);
    }
    
    // ページロード時のアニメーション
    setTimeout(() => {
        if (heroContent) {
            heroContent.style.opacity = '0';
            heroContent.style.transform = 'translateY(30px)';
            heroContent.style.transition = 'all 1s ease-out';
            
            setTimeout(() => {
                heroContent.style.opacity = '1';
                heroContent.style.transform = 'translateY(0)';
            }, 200);
        }
        
        if (heroImage) {
            heroImage.style.opacity = '0';
            heroImage.style.transform = 'translateX(30px) scale(0.9)';
            heroImage.style.transition = 'all 1s ease-out 0.3s';
            
            setTimeout(() => {
                heroImage.style.opacity = '1';
                heroImage.style.transform = 'translateX(0) scale(1)';
            }, 500);
        }
    }, 100);
    
    // 隠し機能：トリプルクリックで猫パレード
    let clickCount = 0;
    let clickTimer;
    
    document.addEventListener('click', function(e) {
        clickCount++;
        
        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 1000);
        } else if (clickCount === 3) {
            clearTimeout(clickTimer);
            clickCount = 0;
            
            // 猫パレード開始！
            catParade();
        }
    });
    
    function catParade() {
        const cats = ['🐱', '😺', '😸', '😹', '😻', '😽', '🙀', '😿', '😾'];
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const cat = document.createElement('div');
                cat.textContent = cats[Math.floor(Math.random() * cats.length)];
                cat.style.cssText = `
                    position: fixed;
                    left: -50px;
                    top: ${Math.random() * (window.innerHeight - 100) + 50}px;
                    font-size: 2rem;
                    pointer-events: none;
                    z-index: 1001;
                    transition: all 3s ease-out;
                `;
                
                document.body.appendChild(cat);
                
                setTimeout(() => {
                    cat.style.left = window.innerWidth + 50 + 'px';
                    cat.style.transform = 'rotate(360deg)';
                }, 100);
                
                setTimeout(() => {
                    if (document.body.contains(cat)) {
                        document.body.removeChild(cat);
                    }
                }, 3100);
            }, i * 300);
        }
    }

    // Spine統合の初期化
    console.log('🔧 Spine統合システム初期化中...');
    
    if (window.spineManager) {
        spineManager.init().then(success => {
            if (success) {
                console.log('🎯 Spine WebGL ready - setting up Purattokun with 4.1.24 data');
                console.log('✅ WebGL準備完了');
                
                const heroSection = document.querySelector('.hero');
                if (heroSection) {
                    console.log('🏔️ Hero section found, loading Spine 4.1.24 Purattokun data');
                    console.log('📁 Path: assets/spine/characters/purattokun/');
                    console.log('🆕 Using Spine 4.1.24 data (physics-free)');
                    
                    console.log('🐱 ぷらっとくん読み込み中...');
                    
                    // プラットくんを読み込み（お店の裏側から出現演出付き）
                    spineManager.loadCharacter('purattokun', 'assets/spine/characters/purattokun/', heroSection);
                    
                    console.log('🎭 Setting up Purattokun with fade-in entrance (HTML-configurable)');
                    
                    // HTMLから設定を読み込み
                    const entranceConfig = loadPurattokunsettings();
                    
                    // 最初から最終位置に配置（透明状態）
                    spineManager.setPosition('purattokun', entranceConfig.x, entranceConfig.y, entranceConfig.scale);
                    
                    console.log(`📍 Viewport position: (${entranceConfig.x}vw, ${entranceConfig.y}vh) scale: ${entranceConfig.scale}`);
                    
                    // キャラクター配置完了
                    console.log('📍 ぷらっとくん(4.1.24)配置完了');
                    
                    // 透明度でのフェードイン演出開始
                    setTimeout(() => {
                        console.log('🎭 Starting fade-in entrance for Purattokun (no movement)');
                        console.log('✨ ぷらっとくん出現中...');
                        
                        // 透明度のみのフェードイン演出
                        spineManager.fadeInCharacter('purattokun', entranceConfig.fadeDuration);
                        
                        // フェードインと同時にSpineアニメーション開始
                        setTimeout(() => {
                            console.log('🎬 Starting Purattokun Spine sequence: syutugen → taiki loop');
                            console.log('🔧 Using physics-free Spine 4.1.24 data');
                            spineManager.playSequenceAnimation('purattokun');
                            console.log('🎬 ぷらっとくんアニメーション実行中');
                            console.log('✨ Purattokun fade-in complete with sequence animation');
                            
                            // クリック機能を有効化（アニメーション開始後）
                            setTimeout(() => {
                                spineManager.addClickInteraction('purattokun');
                                console.log('🖱️ Purattokun click interaction enabled');
                            }, 1000); // さらに1秒後にクリック機能有効化
                        }, 300); // 0.3秒後にSpineアニメーション開始
                        
                    }, entranceConfig.fadeDelay); // 設定した遅延後に演出開始

                    // デモキャラクターは無効化中（ファイルなし）
                    // spineManager.loadCharacter('cat1', 'assets/spine/characters/demo/', heroSection);
                    // spineManager.setPosition('cat1', 150, 250);
                    // 
                    // spineManager.loadCharacter('cat2', 'assets/spine/characters/demo/', heroSection);
                    // spineManager.setPosition('cat2', 450, 200);
                    // 
                    // // 5秒後にデモキャラクターもアニメーション開始
                    // setTimeout(() => {
                    //     spineManager.playAnimation('cat1', 'idle', true);
                    //     spineManager.playAnimation('cat2', 'idle', true);
                    // }, 5000);
                }
            } else {
                console.log('⏳ Spine WebGL not ready, using placeholder mode');
                console.log('📝 Spine読み込み失敗 - プレースホルダーモード');
            }
        });
    } else {
        console.log('❌ spineManager not found');
        console.log('❌ SpineManager読み込み失敗');
    }

    // 初期化完了ログと状況表示
    console.log('🐱 ネコヤサイト - スクロール連動機能初期化完了');
    console.log('- サービスカード:', serviceCards.length, '個を監視');
    console.log('- コンセプト要素:', conceptText ? 'あり' : 'なし', conceptImage ? 'あり' : 'なし');
    console.log('- Spine統合:', window.spineManager ? '有効' : '無効');
    console.log('コンソールで動作確認できます');
    console.log('');
    console.log('🎭 ぷらっとくん設定ガイド (HTML制御対応):');
    console.log('✅ 設定はindex.html内の #purattokun-config で変更可能');
    console.log('');
    console.log('📍 位置設定 (data-x, data-y):');
    console.log('  ・お店の入口付近: x=200');
    console.log('  ・お店付近: x=220 (推奨・吹き出し対応)');
    console.log('  ・道路側: x=100');
    console.log('  ・上の方: y=150, 地面: y=180, 下: y=220');
    console.log('');
    console.log('🎬 演出設定 (data-fade-delay, data-fade-duration):');
    console.log('  ・すぐ出現: delay=500, ゆっくり: delay=3000');
    console.log('  ・早いフェード: duration=1000, ゆっくり: duration=3000');
    console.log('');
    console.log('📏 サイズ設定 (data-scale):');
    console.log('  ・大きめ: 1.0, 普通: 0.75, 小さめ: 0.6');
    console.log('');
    console.log('🛠️ 変更方法: index.htmlのdata-*属性の数値を変更してリロード');
    
    (0);
});

// メールアドレス検証のヘルパー関数
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}