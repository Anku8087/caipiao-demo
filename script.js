window.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 第一部分：声明全局变量
    // ==========================================
    const gameTypeSelect = document.getElementById('gameType');
    const rollBtn = document.getElementById('rollBtn');
    const resultDiv = document.getElementById('result');
    const toast = document.getElementById('toast');
    const ballCountSelect = document.getElementById('ballCount');

    const confirmOverlay = document.getElementById('confirmOverlay');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOk');
    const confirmCancelBtn = document.getElementById('confirmCancel');

    const ballElements = [];
    let rollTimer = null;
    let isRolling = false;
    let toastTimer = null;
    let previousGameType = '3d';
    let pendingConfirmResolve = null;


    function showToast(message, duration = 1000) {
        if (toastTimer) clearTimeout(toastTimer);

        toast.textContent = message;
        toast.classList.add('show');

        toastTimer = setTimeout(() => {
            toast.classList.remove('show')
        }, duration);
    }


    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    function pickUnique(arr, n) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
    }



    function getGridColumns(count) {
        if (count === 20) return window.innerWidth <= 600 ? 5 : 10;
        if (count >= 8) return Math.ceil(count / 2);
        return count;
    }

    function showConfirmDialog(message) {
        return new Promise((resolve) => {
            confirmMessage.textContent = message;
            confirmOverlay.classList.add('show');
            pendingConfirmResolve = resolve;
        });
    }


    function resolveConfirm(choice) {
        if (pendingConfirmResolve) {
            pendingConfirmResolve(choice);
            pendingConfirmResolve = null;
        }
        confirmOverlay.classList.remove('show');
    }

    // 工具函数：生成 3D 的最终号码
    function generate3DConfigs() {
        return Array.from({ length: 3 }, () => {
            const digit = Math.floor(Math.random() * 10);
            return {
                value: String(digit),
                color: 'red',
                min: 0,
                max: 9
            };
        });
    }

    function generateLottoConfigs() {
        const frontPool = Array.from({ length: 35 }, (_, i) => i + 1);
        const backPool = Array.from({ length: 12 }, (_, i) => i + 1);

        const fronts = pickUnique(frontPool, 5).sort((a, b) => a - b);
        const backs = pickUnique(backPool, 2).sort((a, b) => a - b);

        const frontConfigs = fronts.map(num => ({
            value: String(num).padStart(2, '0'),
            color: 'red',
            min: 1,
            max: 35
        }));

        // 后区蓝球配置
        const backConfigs = backs.map(num => ({
            value: String(num).padStart(2, '0'),
            color: 'blue',
            min: 1,
            max: 12
        }));

        // 合并两个数组返回
        return [...frontConfigs, ...backConfigs];
    }

    function generateK8Configs(count) {
        const pool = Array.from({ length: 80 }, (_, i) => i + 1);
        const selected = pickUnique(pool, count).sort((a, b) => a - b);

        return selected.map(num => ({
            value: String(num).padStart(2, '0'),
            color: 'red',
            min: 1,
            max: 80
        }));
    }


    function applyLayout(configs) {
        resultDiv.style.display = '';
        resultDiv.style.gridTemplateColumns = '';
        resultDiv.style.justifyContent = '';
        resultDiv.style.alignItems = '';
        resultDiv.style.gap = '';
        resultDiv.style.justifyItems = '';

        if (gameTypeSelect.value === 'k8' && configs.length >= 8) {
            const columns = getGridColumns(configs.length);

            resultDiv.style.display = 'grid';
            resultDiv.style.gridTemplateColumns = `repeat(${columns},1fr)`;
            resultDiv.style.justifyItems = 'center';
            resultDiv.style.alignItems = 'center';
            resultDiv.style.gap = '15px';
        }
    }

    function createBalls(configs) {
        resultDiv.innerHTML = '';
        ballElements.length = 0;

        configs.forEach((cfg, index) => {
            const ball = document.createElement('span');
            ball.classList.add('ball', cfg.color);

            if (gameTypeSelect.value === 'k8' && configs.length === 9) {
                ball.style.gridRow = index < 4 ? '1' : '2';
            }

            const initNum = getRandomNum(cfg.min, cfg.max);
            ball.textContent = String(initNum).padStart(cfg.value.length, '0');
            resultDiv.appendChild(ball);
            ballElements.push(ball);
        });
    }


    // 操作函数：启动滚动动画
    // 它调用 createBalls 来创建初始球，然后用定时器让数字跳动
    function startRollAnimation(configs, onComplete) {
        // 如果上一次的定时器还在，先关掉
        if (rollTimer) {
            clearInterval(rollTimer);
        }

        // 先创建球（初始显示随机数）
        createBalls(configs);

        // 启动定时器，让数字快速跳动
        rollTimer = setInterval(() => {
            ballElements.forEach((ball, index) => {
                if (ball.classList.contains('stopped')) return;

                const cfg = configs[index];
                const randomNum = getRandomNum(cfg.min, cfg.max);
                ball.textContent = String(randomNum).padStart(cfg.value.length, '0');
            });
        }, 50);

        // 随机总时长：1.5 到 2.5 秒
        const totalDuration = 500 + Math.random() * 500;

        // 每个球依次停下，间隔 300ms
        configs.forEach((cfg, index) => {
            const stopDelay = totalDuration + index * 300;
            setTimeout(() => {
                ballElements[index].textContent = cfg.value;
                ballElements[index].classList.add('stopped');

                // 最后一个球停下时，关掉定时器
                if (index === configs.length - 1) {
                    clearInterval(rollTimer);
                    isRolling = false;
                    if (onComplete) onComplete();
                }
            }, stopDelay);
        });
    }

    function doRoll(configs) {
        applyLayout(configs);
        startRollAnimation(configs, () => {
            if (gameTypeSelect.value === 'k8') {
                ballCountSelect.value = '';
            }
        });
    }


    rollBtn.addEventListener('click', () => {
        if (isRolling) {
            showToast('请勿频繁点击');
            return;
        }

        isRolling = true;

        const gameType = gameTypeSelect.value;

        let configs = [];

        if (gameType === '3d') {
            configs = generate3DConfigs();
        } else if (gameType === 'lotto') {
            configs = generateLottoConfigs();
        }
        // 后续其他玩法在这里加 else if

        doRoll(configs);
    });

    gameTypeSelect.addEventListener('change', () => {
        if (isRolling) {
            showToast('请等待本次摇号结束');
            gameTypeSelect.value = previousGameType;
            return;
        }

        const type = gameTypeSelect.value;
        if (type === 'k8') {
            rollBtn.classList.add('hidden');
            ballCountSelect.classList.remove('hidden');
            ballCountSelect.value = '';
        } else {
            rollBtn.classList.remove('hidden');
            ballCountSelect.classList.add('hidden');
            resultDiv.style.display = '';
            resultDiv.style.gridTemplateColumns = '';
            resultDiv.style.justifyContent = '';
            resultDiv.style.alignItems = '';
            resultDiv.style.gap = '';
            resultDiv.style.justifyItems = '';
        }
        previousGameType = type;
    });

    ballCountSelect.addEventListener('change', async () => {
        if (isRolling) {
            showToast('请等待本次摇号结束');
            ballCountSelect.value = '';
            return;
        }
        const count = parseInt(ballCountSelect.value, 10);
        if (isNaN(count)) return;


        const message = count === 20 ? '确认选择摇出20个开奖号码吗？' : `确认选择摇${count}个号码吗？`;


        const confirmed = await showConfirmDialog(message);

        if (confirmed) {
            isRolling = true;
            const configs = generateK8Configs(count);
            doRoll(configs);
        } else {
            ballCountSelect.value = '';
        }

    });

    confirmOkBtn.addEventListener('click', () => resolveConfirm(true));
    confirmCancelBtn.addEventListener('click', () => resolveConfirm(false));

    confirmOverlay.addEventListener('click', (e) => {
        if (e.target === confirmOverlay) {
            resolveConfirm(false);
        }
    });

});