// adventure-editor-ui.js

// Editor 클래스에 추가될 메서드들
class Editor {
    // 캔버스 이벤트 핸들러
    handleCanvasMouseDown(e) {
        if (!this.state.currentScene) return;

        const rect = this.canvas.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 객체 선택 또는 드래그 시작
        for (const obj of Array.from(this.state.currentScene.objects.values()).reverse()) {
            if (obj.isPointInside(x, y)) {
                this.state.selectedObject = obj;
                this.state.isDragging = true;
                this.showObjectProperties(obj);
                
                if (!this.state.isPlaying) {
                    return;
                }
                
                // 플레이 모드에서는 객체 상호작용 처리
                this.handleObjectInteraction(obj);
                break;
            }
        }
    }

    handleCanvasMouseMove(e) {
        if (!this.state.isDragging || !this.state.selectedObject || this.state.isPlaying) return;

        const rect = this.canvas.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.state.selectedObject.x = x - this.state.selectedObject.width / 2;
        this.state.selectedObject.y = y - this.state.selectedObject.height / 2;

        this.canvas.drawScene(this.state.currentScene);
        this.updateObjectProperties(this.state.selectedObject);
    }

    handleCanvasMouseUp() {
        this.state.isDragging = false;
    }

    // UI 이벤트 핸들러
    addScene() {
        const id = `scene_${Date.now()}`;
        const scene = new Scene(id);
        this.state.scenes.set(id, scene);
        this.updateSceneList();
        this.selectScene(id);
    }

    addObject() {
        if (!this.state.currentScene) return;

        const id = `object_${Date.now()}`;
        const obj = new GameObject(id);
        this.state.currentScene.objects.set(id, obj);
        this.updateObjectList();
        this.selectObject(obj);
        this.canvas.drawScene(this.state.currentScene);
    }

    selectScene(sceneId) {
        const scene = this.state.scenes.get(sceneId);
        if (!scene) return;

        if (this.state.currentScene) {
            this.state.currentScene.stopBGM();
        }

        this.state.currentScene = scene;
        this.state.selectedObject = null;
        this.canvas.drawScene(scene);
        scene.playBGM();
        this.updateSceneList();
        this.showSceneProperties(scene);
    }

    selectObject(obj) {
        this.state.selectedObject = obj;
        this.showObjectProperties(obj);
        this.updateObjectList();
    }

    // UI 업데이트
    updateSceneList() {
        const container = document.getElementById('sceneList');
        container.innerHTML = '';

        for (const [id, scene] of this.state.scenes) {
            const item = document.createElement('li');
            item.className = 'adv-list-item';
            if (this.state.currentScene === scene) {
                item.classList.add('active');
            }
            
            item.textContent = scene.name;
            item.addEventListener('click', () => this.selectScene(id));
            container.appendChild(item);
        }
    }

    updateObjectList() {
        const container = document.getElementById('objectList');
        container.innerHTML = '';

        if (!this.state.currentScene) return;

        for (const [id, obj] of this.state.currentScene.objects) {
            const item = document.createElement('li');
            item.className = 'adv-list-item';
            if (this.state.selectedObject === obj) {
                item.classList.add('active');
            }
            
            item.textContent = obj.name;
            item.addEventListener('click', () => this.selectObject(obj));
            container.appendChild(item);
        }
    }

    showSceneProperties(scene) {
        const template = document.getElementById('scenePropertiesTemplate');
        const editor = document.getElementById('propertyEditor');
        editor.innerHTML = '';
        
        const content = template.content.cloneNode(true);
        editor.appendChild(content);

        // 속성 바인딩
        const nameInput = editor.querySelector('[data-property="name"]');
        nameInput.value = scene.name;
        nameInput.addEventListener('change', (e) => {
            scene.name = e.target.value;
            this.updateSceneList();
        });

        // 파일 업로드 핸들러
        const bgInput = editor.querySelector('[data-property="background"]');
        bgInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await scene.setBackground(e.target.files[0]);
                this.canvas.drawScene(scene);
                this.updatePreview('background', scene.background);
            }
        });

        const bgmInput = editor.querySelector('[data-property="bgm"]');
        bgmInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await scene.setBGM(e.target.files[0]);
                this.updatePreview('bgm', scene.bgm);
            }
        });
    }

    showObjectProperties(obj) {
        const template = document.getElementById('objectPropertiesTemplate');
        const editor = document.getElementById('propertyEditor');
        editor.innerHTML = '';
        
        const content = template.content.cloneNode(true);
        editor.appendChild(content);

        // 속성 바인딩
        this.bindObjectProperties(obj, editor);
        this.setupDialogEditor(obj, editor);
    }

    bindObjectProperties(obj, container) {
        // 기본 속성 바인딩
        const properties = ['name', 'x', 'y', 'width', 'height'];
        properties.forEach(prop => {
            const input = container.querySelector(`[data-property="${prop}"]`);
            if (!input) return;

            input.value = obj[prop];
            input.addEventListener('change', (e) => {
                obj[prop] = prop === 'name' ? e.target.value : Number(e.target.value);
                if (prop === 'name') this.updateObjectList();
                this.canvas.drawScene(this.state.currentScene);
            });
        });

        // 이미지 업로드 핸들러
        const imageInput = container.querySelector('[data-property="image"]');
        imageInput.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                await obj.setImage(e.target.files[0]);
                this.canvas.drawScene(this.state.currentScene);
                this.updatePreview('image', obj.image);
            }
        });

        // 클릭 액션 핸들러
        const actionSelect = container.querySelector('[data-property="clickAction"]');
        if (actionSelect) {
            actionSelect.value = obj.clickAction;
            actionSelect.addEventListener('change', (e) => {
                obj.clickAction = e.target.value;
            });
        }
    }

    setupDialogEditor(obj, container) {
        const dialogList = container.querySelector('.adv-dialog-list');
        const addBtn = container