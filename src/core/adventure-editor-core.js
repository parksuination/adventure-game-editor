// adventure-editor.js

// 전역 상태 관리
class EditorState {
    constructor() {
        this.scenes = new Map();
        this.currentScene = null;
        this.selectedObject = null;
        this.isDragging = false;
        this.isPlaying = false;
    }
}

// 장면 클래스
class Scene {
    constructor(id, name = '새 장면') {
        this.id = id;
        this.name = name;
        this.objects = new Map();
        this.background = null;
        this.bgm = null;
        this.bgmAudio = null;
    }

    async setBackground(file) {
        try {
            const url = await FileManager.createObjectURL(file);
            this.background = url;
            return true;
        } catch (error) {
            console.error('배경 이미지 설정 실패:', error);
            return false;
        }
    }

    async setBGM(file) {
        try {
            const url = await FileManager.createObjectURL(file);
            this.bgm = url;
            return true;
        } catch (error) {
            console.error('BGM 설정 실패:', error);
            return false;
        }
    }

    playBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
        }
        if (this.bgm) {
            this.bgmAudio = new Audio(this.bgm);
            this.bgmAudio.loop = true;
            this.bgmAudio.play();
        }
    }

    stopBGM() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }
    }
}

// 게임 객체 클래스
class GameObject {
    constructor(id, name = '새 객체') {
        this.id = id;
        this.name = name;
        this.x = 0;
        this.y = 0;
        this.width = 100;
        this.height = 100;
        this.image = null;
        this.dialogs = [];
        this.currentDialogIndex = 0;
        this.clickAction = 'dialog';
        this.customAction = null;
    }

    async setImage(file) {
        try {
            const url = await FileManager.createObjectURL(file);
            this.image = url;
            return true;
        } catch (error) {
            console.error('객체 이미지 설정 실패:', error);
            return false;
        }
    }

    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getNextDialog() {
        if (this.dialogs.length === 0) return null;
        const dialog = this.dialogs[this.currentDialogIndex];
        this.currentDialogIndex = (this.currentDialogIndex + 1) % this.dialogs.length;
        return dialog;
    }
}

// 파일 관리자
class FileManager {
    static async createObjectURL(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    static async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}

// 캔버스 관리자
class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
    }

    setupCanvas() {
        // 캔버스 크기 설정
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    async drawScene(scene) {
        // 배경 지우기
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 배경 그리기
        if (scene.background) {
            try {
                const img = await FileManager.loadImage(scene.background);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            } catch (error) {
                console.error('배경 그리기 실패:', error);
            }
        }

        // 객체 그리기
        for (const obj of scene.objects.values()) {
            await this.drawObject(obj);
        }
    }

    async drawObject(obj) {
        if (obj.image) {
            try {
                const img = await FileManager.loadImage(obj.image);
                this.ctx.drawImage(img, obj.x, obj.y, obj.width, obj.height);
            } catch (error) {
                console.error('객체 그리기 실패:', error);
                // 에러 시 기본 도형으로 표시
                this.ctx.fillStyle = '#ff0000';
                this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            }
        } else {
            // 이미지가 없을 경우 기본 도형으로 표시
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
    }
}

// 편집기 초기화
class Editor {
    constructor() {
        this.state = new EditorState();
        this.canvas = new CanvasManager('gameCanvas');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 캔버스 이벤트
        this.canvas.canvas.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        this.canvas.canvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
        this.canvas.canvas.addEventListener('mouseup', this.handleCanvasMouseUp.bind(this));

        // UI 이벤트
        document.getElementById('addSceneBtn').addEventListener('click', this.addScene.bind(this));
        document.getElementById('addObjectBtn').addEventListener('click', this.addObject.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveProject.bind(this));
        document.getElementById('loadBtn').addEventListener('click', this.loadProject.bind(this));
        document.getElementById('previewBtn').addEventListener('click', this.togglePreview.bind(this));
    }

    // 이벤트 핸들러들은 다음 파일에서 계속...
}

// 편집기 인스턴스 생성
window.addEventListener('DOMContentLoaded', () => {
    window.editor = new Editor();
});
