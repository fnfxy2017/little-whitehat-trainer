// components/intro-dialog/intro-dialog.js
// 介绍对白 Component · DOM 渲染 · 隔离的 setData 域
// 来源:wechat-miniprogram-skill/references/dialog-system.md

const SPEAKER_LABELS = {
  wa: '婉婉',
  xiaotian: '小天',
  system: '小天',     // main 分支早期 JSON 用 system 表示小天
  captain: '队长',
  mom: '妈妈',
  brother: '弟弟',
  raddy: '小红',
  lime: '小绿'
};

const SPEAKER_AVATAR = {
  wa: '婉',
  xiaotian: '天',
  system: '天',
  captain: '队',
  mom: '妈',
  brother: '弟',
  raddy: '红',
  lime: '绿'
};

Component({
  options: { multipleSlots: false },

  properties: {
    dialogs: { type: Array, value: [] },
    autoStart: { type: Boolean, value: true }
  },

  data: {
    visible: false,
    currentIndex: 0,
    currentText: '',
    typing: false,
    isLast: false,
    currentSpeaker: 'wa',
    speakerName: '婉婉',
    avatarLabel: '婉'
  },

  observers: {
    'dialogs': function (dialogs) {
      // 关卡切换时 dialogs 数组重新赋值,自动重启
      if (this.data.autoStart && dialogs && dialogs.length > 0) {
        this.start();
      } else if (!dialogs || dialogs.length === 0) {
        this.setData({ visible: false });
      }
    }
  },

  lifetimes: {
    detached() {
      if (this._typeTimer) {
        clearInterval(this._typeTimer);
        this._typeTimer = null;
      }
    }
  },

  methods: {
    start() {
      if (this._typeTimer) clearInterval(this._typeTimer);
      this.setData({
        visible: true,
        currentIndex: 0,
        isLast: this.properties.dialogs.length <= 1
      });
      this._showCurrent();
    },

    _showCurrent() {
      const idx = this.data.currentIndex;
      const item = this.properties.dialogs[idx];
      if (!item) {
        this.finish();
        return;
      }

      // 字数校验(开发期警告)
      if (item.text && item.text.length > 20) {
        console.warn(`[intro-dialog] 对白超过 20 字: "${item.text}"`);
      }

      const speaker = item.speaker || 'wa';
      this.setData({
        currentSpeaker: speaker,
        speakerName: SPEAKER_LABELS[speaker] || speaker,
        avatarLabel: SPEAKER_AVATAR[speaker] || speaker.charAt(0).toUpperCase(),
        currentText: '',
        typing: true
      });
      this._typewrite(item.text || '');
    },

    _typewrite(fullText) {
      if (this._typeTimer) clearInterval(this._typeTimer);
      let i = 0;
      const speed = 60;  // 每字符 60ms,儿童阅读速度

      // 立即显示第一个字符,避免空白闪一下
      if (fullText.length > 0) {
        this.setData({ currentText: fullText.slice(0, 1) });
        i = 1;
      }
      if (i >= fullText.length) {
        this.setData({ typing: false });
        return;
      }
      this._typeTimer = setInterval(() => {
        i++;
        if (i >= fullText.length) {
          clearInterval(this._typeTimer);
          this._typeTimer = null;
          this.setData({ currentText: fullText, typing: false });
          return;
        }
        // 用 slice 而不是字符串拼接,避免 setData 数据出错
        this.setData({ currentText: fullText.slice(0, i) });
      }, speed);
    },

    onNext() {
      if (this.data.typing) {
        // 打字中点击 = 立即显示完整
        if (this._typeTimer) {
          clearInterval(this._typeTimer);
          this._typeTimer = null;
        }
        const item = this.properties.dialogs[this.data.currentIndex];
        this.setData({
          currentText: (item && item.text) || '',
          typing: false
        });
        return;
      }
      const next = this.data.currentIndex + 1;
      if (next >= this.properties.dialogs.length) {
        this.finish();
        return;
      }
      this.setData({
        currentIndex: next,
        isLast: next >= this.properties.dialogs.length - 1
      });
      this._showCurrent();
    },

    onSkip() {
      if (this._typeTimer) {
        clearInterval(this._typeTimer);
        this._typeTimer = null;
      }
      this.finish();
    },

    onTapMask() {
      // 点击遮罩 = 同 onNext
      this.onNext();
    },

    onTapDialog() {
      // 点击对话框本身,阻止冒泡到 mask
      // (catchtap 已经处理,这里留空作为占位)
    },

    finish() {
      this.setData({ visible: false, currentIndex: 0, currentText: '' });
      this.triggerEvent('finish');
    }
  }
});
