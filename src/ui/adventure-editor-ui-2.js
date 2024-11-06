// adventure-editor-ui.js (continued)

// Editor 클래스에 추가될 메서드들 (계속)
class Editor {
    // 대화 시스템 관리
    setupDialogEditor(obj, container) {
        const dialogList = container.querySelector('.adv-dialog-list');
        const addBtn = container.querySelector('#addDialogBtn');

        const updateDialogList = () => {
            dialogList.innerHTML = '';
            obj.dialogs.forEach((dialog, index) => {
                const dialogOption = document.createElement('div');
                dialogOption.className = 'adv-dialog-option';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'adv-input';
                input.value = dialog;
                input.addEventListener('change', (e) => {
                    obj.dialogs[index] = e.target.value;
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', () => {
                    obj.dialogs.splice(index, 1);
                    updateDialogList();
                });

                dialogOption.appendChild(input);
                dialogOption.appendChild(deleteBtn);
                dialogList.appendChild(dialogOption);
            });
        };

        addBtn.addEventListener('click', () => {
            obj.dialogs.push('새로운 대화');
            updateDialogList();
        });

        updateDialogList();
    }

    // 상호작용 처리
    handleObjectInteraction(obj) {
        switch (obj.clickAction) {
            case 'dialog':
                this.showDialog(obj);
                break;
            case 'scene':
                if (obj.targetScene) {
                    this.selectScene(obj.targetScene);
                }
                break;
            case 'custom':
                if (typeof obj.customAction === 'function') {
                    obj.customAction();
                }
                break;
        }
    }

    // 대화창 관리
    showDialog(obj) {
        const dialogBox = document.getElementById('dialogBox');
        const dialogText = document.getElementById('dialogText');
        const nextBtn = document.getElementById('nextDialogBtn');

        const dialog = obj.getNextDialog();
        if (!dialog) return;

        dialogBox.classList.remove('adv-hidden');
        dialogText.textContent = dialog;

        const hideDialog = () => {
            dialogBox.classList.add('adv-hidden');
            nextBtn.removeEventListener('click', handleNext);
        };

        const handleNext = () => {
            const nextDialog = obj.getNextDialog();
            if (nextDialog) {
                dialogText.textContent = nextDialog;
            } else {
                hideDialog();
            }
        };

        nextBtn.addEventListener('click', handleNext);
    }

    // 미리보기 모드
    togglePreview() {
        this.state.isPlaying = !this.state.isPlaying;
        const previewBtn = document.getElementById('previewBtn');
        
        if (this.state.isPlaying) {
            previewBtn.textContent = '편집 모드';
            this.enterPreviewMode();
        } else {
            previewBtn.textContent = '미리보기';
            this.exitPreviewMode();
        }
    }

    enterPreviewMode() {
        document.body.classList.add('adv-preview-mode');
        // 에디터 UI 숨기기
        document.querySelectorAll('.adv-sidebar').forEach(sidebar => {
            sidebar.classList.add('adv-hidden');
        });
    }

    exitPreviewMode() {
        document.body.classList.remove('adv-preview-mode');
        // 에디터 UI 표시
        document.querySelectorAll('.adv-sidebar').forEach(sidebar => {
            sidebar.classList.remove('adv-hidden');
        });
    }

    // 저장/불러오기
    async saveProject() {
        try {
            const projectData = {
                scenes: Array.from(this.state.scenes.entries()),
                currentSceneId: this.state.currentScene?.id
            };

            const blob = new Blob([JSON.stringify(projectData)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'adventure-game.json';
            a.click();
            
            URL.revokeObjectURL(url);
            this.showModal('저장 완료', '프로젝트가 저장되었습니다.');
        } catch (error) {
            this.showModal('저장 실패', '프로젝트 저장 중 오류가 발생했습니다.');
            console.error('저장 실패:', error);
        }
    }

    async loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', async (e) => {
            try {
                const file = e.target.files[0];
                const text = await file.text();
                const projectData = JSON.parse(text);
                
                this.state.scenes = new Map(projectData.scenes);
                if (projectData.currentSceneId) {
                    this.selectScene(projectData.currentSceneId);
                }
                
                this.updateSceneList();
                this.showModal('불러오기 완료', '프로젝트를 불러왔습니다.');
            } catch (error) {
                this.showModal('불러오기 실패', '프로젝트를 불러오는 중 오류가 발생했습니다.');
                console.error('불러오기 실패:', error);
            }
        });
        
        input.click();
    }

    // 모달 다이얼로그
    showModal(title, message) {
        const template = document.getElementById('modalTemplate');
        const modal = template.content.cloneNode(true);
        
        const modalElement = modal.querySelector('.adv-modal');
        const titleElement = modal.querySelector('.adv-modal-title');
        const bodyElement = modal.querySelector('.adv-modal-body');
        
        titleElement.textContent = title;
        bodyElement.textContent = message;
        
        const closeModal = () => modalElement.remove();
        
        modal.querySelector('.adv-modal-close').addEventListener('click', closeModal);
        modal.querySelector('[data-action="confirm"]').addEventListener('click', closeModal);
        modal.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
        
        document.body.appendChild(modal);
    }

    // 미디어 프리뷰 업데이트
    updatePreview(type, url) {
        const preview = document.querySelector(`[data-preview="${type}"]`);
        if (!preview) return;

        preview.classList.remove('adv-hidden');
        
        if (type === 'bgm') {
            const audio = preview.querySelector('audio');
            audio.src = url;
        } else {
            preview.src = url;
        }
    }
}

// 유틸리티 함수들
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
